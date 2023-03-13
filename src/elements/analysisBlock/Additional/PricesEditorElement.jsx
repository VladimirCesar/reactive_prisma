import { useEffect, useState, useRef, useCallback } from "react";
import { Input } from "antd";
import * as _ from "lodash";

import * as rowDataChange from "../Logic/RowDataChange";


export function PricesEditorElement({ params, settingsParams, col, changedItems, classRulesInterface }) {
    const [value, setValue] = useState('')
    const [isSatisfy, setIsSatisfy] = useState(true)

    useEffect(() => {
        if (params.data[`${col.field}_newValue`]) setValue(params.data[`${col.field}_newValue`]);
        document.querySelector('.prices-half-cell-input')?.focus();
    }, [setValue, params, col]);

    const onInputChange = (event) => {
        const reg = /^[0-9]\d*$/;
        const primecost = params.data.primecost;
        let newValue = event.target.value;
        
        // цена дб больше 0,5*primecost, поменять наименование minClub 
        const minClub = Math.floor(0.5 * primecost) + 1;
        (newValue < minClub) ? setIsSatisfy(false) : setIsSatisfy(true);
        
        if (!_.isEmpty(newValue) && !reg.test(newValue)) return;

        setValue(newValue);
        rowDataChange.price(params.data, col.field, newValue)
    }
    
    const errorStyle = {
        backgroundColor: '#FF4040',
        color: 'white'
    }

    const element = (<div className="prices-cell-container" style={{ width: `${params.column.actualWidth ?? 40}px`, height: `${(params.node.rowHeight ?? 42) - 2}px` }}>
        <div className="prices-half-cell-initial">{params.value}</div>
        <Input style={isSatisfy ? null : errorStyle} className="prices-half-cell-input" size='small' value={value} onChange={onInputChange} />
    </div>)

    return element;
}