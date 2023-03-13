import "../../styles/analysisTable.css";
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import "ag-grid-enterprise/styles/ag-grid.css";
import "ag-grid-enterprise/styles/ag-theme-alpine.css";

import { MoreOutlined, UpOutlined, DownOutlined } from "@ant-design/icons";

import React, {
    useState,
    useRef,
    useEffect,
    useMemo,
    useCallback,
} from "react";
import * as _ from 'lodash';
import { AgGridReact } from "ag-grid-react";
import { ModuleRegistry, ClientSideRowModelModule } from "ag-grid-community";
import { GridChartsModule } from "ag-grid-enterprise";
import { ROOT_URL, ROOT_PORT, defaultHeaders } from "../../scripts/env";
import { AgGridReactLocaleRu } from "../../elements/ag-grid/AG_GRID_LOCALE_RU";

import { presettingTable } from "./TableComponent/presettingTable"

import CharacteristicsToolPanel from "./TableComponent/characteriscicsToolPanel";

import { EffectColDefs } from "./Creating/analysisTableColDefs";
import { ApplyChangesForRow } from "./Logic/ApplyingChangesForRow";
import { ContextMenuItems } from "./Logic/ContextMenu";
import { ResetColumnStyle } from "./Logic/ResetColumnStyle";

import "../../styles/analysisTable.css";
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import "ag-grid-enterprise/styles/ag-grid.css";
import "ag-grid-enterprise/styles/ag-theme-alpine.css";
import LoadingScreen from '../../res/LoadingScreen.gif';

import * as rowDataChange from "./Logic/RowDataChange";
import { Input } from "antd";
import { log } from "async";

ModuleRegistry.registerModules([
    ClientSideRowModelModule,
    GridChartsModule
]);

