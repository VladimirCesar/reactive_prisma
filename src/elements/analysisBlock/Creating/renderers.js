import { motivationGetChecked } from './motivationGetChecked';
import * as _ from 'lodash';
import { Radio } from 'antd';
import { key } from 'localforage';

function createDefaultElement(initValue, newValue, styles = {}) {
    const cellStyle = (styles?.cell) ? styles.cell : '';
    const upperHalfStyle = (styles?.upperHalf) ? styles.upperHalf : '';
    const bottomHalfStyle = (styles?.bottomHalf) ? styles.bottomHalf : '';

    // не совсем уверена в этой проверке
    const validInitPrice = (Number(initValue) !== 0) ? true : false;

    const initPriceHalfCell = (
        <div className={`prices-half-cell ${upperHalfStyle}`}>
            {(validInitPrice) ? initValue : ''}
        </div>
    )

    const element = (
        <div className={`prices-cell-container ${cellStyle}`}>
            {(newValue !== 0 || validInitPrice)
                ? initPriceHalfCell
                : null
            }
            {(newValue !== 0)
                ? <div className={`prices-half-cell ${bottomHalfStyle}`}>
                    {newValue}
                </div>
                : null
            }
        </div>)

    return element;
}

function createCellElement(initValue = 0, newValue = 0, styles = {}) {
    if (!initValue && !newValue) return;
    const cellStyle = (styles?.cell) ? styles.cell : '';
    const upperHalfStyle = (styles?.upperHalf) ? styles.upperHalf : '';
    const bottomHalfStyle = (styles?.bottomHalf) ? styles.bottomHalf : '';

    function roundValue(val) {
        return Math.round(Number(val) * 100) / 100
    }

    // не совсем уверена в этой проверке
    const validInitPrice = (Number(initValue) !== 0) ? true : false;

    const initPriceHalfCell = (
        <div className={`prices-half-cell prices-half-cell-initial ${upperHalfStyle}`}>
            {(validInitPrice) ? roundValue(initValue) : ''}
        </div>
    )

    const element = (
        <div className={`prices-cell-container ${cellStyle}`}>
            {(newValue !== 0 || validInitPrice)
                ? initPriceHalfCell
                : null
            }
            {(newValue !== 0)
                ? <div className={`prices-half-cell ${bottomHalfStyle}`}>
                    {newValue}
                </div>
                : null
            }
        </div>)

    return element;
}

function createAggregationCell(value) {
    const element = (
        <div className='cl-agregation-cell'>
            {value}
        </div>
    )
    return element;
}

function createAggregationCellWithTotalItems(value) {
    try {
        if (value?.isGroup) {
            let content = (value?.sum == 0) ? 0 : `${value?.sum ?? ''} (${value?.totalItems ?? ''})`;
            return createAggregationCell(content);
        } else if (!_.isObject(value)) {
            return createAggregationCell(value);
        } else {
            return createAggregationCell('');
        }
    } catch (error) {
        console.log('не удалось добавить агрегацию');
        return '';
    }
}

export const segment = (props) => {
    if (!props.value) return;
    const initSegments = props.data?.[props.column.colId] ?? [];
    const values = _.map(initSegments, (value) => <p className="segment-cell__value">{value.segment_name}</p>);
    const element = <div className="segment-cell">{values}</div>;
    return element;
}

export const motivation = (props, settingsParams) => {
    if (!props.value) return;
    let checkedValue = 0;
    let cellValue = '';
    if (props.data.cl_motivationValues_new) {
        checkedValue = props.data.cl_motivationValues_new.type;
        cellValue = props.data.cl_motivationValues_new.value;
        if (checkedValue == 0) cellValue = `${props.data.cl_motivationValues_new.percent}%  (${cellValue})`;
    } else {
        [checkedValue, cellValue] = motivationGetChecked(props)
        if (checkedValue == 0) {
            const clubGuid = settingsParams.selectedClub;
            const club = props.data?.[clubGuid] ?? 0;
            cellValue = `${cellValue}%  (${Math.round(cellValue * club) / 100})`;
        }
    };
    const element = (<div className="motivation-cell" style={{ 'pointer-events': 'none' }} >
        <Radio.Group size="small" value={checkedValue} disabled={true}>
            <Radio.Button value={0}>Руч %</Radio.Button>
            <Radio.Button value={1}>Руч Σ</Radio.Button>
            <Radio.Button value={2}>% Маржи</Radio.Button>
        </Radio.Group>
        <p className="motivation-value">{cellValue}</p>
    </div>);
    return element;
}

