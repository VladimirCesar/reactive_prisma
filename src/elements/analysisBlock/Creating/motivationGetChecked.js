export const motivationGetChecked = (props) => {
    const v = props.value;
    if (v?.manual?.value !== undefined) {
        if (v.manual.isOff) {
            props.data.cl_motivationValues = [2, v?.auto ?? ""];
        } else if (v.manual.sum) {
            props.data.cl_motivationValues = [1, v.manual.value];
        } else {
            // внесла сюда изменения т.к. выводил не процент, а значение
            props.data.cl_motivationValues = [0, Number(v.manual?.percent) * 100 ?? v.manual?.value];
        }
    } else {
        props.data.cl_motivationValues = [2, v.auto];
    }
    return props.data.cl_motivationValues;
}