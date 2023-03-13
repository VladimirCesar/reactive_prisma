import { Form, Button, Input, Switch } from 'antd';
import React, { useCallback, useRef, useEffect, useState } from 'react';
import * as _ from 'lodash';

export function CustomizeModal({ params, styleBuffer, isFirstRender = true }) {

    const initColumnStyle = {
        backgroundColor: '#ffffff',
        fontColor: '#000000',
        bold: false,
        italic: false,
        header: params.column.getColDef().initHeaderName ?? params.column.getColDef().headerName,
        clear: false,
    }
    const [sBackgroundColor, setSBackgroundColor] = useState(initColumnStyle.backgroundColor);
    const [sFontColor, setSFontColor] = useState(initColumnStyle.fontColor);
    const [sBold, setSBold] = useState(initColumnStyle.bold);
    const [sItalic, setSItalic] = useState(initColumnStyle.italic);
    const [sHeader, setSHeader] = useState(initColumnStyle.header);
    const [sClear, setSClear] = useState(false);
    const columnId = params.column.colId;
    const colPropLocalStorage = 'savedColumnStyle_' + columnId;
    if (!styleBuffer.current?.[columnId]) styleBuffer.current[columnId] = {};
    let col = styleBuffer.current[columnId];

    const setColumnStyle = useCallback((newStyles) => {
        if (newStyles.backgroundColor) {
            setSBackgroundColor(newStyles.backgroundColor);
            col.backgroundColor = newStyles.backgroundColor;
        }
        if (newStyles.fontColor) {
            setSFontColor(newStyles.fontColor);
            col.fontColor = newStyles.fontColor;
        }
        if (newStyles.bold) {
            setSBold(newStyles.bold);
            col.bold = newStyles.bold;
        }
        if (newStyles.italic) {
            setSItalic(newStyles.italic);
            col.italic = newStyles.italic;
        }
        if (newStyles.header) {
            setSHeader(newStyles.header);
            col.header = newStyles.header;
        }
        if (newStyles.clear) {
            setSClear(newStyles.clear);
            col.clear = newStyles.clear;
        }
    }, [styleBuffer, columnId, setSBackgroundColor, setSFontColor, setSBold, setSItalic, setSHeader, setSClear]);

    const getColumnStyleFromStorage = useCallback(() => {
        const tryToParse = (v) => {
            if (!v)
                return {};
            try {
                return JSON.parse(v);
            } catch (e) {
                return {};
            }
        }
        const localStorageItem = localStorage.getItem(colPropLocalStorage);
        const savedColumnStyle = tryToParse(localStorageItem);
        setColumnStyle(savedColumnStyle);
    }, []);

    useEffect(() => {
        if (!isFirstRender) return;
        isFirstRender = false;
        getColumnStyleFromStorage();
    }, [getColumnStyleFromStorage]);

    const buttonItemLayout = {
        wrapperCol: {
            span: 10,
            offset: 12,
        }
    }

    const onInputColorColumnChange = (e) => {
        setSBackgroundColor(e.target.value);
        col.backgroundColor = e.target.value;
    }

    const onInputFontColorChange = (e) => {
        setSFontColor(e.target.value);
        col.fontColor = e.target.value;
    }

    const onIsBoldChange = (e) => {
        setSBold(e);
        col.bold = e;
    }

    const onIsItalicChange = (e) => {
        setSItalic(e);
        col.italic = e;
    }

    const onHeaderChange = (e) => {
        setSHeader(e.target.value);
        col.header = e.target.value;
    }

    const onClearClick = (e) => {
        setSClear(true);
        setSBackgroundColor(initColumnStyle.backgroundColor);
        setSFontColor(initColumnStyle.fontColor);
        setSBold(initColumnStyle.bold);
        setSItalic(initColumnStyle.italic);
        setSHeader(initColumnStyle.header);

        col.clear = true;
        col.backgroundColor = initColumnStyle.backgroundColor;
        col.fontColor = initColumnStyle.fontColor;
        col.bold = initColumnStyle.bold;
        col.italic = initColumnStyle.italic;
        col.header = initColumnStyle.header;
    }


    return (
        <Form
            labelCol={{ span: 11 }}
            wrapperCol={{ span: 10, offset: 1 }}
            layout="horizontal"
            size="small"
        >
            <Form.Item label="Колонка">
                <div>{params.column.getColDef().headerName}</div>
            </Form.Item>
            <Form.Item label="Новый цвет колонки">
                <input className="input-color-cell" value={sBackgroundColor} onInput={onInputColorColumnChange} type='color' />
            </Form.Item>
            <Form.Item label="Цвет шрифта">
                <input className="input-color-cell" value={sFontColor} onInput={onInputFontColorChange} type='color' />
            </Form.Item>
            <Form.Item label="Жирный">
                <Switch checked={sBold} onChange={onIsBoldChange} />
            </Form.Item>
            <Form.Item label="Курсив">
                <Switch checked={sItalic} onChange={onIsItalicChange} />
            </Form.Item>
            <Form.Item label="Новое имя колонки">
                <Input type="text" value={sHeader} onChange={onHeaderChange} />
            </Form.Item>
            <Form.Item {...buttonItemLayout}>
                <Button type="danger" htmlType="button" onClick={onClearClick} >Сбросить изменения</Button>
            </Form.Item>

        </Form>
    );
}