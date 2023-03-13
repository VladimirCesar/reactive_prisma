import "antd/dist/antd.css";
import "../../styles/settings.css";

import { ROOT_URL, ROOT_PORT } from "../../scripts/env";
import { useState, useEffect } from "react";
import { TreeSelect } from "antd";
import { Select, Radio, InputNumber } from "antd";
import { cloneTree } from "./removingDuplicates";

import _ from "lodash";

const { SHOW_PARENT } = TreeSelect;

const alwaysSelectedGuid = []; // ['3f348c14-645d-11eb-80ca-a0d3c1ef2117', 'd45371fb-da40-11ec-80cd-1402ec7abf4d'];
const alwaysSelected = ['Цена за онлайн оплату', 'Розничная цена'];

export let chosenValue = [], club, retail;
let choisenCorridorType = 0;

export function TypeOfPrice({settingsParams}) {
    const [data, setData] = useState([]);
    const [value, setValue] = useState([]);
    const [loading, setLoading] = useState(true);
    const [hasResponse, setHasResponse] = useState(false);
    const [selectedClub, setSelectedClub] = useState({});
    const [selectedRetail, setSelectedRetail] = useState({});
    const [chosenOptions, setChosenOptions] = useState([]);
    const [optionsForClub, setOptionsForClub] = useState([]);
    const [optionsForRetail, setOptionsForRetail] = useState([]);
    const [corridorType, setCorridorType] = useState(choisenCorridorType);
    const [corridorValue, setCorridorValue] = useState(1);

    // Типы кориодоров: 0-без коридора, 1-предопределенный, 2-по шагу

    const choisenAlwaysSelected = (arr, result = []) => {
        // рекурсивный обход массива
        for (let i = 0; i < arr.length; i++) {
            if (_.includes(alwaysSelectedGuid, arr[i].value)) {
                let el = _.cloneDeep(arr[i]);
                result.push(el);
                arr[i].disabled = true;
            } else if (_.includes(settingsParams.get().typeOfPriceValue, arr[i].value)) {
                result.push(arr[i]);
            }
            if (arr[i].children) {
                choisenAlwaysSelected(arr[i].children, result);
            } 
        }
        return result;
    }
    
    useEffect(() => {
        if (hasResponse) return;
        else setHasResponse(true);
        fetch(`http://${ROOT_URL}:${ROOT_PORT}/types_of_prices_id`)
            .then((response) => response.json())
            .then((data) => {
            
                //setData(data);
                let newChosen = choisenAlwaysSelected(data);

                // с деревом данная конструкция не работает

                let newData = cloneTree(data);
                setData(newData);

                const chosen = _.filter(data, (e) => _.includes(settingsParams.get().typeOfPriceValue, e.value));

                let result = [];
                for (let i = 0; i < newChosen.length; i++) {
                    const element = {label: newChosen[i].title, value: newChosen[i].value};
                    if (element.value == settingsParams.get().selectedClub || element.value == settingsParams.get().selectedRetail) {
                        element.disabled = true;
                    }
                    result.push(element);
                }
                //-----------------------------------------//

                const selectedTypesOfPrices = _.union(settingsParams.get().typeOfPriceValue, alwaysSelectedGuid);                
    
                //adding value, club and retail from settingsParams
                setValue(selectedTypesOfPrices);
                setSelectedClub(settingsParams.get().selectedClub);
                setSelectedRetail(settingsParams.get().selectedRetail);
                setCorridorType(settingsParams.get().corridorType);
                setCorridorValue(settingsParams.get().corridorValue);
                setChosenOptions(result);                
            })
            .catch((error) => {
                console.log("Ошибка загрузки складов\n" + error);
            })
            .finally(() => setLoading(false));
        
        club = settingsParams.get().selectedClub;
        retail = settingsParams.get().selectedRetail;
    }, [hasResponse]);

    const onChange = (newValue, labels) => {
        setValue(newValue);
        chosenValue = newValue;

        let result = [];
        for (let i = 0; i < labels.length; i++) {
            const element = {label: labels[i], value: newValue[i]};
            result.push(element);
        }
        setChosenOptions(result);
        settingsParams.add({typeOfPriceValue: newValue});
    };
    const onChangeClubSelect = (value) => {
        _.map(chosenOptions, (element) => {
            element.disabled = element.value === value || element.value === selectedRetail || null;
        });
        setSelectedClub(value);
        club = value;
        settingsParams.add({selectedClub: value});
    }
    const onChangeRetailSelect = (value) => {
        _.map(chosenOptions, (element) => {
            element.disabled = element.value === value || element.value === selectedClub || null;
        });
        setSelectedRetail(value);
        retail = value;
        settingsParams.add({selectedRetail: value});
    }

    const onRadioCorridorChange = (e) => {
        setCorridorType(e.target.value);
        choisenCorridorType = e.target.value;
        settingsParams.add({corridorType: e.target.value});
    }

    const onChangeCorridorValue = (value) => {
        setCorridorValue(value);
        settingsParams.add({corridorValue: value});
    }

    const treeProps = {
        allowClear: true,
        loading,
        value,
        onChange,
        treeData: data,
        treeCheckable: true,
        showCheckedStrategy: SHOW_PARENT,
        placeholder: "Выбор видов цен",
        showSearch: true,
        treeNodeFilterProp: "title",
        virtual: false,
    };
    const selectProps = {
        allowClear: true,
        loading,
        style: { 'margin-left': "4px", 'min-width': '100px' },
    }

    const numericInput = (
        <InputNumber min={100} type="number" defaultValue={corridorValue} onChange={onChangeCorridorValue} />
    )

    const radioCorridor = (
    <div className="settings-group-price">
        <Radio.Group
            value={corridorType}
            onChange={onRadioCorridorChange}
            className="radio-group"
        >
            <Radio value={0}>Без коридора</Radio>
            <Radio value={1}>Предопределенный</Radio>
            <Radio value={2}>По шагу</Radio>
        </Radio.Group>

        {(corridorType === 2) ? numericInput : null}
    </div>
    )

    const element = (
        <div className="settings-group settings-group-top">
            <header>
                <i className="ruble sign icon" />
                &nbsp;Виды цен
            </header>
            <TreeSelect virtual={false} {...treeProps} />
            <div className=" settings-group-price settings-group-price-select">
                <label>Клуб. <Select {...selectProps} value={(selectedClub)?selectedClub:''} onChange={onChangeClubSelect} options={chosenOptions} /></label>
                <label>Рознич.<Select {...selectProps} value={(selectedRetail)?selectedRetail:''} onChange={onChangeRetailSelect} options={chosenOptions} /></label>
            </div>
            <div className="settings-group-price-corridor-group">
                <header>
                    <i className="balance scale icon" />
                    &nbsp;Ценовой коридор
                </header>
                {radioCorridor}
            </div>
        </div>
    );
    return element;
}
