import { useEffect, useState, useMemo } from "react";
import { Select } from "antd";
import { ROOT_URL, ROOT_PORT } from "../../../scripts/env";
import * as _ from "lodash";
import "../../../styles/analysisTable.css";

import * as rowDataChange from "../Logic/RowDataChange";

export function SegmentsEditorElement({ params, col }) {
    const [options, setOptions] = useState([]);
    const [value, setValue] = useState([]);

    const onChange = (val) => {
        const guid = params.column.colId;
        let optionsList = options;

        params.data[guid] = [];
        if (!params.data.segmentsEdited) params.data.segmentsEdited = {};
        params.data.segmentsEdited[guid] = { 'added': [], 'removed': [] };

        for (let i = 0; i < val.length; i++) {
            let segment = optionsList.find((item) => item.value == val[i]);
            let obj = {
                'segment_id': segment.value,
                'segment_item_id': params.data['item_toi_id'],
                'segment_name': segment.label,
                'segment_parent_id': guid,
                'segment_parent_name': params.colDef.headerName,
            }
            params.data[guid].push(obj);
        }

        let primary = (params.data?.segmentsPrimary?.[guid]) ? params.data.segmentsPrimary[guid] : [];
        let intersection = _.intersectionBy(primary, params.data[guid], 'segment_id');
        let newValue = { 'added': [], 'removed': [] };

        if (intersection.length === 0) {
            newValue.added = params.data[guid];
            newValue.removed = primary;

            rowDataChange.segment(params.data, guid, newValue.added, newValue.removed)
        } else {
            newValue.added = _.differenceBy(params.data[guid], intersection, 'segment_id');
            newValue.removed = _.differenceBy(primary, intersection, 'segment_id');

            rowDataChange.segment(params.data, guid, newValue.added, newValue.removed)

        }
        setValue(val);
    }

    useEffect(() => {
        async function getSegments() {
            const group = params.column.colId;
            const response = await fetch(
                `http://${ROOT_URL}:${ROOT_PORT}/segments_by_group/${group}`
            );
            return await response.json();
        };
        getSegments().then((o) => {
            setOptions(o);
            // if (params.value) {
            //     let initSegments = []
            //     for (let i = 0; i < params.value.length; i++) {
            //         initSegments.push(params.value[i]['segment_id']);
            //     }
            //     setValue(initSegments);
            // }
            const guid = params.column.colId;
            if (params.data?.[guid]) {
                const segments = params.data[guid];
                let initSegments = []
                for (let i = 0; i < segments.length; i++) {
                    initSegments.push(segments[i]['segment_id']);
                }
                setValue(initSegments);
            }
        });
    }, [params.column.colId]);

    const element = (
        <div style={{ width: '100%', height: '30px' }}>
            <Select
                mode="multiple"
                style={{ width: '200px' }}
                placeholder="Выберите сегменты"
                defaultValue={params.value}
                options={_.sortBy(options, [function (o) { return o.label; }])}
                value={value}
                onChange={onChange}
                optionFilterProp="label"
            >
            </Select>
        </div>
    );
    return element;
}
