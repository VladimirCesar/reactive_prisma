import "antd/dist/antd.css";
import "../../styles/settings.css";

import { ROOT_URL, ROOT_PORT } from "../../scripts/env";
import { Radio, Select } from "antd";
import { useState, useEffect } from "react";
import { TreeSelect } from "antd";
import { defaultHeaders } from "../../scripts/env";
import _ from "lodash";

// import { cloneTree } from "./removingDuplicates";

const { SHOW_PARENT } = TreeSelect;

export let TOIValue = [],
    DOCValue = [],
    chosenType = 1;
function InputGroup({ settingsParams }) {
    const [TOIData, SetTOIData] = useState([]);
    const [DOCData, SetDOCData] = useState([]);
    const [radioValue, setRadioValue] = useState(chosenType);
    const [value, setValue] = useState([]);
    const [placeholder, setPlaceholder] = useState("Выбор вида номенклатуры");
    const [loading, setLoading] = useState(true);
    const [hasResponse, setHasResponse] = useState(false);
    const [propsSelectData, setPropsSelectData] = useState([]);
    const [propsSelectLoading, setPropsSelectLoading] = useState(true);
    const [propsSelectValue, setPropsSelectValue] = useState(null);

    const refreshPropsSelectData = (TOIValue, isDOC = false) => {
        setPropsSelectLoading(true);
        settingsParams.add({ props: undefined });
        if (isDOC) {
            setPropsSelectData([]);
            setPropsSelectLoading(false);
        } else {
            fetch(`http://${ROOT_URL}:${ROOT_PORT}/all_properties`, {
                method: "POST",
                body: JSON.stringify(TOIValue),
                headers: defaultHeaders
            })
                .then((response) => response.json())
                .then((data) => {
                    setPropsSelectData(data);
                })
                .catch((error) => {
                    console.log("Ошибка загрузки видов номенклатуры\n" + error);
                })
                .finally(() => {
                    setPropsSelectLoading(false);
                });
        }
    }

    // рекурсивный обход дерева и удаление дубликатов
    const cloneTree = (arr) => {
        const guidsList = [];
        const newArr = [];
        arr.forEach((item) => {
            const newItem = { ...item };
            if (!_.includes(guidsList, item.value)) {
                guidsList.push(item.value);
                if (item.children) {
                    newItem.children = cloneTree(item.children);
                } 
                newArr.push(newItem);
            } else {
                // в массив не добавляем так как он уже есть
            }
        });
        return newArr;
    }

    useEffect(() => {
        if (hasResponse) return;
        else setHasResponse(true);
        // make list of tasks to fetch data from different sources
        const tasks = [
            fetch(`http://${ROOT_URL}:${ROOT_PORT}/type_of_items_id`)
                .then((response) => response.json())
                .then((data) => {
                    let newData = cloneTree(data);
                    SetTOIData(newData);
                })
                .catch((error) => {
                    console.log("Ошибка загрузки видов номенклатуры\n" + error);
                }),
            fetch(`http://${ROOT_URL}:${ROOT_PORT}/registered_docs_id`)
                .then((response) => response.json())
                .then((data) => {
                    let newData = cloneTree(data);
                    SetDOCData(newData);
                })
                .catch((error) => {
                    console.log("Ошибка загрузки документов\n" + error);
                })];
        Promise.all(tasks).then(() => {
            setLoading(false);
            TOIValue = settingsParams.get().TOIValue;
            DOCValue = settingsParams.get().DOCValue;
            chosenType = settingsParams.get().itemsLoadType;
            setRadioValue(chosenType);
            setValue(chosenType === 1 ? TOIValue : DOCValue);
            refreshPropsSelectData(chosenType === 1 ? TOIValue : DOCValue, chosenType === 2);
        }).catch((error) => {
            console.log(error);
            setLoading(false);
        });
    }, [hasResponse, settingsParams]);
    const onRadioChange = (e) => {
        setPropsSelectValue(null);
        const newValue = e.target.value;
        setRadioValue(newValue);
        if (newValue === 1) {
            setPlaceholder("Выбор вида номенклатуры");
            chosenType = 1;
            setValue(TOIValue);
            refreshPropsSelectData(TOIValue);
            settingsParams.add({ TOIValue, DOCValue, itemsLoadType: chosenType });
        }
        if (newValue === 2) {
            setPlaceholder("Выбор документа");
            chosenType = 2;
            setValue(DOCValue);
            refreshPropsSelectData(null, []);
            settingsParams.add({ TOIValue, DOCValue, itemsLoadType: chosenType });
        }
    };
    const onChange = (newValue) => {
        setPropsSelectValue(null);
        if (radioValue === 1) {
            TOIValue = newValue;
            setValue(TOIValue);
            refreshPropsSelectData(TOIValue);
            settingsParams.add({ TOIValue, DOCValue, itemsLoadType: chosenType });
        }
        if (radioValue === 2) {
            DOCValue = newValue;
            setValue(DOCValue);
            refreshPropsSelectData(null, true);
            settingsParams.add({ TOIValue, DOCValue, itemsLoadType: chosenType });
        }
    };

    const onPropsSelectChange = (newValue) => {
        settingsParams.add({ props: newValue });
        setPropsSelectValue(newValue);
    }

    const treeProps = {
        allowClear: true,
        loading,
        value,
        onChange,
        treeData: radioValue === 1 ? TOIData : DOCData,
        treeCheckable: radioValue === 1,
        showCheckedStrategy: SHOW_PARENT,
        placeholder,
        showSearch: true,
        treeNodeFilterProp: "title",
    };

    const propsSelectProps = {
        allowClear: true,
        options: propsSelectData,
        loading: propsSelectLoading,
        disabled: propsSelectData.length === 0,
        placeholder: propsSelectData.length === 0 ? "Нет свойств для выбора" : "Выбор свойства",
        onChange: onPropsSelectChange,
        value: propsSelectValue,
        showSearch: true,
        optionFilterProp: "label",
    }

    const element = (
        <>
            <Radio.Group
                value={radioValue}
                onChange={onRadioChange}
                className="radio-group"
            >
                <Radio value={1}>По видам</Radio>
                <Radio value={2}>Из документа</Radio>
            </Radio.Group>
            <TreeSelect virtual={false} {...treeProps} />
            <div className="props_select_field">
                <p>Свойство для группировки:</p>
                <Select style={{ width: '100%' }} 
                        {...propsSelectProps} 
                        virtual={false}
                        filterSort={(a,b) => a.label.localeCompare(b.label) }   />
            </div>
        </>
    );
    return element;
}

export function TypeOfItem({ settingsParams }) {
    const element = (
        <div className="settings-group settings-group-toi">
            <header>
                <i class="boxes icon" />
                &nbsp;Номенклатура
            </header>
            <InputGroup settingsParams={settingsParams} />
        </div>
    );
    return element;
}
