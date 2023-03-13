import { useEffect, useState, useMemo } from "react";
import { Input, Select } from "antd";
import { ROOT_URL, ROOT_PORT } from "../../../scripts/env";
import * as _ from "lodash";
import "../../../styles/analysisTable.css";

export function TransferEditorElement({ params, changedItems, col }) {
    const [value, setValue] = useState([]);
    const [inputStyle, setInputStyle] = useState({});
    let initValue = params?.value ?? 0;
    let guidShop = params.colDef.field.replace('balance.', '');

    useEffect(() => {
        // внести первоначальные данные в валью
        if (params.data?.toDC?.[guidShop]) setValue(`-${params.data.toDC[guidShop]}`);
        else if (params.data?.toShops?.[guidShop]) setValue(params.data.toShops[guidShop]);
        else setValue('');
        document.querySelector('.prices-half-cell-input')?.focus();
    }, [setValue]);

    const onInputSoldChange = (e) => {
        setValue(e.target.value);

        if (!params.data?.toDC) params.data.toDC = {};
        if (!params.data?.toShops) params.data.toShops = {};

        params.data.toDC[guidShop] = 0;
        params.data.toShops[guidShop] = 0;

        let inputValue = e.target.value;
        const reg = /[-]{0,1}[0-9]*/;
        let match = inputValue.match(reg);
        if (match[0] !== inputValue) {
            inputValue = match[0];
        }
        if (inputValue[0] == 0 && inputValue.length > 1) {
            inputValue = inputValue.slice(1);
        }
        e.target.value = inputValue;
        setValue(e.target.value);

        if (e.target.value.includes('-')) {
            let newValue = e.target.value.replace('-', '');
            const balance = params.data.balance?.[guidShop] ?? '0';
            setValue(e.target.value);

            if (newValue == 0) {
                newValue = 0;
                params.data.toDC[guidShop] = 0;
                params.data.toShops[guidShop] = 0;
            } else if (newValue > balance) {
                newValue = String(balance);
                params.data.toDC[guidShop] = newValue;
                setValue(`-${balance}`);
            } else {
                params.data.toDC[guidShop] = newValue;
            }

            if (newValue == 0) setInputStyle({ backgroundColor: '' })
            else if (newValue == balance) setInputStyle({ backgroundColor: '#FFBF94' })
            else if (newValue < balance) setInputStyle({ backgroundColor: '#9fd4f3' })
            else setInputStyle({ backgroundColor: '' })

            params.data.toShops[guidShop] = '';

        } else {
            let newValue = e.target.value;
            let toShopsList = params.data?.toShops ?? {};
            let balanceDC = Number(params.data?.balanceDC);
            // резерв товаров на других магазинах
            let reserve = 0;
            for (let key in toShopsList) {
                if (key !== guidShop && toShopsList.hasOwnProperty(key) && key !== guidShop) reserve += Number(toShopsList[key]);
            }

            let newNumberValue = Number(newValue);

            if (newValue == 0) {
                newValue = 0;
                params.data.toDC[guidShop] = 0;
                params.data.toShops[guidShop] = 0;
            } else if (reserve + newNumberValue > balanceDC) {
                newValue = String(balanceDC - reserve);
                params.data.toShops[guidShop] = newValue;
                setValue(newValue);
            } else {
                params.data.toShops[guidShop] = newValue;
                setValue(e.target.value);
            }

            if (newValue == 0) setInputStyle({ backgroundColor: '' })
            else if (newValue == params.data.balanceDC || reserve + Number(newValue) == params.data.balanceDC) setInputStyle({ backgroundColor: '#FFCF40' })
            else if (newValue < params.data.balanceDC) setInputStyle({ backgroundColor: '#79BE80' })
            else setInputStyle({ backgroundColor: '' })

            params.data.toDC[guidShop] = '';
        }

        function reqursionRedrowParentRows(parent) {
            params.api.redrawRows({ rowNodes: [params.api.getDisplayedRowAtIndex(parent.rowIndex)] });
            if (parent.level > 0) reqursionRedrowParentRows(parent.parent);
        }

        reqursionRedrowParentRows(params.node.parent);
        params.api.refreshCells({ rowNodes: [params.api.getDisplayedRowAtIndex(params.rowIndex)] });
    }

    let element = (
        <div className="prices-cell-container" style={{ width: `${params.column.actualWidth ?? 40}px`, height: `${(params.node.rowHeight ?? 42) - 2}px` }}>
            <div className="prices-half-cell-initial">{initValue}</div>
            <Input style={inputStyle} className="prices-half-cell-input" size='small' value={value} onChange={onInputSoldChange} />
        </div>
    )

    return element;
}