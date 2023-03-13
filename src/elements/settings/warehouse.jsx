import "antd/dist/antd.css";
import "../../styles/settings.css";

import { ROOT_URL, ROOT_PORT } from "../../scripts/env";
import { useState, useEffect } from "react";
import { TreeSelect } from "antd";
const { SHOW_PARENT } = TreeSelect;

export let chosenValue = [];

export function Warehouse({settingsParams}) {
    const [data, setData] = useState([]);
    const [value, setValue] = useState([]);
    const [loading, setLoading] = useState(true);
    const [hasResponse, setHasResponse] = useState(false);
    useEffect(() => {
        if (hasResponse) return;
        else setHasResponse(true);
        fetch(`http://${ROOT_URL}:${ROOT_PORT}/warehouses`)
            .then((response) => response.json())
            .then((data) => {
                setData(data);
                setValue(settingsParams.get().warehouseValue);
            })
            .catch((error) => {
                console.log("Ошибка загрузки складов\n" + error);
            })
            .finally(() => setLoading(false));
    }, [hasResponse]);
    const onChange = (newValue) => {
        setValue(newValue);
        chosenValue = newValue;
        settingsParams.add({warehouseValue: newValue});
    };
    const treeProps = {
        allowClear: true,
        loading,
        value,
        onChange,
        treeData: data,
        treeCheckable: false,
        showCheckedStrategy: SHOW_PARENT,
        placeholder: "Выбор склада",
        showSearch: true,
        treeNodeFilterProp: "title",
        virtual: false,
    };
    const element = (
        <div className="settings-group settings-group-warehouse">
            <header>
                <i class="warehouse icon" />
                &nbsp;Склад РЦ
            </header>
            <TreeSelect virtual={false} {...treeProps} />
        </div>
    );
    return element;
}