export const price = (props, col) => {
    if (!props?.data) return createAggregationCell(props.value);

    const initValue = props.data?.[col?.field] ?? 0;
    const newValue = props.data?.[`${col.field}_newValue`];

    const styles = {
        upperHalf: 'cl-init-price',
    }

    const element = createCellElement(initValue, newValue, styles)
    return element
}

export const transfer = (props, col) => {
    if (!props.data){
        if (col.field.includes('transit.')) {
            let guid = col.field.replace('transit.','');
            let rowsVisible = props?.node?.childrenAfterFilter ?? [];

            let sum = 0;

            function reqursionSum(rows) {
                _.forEach(rows, (row) => {
                    if (row?.group) reqursionSum(row?.childrenAfterFilter ?? []);
                    
                    if (row?.data && row.data?.toShops?.[guid]) {
                        sum += Number(row.data.toShops[guid])
                    }})
            }
            reqursionSum(rowsVisible);

            return (
                <div className='cl-agregation-cell'>
                {props.value} [{sum}]
                </div>
            )
        } else {
            return createAggregationCellWithTotalItems(props.value)
        }
    }

    if (!props?.value) props.setValue(0);
    let initValue = props?.value ?? 0;
    let newValue = '';
    let guidShop;
    let cellStyle = '';
    let cellClass = '';
    let commonStyle = 'cl_transfer-change-cell'
    const styles = {
        yellow: `cl_personalisation_yellow-cell ${commonStyle}`,
        orange: `cl_personalisation_orange-cell ${commonStyle}`,
        green: `cl_personalisation_green-cell ${commonStyle}`,
        blue: `cl_personalisation_blue-cell ${commonStyle}`,
    }

    if (col.field.includes('balance.')) {
        guidShop = col.field.replace('balance.', '');
        if (props.data?.toDC?.[guidShop] && props.data.toDC[guidShop] !== '') {
            const balance = props.data.balance?.[guidShop] ?? '0';
            newValue = `-${props.data.toDC[guidShop]}`;

            if (props.data.toDC[guidShop] == balance) cellStyle = styles.orange;
            else if (props.data.toDC[guidShop] < balance) cellStyle = styles.blue;

        } else if (props.data?.toShops?.[guidShop] && props.data.toShops[guidShop] !== '') {
            const toShopsList = props.data?.toShops ?? {};
            let reserve = 0;
            for (let key in toShopsList) {
                if (toShopsList.hasOwnProperty(key)) reserve += Number(toShopsList[key]);
            }

            newValue = `+${props.data.toShops[guidShop]}`;

            if (Number(newValue) == props.data.balanceDC || reserve == props.data.balanceDC) cellStyle = styles.yellow;
            else if (Number(newValue) < props.data.balanceDC) cellStyle = styles.green;

        }
    } else if (col.field.includes('transit.')) {
        let guidShopTransit = col.field.replace('transit.', '');
        let toShop = (!Number.isNaN(Number(props.data?.toShops?.[guidShopTransit]))) ? Number(props.data?.toShops?.[guidShopTransit]) : 0;
        newValue = toShop;
        cellClass = 'cl_default-personalisation_warehouse-transit'
    } else if (col.field.includes('sold.')) {
        cellClass = 'cl_default-personalisation_warehouse-sold';
    }

    const cellStyles = {
        cell: `${cellStyle} price-cell-transfer-border`,
        upperHalf: `cl_default-personalisation_warehouse ${cellClass}`,
        bottomHalf: ``,
    }
    const element = createCellElement(initValue, newValue, cellStyles)
    return element
}

