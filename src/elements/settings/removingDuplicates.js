import * as _ from 'lodash';

 // рекурсивный обход дерева и удаление дубликатов
 export const cloneTree = (arr) => {
    const guidsList = [];
    const newArr = [];
    arr.forEach((item) => {
        const newItem = { ...item };
        if (!_.includes(guidsList, item.value)) {
            guidsList.push(item.value);
            if (item.children) {
                newItem.children = cloneTree(item.children);
            } 
            newArr.push(newItem);
        } else {
            // в массив не добавляем так как он уже есть
        }
    });
    return newArr;
}