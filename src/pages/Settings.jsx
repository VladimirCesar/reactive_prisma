import React, { useEffect, useRef, useState } from "react";
import { MainHeader } from "../elements/mainHeader";
import { SettingsPeriod } from "../elements/settings/period";
import { Segments } from "../elements/settings/segments";
import { Shops } from "../elements/settings/shops";
import { TypeOfItem } from "../elements/settings/typeOfItem";
import { TypeOfPrice } from "../elements/settings/typeOfPrice";
import { Warehouse } from "../elements/settings/warehouse";
import { List, Checkbox } from "antd";
import { locale } from "moment";

export function Settings({ allowToContinue, settingsParams, errorPool, setStopRenderTable }) {
    useEffect(() => {
        document.title = "Призма Настройки";
        setStopRenderTable(false);
    });

    useEffect(() => {
        if (!settingsParams?.get()?.splitByPages) settingsParams.add({ splitByPages: true })
    }, []);
    
    const element = (
        <div className="container">
            <MainHeader allowToContinue={allowToContinue} />
            

            <div className="settings-common">
                <List
                        header={<div className={"cle_settings-filling-errors"}>Ошибки заполнения:</div>}
                        dataSource={errorPool}
                        locale={{ emptyText: "Ошибок нет, теперь можно перейти к таблице" }}
                        renderItem={(item) => (
                            <List.Item className="cle_settings-filling-errors">
                                • {item}
                            </List.Item>)
                        }
                    />
            </div>

            <div className="settings-common settings-content">
                <SettingsPeriod settingsParams={settingsParams} />
                <TypeOfItem settingsParams={settingsParams} />
                <Warehouse settingsParams={settingsParams} />
                <Shops settingsParams={settingsParams} />
                <TypeOfPrice settingsParams={settingsParams} />
                <Segments settingsParams={settingsParams} />  
            </div>
            <Checkbox
            onChange={(e) => {
                const { checked } = e.target;
                settingsParams.add({ splitByPages: checked });
            }}
            checked={settingsParams?.get()?.splitByPages}
            style={{
                margin: "16px 0 0 150px",
                transform: "scale(1.5)",
            }}>
                Постраничный скроллинг
            </Checkbox>
        </div>
    );
    return element;
}
