import * as _ from 'lodash';

export function ResetColumnStyle(params, settingsParams) {
    const styleslist = JSON.parse(localStorage.getItem('listOfStyleColumnNames')) ?? [];
    const segments = settingsParams.segments ?? [];

        styleslist.forEach((style) => {
            const columnName = style.replace('savedColumnStyle_', '');
            const column = params.columnApi.getColumn(columnName);
            if (column) {
                const colDef = column.getColDef();
                colDef.cellStyle = (params) => {
                    if (!_.isNull(params.value ?? null)) {
                        let columnStyle = {
                            'padding': 'unset',
                            "overflow-y": (_.includes(segments, colDef.field)) ? "unset" : "",
                        }
                        return columnStyle;
                    }
                }
                if (colDef?.initHeaderName) {
                    colDef.headerName = colDef.initHeaderName
                    params.api.refreshHeader();
                } else {
                    // Дополнительных проверок не требуется, т.к. если в буфере нет заголовка, то он не будет изменен
                }
                localStorage.removeItem(style);
            } else {
                // Дополнительных проверок не требуется, т.к. если в буфере нет стиля, то он не будет изменен
            }
        });
        localStorage.removeItem('listOfStyleColumnNames');
        params.api.refreshCells({ force: true });
}
