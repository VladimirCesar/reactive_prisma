import * as _ from 'lodash';

// type : 0 - БА, 1 - БП, 2 - все
export function presettingTable(props,{ settingsParams, gridRef}) {
    const columns = gridRef.current.api.getColumnDefs();
    const segments = settingsParams.segments;
    const prices = settingsParams.typeOfPriceValue;
    const type = props;

    const hideAlways = [
        'byStep.corridor_name',
        'item_toi_name'
    ]

    const visibleAlways = [
        'item_name',
        'item_code',
        'item_producer',
    ]

    const analysisBlockFieldsHidden = [
        // 'balanceDC',
        // 'transitDC',
        // 'soldTotal',
        // 'shopTotal',
        // 'transitTotal',
    ];
    const transferBlockFieldsHidden = [
        ...segments,
        ...prices,
        // 'primecost',
        'margin',
        'marginPercent',
        'motivation',
        'pola',
        'suppliersPrice',
        'netProfit'
    ]

    function hiddenColumn(col, isHidden = true) {
        if (_.includes(hideAlways, col?.field) || _.includes('Ценовой коридор', col?.headerName)) {
            if (!col?.hide) gridRef.current.columnApi.setColumnVisible(col?.colId, false);
        } else if (col.children) {
            _.forEach(col.children, (child) => hiddenColumn(child));
        } else {
            if (col?.colId) gridRef.current.columnApi.setColumnVisible(col?.colId, !isHidden);
        }
    }

    function openColumn(col, isOpen = true) {
        hiddenColumn(col, false);
        if (col.children) {
            gridRef.current.columnApi.setColumnGroupOpened(col?.groupId, isOpen);
            _.forEach(col.children, (child) => {
                openColumn(child);
            })
        } 
    }

    function analysisBlock() {
        _.forEach(columns, (col) => {
            if (!col?.field || _.includes(analysisBlockFieldsHidden, col?.field)) hiddenColumn(col);
            else (hiddenColumn(col, false))
        });
    }

    function transferBlock() {
        _.forEach(columns, (col) => {
            
            if (_.includes(transferBlockFieldsHidden, col?.field)) hiddenColumn(col);
            else if (!col.field) openColumn(col);
            else (hiddenColumn(col, false));
        });
    }

    function completeTable() {
        _.forEach(columns, (col) => {
            if (col?.colId) hiddenColumn(col, false);
            if (!col.field) openColumn(col, false);
        });
    }
    if (type == 0) analysisBlock();
    else if (type == 1) transferBlock();
    else if (type == 2) completeTable();
    else return;
}