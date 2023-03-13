import * as _ from 'lodash';
import { CalculateModal } from '../../common/CalculateModal';
  
export function ContextMenuItems(params, { settingsParams, gridRef, applyChangesForRow, callCalculateModal }) {
    let contextItems = params.defaultItems;
    const guid = params.column.colId;
    const segments = settingsParams?.segments ?? [];
    const prices = settingsParams?.typeOfPriceValue ?? [];
    const clubGuid = settingsParams.selectedClub;
    // Добавление изменения ячеек
    // добавить еще мотивацию
    // убрала не работает || guid === 'motivation' 
    if (segments.includes(guid) || prices.includes(guid) || _.includes(guid, 'balance.')) {
        contextItems.push({
            name: 'Применить ко всем',
            action: () => {

                let itemsNodeRows = [];
                let items = gridRef.current.props.rowData;
                let column = gridRef.current.columnApi.getColumn(guid);

                // получение отфильтрованных строк
                params.api.forEachNodeAfterFilter(node => { if (node?.data) itemsNodeRows.push(node) });

                if (prices.includes(guid)) {
                    const value = params.node.data?.[`${guid}_newValue`] ?? null;
                    for (let i = 0; i < itemsNodeRows.length; i++) {
                        const data = itemsNodeRows[i].data;
                        const minClub = Math.floor(1.5 * data.primecost) + 1;
                        // const validateValue = value;

                        if (!value && data?.[`${guid}_newValue`]) {
                            delete data?.[`${guid}_newValue`];
                        } else if (value) {
                            data[`${guid}_newValue`] = value;
                        }
                        const colDef = column.getColDef();
                        const dontRedraw = true;

                        applyChangesForRow({ data, colDef, value, dontRedraw }, settingsParams);
                        params.api.redrawRows({ rowNodes: itemsNodeRows[i] });
                    }
                } else if (segments.includes(guid)) {

                    let segments = params?.node?.data?.[guid] ?? [];
                   
                    for (let i = 0; i < itemsNodeRows.length; i++) {
                        let item = itemsNodeRows[i].data;

                        // let differenceSegments = _.differenceBy(segments, item?.[`${guid}`], 'segment_id');
                        // if (differenceSegments.length == 0) continue;
                        // определяем primary, intersection, newValue

                        let primary = item.segmentsPrimary?.[guid] ?? [];
                        let intersection = _.intersectionBy(primary, segments, 'segment_id');
                        // let intersection = _.intersectionBy(primary, item[guid], 'segment_id');
                        let newValue = {'added': [], 'removed': []};

                        item[`${guid}`] = segments;
                        if (!item.segmentsEdited) item.segmentsEdited = {};
                        item.segmentsEdited[guid] = {
                            added: [],
                            removed: [],
                        }

                        if (intersection.length === 0) {
                            item.segmentsEdited[guid].added = item[guid];
                            item.segmentsEdited[guid].removed = primary;
                        } else {
                            newValue.added = _.differenceBy(segments, intersection, 'segment_id');
                            newValue.removed = _.differenceBy(primary, intersection, 'segment_id');

                            item.segmentsEdited[guid].added = _.differenceBy(segments, intersection, 'segment_id');
                            item.segmentsEdited[guid].removed = _.differenceBy(primary, intersection, 'segment_id');
                        }
                        const data = itemsNodeRows[i].data;
                        const colDef = column.getColDef();
                        const dontRedraw = true;
                        const value = segments;
                        // dontRedraw = true, тк при передачи строки (rowNode) происходит ошибка

                        applyChangesForRow({ data, colDef, value, dontRedraw }, settingsParams);
                        params.api.redrawRows({ rowNodes: itemsNodeRows[i] });
                    }
                }
                // ФОТ
                // 1. Проверить, есть ли в колонке значение
                // 2. Если есть, то применить его ко всем
                // 3. Если нет, то удалить его у всех
                else if (guid === 'motivation') {
                    let value = (params.node.data?.cl_motivationValues_new) 
                        ? [params.node.data.cl_motivationValues_new.type, params.node.data.cl_motivationValues_new.value, params.node.data.cl_motivationValues_new?.percent] 
                        : params.node.data?.cl_motivationValues;

                    for (let i = 0; i < itemsNodeRows.length; i++) {
                        let motivation = itemsNodeRows[i].data.cl_motivationValues;
   
                        const club = itemsNodeRows[i].data?.[clubGuid] ?? 0;
                        
                        let type = Number(value?.[0]);
                        let val = Number(value?.[1]) ?? '';
                        let percent = Number(value?.[2]) ?? undefined;
                        
                        if (type == 0) {
                            val = Math.round(percent * club) / 100;
                            itemsNodeRows[i].data.cl_motivationValues_new = {
                                type,
                                value: val,
                                percent: percent,
                            }
                        } else if (type == 1) {
                            itemsNodeRows[i].data.cl_motivationValues_new = {
                                type,
                                value: val
                            }
                        } else if (type == 2) {
                            val = (motivation?.[0] == type) ? motivation[1] : itemsNodeRows[i].data?.motivationMargin?.auto ?? ''
                            itemsNodeRows[i].data.cl_motivationValues_new = {
                                type,
                                value: val
                            }
                        }
                                
                        const data = itemsNodeRows[i].data;
                        const colDef = column.getColDef();
                        const dontRedraw = true;
                        const isContext = true;
                        const newValue = [type, val, percent];

                        applyChangesForRow({ data, colDef, value: newValue, dontRedraw, isContext }, settingsParams);
                        params.api.redrawRows({ rowNodes: itemsNodeRows[i] });
                    }
                }
                // инф по складам
                else if (_.includes(guid, 'balance.')) {
                    const guidShop = guid.split('.')[1];
                    const isToDC = (!params.node.data?.toShops?.[guidShop] ?? _.isEmpty(String(params.node.data?.toShops?.[guidShop]))) ? true : false;
                    const value = Number((isToDC) ? params.node.data?.toDC?.[guidShop] : params.node.data?.toShops?.[guidShop]);

                    function zeroing(data, toShops, toDC, guidShop) {
                        toShops[guidShop] = '';
                        toDC[guidShop] = '';

                        data.toShops[guidShop] = '';
                        data.toDC[guidShop] = '';
                    }

                    // function
                    for (let i = 0; i < itemsNodeRows.length; i++) {
                        let toShops = {};
                        let toDC = {};
                        let data = itemsNodeRows[i].data

                        if (!data?.toDC) data.toDC = {};
                        if (!data?.toShops) data.toShops = {};

                        if (isToDC) {
                            const balanceShop = data?.balance?.[guidShop] ?? 0;
                            // проверяем наличие значения на магазине
                            if (value <= balanceShop) {
                                data.toDC[guidShop] = String(value);
                                data.toShops[guidShop] = '';
                                
                                toDC[guidShop] = String(value);
                                toShops[guidShop] = '';
                            } else {
                                zeroing(data, toShops, toDC, guidShop);
                            }
                        } else {
                            let totalToShops = 0;
                            _.forOwn(data.toShops, (value, key) => { totalToShops += (key !== guidShop) ? Number(value) : 0 });
                            if (totalToShops + Number(value) <= Number(data.balanceDC)) {
                                data.toShops[guidShop] = String(value);
                                data.toDC[guidShop] = '';
                                
                                toShops[guidShop] = String(value);
                                toDC[guidShop] = '';
                            } else {
                                zeroing(data, toShops, toDC, guidShop);
                            }
                        }
                        const dontRedraw = true;
                        const colDef = column.getColDef();

                        applyChangesForRow({ data, colDef, value: {toShops: String(toShops), toDC: String(toDC)}, dontRedraw }, settingsParams);
                        params.api.redrawRows({ rowNodes: itemsNodeRows[i] });
                    }
                }
            }
        })
    }
    if (_.includes(prices, guid)) {
        contextItems.push({
            name: 'Калькулятор цен',
            action: () => {
                callCalculateModal(params);
            }
        });
    }
    return contextItems;
}