export const dlaWarehouse = (props, col) => {
    if (!props.data) return;

    const warehouseGuid = col.field.replace('dla.', '');
    const daysOf = props.data?.daysOfLastAdmission?.[warehouseGuid] ?? null;

    const styles = {
        upperHalf: 'cl-dla-cell'
    }

    let dla = (!!daysOf?.days_of_last_admission) ? daysOf?.days_of_last_admission : '-';
    let dsa = (!!daysOf?.days_of_senior_admission) ? daysOf?.days_of_senior_admission : '-';

    const element = (daysOf)
        ? createDefaultElement(dla, dsa, styles)
        : <div className='cl-dla-median-cell'>-</div>

    return element;
}

export const transitTotal = (props, col) => {
    if (!props?.data) {
        return createAggregationCellWithTotalItems(props.value)
    }
    const initValue = props.data?.transitTotal ?? 0;
    let newValue = 0;

    if (props.data?.toShops) {
        let toShopsTotal = 0;
        let toShopsList = props.data?.toShops ?? [];
        for (let key in toShopsList) {
            toShopsList.hasOwnProperty(key) && (toShopsTotal += Number(toShopsList[key]));
        }
        newValue = Number(initValue) + toShopsTotal;
    }

    const element = createCellElement(initValue, (newValue == initValue) ? 0 : newValue)
    return element
}

export const soldTotal = (props, col) => {
    if (!props?.data) {
        // console.log('props', props);
        return createAggregationCellWithTotalItems(props.value)
    }
    const initValue = props.data?.soldTotal ?? 0;
    if (!initValue) return;

    const element = createCellElement(initValue, 0)
    return element
}



export const shopTotal = (props, col) => {
    if (!props?.data) {
        return createAggregationCellWithTotalItems(props.value)
    }
    const initValue = props.data?.shopTotal ?? 0;
    if (!initValue) return;

    const element = createCellElement(initValue, 0)

    return element
}

export const margin = (props, settingsParams) => {
    if (!props.data) return createAggregationCell(props.value);

    const clubGuid = settingsParams.selectedClub;
    const primecost = props.data?.primecost ?? 0;
    const clubPrice = props.data?.[clubGuid] ?? 0;
    let newClub = (props.data?.[`${clubGuid}_newValue`]) ? props.data[`${clubGuid}_newValue`] : null;

    let getMargin = (club) => {
        return Math.round((club - primecost) * 100) / 100;
    }

    props.data.cl_margin = getMargin(clubPrice);
    props.data.cl_margin_newValue = (!_.isNull(newClub) || !_.isEmpty(newClub)) ? getMargin(newClub) : null;

    const initMargin = getMargin(clubPrice);
    const userMargin = (!_.isNull(newClub) || !_.isEmpty(newClub)) ? getMargin(newClub) : 0;
    const element = createCellElement(initMargin, userMargin)

    return element;
}

export const marginPercent = (props, settingsParams) => {
    if (!props.data) return;

    const clubGuid = settingsParams.selectedClub;
    const primecost = props.data?.primecost ?? 0;
    const clubPrice = props.data?.[clubGuid] ?? 0;
    let newClub = (props.data?.[`${clubGuid}_newValue`]) ? props.data[`${clubGuid}_newValue`] : null;

    let getMarginPercent = (club) => {
        if (primecost == 0) return '';
        let marginPercent = (club - primecost) * 100 / primecost;
        return Math.round(marginPercent * 100) / 100;
    }

    const initMarginPercent = getMarginPercent(clubPrice);
    const userMarginPercent = (!_.isNull(newClub) || !_.isEmpty(newClub)) ? getMarginPercent(newClub) : 0;
    const element = createCellElement(initMarginPercent, userMarginPercent)

    return element;
}

export const supPrice = (props) => {
    const price = props?.data?.suppliersPrice?.value ?? null;
    const date = props?.data?.suppliersPrice?.date ?? null;
    if (!price && !date) return null;
    const element = (<div className="sup-price-cell cl_default-personalisation_sup-price-cell">
        <p className="sup-price-value cl_default-personalisation_sup-price-value">{price}</p>
        <p className="sup-price-date">{date}</p>
    </div>);
    return element;
}

