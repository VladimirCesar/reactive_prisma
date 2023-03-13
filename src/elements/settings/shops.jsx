import "antd/dist/antd.css";
import "../../styles/settings.css";

import { ROOT_URL, ROOT_PORT } from "../../scripts/env";
import { useState, useEffect } from "react";
import { TreeSelect } from "antd";
const { SHOW_PARENT } = TreeSelect;

export let chosenValue = [];

export function Shops({settingsParams}) {
    const [data, setData] = useState([]);
    const [value, setValue] = useState([]);
    const [loading, setLoading] = useState(true);
    const [hasResponse, setHasResponse] = useState(false);
    useEffect(() => {
        if (hasResponse) return;
        else setHasResponse(true);
        fetch(`http://${ROOT_URL}:${ROOT_PORT}/shops`)
            .then((response) => response.json())
            .then((data) => {
                //adding value from settingsParams
                setData(data);
                setValue(settingsParams.get().shopValue);
            })
            .catch((error) => {
                console.log("Ошибка загрузки складов\n" + error);
            })
            .finally(() => setLoading(false));

    }, [hasResponse]);
    const onChange = (newValue) => {
        setValue(newValue);
        chosenValue = newValue;
        settingsParams.add({shopValue: newValue});
    };
    const treeProps = {
        allowClear: true,
        loading,
        value,
        onChange,
        treeData: data,
        treeCheckable: true,
        showCheckedStrategy: SHOW_PARENT,
        placeholder: "Выбор склада",
        showSearch: true,
        treeNodeFilterProp: "title",
    };
    const element = (
        <div className="settings-group settings-group-shops">
            <header>
                <i class="shopping basket icon" />
                &nbsp;Магазины (Склады ТП)
            </header>
            <TreeSelect {...treeProps} virtual={false}/>
        </div>
    );
    return element;
}
