import * as _ from 'lodash';
import { ApplyChangesForRow } from './ApplyingChangesForRow';


const calculateOkHandler = (params, calculateBuffer, settingsParams) => {
    /*  type: 
            0 - по колонке
            1 - по значению
            2 - на значение
            3 - на процент
            4 - сбросить
    */
    const buffer = calculateBuffer.current?.calculate; 
    const value = buffer?.value ?? null;
    const columnField = buffer?.column ?? null;
    const isIncrease = buffer?.isIncrease ?? null;
    const type = buffer?.type ?? null;
    const initColumn = params.column.colId;

    let itemsNodeRows = [];
    const column = params.columnApi.getColumn(initColumn);

    // получение отфильтрованных строк
    params.api.forEachNodeAfterFilter(node => { if (node?.data) itemsNodeRows.push(node) });

    function changeRow(value, row) {
        let newValue = (_.isNumber(value)) ? value : Number(value);
        let initValue = row.data?.[initColumn] ?? 0;
        if (newValue == initValue) newValue = null;
        let data = row.data;

        if (!newValue && data?.[`${initColumn}_newValue`]) {
            delete data[`${initColumn}_newValue`]
        } else if (newValue) {
            data[`${initColumn}_newValue`] = newValue;
        }
        const colDef = column.getColDef();
        const dontRedraw = true;
        newValue = (newValue) ? String(newValue) : '';

        ApplyChangesForRow({data, colDef, value: newValue, dontRedraw}, settingsParams);
        params.api.redrawRows({rowNodes: [row]});
    }

    function changeItemsRowsWithStaticValue(value = '') {
        for (let i = 0; i < itemsNodeRows.length; i++) {
            if (!itemsNodeRows[i]?.data) continue;
            changeRow(value, itemsNodeRows[i]);
        }
    }

    switch (type) {
        case 0:
            if (!columnField) return;
            for (let i = 0; i < itemsNodeRows.length; i++) {
                if (!itemsNodeRows[i]?.data) continue;
                let newValue = itemsNodeRows[i].data?.[columnField] ?? '';
                changeRow(newValue, itemsNodeRows[i]);
            }
            break;
        case 1:
            changeItemsRowsWithStaticValue(value);
            break;
        case 2:
            if (!columnField) return; 
            for (let i = 0; i < itemsNodeRows.length; i++) {
                if (!itemsNodeRows[i]?.data) continue;
                let newValue = (isIncrease) 
                    ? String(itemsNodeRows[i].data?.[columnField] + Number(value))
                    : String(itemsNodeRows[i].data?.[columnField] - Number(value)); 
                changeRow(newValue, itemsNodeRows[i]);
            }
            break;
        case 3:
            if (!columnField) return; 
            for (let i = 0; i < itemsNodeRows.length; i++) {
                if (!itemsNodeRows[i]?.data) continue;
                let columnValue = itemsNodeRows[i].data?.[columnField] ?? 0;
                let percent = (isIncrease)
                    ? 100 + Number(value)
                    : 100 - Number(value);
                let newValue = String(Math.round(columnValue * percent) / 100);
                changeRow(newValue, itemsNodeRows[i]);
            }
            break;
        case 4:
            changeItemsRowsWithStaticValue();
            break;
        default:
            break;
    }
}

export default calculateOkHandler;