import { useEffect, useState, useRef, useCallback } from "react";
import { Input, Radio, Button } from "antd";
import * as _ from "lodash";
import { normalizeUnits } from "moment";
import "../../../styles/analysisTable.css";

import * as rowDataChange from "../Logic/RowDataChange";

export function MotivationEditorElement({ params, settingsParams, col, changedItems, classRulesInterface, checkMotivation }) {

    // if (!params.value) return;
    // const [checkedValue, cellValue] = this.MotivationGetChecked(params);
    // 0: checkedValue, 1: cellValue
    let initCheck = checkMotivation;
    const [checkedValue, setCheckedValue] = useState(params.data?.cl_motivationValues_new?.type ?? initCheck[0]);
    const [inputElement, setInputElement] = useState();
    const [inputPercent, setInputPercent] = useState('');
    const [inputSum, setInputSum] = useState('');
    const [margin, setMargin] = useState('');

    const clubGuid = settingsParams.selectedClub;
    const club = params.data?.[clubGuid] ?? 0;

    const changeData = () => {
        if (params.data.cl_motivationValues_new) {
            setCheckedValue(params.data.cl_motivationValues_new.type);
            if (params.data.cl_motivationValues_new.type === 0) setInputPercent(params.data.cl_motivationValues_new.percent);
            else if (params.data.cl_motivationValues_new.type === 1) setInputSum(params.data.cl_motivationValues_new.value);
        } else if (params.data.cl_motivationValues) {
            setCheckedValue(params.data.cl_motivationValues[0]);
            if (params.data.cl_motivationValues[0] === 0) setInputPercent(params.data.cl_motivationValues[1]);
            if (params.data.cl_motivationValues[0] === 1) setInputSum(params.data.cl_motivationValues[1]);
            if (params.data.cl_motivationValues[0] === 2) setMargin(params.data.cl_motivationValues?.[1] ?? '');
        }
    }

    const onChange = (e) => {
        setCheckedValue(e.target.value);
        rowDataChange.motivation(params.data, e.target.value);
        document.querySelector('.cfe_motivation-input')?.focus();
    }

    const onBtnClick = (e) => {
        delete params.data.cl_motivationValues_new;;
        changeData();
    }

    // НУЖНО ОБЕРНУТЬ В useCallback
    useEffect(() => {
        changeData()
    }, [changeData])

    const onInputPercentChange = (e) => {
        let value = e.target.value;
        setInputPercent(value);
        rowDataChange.motivation(params.data, 0, value);
    }

    const onInputSumChange = (e) => {
        setInputSum(e.target.value);
        rowDataChange.motivation(params.data, 1, e.target.value);
    }

    // изменять элемент в зависимости от выбранного radio
    useEffect(() => {

        if (checkedValue === 0) {
            setInputElement(
                <div className="cfe_motivation-input-container">
                    <Input type="number" value={inputPercent} className="cfe_motivation-input" onChange={onInputPercentChange} />
                    <div>{Math.round(inputPercent * club) / 100}</div>
                </div>
            )
            document.querySelector('.cfe_motivation-input')?.focus();
        } else if (checkedValue === 1) {
            setInputElement(
                <div style={{ 'padding': '4px' }}>
                    <Input type="number" value={inputSum} className="cfe_motivation-input" onChange={onInputSumChange} />
                </div>
            )
            document.querySelector('.cfe_motivation-input')?.focus();
        } if (checkedValue === 2) {
            setInputElement(
                <div>{params.data?.motivation?.auto ?? ''}</div>
            )
        }
    }, [checkedValue, inputPercent, inputSum]);

    const element = (<div className="motivation-cell" style={{ width: `${params.column.actualWidth ?? 100}px`, height: `${(params.node.rowHeight ?? 50) - 2}px` }}>
        <Radio.Group size="small" value={checkedValue}>
            <Radio.Button value={0} onChange={onChange}>Руч %</Radio.Button>
            <Radio.Button value={1} onChange={onChange}>Руч Σ</Radio.Button>
            <Radio.Button value={2} onChange={onChange}>% Маржи</Radio.Button>
            <Button size="small" onClick={onBtnClick}>x</Button>
        </Radio.Group>
        {inputElement}
    </div >);
    return element;
}