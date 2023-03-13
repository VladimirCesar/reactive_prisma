import "semantic-ui-css/semantic.css";
import './styles/mainapp.css'
import { useEffect, useState, useRef } from "react";
import { Route, Routes } from "react-router-dom";
import { Auth } from './pages/Auth';
import { Settings } from "./pages/Settings";
import { Analysis } from "./pages/AnalysisBlock";
import { Transfer } from "./pages/TransferBlock";
import { ConfigProvider } from "antd";
import * as _ from 'lodash';
import locale from "antd/es/locale/ru_RU";

let changedItems = [];
window.getChangedItems = () => changedItems;

function App() {

    const [authData, setAuthData] = useState({});
    const [autoLogin, setAutoLogin] = useState(true);
    const [settingsParams, setSettingsParams] = useState({});
    const [allowToContinue, setAllowToContinue] = useState(true);
    const [stopRenderTable, setStopRenderTable] = useState(false);

    const [errorPool, setErrorPool] = useState([]);

    const characterHasResponse = useRef(false);

    useEffect(() => {
        if (!autoLogin) return;
        else setAutoLogin(false);

        const authDataLS = localStorage.getItem("authData");
        const authDataSS = sessionStorage.getItem("authData");
        if (authDataLS || authDataSS) {
            const authData = authDataLS ? JSON.parse(authDataLS) : JSON.parse(authDataSS);
            setAuthData(authData);
        }

        const settingsParamsLS = localStorage.getItem("settingsParams");
        if (settingsParamsLS) {
            let loadSettingsParams;
            try {
                loadSettingsParams = JSON.parse(settingsParamsLS);
            } catch (e) {
                loadSettingsParams = {};
                localStorage.removeItem("settingsParams");
            }
            console.log("set");
            setSettingsParams(loadSettingsParams);
        }


    }, [autoLogin]);

    const setChangedItems = (v) => changedItems = [...v];

    const changedItemsInterface = {
        get: () => changedItems,
    }

    const settingsParamsInterface = {
        get: () => settingsParams,
        add: (v) => {
            const settingsParamsNow = settingsParams;
            for (const key in v) {
                settingsParams[key] = v[key];
            }
            setSettingsParams(settingsParamsNow);
            checkSettingsParams();
            localStorage.setItem("settingsParams", JSON.stringify(settingsParamsNow));
        },
        delete: (v) => {
            const settingsParamsNow = settingsParams;
            delete settingsParamsNow[v];
            setSettingsParams(settingsParamsNow);
            checkSettingsParams();
            localStorage.setItem("settingsParams", JSON.stringify(settingsParamsNow));
        },
    };

    const checkSettingsParams = () => {
        const errors = [];

        if (settingsParams.itemsLoadType === 1) {
            if (_.isEmpty(settingsParams.TOIValue)) {
                errors.push("Не выбраны виды номенклатуры");
            }
        } else if (settingsParams.itemsLoadType === 2) {
            if (_.isEmpty(settingsParams.DOCValue)) {
                errors.push("Не выбран документ для загрузки номенклатуры");
            }
        } else {
            errors.push("Не выбран тип загрузки номенклатуры (по видам или из документа)");
        }
        if (_.isEmpty(settingsParams.periodStart) || _.isEmpty(settingsParams.periodEnd)) {
            errors.push("Не выбран период");
        }
        if (_.isEmpty(settingsParams.shopValue)) {
            errors.push("Не выбраны склады ТП");
        }
        if (_.isEmpty(settingsParams.warehouseValue)) {
            errors.push("Не выбран склад РЦ");
        }
        if (_.isEmpty(settingsParams.selectedClub) || _.isEmpty(settingsParams.selectedRetail)) {
            errors.push("Не выбрана клубная или розниичная цены");
        }
        if (_.isEmpty(settingsParams.typeOfPriceValue)) {
            errors.push("Не выбраны виды цен");
        }

        setErrorPool(errors);

        if (errors.length > 0) {
            setAllowToContinue(false);
        } else {
            setAllowToContinue(true);
        }
    };


    const getPage = (element) => {
        const ifAuthorized = authData.state ? element : <Auth setAuthData={setAuthData} />;
        return ifAuthorized;
    }

    return (
        <>
            <ConfigProvider locale={locale}>
                <Routes>
                    <Route path={'*'} element={getPage(<Settings setStopRenderTable={setStopRenderTable} errorPool={errorPool} allowToContinue={allowToContinue} settingsParams={settingsParamsInterface} />)} />
                    <Route path="/analysis" element={getPage(<Analysis stopRenderTable={stopRenderTable} setStopRenderTable={setStopRenderTable} setChangedItems={setChangedItems} allowToContinue={allowToContinue} settingsParams={settingsParams} authData={authData} changedItems={changedItemsInterface} characterHasResponse={characterHasResponse} />)} />
                </Routes>
            </ConfigProvider>
        </>
    );
}

export default App;
