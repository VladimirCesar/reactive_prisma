import * as _ from 'lodash';

import { SegmentsEditorElement } from '../Additional/SegmentsEditorElement';
import { MotivationEditorElement } from '../Additional/MotivationEditorElement';
import { PricesEditorElement } from '../Additional/PricesEditorElement';
import { TransferEditorElement } from '../Additional/TransferEditorElement';
import { motivationGetChecked } from './motivationGetChecked';
import * as renderers from './renderers';
import * as aggregations from './aggregations';

// вынести эдиторы и компараторы и геттеры

export function EffectColDefs(colDef, settingsParams) {
    _.forEach(colDef, function (col) {
        if (col.cfe_type === "segment") {
            EffectSegmentColDef(col, settingsParams);
        }
        if (col.field === "motivation") {
            EffectMotivationColDef(col, settingsParams);
        }
        if (col.cfe_type === "price") {
            EffectPriceColDef(col, settingsParams);
        }
        if (_.includes(col.cfe_type, 'warehousesInfo')) {
            EffectWarehousesInfoColDef(col);
        }
        if (col.field == "soldTotal") { 
            EffectSoldTotalColDef(col);
        }
        if (col.field == "shopTotal") { 
            EffectShopTotalColDef(col);
        }
        if (col.field == "transitTotal") { 
            EffectTransitTotalColDef(col);
        }
        if (col.field === 'primecost') {
            EffectPrimecostColDef(col);
        }
        if (col.field === "margin") {
            EffectMarginColDef(col, settingsParams);
        }
        if (col.field === "marginPercent") {
            EffectMarginPercentColDef(col, settingsParams);
        }
        if (col.field === "suppliersPrice") {
            EffectSuppliersPriceColDef(col);
        }
        if (col.field === "opp") {
            EffectOppColDef(col, settingsParams);
        }
        if (col.field === "transitDC") {
            EffectTransitDCColDef(col);
        }
        if (col.field === "balanceDC") {
            EffectBalanceDCColDef(col);
        }
        if (col.field === 'item_producer') {
            EffectItemProducerColDef(col);
        }
        if (col.field === 'item_code') {
            EffectItemCodeColDef(col);
        }
    });
    // чистая прибыль (net profit)
    AddNPColumn(colDef);
    AddDLAColumn(colDef)
    return colDef;
}

// Segments
const SegmentFilterGetter = (props, field) => {
    // ?? переделываю для сохранения сегментов и их отображения так НОРМ?
    if (!props.data || !props.data[field]) return "";
    return _.map(props.data[field], (e) => e.segment_name).join(' ');
}

const SegmentValueGetter = (props, field) => {
    if (!props.data || !props.data[field]) return "";
    return _.map(props.data[field], (e) => e.segment_name).join(' ');
}

const SegmentsEditor = (props, settingsParams, col) => {
    const element = <SegmentsEditorElement params={props} settingsParams={settingsParams} col={col} />;
    return element;
}

// Motivation
const MotivationComparator = (props) => {
    if (!props.data || (!props.data?.cl_motivationValues_new && !props.data?.cl_motivationValues)) return "";

    if (props.data?.cl_motivationValues_new) {
        return props.data.cl_motivationValues_new.value;
    } else {
        return props.data?.cl_motivationValues.value ?? '';
    }
}

const MotivationEditor = (props, settingsParams, col) => {
    if (!props.value) return;
    const checkMotivation = motivationGetChecked(props);
    const element = <MotivationEditorElement params={props} checkMotivation={checkMotivation} settingsParams={settingsParams} col={col} />;
    return element;
}

// Prices
const PricesEditor = (props, settingsParams, col, changedItems, classRulesInterface) => {
    const element = <PricesEditorElement params={props} settingsParams={settingsParams} col={col} changedItems={changedItems} classRulesInterface={classRulesInterface} />;
    return element;
}


// Transfer
const TransferEditor = (props, settingsParams, col) => {
    const element = <TransferEditorElement params={props} settingsParams={settingsParams} col={col} />;
    return element;
}

// supPrice

const SupFilterGetter = (props) => {
    const price = props?.data?.suppliersPrice?.value ?? null;
    return price;
}

const SupValueGetter = (props) => {
    const price = props?.data?.suppliersPrice?.value ?? null;
    const date = props?.data?.suppliersPrice?.date ?? null;
    if (!price) return "";
    else return `${price} (${date})`;
}

const SupFilterComparator = (valueA, valueB) => {
    // получить из value значение до ' (' и сравнить
    // let newValA = Number(valueA?.value);
    // let newValB = Number(valueB?.value);
    let newValA = Number(valueA.split(' (')[0]);
    let newValB = Number(valueB.split(' (')[0]);

    return newValA - newValB;
};

