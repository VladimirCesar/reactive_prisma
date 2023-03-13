import { Form, Button, Input, Switch, Select, Radio, PageHeader } from 'antd';
import React, { useCallback, useRef, useEffect, useState } from 'react';
import * as _ from 'lodash';
import { Header } from 'semantic-ui-react';

    /*
    0 - byColumn 
    1 - byValue
    2 - onTheValue
    3 - onThePercent                
    4 - clear
    */


export function CalculateModal({ params, calculateBuffer, isFirstRender = true, settingsParams }) {

    if (!calculateBuffer.current?.calculate) calculateBuffer.current.calculate = {
        type: 0,
        column: null,
        value: null,
        isIncrease: true
    };
    const buffer = calculateBuffer.current['calculate'];
    
    const [choisenElementByGroup, setChoisenElementByGroup] = useState(null);
    const [column, setColumn] = useState(buffer.column);
    const [value, setValue] = useState(buffer.value);
    const [isIncrease, setIsIncrease] = useState(buffer.isIncrease);
    const [type, setType] = useState(buffer.type);
    const selectedColumns = [...settingsParams.typeOfPriceValue, 'primecost'];
    let optionsColumns = []

    const onSelectColumnHandler = (e) => {
        setColumn(e);
        buffer.column = String(e);
    }

    const inIsIncreaseHandler = (e) => {
        setIsIncrease(e);
        buffer.isIncrease = e;
    }

    const onChangeValueHandler = (e) => {
        // фигня  какая-то с replace  e.target.value.replace(/[-,+,e]/g, '');
        setValue(e.target.value);
        buffer.value = String(e.target.value);
    }

    const onRadioChange = (e) => {
        let choisenValue = e.target.value;
        getElementByGroup(choisenValue);
        setType(choisenValue);
        
        buffer.type = choisenValue;
    };

    // используемые элементы
    const ColumnSelect = (
        <Select
        showSearch
        placeholder="Выберете колонку"
        optionFilterProp="children"
        onChange={onSelectColumnHandler}
        value={column}
        filterOption={(input, option) => option.label.toLowerCase().includes(input.toLowerCase())}
        options={optionsColumns}
    />
    )
    const IsIncreaseSwitch = (
        <Switch onChange={inIsIncreaseHandler} value={isIncrease} checkedChildren="Увеличить" unCheckedChildren="Уменьшить" defaultChecked />
    )
    const InputValue = (text) => (
        <Input value={value} type='number' min={0} placeholder={text} onChange={onChangeValueHandler} />
    )

    useEffect(() => {
        getElementByGroup(type)
        let colDefs = params.columnApi.columnModel.columnDefs;

        _.forEach(selectedColumns, (column) => {
            _.find(colDefs, (colDef) => {
                if (colDef.field === column) {
                    optionsColumns.push({
                        label: colDef.headerName,
                        value: colDef.field
                    });
                }
            });
        });
               
    }, [optionsColumns, settingsParams, params]);


    function getElementByGroup(group) {
        let element = null; 
        switch (group) {
            case 0:
                element = (
                    <div>
                        {ColumnSelect}
                    </div>
                );
                setChoisenElementByGroup(element);
                break;
            case 1:
            element = (
                <div>
                    {InputValue('Введите значение')}
                </div>
            );
            setChoisenElementByGroup(element);

            break;
            case 2:
                element = (
                    <div>
                        <div className='cl_calculate-modal_group'>
                            {IsIncreaseSwitch}
                            <div className='cl_calculate-modal_text'> на </div>
                            {InputValue('Введите значение')}
                        </div>
                        {ColumnSelect}
                    </div>
                );
                setChoisenElementByGroup(element);

                break;
            case 3:
                element = (
                    <div>
                        <div className='cl_calculate-modal_group'>
                            {IsIncreaseSwitch}
                            <div className='cl_calculate-modal_text'> на </div>
                            {InputValue('Введите процент')}
                        </div>
                        {ColumnSelect}
                    </div>
                );
                setChoisenElementByGroup(element);
                break;
                case 4:
                    element = (
                        <div style={{width: '250px'}}>
                            Все пользовательские значения в колонке будут очищены 
                        </div>
                    );
                    setChoisenElementByGroup(element);
                    break;
            default:
                setChoisenElementByGroup(null);
                break;
            }
    }

   return (
    <div>
        <Header size='small'>Колонка: {params?.column?.colDef?.headerName ?? 'Упс, название не найдено'}</Header>

        <div className='cl_calculate-modal_content'>
            <Radio.Group onChange={onRadioChange} value={type} className='cl_calculate-modal_content-radio' >
                <Radio.Button value={0}>По колонке</Radio.Button>
                <Radio.Button value={1}>По значению</Radio.Button>
                <Radio.Button value={2}>На значение</Radio.Button>
                <Radio.Button value={3}>На %</Radio.Button>
                {/* <Radio.Button value={4}>Сбросить</Radio.Button> */}
            </Radio.Group>

            { choisenElementByGroup }
        </div>
    </div>

    ); 
}