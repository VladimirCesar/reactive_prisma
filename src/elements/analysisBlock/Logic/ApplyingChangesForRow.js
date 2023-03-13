import * as _ from 'lodash';

export function ApplyChangesForRow(row, settingsParams) {
    const focusedCell = (row?.api?.getFocusedCell()) ? row.api.getFocusedCell() : null;
    const data = row.data;
    const colDef = row.colDef;
    // в value пока костыль - для сегментов передается объект, поэтому value переопределяется
    const value = (!_.isEmpty(row.value)) ? String(row.value) : '';
    const changedItemsArray = window.getChangedItems();

    const makeChange = (thisField, newChange, hasChanges) => {
        // тк в инф по складам гуиды складов отличаются, нужно стандартизировать вид
        const getConcreteFields = (elem) => {
            return {
                guid: elem?.guid,
                type: elem?.type,
                value: elem?.value,
            }
        }
        const itemIndex = _.findIndex(changedItemsArray, (e) =>  _.isEqual(getConcreteFields(e), getConcreteFields(thisField)));
        // const itemIndex = _.findIndex(changedItemsArray, (e) => _.isEqual(e, thisField));
        let value = newChange?.value;
        if (hasChanges) {
            if (itemIndex >= 0) {
                if (!value) {
                    changedItemsArray.splice(itemIndex, 1);
                } else if (thisField) {
                    changedItemsArray.splice(itemIndex, 1, newChange);
                }
            } else if (value) {
                changedItemsArray.push(newChange);
            }
        }
        else if (itemIndex >= 0) {
            changedItemsArray.splice(itemIndex, 1);
        }

        // добавление в локалсторедж changedItems
        if (_.isEmpty(changedItemsArray) && localStorage.getItem('changedItems')) {
            localStorage.removeItem('changedItems');
        } else {
            localStorage.setItem('changedItems', JSON.stringify(changedItemsArray));
        }
    };
    const guid = data._id;
    const field = colDef.field;
    const segmentsList = settingsParams?.segments ?? [];
    const pricesList = settingsParams?.typeOfPriceValue ?? [];
    const club = settingsParams.selectedClub;

    if (segmentsList.includes(colDef.field)) {
        // поменяла логику т.к. при сохранении в эксель [object object] + логика повторяется
        const segments = data?.[field] ?? [];
        const primary = data.segmentsPrimary?.[field] ?? [];
        const intersection = _.intersectionBy(primary, segments, 'segment_id');
        const added = _.differenceBy(segments, intersection, 'segment_id');
        const removed = _.differenceBy(primary, intersection, 'segment_id');

        const hasChanges = added.length > 0 || removed.length > 0;
        const thisField = _.find(changedItemsArray, { guid, field });
        const newChange = { guid, field, type: "segment", value: {added, removed} };

        makeChange(thisField, newChange, hasChanges);
    }
    if (colDef.field === 'motivation') {
        const oldValues = data.cl_motivationValues;
        const newValues = (!row.isContext) ? [data?.cl_motivationValues_new?.type, data?.cl_motivationValues_new?.value] : [value[0], value[1]];
        const newValuePercent = (!row.isContext) ? data?.cl_motivationValues_new?.percent : value[2];
        const hasChanges = !_.isEqual(oldValues, newValues);
        const newChange = { guid, field, value: newValues[0] === 0 ? newValuePercent / 100 : newValues[1], type: newValues[0] };

        const thisField = _.find(changedItemsArray, (i) => i.guid === guid && i.field === field);
        makeChange(thisField, newChange, hasChanges);
    }
    if (_.includes(colDef.field, 'balance.')) {
        const toDC = data?.toDC;
        const toShops = data?.toShops;

        // добавлено для удаления пустых значений
        _.forOwn(toDC, (value, key) => {
            if (value == 0 || value == '') {
                delete toDC[key];
            }
        });

        _.forOwn(toShops, (value, key) => {
            if (value == 0 || value == '') {
                delete toShops[key];
            }
        });
        
        // newValue с проверкой на пустое значение
        const newValue = (_.isEmpty(toDC) && _.isEmpty(toShops)) ? null : { toDC, toShops };

        const toDCValue = _.values(toDC)[0];
        const toShopsValue = _.values(toShops)[0];
        const hasChanges = _.sumBy(toDCValue, e => Number(e)) !== 0 || _.sumBy(toShopsValue, e => Number(e)) !== 0;
        const newChange = { guid, field, DCguid: data.DCguid, type: 'transfer', value: newValue };
        const thisField = _.find(changedItemsArray, (i) => i.guid === guid && i.DCguid);
        makeChange(thisField, newChange, hasChanges);
    }
    if (pricesList.includes(colDef.field)) {
        const oldValue = data?.[colDef.field] ?? 0;
        let value = data?.[`${colDef.field}_newValue`] || oldValue
        let newValue = (!value) ? 0 : value;

        const primecost = data?.primecost ?? 0;
        const minPrice = Math.floor(primecost * 0.5) + 1;
        if (newValue !== oldValue && newValue < minPrice) {
            data[`${colDef.field}_newValue`] = '';
            newValue = null;
        }

        const guid = data._id;
        const field = colDef.field;
        const thisField = _.find(changedItemsArray, (i) => i.guid === guid && i.field === field);
        const hasChanges = !_.isEqual(oldValue, Number(newValue));
        // const hasChanges = (!_.isEmpty(newValue)) ? !_.isEqual(oldValue, newValue) : false;
        const newChange = { guid, field, type: 'price', value: newValue };

        makeChange(thisField, newChange, hasChanges);
    }

    if (!row.dontRedraw) {
        row.api.redrawRows({ rowNodes: [row.node] });
        const delay = setTimeout(() => {
            if (focusedCell?.rowIndex && focusedCell?.column) row.api.setFocusedCell(focusedCell.rowIndex, focusedCell.column);
            clearTimeout(delay);
        }, 100);
    }
}