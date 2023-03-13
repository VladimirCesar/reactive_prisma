import React from "react";
import { ROOT_URL, ROOT_PORT, defaultHeaders } from "../../../scripts/env";
import { Button, Checkbox, Collapse, Typography, Spin, Input } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import * as _ from "lodash";
import { useState, useEffect } from 'react';

const { Panel } = Collapse;
const { Title } = Typography;

// let hasResponse = false;
// let loading = true;

const CharacteristicsTool = (props) => {
    const [treeElement, setTreeElement] = useState([]);
    const [choisenCharacteristics, setChoisenCharacteristics] = useState(props?.characteristicsFilter ?? {});
    const [loading, setLoading] = useState(!props.props.characterHasResponse.current);

    function getCharacteristicsTree(rows) {
        let characteristics = [];

        _.forEach(rows, (char) => {
            if (!_.find(characteristics, { id: char.filter_prop_id })) {
                characteristics.push({
                    id: char.filter_prop_id,
                    name: char.filter_prop_text.split(' (')[0],
                    isCollapsed: false,
                    children: [{
                        id: char.filter_value_id,
                        name: char.filter_value_text
                    }]
                });
            } else {
                let characteristic = _.find(characteristics, { id: char.filter_prop_id });
                if (!_.find(characteristic.children, { id: char.filter_value_id })) {
                    characteristic.children.push({
                        id: char.filter_value_id,
                        name: char.filter_value_text
                    });
                }
            }
        })

        let sortChildren = _.map(characteristics, (el) => {
            let sortChild = _.sortBy(el.children, ['name']);
            el.children = sortChild;
            return el;
        });
        let sortCharacteristics = _.sortBy(sortChildren, ['name']);

        return sortCharacteristics;
    }

    function getCharacteristicsTreeElement(characteristics) {
        let initValue = props?.characteristicsFilter ?? {};
        let treeElement = [];

        let characteristicElement = (el) => {
            let isCollapsed = !!initValue?.[el.id];
            let children = initValue[el.id] ?? [];
            
            // проверяем, являются ли дети числами
            let concatinateChildren = '';
            _.forEach(el.children, (child) => concatinateChildren += child.name);
            const childrenIsNumber = !_.isNaN(Number(concatinateChildren));

            let characteristicChildren = _.map(el.children, (child) => {
                return {
                    label: (childrenIsNumber) ? Number(child.name) : child.name,
                    value: child.id
                }
            });

            let childrenCheckboxElement = (
                <Collapse defaultActiveKey={(isCollapsed) ? [el.id] : []} className="site-collapse-custom-collapse">
                    <Panel header={el.name} key={el.id} className="site-collapse-custom-panel" >
                        <Checkbox.Group
                            defaultValue={children}
                            onChange={(children) => onCheckboxChange({ children, parent_id: el.id })}
                            options={characteristicChildren}
                            style={{ display: 'flex', flexDirection: 'column' }}
                        />
                    </Panel>
                </Collapse>
            )

            const childrenRangeElement = () => {
                // получаем мин и макс
                const fullChoisenChildren = (choisenCharacteristics?.[el.id])   ? characteristicChildren.filter((child) => choisenCharacteristics[el.id].includes(child.value))
                                                                                : null;
                let min = _.minBy(characteristicChildren, 'label');
                let max = _.maxBy(characteristicChildren, 'label');
                let userMin = (fullChoisenChildren) ? _.minBy(fullChoisenChildren, 'label') : min;
                let userMax = (fullChoisenChildren) ? _.maxBy(fullChoisenChildren, 'label') : max;

                let element = (
                    <Collapse defaultActiveKey={(isCollapsed) ? [el.id] : []} className="site-collapse-custom-collapse">
                        <Panel header={el.name} key={el.id} className="site-collapse-custom-panel" >
                            <div className='characteristics-tool-panel-number-container'>
                                <Checkbox   id={`characteristic-tool-panel-checkbox-${el.id}`}
                                            defaultChecked={!!choisenCharacteristics?.[el.id]}
                                            onChange={(e) => onRangeCheck({e, parent_id: el.id, children: characteristicChildren})}>
                                </Checkbox>

                                <div className='characteristics-tool-panel-number-input-container'>
                                    <Input  type='number'
                                            disabled={!choisenCharacteristics?.[el.id]}
                                            min={min.label}
                                            max={max.label}
                                            id={`characteristic-tool-panel-min-${el.id}`}
                                            placeholder={userMin.label}
                                            addonBefore="от "
                                            addonAfter={
                                                <CloseOutlined 
                                                    onClick={() => onChangeToInitialValue({parent_id: el.id, min: min.label, max: max.label, children: characteristicChildren})} 
                                                    id={`characteristic-tool-panel-btn-min-${el.id}`}
                                                />} 
                                            onChange={(e) => onMinInputChange({e, parent_id: el.id, children: characteristicChildren})}>
                                    </Input>
                                    <Input  type='number'
                                            disabled={!choisenCharacteristics?.[el.id]}
                                            max={max.label}
                                            min={min.label}
                                            placeholder={userMax.label}
                                            id={`characteristic-tool-panel-max-${el.id}`}
                                            addonBefore="до"
                                            addonAfter={
                                                <CloseOutlined 
                                                    onClick={(e) => onChangeToInitialValue({parent_id: el.id, min: min.label, max: max.label, children: characteristicChildren, isMin:false})}
                                                    id={`characteristic-tool-panel-btn-max-${el.id}`}
                                                />} 
                                            onChange={(e) => onMaxInputChange({e, parent_id: el.id, children: characteristicChildren})}>
                                    </Input>
                                </div>
                            </div>
                        </Panel>
                    </Collapse>
                )

                return element;
            }

            if (childrenIsNumber) return childrenRangeElement();
            else return childrenCheckboxElement;
        }
        _.forEach(characteristics, (el) => {
            treeElement.push(characteristicElement(el));
        });

        return treeElement;
    }

    useEffect(() => {
        const settingsParams = props.props.settingsParams;
        const login = props.props.authData.login;
        const password = props.props.authData.password;
        const toiList = (_.isEmpty(settingsParams.TOIValue)) ? settingsParams.DOCValue : settingsParams.TOIValue;
        const rowData = props.rowData;

        const getCharacteristics = () => {
            return new Promise((resolve, reject) => {
                let data = [];
                try {
                    fetch(`http://${ROOT_URL}:${ROOT_PORT}/additional_characteristics_for_the_filter`, {
                        method: 'POST',
                        body: JSON.stringify({ type_of_items_id: toiList, login, password }),
                        headers: defaultHeaders,
                    }).then((response) => {
                        if (response.ok) {
                            return response.json();
                        } else {
                            throw new Error("Ошибка загрузки фильтров");
                        }
                    }).then((response) => {
                        data = response;
                        resolve(data);
                    }).catch((error) => {
                        throw Error(error);
                    });
                } catch (error) {
                    reject(error);                    
                }
            });
        };
        if (!props.props.characterHasResponse.current) {
            getCharacteristics()
                .then((data) => {
                    props.props.characterHasResponse.current = true;
                    let tree = getCharacteristicsTree(data);
                    setTreeElement(getCharacteristicsTreeElement(tree));
                    props.updateCharacteristicsTree(tree)
        
                    _.forEach(data, (el) => {
                        let row = rowData.find((row) => row._id === el.filter_item_id);
                        if (row) {
                            if (!row.additionalCharacteristicsFilter) row.additionalCharacteristicsFilter = [];
        
                            let duplicate = row.additionalCharacteristicsFilter.find((char) => (char.filter_prop_id === el.filter_prop_id && char.filter_value_id === el.filter_value_id))
        
                            if (duplicate) {
                                return;
                            } else {
                                row.additionalCharacteristicsFilter.push({
                                    filter_prop_id: el.filter_prop_id,
                                    filter_prop_text: el.filter_prop_text,
                                    filter_value_id: el.filter_value_id,
                                    filter_value_text: el.filter_value_text
                                });
                            }
                        }
                    })
                })
                .catch((error) => {
                    console.log(error);
                })
                .finally(() => {

                });
        }
    }, []);

    useEffect(() => {
        setTreeElement(getCharacteristicsTreeElement(props.characteristicsTree));
    }, [])

    const onApplyClick = () => {
        props.updateCharacteristicsFilter(choisenCharacteristics);
        props.updateCharacteristicsFilterApply(true)

        localStorage.setItem('characteristicsFilter', JSON.stringify(choisenCharacteristics));
    }

    const onCheckboxChange = (e) => {
        let characteristics = choisenCharacteristics;

        if (e.children.length === 0) {
            delete characteristics[e.parent_id];
        } else {
            characteristics[e.parent_id] = e.children;
        }

        setChoisenCharacteristics(characteristics);
    }

    const onMinInputChange = ({e, parent_id, children=[]}) => {
        let characteristics = choisenCharacteristics;
        let userMin = Number(e.target.value) ?? 0;
        let choisenChildren = [];

        if (!characteristics?.[parent_id] || characteristics[parent_id].length === 0) {
            choisenChildren = children.filter((child) => child.label >= userMin).map((child) => child.value);
            characteristics[parent_id] = choisenChildren;
        } else {
            let fullChoisenChildren = children.filter((child) => characteristics[parent_id].includes(child.label));
            let maxChoisenChildren = _.maxBy(fullChoisenChildren, 'label').label;
            choisenChildren = children.filter((child) => child.label >= userMin && child.label <= maxChoisenChildren).map((child) => child.value);

            if (userMin > maxChoisenChildren) {
                if (characteristics[parent_id]) delete characteristics[parent_id];
            } else {
                characteristics[parent_id] = choisenChildren;
            }
        }
        setChoisenCharacteristics(characteristics);
    }

    const onMaxInputChange = ({e, parent_id, children=[]}) => {
        let characteristics = choisenCharacteristics;
        let userMax = Number(e.target.value) ?? 0;
        let choisenChildren = [];

        if (!characteristics?.[parent_id] || characteristics[parent_id].length === 0) {
            choisenChildren = children.filter((child) => child.label <= userMax).map((child) => child.label);
            characteristics[parent_id] = choisenChildren;
        } else {
            let fullChoisenChildren = children.filter((child) => characteristics[parent_id].includes(child.label));
            let minChoisenChildren = _.minBy(fullChoisenChildren, 'label').label;

            choisenChildren = children.filter((child) => child.label >= minChoisenChildren && child.label <= userMax).map((child) => child.value);
            characteristics[parent_id] = choisenChildren;
        }
        setChoisenCharacteristics(characteristics);
    }

    const onChangeToInitialValue = ({parent_id, min, max, children=[], isMin=true}) => {
        let checkbox = document.getElementById(`characteristic-tool-panel-checkbox-${parent_id}`);
        let inputMin = document.getElementById(`characteristic-tool-panel-min-${parent_id}`);
        let inputMax = document.getElementById(`characteristic-tool-panel-max-${parent_id}`);

        let characteristics = choisenCharacteristics;
        let choisenChildren = [];

        if (checkbox.checked) {
            let fullChoisenChildren = children.filter((child) => characteristics[parent_id].includes(child.label));

            if (isMin) {
                let maxChoisenChildren = _.maxBy(fullChoisenChildren, 'label').label;
                choisenChildren = children.filter((child) => child.value >= min && child.value <= maxChoisenChildren).map((child) => child.value);
                inputMin.value = min;
            } else {
                let minChoisenChildren = _.minBy(fullChoisenChildren, 'label').label;
                choisenChildren = children.filter((child) => child.value >= minChoisenChildren && child.value <= max).map((child) => child.value);
                inputMax.value = max;
            }
            characteristics[parent_id] = choisenChildren;
            setChoisenCharacteristics(characteristics);
        } else {
            inputMin.value = min;
            inputMax.value = max;
        }
    }

    const onRangeCheck = ({e, parent_id, children=[]}) => {
        let characteristics = choisenCharacteristics;
        let inputMin = document.getElementById(`characteristic-tool-panel-min-${parent_id}`);
        let inputMax = document.getElementById(`characteristic-tool-panel-max-${parent_id}`);

        if (!e.target.checked && characteristics?.[parent_id]) {
            delete characteristics[parent_id];
            inputMin.disabled = true;
            inputMax.disabled = true;
            inputMin.classList.add('ant-input-disabled');
            inputMax.classList.add('ant-input-disabled');
        }
        else if (e.target.checked) {
            const choisenChildren = children.map((child) => child.value);
            characteristics[parent_id] = choisenChildren;
            inputMin.disabled = false;
            inputMax.disabled = false;
            inputMin.classList.remove('ant-input-disabled');
            inputMax.classList.remove('ant-input-disabled');
        }
        setChoisenCharacteristics(characteristics);
    }

    return (
        !loading
            ? <div className="characteristics-tool-panel">
                <div className="characteristics-tool-panel-header-container">
                    <Title level={3} className="characteristics-tool-panel-header">
                        Продвинутый фильтр
                    </Title>
                    <div className="characteristics-tool-panel-container">
                        {treeElement}
                    </div>
                </div>
                <div className="characteristics-tool-panel-apply-btn">
                    <Button type="primary" onClick={onApplyClick}>Применить</Button>
                </div>
            </div>
            : <div className="characteristics-tool-panel-loading">
                <Spin size="large" tip="  Загрузка..." />
            </div>
    )
}

export default CharacteristicsTool;