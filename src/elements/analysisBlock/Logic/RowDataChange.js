import * as _ from 'lodash';

const settingsParams = JSON.parse(localStorage.getItem('settingsParams'));
const clubGuid = settingsParams?.selectedClub;

export const motivation = (row, type, value=0, isLoading=false) => {
    if (type == 2) {
        row.cl_motivationValues_new = {
            'type': type,
            'value': row?.motivation?.auto ?? null
        };
    } else if (type == 1) {
        row.cl_motivationValues_new = {
            'type': type,
            'value': value
        };
    } else if (type == 0) {
        const club = row?.[clubGuid] ?? 0;

        let percent = (isLoading) ? Math.round(value * 100) : value;
        let percentRound = Math.round(percent * club) / 100;

        row.cl_motivationValues_new = {
            'type': type,
            'value': percentRound,
            'percent': percent
        };
    }
}

export const price = (row, field, value=0) => {
    row[`${field}_newValue`] = value;
}

// + небольшой костыль:( (isSaveData) может поменять на isLoadData
export const segment = (row, field, added=[], removed=[], isSaveData=false ) => {
    if (!row?.segmentsEdited) row.segmentsEdited = {};

    if (isSaveData) {
        let initValue = row?.segmentsPrimary?.[field] ?? [];
        let newSegmentsList = [];

        _.forEach(initValue, val => {
            if (!removed.find(e => _.isEqual(e, val))) {
                newSegmentsList.push(val);
            }
        })
        let segmentsList = _.union(added, newSegmentsList);
        row[field] = segmentsList;
    }

    row.segmentsEdited[field] = {   added: added, 
                                    removed: removed };
}

export const transfer = (row, field, value) => {
    // подумать как реализовать с transferEditor
    row.toDC = _.cloneDeep(value.toDC);
    row.toShops = _.cloneDeep(value.toShops);
}