// Effects
function EffectSegmentColDef(col, settingsParams) {
    delete col.cfe_type;
    col.filterParams = {
        valueGetter: (props) => SegmentFilterGetter(props, col.field),
        buttons: ['reset'],
    };

    col.cellStyle = {
        'overflow-y': 'auto'
    }
    col.editable = true;
    col.cellEditorPopup = true;

    col.valueGetter = (props) => SegmentValueGetter(props, col.field);

    col.cellRenderer = (props) => renderers.segment(props);
    col.cellEditor = (props) => SegmentsEditor(props, settingsParams, col);
}
function EffectMotivationColDef(col, settingsParams) {
    col.filterParams = {
        valueFormatter: (props) => MotivationComparator(props),
        buttons: ['reset'],
    };
    col.editable = true;
    col.cellEditorPopup = true;
    col.cellEditor = (props) => MotivationEditor(props, settingsParams, col);
    col.cellRenderer = (props) => renderers.motivation(props, settingsParams);
    delete col.minWidth;
    col.width = 165;
}
function EffectPriceColDef(col, settingsParams) {
    delete col.cfe_type;
    col.filterParams = {
        buttons: ['reset'],
    };
    col.autoHeight = false;
    col.editable = true;
    col.cellEditorPopup = true;
    col.cellEditor = (props) => PricesEditor(props, settingsParams, col);
    col.cellRenderer = (props) => renderers.price(props, col);
}
function EffectWarehousesInfoColDef(col, settingsParams) {
    col.filterParams = {
        buttons: ['reset'],
    };
    col.cellRenderer = (props) => renderers.price(props, col);
    col.marryChildren = true;
    _.forEach(col.children, (child) => {
        child.suppressMovable=false;
        child.marryChildren = true;
        child.headerClass = 'ag-header-cell-warehouses';
        _.forEach(child.children, (child) => {
            child.cellRenderer = (props) => renderers.transfer(props, col = child);
            if (child.field.includes('balance.')) {
                child.editable = true;
                child.cellEditorPopup = true;
                child.cellEditor = (props) => TransferEditor(props, settingsParams, child);
                // child.aggFunc = 'sum';
                child.aggFunc = (params) => aggregations.sumWithTotalItems(params);
                
                child.headerName = 'Ост';
                child.width = 35;
                child.maxWidth = 70;
                child.headerClass = 'ag-header-cell-warehouses';
            }
            if (child.field.includes('sold.')) {
                child.aggFunc = 'sum';
                child.headerName = 'Прод';
                child.width = 35;
                child.maxWidth = 70;
                child.headerClass = 'ag-header-cell-warehouses';
            }
            if (child.field.includes('transit.')) {
                child.aggFunc = 'sum';
                child.headerName = 'Тр';
                child.width = 35;
                child.maxWidth = 70;
                child.headerClass = 'ag-header-cell-warehouses';
            }
            if (child.field.includes('dla.')) {
                child.headerClass = 'ag-header-cell-warehouses';
                child.cellRenderer = (props) => renderers.dlaWarehouse(props, child)

            }
        });
    });
}
function EffectSoldTotalColDef(col) {
    col.aggFunc = 'sum';
    // col.aggFunc = (params) => aggregations.sumWithTotalItems(params);
    col.cellRenderer = (props) => renderers.soldTotal(props, col);
    col.valueGetter = (params) => {
        return params.data?.soldTotal ?? 0;
    }
    col.headerName = 'Прод Ит';
}
function EffectShopTotalColDef(col) {
    // col.aggFunc = 'sum';
    col.aggFunc = (params) => aggregations.sumWithTotalItems(params);
    col.cellRenderer = (props) => renderers.shopTotal(props, col);
}
function EffectTransitTotalColDef(col) {
    // col.aggFunc = 'sum';
    col.aggFunc = (params) => aggregations.sumWithTotalItems(params);
    col.cellRenderer = (props) => renderers.transitTotal(props, col);
}
function EffectPrimecostColDef(col) {
    col.filterParams = {
        buttons: ['reset'],
    };
    col.cellRenderer = (props) => renderers.price(props, col);
}
function EffectMarginColDef(col, settingsParams) {
    col.filterParams = {
        buttons: ['reset'],
    };
    col.cellRenderer = (props) => renderers.margin(props, settingsParams);
}
function EffectMarginPercentColDef(col, settingsParams) {
    col.filterParams = {
        buttons: ['reset'],
    };
    col.cellRenderer = (props) => renderers.marginPercent(props, settingsParams);
    col.headerName = '%';
}
function EffectSuppliersPriceColDef(col) {
    col.filterParams = {
        buttons: ['reset'],
        valueGetter: (props) => SupFilterGetter(props),
    };
    col.comparator = (valueA, valueB) => SupFilterComparator(valueA, valueB);
    col.cellRenderer = (props) => renderers.supPrice(props);

    col.valueGetter = (props) => SupValueGetter(props)

    col.sortable = true;
}
function EffectOppColDef(col, settingsParams) {
    col.cellRenderer = (props) => renderers.opp(props, settingsParams);
    col.editable = false;
}
function EffectTransitDCColDef(col) {
    col.cellRenderer = (props) => renderers.transitDC(props);
    // col.aggFunc = 'sum';
    col.aggFunc = (params) => aggregations.sumWithTotalItems(params);
    col.headerName = 'В пути РЦ';
}
function EffectBalanceDCColDef(col) {
    delete col.cfe_type;

    col.cellRenderer = (props) => renderers.balanceDC(props);
    // col.aggFunc = 'sum';
    col.aggFunc = (params) => aggregations.sumWithTotalItems(params);
    col.filter = 'agNumberColumnFilter';
    col.headerName = 'Ост РЦ';
}
function EffectItemProducerColDef(col) {
    col.headerName = 'Производитель';
}
function EffectItemCodeColDef(col) {
}
function EffectNpColDef(col) {
    col.headerName = "ЧП";
    col.field = "netProfit";
    col.width = 57;
    col.cellRenderer = (props) => renderers.np(props);
    col.sortable = true;
}

function EffectDLAColDef(col) {
    col.headerName = 'ДППср'
    col.field = 'dla'
    col.width = 45;
    col.cellRenderer = (props) => renderers.dla(props)
    col.sortable = true;
}

function EffectDefaultColDef(col) {
    delete col.cfe_type;
}

function AddNPColumn(colDef) {
    let np = {}

    EffectNpColDef(np)
    colDef.push(np);
}

function AddDLAColumn(colDef) {
    let dla = {}
    EffectDLAColDef(dla)
    colDef.push(dla)
}
