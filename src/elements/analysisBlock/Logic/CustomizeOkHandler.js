import * as _ from 'lodash';

const CustomizeOkHandler = (params, styleBuffer, settingsParams) => {
    const colDef = params.column.getColDef();
    const columnId = params.column.colId;
    const colPropLocalStorage = 'savedColumnStyle_' + columnId;
    const buffer = styleBuffer.current[columnId];
    const segments = settingsParams.segments ?? [];

    if (buffer && params && colDef) {
        colDef.cellStyle = (params) => {
            if (buffer?.clear) {
                if (colDef?.initHeaderName) colDef.headerName = colDef.initHeaderName;
                params.api.refreshHeader();
                localStorage.removeItem(colPropLocalStorage);
                let listColumnsLocalStorage = (localStorage.getItem('listOfStyleColumnNames')) ? JSON.parse(localStorage.getItem('listOfStyleColumnNames')) : [];
                if (listColumnsLocalStorage.includes(colPropLocalStorage)) {
                    let newList = _.remove(listColumnsLocalStorage, (item) => item !== colPropLocalStorage);
                    localStorage.setItem('listOfStyleColumnNames', JSON.stringify(newList));
                }

                let newStyle = {
                    'padding': 'unset',
                    "overflow-y": (_.includes(segments, colDef.field)) ? "unset" : "",
                }

                return newStyle;    
            }

            if (!_.isNull(params.value ?? null)) {
                let columnStyle = {
                    'padding': 'unset',
                    'background-color': buffer?.backgroundColor ?? '',
                    'color': buffer?.fontColor ?? '',
                    'font-weight': (buffer?.bold) ? 'bold' : 'normal',
                    'font-style': (buffer?.italic) ? 'italic' : 'normal',
                    "overflow-y": (_.includes(segments, colDef.field)) ? "unset" : "",
                }
                return columnStyle;
            }
        };

        if (buffer?.header) {
            if (!colDef.initHeaderName) colDef.initHeaderName = colDef.headerName;
            colDef.headerName = buffer.header;
            params.api.refreshHeader();
        } else {
            // Дополнительных проверок не требуется, т.к. если в буфере нет заголовка, то он не будет изменен
        }

        localStorage.setItem(colPropLocalStorage, JSON.stringify(buffer));
        let listColumnsLocalStorage = (localStorage.getItem('listOfStyleColumnNames')) ? JSON.parse(localStorage.getItem('listOfStyleColumnNames')) : [];
        if (!listColumnsLocalStorage.includes(colPropLocalStorage)) {
            listColumnsLocalStorage.push(colPropLocalStorage);
            localStorage.setItem('listOfStyleColumnNames', JSON.stringify(listColumnsLocalStorage));
        }
        params.api.refreshCells({ force: true });
    }
}

export default CustomizeOkHandler;