export function AnalysisTable(props) {
    const [loading, setLoading] = useState(true);
    const [rowData, setRowData] = useState(null);
    const [initRowData, setInitRowData] = useState(null);
    const [columns, setColumns] = useState([]);
    const [defaultColDef, setDefaultColDef] = useState(null);

    const [characteristicsFilter, setCharacteristicsFilter] = useState({});
    const [characteristicsFilterApply, setCharacteristicsFilterApply] = useState(false);
    // Может это неправильно, для того, чтобы каждый раз данные не подгружались в продвинутых фильтрах
    const [characteristicsTree, setCharacteristicsTree] = useState([]);

    function isRowBelongingToFilter(row) {
        const rowFilters = row?.additionalCharacteristicsFilter ?? [];
        let result = true;
        _.forOwn(characteristicsFilter, (value, key) => {
            if (!result) return
            if (!_.find(rowFilters, function (o) { return o.filter_prop_id == key && value.includes(o.filter_value_id) })) {
                result = false;
            }
        });
        return result;
    }

    useEffect(() => {
        if (characteristicsFilterApply) {
            let newRowData = [];
            if (!_.isEmpty(characteristicsFilter)) {
                initRowData.forEach((row) => {
                    if (isRowBelongingToFilter(row)) {
                        newRowData.push(row)
                    };
                });
            } else {
                newRowData = initRowData;
            }
            setCharacteristicsFilterApply(false);
            setRowData(newRowData);
            // +открыть toolPanel на определенной вкладке (сейчас вкладка продвинутый фильтр открывается по умолчанию)
        }
    }, [characteristicsFilter, characteristicsFilterApply, initRowData, isRowBelongingToFilter, setCharacteristicsFilterApply, setRowData])


    function updateCharacteristicsFilter(filter) {
        setCharacteristicsFilter(filter);
    }

    function updateCharacteristicsFilterApply(value) {
        setCharacteristicsFilterApply(value);
    }

    function updateCharacteristicsTree(value) {
        setCharacteristicsTree(value);
    }

    // инициализация таблицы
    const createTable = useCallback((settingsParams) => {
        return new Promise((resolve, reject) => {
            const params = {
                login: settingsParams.login,
                password: settingsParams.password,
                type_of_items_id: settingsParams.TOIValue,
                doc_id: settingsParams.DOCValue,
                load_type: settingsParams.itemsLoadType,
                segments_groups: settingsParams.segments,
                period_start: settingsParams.periodStart,
                period_end: settingsParams.periodEnd,
                type_of_prices_id: settingsParams.typeOfPriceValue,
                selected_club_id: settingsParams.selectedClub,
                selected_shops_id: settingsParams.shopValue,
                selected_warehouse_id: settingsParams.warehouseValue,
                property_for_grouping: settingsParams.props,
                corridor_type: settingsParams.corridorType,
                corridor_value: settingsParams.corridorValue ?? null,
            };
            let controller = new AbortController();
            let signal = controller.signal;
            signal.addEventListener('abort', () => {
                console.log('Запрос завершен');
            });
            fetch(`http://${ROOT_URL}:${ROOT_PORT}/table`, {
                method: 'POST',
                body: JSON.stringify(params),
                headers: defaultHeaders,
                signal: signal,
            }).then((res) => res.json()).then((json) => {
                const colDef = json.colDef;
                const additionalColDef = EffectColDefs(colDef, settingsParams);
                setColumns(additionalColDef);
                // добавила изначальный набор даты
                setInitRowData(json.table);
                setRowData(json.table);

                controller.abort();
                resolve();
                props.characterHasResponse.current = false;
            }).catch((err) => {
                console.log(err);
                reject();
            });
        });
    }, []);
    // обновление таблицы
    const gridRef = useRef(null);
    const gridApiRef = useRef(null);

    function updateWarehousesGroupsBorders(params, props) {
        const groupState = params.columnApi.getColumnState();
        const colDefs = params.columnApi.columnModel.columnDefs;

        // не уверена в правильности этого решения
        //  перебор также по гуидам складов, но их брать из child

        let warehouses = _.find(colDefs, (e) => _.includes(e?.cfe_type, 'warehousesInfo'))?.children ?? [];

        function getWarehoseGuid(warehouse) {
            let prefix = {
                0: 'sold.',
                1: 'balance.',
                2: 'transit.',
                3: 'dla.',
            }

            let guid = '';

            _.forEach(warehouse.children, (col) => {
                if (_.includes(col.field, prefix[0])) {
                    return guid = col.field.replace(prefix[0], '');
                } else if (_.includes(col.field, prefix[1])) {
                    return guid = col.field.replace(prefix[1], '');
                } else if (_.includes(col.field, prefix[2])) {
                    return guid = col.field.replace(prefix[2], '');
                } else if (_.includes(col.field, prefix[3])) {
                    return guid = col.field.replace(prefix[3], '');
                }
            })
            return guid;
        }

        for (let i = 0; i < warehouses.length; i++) {
            if (!warehouses[i]?.children) continue;

            let k = 0;
            let shop = getWarehoseGuid(warehouses[i])

            _.forEach(groupState, (col) => {
                if (_.includes(col.colId, shop)) {
                    let column = gridRef.current.columnApi.getColumn(col.colId);
                    k++;

                    if (column) {
                        const colDef = column.getColDef();
                        if (k === 1) {
                            colDef.cellClass = 'transfer-group-border-left';
                        } else if (k === 2 || k === 3) {
                            colDef.cellClass = '';
                        } else if (k === 4) {
                            colDef.cellClass = 'transfer-group-border-right';
                        }
                    }
                }
            })
        }
    }

    const onGridReady = useCallback((params) => {
        gridApiRef.current = params.api;
        params.api.closeToolPanel();
        // загружает сосотояние таблицы из localStorage
        if (localStorage?.savedTableState) {
            const savedState = JSON.parse(localStorage.getItem('savedTableState'));
            gridRef.current.columnApi.applyColumnState({
                state: savedState,
                applyOrder: true,
            });
        }

        if (localStorage?.listOfStyleColumnNames && localStorage?.listOfStyleColumnNames !== '[]') {
            let columns = JSON.parse(localStorage.getItem('listOfStyleColumnNames'));
            const segments = props.settingsParams.segments ?? [];
            //список колонок со стилями по-умолчанию
            columns.forEach((col) => {
                let columnName = col.replace('savedColumnStyle_', '');
                let column = gridRef.current.columnApi.getColumn(columnName);
                let styleCol = JSON.parse(localStorage.getItem(col));
                if (column) {
                    const colDef = column.getColDef();
                    colDef.cellStyle = (params) => {
                        if (!_.isNull(params.value ?? null)) {
                            let columnStyle = {
                                'padding': 'unset',
                                'background-color': styleCol?.backgroundColor ?? '',
                                'color': styleCol?.fontColor ?? '',
                                'font-weight': (styleCol?.bold) ? 'bold' : 'normal',
                                'font-style': (styleCol?.italic) ? 'italic' : 'normal',
                                "overflow-y": (_.includes(segments, colDef.field)) ? "unset" : "",
                            }
                            return columnStyle;
                        } else {
                            return {
                                'padding': 'unset',
                                "overflow-y": (_.includes(segments, colDef.field)) ? "unset" : "",
                            }
                        }
                    }
                    if (styleCol?.header) {
                        if (!colDef.initHeaderName) colDef.initHeaderName = colDef.headerName;
                        colDef.headerName = styleCol.header;
                        params.api.refreshHeader();
                    } else {
                        // Дополнительных проверок не требуется, т.к. если в буфере нет заголовка, то он не будет изменен
                    }
                }
            })
        }
        updateWarehousesGroupsBorders(params, props)

        // загружаем измененные элементы из localStorage
        if (!_.isEmpty(localStorage.getItem('changedItems'))) {
            // УТОЧНИТЬ, чтобы понять что это первый рендер, добавляю 1ым элементом массива объект сообщение
            // нужно сразу сортировать нужные элементы и сохранять в localStorage

            let rows = params?.api?.gridOptionsWrapper?.gridOptions?.rowData ?? [];
            window.getChangedItems().length = 0;
            let changedItemsArray = window.getChangedItems();
            let newArr = [{ isFirstRender: true }].concat(JSON.parse(localStorage.getItem('changedItems')));
            let choisenSegments = props.settingsParams.segments ?? [];
            let choisenPrices = props.settingsParams.typeOfPriceValue ?? [];
            let choisenShops = props.settingsParams.shopValue ?? [];
            let choisenVarehouse = props.settingsParams.warehouseValue;

            newArr.forEach((item) => {
                let row = _.find(rows, { _id: item.guid });
                if (!row) {}
                else if (   
                            (item.type == 'segment' && choisenSegments.includes(item.field)) || item.field == 'motivation' || 
                            (item.type == 'price' && choisenPrices.includes(item.field)) || (item.type == 'shop' && choisenShops.includes(item.field))
                ) {
                    changedItemsArray.push(item)
                } else if (item.type == 'transfer' && item.DCguid == choisenVarehouse) {
                    let isCheck = true;
                    _.forOwn(item.value.toDC, (value, key) => {
                        if (!choisenShops.includes(key)) isCheck = false;
                    })
                    _.forOwn(item.value.toShops, (value, key) => {
                        if (!choisenShops.includes(key)) isCheck = false;
                    })
                    if (isCheck) changedItemsArray.push(item);
                }
            });
            localStorage.setItem('changedItems', JSON.stringify(changedItemsArray));

            function deleteItemFromChangedItemsArray(key) {
                changedItemsArray.splice(key, 1);
                localStorage.setItem('changedItems', JSON.stringify(changedItemsArray));
            }

            _.forEach(changedItemsArray, (item, key) => {
                let row = _.find(rows, { _id: item.guid });
                if (row) {
                    if (item.field == 'motivation') {
                        rowDataChange.motivation(row, item.type, item.value, true);
                    } else if (item.type == 'price') {
                        rowDataChange.price(row, item.field, item.value);
                    } else if (item.type == 'segment') {
                        let added = _.cloneDeep(item.value?.added ?? []);
                        let removed = _.cloneDeep(item.value?.removed ?? []);
                        rowDataChange.segment(row, item.field, added, removed, true);
                    } else if (item.type == 'transfer') {
                        let value = _.cloneDeep(item.value);
                        rowDataChange.transfer(row, item.field, value);
                    } 
                } else if (key !== 0 && !item.isFirstRender) {
                    // По идее удалять ничего не придется
                    deleteItemFromChangedItemsArray(key);
                }
            });
        } else {
            // если локал сторадж пустой, то очищаем массив
            window.getChangedItems().length = 0;
        }
    }, []);

    const saveState = useCallback(() => {
        let save = gridRef.current.columnApi.getColumnState();
        let savedTableState = JSON.stringify(save);
        localStorage.setItem('savedTableState', savedTableState);
    }, [gridRef]);

    // локализация таблицы
    const localeText = useMemo(() => {
        return AgGridReactLocaleRu;
    }, []);

    // события колонок таблицы
    const columnEditEventTypes = {
        'DragStopped': 'dragStopped',
        'ColumnResized': 'columnResized',
        'ColumnVisible': 'columnVisible',
    }

    const onColumnEditEvent = useCallback((type) => {
        if (type === columnEditEventTypes.ColumnResized) {
            saveState();
        } else if (type === columnEditEventTypes.ColumnVisible) {
            saveState();
        } else if (type === columnEditEventTypes.DragStopped) {
            saveState();
        }
    }, []);

    const onDragStopped = useCallback((params) => {
        onColumnEditEvent(columnEditEventTypes.DragStopped, params)
        updateWarehousesGroupsBorders(params, props)

        params.api.redrawRows();
    }, [props, onColumnEditEvent])

    const onColumnVisible = (event) => onColumnEditEvent(columnEditEventTypes.ColumnVisible, event);
    const onColumnResized = (event) => onColumnEditEvent(columnEditEventTypes.ColumnResized, event);

    // развертывание рядов таблицы
    const collapseAll = useCallback(() => {
        if (gridRef.current?.api) gridRef.current?.api.collapseAll();
    }, []);
    const expandAll = useCallback(() => {
        if (gridRef.current?.api) gridRef.current.api.expandAll();
    }, [])

    const onKeyDown = useCallback((e) => {
        const PLUS_key = '+';
        const MINUS_key = '-';

        if (e.shiftKey && e.key === PLUS_key) {
            expandAll();
        } else if (e.shiftKey && e.key === MINUS_key) {
            collapseAll();
        }
    }, [collapseAll, expandAll]);
    window.addEventListener('keydown', onKeyDown);
    // подсветка измененных строк таблицы
    const rowClassRules = useMemo(() => {
        return {
            'cfe_edited-row': (params) => {
                if (window.getChangedItems()[0]?.isFirstRender) {
                    window.getChangedItems().shift();
                    let edited = _.map(window.getChangedItems(), 'guid');
                    return edited.includes(params?.data?.['_id']);
                } else {
                    let edited = _.uniq(_.map(window.getChangedItems(), 'guid'));
                    return edited.includes(params?.data?.['_id']);
                }
            },
        };
    }, []);

    // --------------------- Пагинация --------------------- //
    const paginationIsEnabled = props?.settingsParams?.splitByPages;


    const onPaginationChanged = useCallback(() => {
        if (gridRef.current.api) {
            const setText = (selector, text) => document.getElementById(selector).innerHTML = text;
            let currentPage = gridRef.current.api.paginationGetCurrentPage() + 1;
            let totalPages = gridRef.current.api.paginationGetTotalPages();

            const numDisabled = 'pagination-number-disabled';
            const arrowDisabled = 'pagination-arrow-icon-disabled';

            const setDisabled = (id, style, isDisabled=true) => {
                let el = document.getElementById(id);

                if (!el.classList.contains(arrowDisabled) && isDisabled) el.classList.add(style);
                if (!isDisabled) el.classList.remove(style);
            }
            
            if (gridRef.current.api.paginationGetTotalPages() <= 1 ) {
                setText('firstPage', '');
                setText('lastPage', '');
                setDisabled('paginationUpBtn', arrowDisabled);
                setDisabled('paginationDownBtn', arrowDisabled);
            } else {
                setDisabled('paginationDownBtn', arrowDisabled, false);
                setDisabled('lastPage', numDisabled, false);
                setDisabled('paginationUpBtn', arrowDisabled, false);
                setDisabled('firstPage', numDisabled, false);

                if (currentPage == 1) {
                    setDisabled('paginationUpBtn', arrowDisabled);
                    setDisabled('firstPage', numDisabled);

                } else if (currentPage == totalPages) {
                    setDisabled('paginationDownBtn', arrowDisabled);
                    setDisabled('lastPage', numDisabled);
                }

                setText('firstPage', '1');
                setText('lastPage', totalPages);
            }
            setText('currentPage', currentPage);
        }

    }, []);

    const onBtFirst = useCallback(() => {
        gridRef.current.api.paginationGoToFirstPage();
      }, []);

      const onBtLast = useCallback(() => {
        gridRef.current.api.paginationGoToLastPage();
      }, []);

      const onBtNext = useCallback(() => {
        let currentPage = gridRef.current.api.paginationGetCurrentPage() + 1;
        let totalPages = gridRef.current.api.paginationGetTotalPages();

        if (currentPage < totalPages) gridRef.current.api.paginationGoToNextPage();
      }, []);
    
      const onBtPrevious = useCallback(() => {
        let currentPage = gridRef.current.api.paginationGetCurrentPage() + 1;

        if (currentPage > 1) gridRef.current.api.paginationGoToPreviousPage();
      }, []);
      
      
    const paginationCurrentInput = ({top=0, left=0, height=40}) => {
        let input = document.createElement('input');
        let currentPage = gridRef.current.api.paginationGetCurrentPage() + 1;
        input.classList.add('pagination-current-input');
        input.id = 'paginationCurrentInput';
        input.style.top = `${top}px`;
        input.style.left = `${left}px`;
        input.style.height = `${height}px`;
        input.type = 'number';
        input.value = currentPage;
        
        const onChangeCurrentPage = (e) => {
            let userPage = e.target.value;
            let lastPage = gridRef.current.api.paginationGetTotalPages();

            if (userPage > 0 && userPage <= lastPage && userPage != currentPage) {
                document.getElementById('currentPage').innerHTML = userPage;
                gridRef.current.api.paginationGoToPage(userPage - 1);
            } 
            input.remove();
        }

        input.addEventListener('blur', (e) => onChangeCurrentPage(e));
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === 'Escape') input.blur();
        });
        return input;
    } 

      const onChangeCurrentPage = useCallback((e) => {
        let currentNumEl = document.getElementById('currentPage');

        let currentNumElCoordinate = currentNumEl.getBoundingClientRect();
        let input = paginationCurrentInput({top: currentNumElCoordinate.y, left: currentNumElCoordinate.x, height: currentNumElCoordinate.height});
        document.body.append(input);
        input.focus();
      }, []);
    // --------------------- Пагинация --------------------- //
    // ----------------------------------------------------- //

    // --------------------- Скролл --------------------- //

    const onBodyScrollEnd = useCallback((event) => {
        window.onScroll = function () {
            let timeout = setTimeout(() => {
                window.onscroll = null;
            }, 800);
            if (timeout) {
                clearTimeout(timeout);
            }
        }
    }, []);

    const onBodyScroll = useCallback((event) => {
        let timeout = setTimeout(() => {
            window.onScroll = function (e) {
                e.preventDefault();
            }
        }, 2000);
        if (timeout) {
            clearTimeout(timeout);
        }
    }, []);

    if (paginationIsEnabled) {
        window.onwheel = function (e) {
            const agRootTable = document.getElementsByClassName('ag-root-wrapper');
            const btnUp = document.getElementById('paginationUpBtn');
            const btnDown = document.getElementById('paginationDownBtn');

            const isCheck = () => {
                let menusElements = document.getElementsByClassName('ag-menu');
                let personalisationElement = document.getElementsByClassName('ant-modal-wrap');
                let toolPanelsElements = document.getElementsByClassName('ag-tool-panel-wrapper');
                let isToolPanel = false;
                if (!_.isEmpty(menusElements) || !_.isEmpty(personalisationElement)) return true;

                for (let i = 0; i < toolPanelsElements.length; i++) {
                    if (!toolPanelsElements[i].classList.contains('ag-hidden')) {
                        isToolPanel = true;
                        break;
                    }
                }
                for (let i = 0; i < personalisationElement.length; i++) {
                    if (personalisationElement[0].style.display != 'none') {
                        isToolPanel = true;
                        break;
                    };
                }
                return isToolPanel;
            }

            if (isCheck() || _.isEmpty(agRootTable)) return;
            if (e.wheelDelta < 0) btnDown.click();
            else btnUp.click();
        }
    } else {
        window.onwheel = null;
    }
    // --------------------- Скролл --------------------- //
    // -------------------------------------------------- //

    const onCellEditingStopped = useCallback((row) => ApplyChangesForRow(row, props.settingsParams), [props]);
    const getContextMenuItems = useCallback((params) =>
        ContextMenuItems(params, {
            settingsParams: props.settingsParams,
            gridRef: gridRef,
            applyChangesForRow: ApplyChangesForRow,
            callCalculateModal: props.callCalculateModal
        }), [props]);

    // сброс изменений персонализации
    const resetColumnStyles = useCallback((params) => ResetColumnStyle(params, props.settingsParams), [props]);

    // изменения после фильтрации
    const onFilterChanged = useCallback((params) => {
        if (params?.rowModel?.rowsToDisplay) {
            params.rowModel.rowsToDisplay.forEach((row) => {
                if (row.group) params.api.redrawRows(row.rowIndex);
            })
        }
    }, []);

    // Добавление кнопки изменения цвета колонки в меню настроек колонки
    const getMainMenuItems = useCallback((params) => {
        let menuItems = params.defaultItems;
        let callCustomizeModal = props.callCustomizeModal;
        menuItems.push({
            name: 'Персонализация',
            action: () => {
                callCustomizeModal(params);
            }
        }, {
            name: 'Сбросить стили колонок',
            action: () => {
                resetColumnStyles(params);
            }
        });
        return menuItems;
    }, [props, resetColumnStyles]);

    /* //////////////////////////////////////// */

    const autoGroupColumnDef = {
        headerName: ' ',
        pinned: 'left',
        autoHeight: false,
        width: 50,
        rowGroup: true,
        colSpan: (params) => {
            if (params.node.group) {
                const segmentsCount = _.findIndex(params.api.getColumnDefs(), (e) => e.field === "item_name") + 2;
                return segmentsCount;
            } else {
                return 1;
            }
        },
    };

    const presetting = useCallback((params) => presettingTable(params, { settingsParams: props.settingsParams, gridRef: gridRef, type: props.tableState }), [props]);
    useEffect(() => {
        if (props.stopRenderTable) return;
        setDefaultColDef({
            sortable: true,
            resizable: true,
            filter: true,
            wrapText: true,
            autoHeight: false,
            enableValue: true,
            enableRowGroup: true,
            enablePivot: true,
            cellStyle: {
                'margin': '0',
                'padding': '0',
            },
        });
        props.setStopRenderTable(true);
        console.log("AnalysisTable: render");
        if (_.isEmpty(props.settingsParams)) {
            window.location.pathname = "/";
            return;
        }
        createTable({ ...props.settingsParams, ...props.authData }).then(() => {
            setLoading(false);
        });
        props.presetTable.current = presetting;
    }, [props, props.settingsParams, props.stopRenderTable, createTable]);

    const sideBar = {
        toolPanels: [
            {
                id: 'filters',
                labelDefault: 'Filters',
                labelKey: 'filters',
                iconKey: 'filter',
                toolPanel: 'agFiltersToolPanel',
            },
            {
                id: 'columns',
                labelDefault: 'Columns',
                labelKey: 'columns',
                iconKey: 'columns',
                toolPanel: 'agColumnsToolPanel',
                visualViewport: true,
            },
            {
                id: 'characteristics',
                labelDefault: 'Продвинутый фильтр',
                labelKey: 'characteristics',
                iconKey: 'columns',
                toolPanel: () => CharacteristicsToolPanel({
                    props, rowData: initRowData, updateCharacteristicsFilter,
                    updateCharacteristicsFilterApply, characteristicsFilter,
                    updateCharacteristicsTree, characteristicsTree
                }),
            },
        ],
    };
    // Постраничная пагинация
    const element = (<>
    {loading ?
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%' }}>
            <img style={{ height: '70px' }} src={LoadingScreen} alt="Загрузка..." />
        </div>
        :
    <div className="common-analysis-table-container">
        <div className="table-container ag-theme-alpine">
                <AgGridReact
                    ref={gridRef}

                    onGridReady={onGridReady}
                    onDragStopped={onDragStopped}
                    onColumnVisible={onColumnVisible}
                    onColumnResized={onColumnResized}
                    onCellEditingStopped={onCellEditingStopped}
                    onFilterChanged={onFilterChanged}
                    onBodyScroll={onBodyScroll}
                    onBodyScrollEnd={onBodyScrollEnd}

                    autoGroupColumnDef={autoGroupColumnDef}
                    localeText={localeText}
                    defaultColDef={defaultColDef}
                    getMainMenuItems={getMainMenuItems}
                    rowData={rowData}
                    columnDefs={columns}
                    rowClassRules={rowClassRules}
                    aria-colcount='-1'
                    groupDefaultExpanded={-1}
                    rowHeight={36}
                    getContextMenuItems={getContextMenuItems}
                    sideBar={sideBar}
                    suppressAggFuncInHeader={true}
                    headerHeight={30}
                    suppressDragLeaveHidesColumns={true}

                    rowSelection={'single'}
                    suppressColumnVirtualisation={true}
                    // pagination={true}
                    // paginationAutoPageSize={true}
                    // paginateChildRows={true}
                    // suppressPaginationPanel={true}
                    
                    pagination={paginationIsEnabled}
                    paginateChildRows={paginationIsEnabled}
                    paginationAutoPageSize={paginationIsEnabled}
                    suppressPaginationPanel={paginationIsEnabled}
                    onPaginationChanged={paginationIsEnabled? onPaginationChanged : null}

                    // debounceVerticalScrollbar={true}
                    enableRangeSelection={true}
                // rowBuffer={50}
                // onColumnEverythingChange={onColumnEverythingChange}
                ></AgGridReact>

        </div>
        {paginationIsEnabled 
            ? <div className="pagination-container">
                <div className="pagination-inner-container">
                    <UpOutlined onClick={onBtPrevious} className="pagination-arrow-icon" id="paginationUpBtn" />
                    <div onClick={onBtFirst} className="pagination-number" id="firstPage">1</div>

                    <MoreOutlined />
                    <div onDoubleClick={onChangeCurrentPage} className="pagination-current-number" id="currentPage">-</div>
                    <MoreOutlined />
                    <div onClick={onBtLast} className="pagination-number" id="lastPage">-</div>

                    <DownOutlined onClick={onBtNext} className="pagination-arrow-icon" id="paginationDownBtn" />
                </div>
            </div>
            : null}
    </div>}
    </>);
    return element;
}