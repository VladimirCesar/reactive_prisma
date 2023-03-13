import * as _ from 'lodash';

export const sumWithTotalItems = (params) => {
    let sum = 0;
    let totalItems = 0;

    params.values.forEach((value) => {
        if (value) {
            if (value?.isGroup) {
                sum += value?.sum ?? 0;
                totalItems += value.totalItems ?? 0;
            } else {
                sum += (_.isNumber(value)) ? value : Number(value) ;
                totalItems++;
            }
        }
    });
    const result = {
        isGroup: true,
        sum: sum,
        totalItems: totalItems 
    }

    // console.log('sumWithTotalItems', result);

    return result;
}