export const opp = (props, settingsParams) => {
    if (!props?.data) {
        return createAggregationCell(props.getValue());
    }

    const oppGuid = props?.data?.['oppGuid'] ?? null;
    const clubGuid = settingsParams.selectedClub;

    let userClub = props.data?.[`${clubGuid}_newValue`] ?? undefined;
    let userOpp = props.data?.[`${oppGuid}_newValue`] ?? undefined;

    const initValue = Number(props.data?.opp) || 0;
    const club = (userClub && userClub !== 0) ? userClub : props.data?.[`${clubGuid}`] ?? 0;
    const opp = (userOpp && userOpp !== 0) ? userOpp : props.data?.[`${oppGuid}`] ?? 0;
    const newValue = (userClub || userOpp) ? club - opp : 0;

    const element = createCellElement(initValue, newValue)
    return element
}

export const balanceDC = (props) => {
    if (!props?.data) {
        return createAggregationCellWithTotalItems(props.value)
    }
    const initValue = (props?.value) ? Number(props?.value) : 0;
    const element = createCellElement(initValue, 0)
    return element
}

export const transitDC = (props) => {
if (!props?.data) {
        let rowsVisible = props?.node?.childrenAfterFilter ?? [];
        let sum = 0;

        function reqursionSum(rows) {
            _.forEach(rows, (row) => {
                if (row?.group) reqursionSum(row?.childrenAfterFilter ?? []);
                
                let toDCShops = row.data?.toDC ?? {};
                _.forOwn(toDCShops, (value, key) => {
                    sum += Number(value);
                })
            })

        }
        reqursionSum(rowsVisible);

    return (
            <div className='cl-agregation-cell-DC'>
                {createAggregationCellWithTotalItems(props.value)}
                <div>[{sum}]</div>
            </div>
    )}

    let initValue = (props?.value) ? Number(props?.value) : 0;
    let fromShops = 0;

    if (props.data?.toDC) {
        for (let key in props.data.toDC) {
            props.data.toDC.hasOwnProperty(key) && (fromShops += Number(props.data.toDC[key]));
        }
    }
    props.setValue(initValue)
    const newValue = fromShops;
    const styles = {
        upperHalf: 'cl_default-personalisation_warehouse'
    }
    const element = createCellElement(initValue, newValue, styles)
    return element;
}

export const np = (props) => {
    if (!props?.data) return;

    let margin = props.data?.cl_margin ?? 0;
    let newMargin = props.data?.cl_margin_newValue ?? margin;

    let motivation = props.data?.cl_motivationValues?.[1] ?? 0;
    let newMotivation = props.data?.cl_motivationValues_new?.value ?? motivation;
    let initValue = Math.round((margin - motivation) * 100) / 100;
    let newValue = Math.round((newMargin - newMotivation) * 100) / 100;
    props.setValue(initValue)

    const newValidateValue = (newMotivation !== motivation || newMargin !== margin) ? newValue : 0;
    const element = createCellElement(initValue, newValidateValue)
    return element
}

export const dla = (props) => {
    if (!props?.data) return;

    function compareNumbers(a, b) {
        return a - b;
    }
    function getElement(name) {
        return (
            <div className='cl-dla-median-cell'>
                {name}
            </div>
        )
    }

    const warehousesDla = props.data?.daysOfLastAdmission ?? {};
    let dlaList = [];
    let median;

    _.forOwn(warehousesDla, (val) => {
        if (val?.days_of_last_admission) dlaList.push(val.days_of_last_admission);
    });

    // как-то некрасиво выглядит
    if (_.isEmpty(dlaList)) return getElement('-');

    let dlaSortList = dlaList.sort(compareNumbers);
    let isEven = (dlaSortList.length % 2 > 0) ? false : true;
    if (isEven) {
        let lastIndex = dlaSortList.length / 2;
        median = Math.round((dlaSortList[lastIndex] + dlaSortList[lastIndex - 1]) / 2);
    } else {
        let index = Math.trunc(dlaSortList.length / 2);
        median = dlaSortList[index];
    }

    const element = (
        <div className='cl-dla-median-cell'>
            {median}
        </div>
    )
    return element;
}
