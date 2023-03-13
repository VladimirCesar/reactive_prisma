import { MainHeader } from "../elements/mainHeader";
import { AnalysisTable } from '../elements/analysisBlock/analysisTable';
import { AnalysisHeader } from "../elements/analysisBlock/analysisHeader";
import { Modal, Input, Form, Button, Switch } from 'antd';
import * as _ from 'lodash';
import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { CustomizeModal } from "../elements/common/CustomizeModal";
import { CalculateModal } from "../elements/common/CalculateModal";
import CustomizeOkHandler from "../elements/analysisBlock/Logic/CustomizeOkHandler";
import CalculateOkHandler from "../elements/analysisBlock/Logic/CalculateOkHandler";

function Analysis({ allowToContinue, stopRenderTable, setStopRenderTable, settingsParams, authData, changedItems, setChangedItems, characterHasResponse }) {
    document.title = "Призма | Анализ";
    const styleBuffer = useRef({});
    const calculateBuffer = useRef({});
    // состояние таблицы преднастройки
    const presetTable = useRef(null);
    // Вынесла в отдельный компонент customizeOkHandler

    const calculateModal = (params) => {
        return (
            <CalculateModal params={params} calculateBuffer={calculateBuffer} settingsParams={settingsParams}  />
        )
    };

    const customizeModal = (params) => {
        return (
            <CustomizeModal params={params} styleBuffer={styleBuffer} />
        )
    };

    const callCustomizeModal = (params) => {
        Modal.confirm({
            title: 'Персонализация',
            content: customizeModal(params),
            okText: 'Применить',
            cancelText: 'Отмена',
            onOk: () => CustomizeOkHandler(params, styleBuffer, settingsParams),
            okType: 'primary',
     
        });
    }

    const callCalculateModal = (params) => {
        Modal.confirm({
            title: 'Калькулятор цен',
            content: calculateModal(params),
            okText: 'Применить',
            cancelText: 'Отмена',
            onOk: () => CalculateOkHandler(params, calculateBuffer, settingsParams),
            okType: 'primary',
            width: 600
        });
    }

    return (
        <>
            <MainHeader allowToContinue={allowToContinue} />
            <AnalysisHeader presetTable={presetTable} settingsParams={settingsParams} authData={authData}/>
            <AnalysisTable presetTable={presetTable} stopRenderTable={stopRenderTable} setStopRenderTable={setStopRenderTable} authData={authData} settingsParams={settingsParams} setChangedItems={setChangedItems} changedItems={changedItems} callCustomizeModal={callCustomizeModal} callCalculateModal={callCalculateModal} characterHasResponse={characterHasResponse} />
        </>
    );
}

export { Analysis };
