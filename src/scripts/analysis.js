import * as _ from 'lodash';
import { ROOT_URL, ROOT_PORT, defaultHeaders } from '../scripts/env'
import { useNavigate } from 'react-router-dom';
export function GetDataForApply({ settingsParams, authData }) {
    const changes = window.getChangedItems();
    const priceChanges = _.filter(changes, (change) => change.type === 'price');
    const segmentsChanges = _.filter(changes, (change) => change.type === 'segment');
    const motivationChangesToAdd = _.filter(changes, (change) => change.field === 'motivation' && change.type <= 1);
    const motivationChangesToRemove = _.filter(changes, (change) => change.field === 'motivation' && change.type === 2);
    const transferChanges = _.filter(changes, (change) => change.type === 'transfer');
    const SPData = [];
    _.forEach(priceChanges, (change) => {
        let typeOfPrice = _.find(SPData, (e) => e.type_of_price === change.field);
        if (!typeOfPrice) {
            SPData.push({
                type_of_price: change.field,
                items: [],
            });
            typeOfPrice = _.last(SPData);
        };
        typeOfPrice.items.push({
            item_id: change.guid,
            price: change.value
        });
    });
    const SPDataWithWorkingDate = {
        data: SPData,
        workingDate: settingsParams.workingDate
    };

    const SegmentsData = [];
    _.forEach(segmentsChanges, (change) => {
        let item = _.find(SegmentsData, (e) => e.item_id === change.item);
        if (!item) {
            SegmentsData.push({
                item_id: change.guid,
                toAdd: [],
                toRemove: [],
            });
            item = _.last(SegmentsData);
        };
        item.toAdd.push(..._.map(_.filter(change.value.added, (e) => e.segment_id !== null), (e) => e.segment_id));
        item.toRemove.push(..._.map(_.filter(change.value.removed, (e) => e.segment_id !== null), (e) => e.segment_id));
    });

    const AddManualMotivation = {
        workingDate: settingsParams.workingDate,
        items: _.map(motivationChangesToAdd, (change) => {
            return {
                item_id: change.guid,
                value: change.value,
                type: change.type,
            }
        }),
    };

    const RemoveManualMotivation = {
        workingDate: settingsParams.workingDate,
        items: _.map(motivationChangesToRemove, (change) => {
            return {
                item_id: change.guid,
            }
        }),
    };

    const getTransferDocs = () => {
        if (transferChanges.length === 0) return [];
        const DCguid = transferChanges[0].DCguid;
        const shopsRaw = [];
        _.forEach(transferChanges, (change) => {
            shopsRaw.push(..._.keys(change.value.toShops), ..._.keys(change.value.toDC));
        });
        const shops = _.uniq(shopsRaw);
        const itemsToTransferRaw = [];
        _.forEach(shops, (shop) => {
            _.forEach(transferChanges, (change) => {
                const toShopCount = change.value.toShops[shop] || 0;
                const toDCCount = change.value.toDC[shop] || 0;
                let transition;
                if (toShopCount > 0) {
                    transition = {
                        shopGuid: shop,
                        item_id: change.guid,
                        toDC: false,
                        count: toShopCount,
                    };
                }
                if (toDCCount > 0) {
                    transition = {
                        shopGuid: shop,
                        item_id: change.guid,
                        toDC: true,
                        count: toDCCount,
                    }
                }
                if (!transition) return;
                else itemsToTransferRaw.push(transition);
            });
        });
        const itemsToTransfer = [];
        _.forEach(itemsToTransferRaw, (item) => {
            const doc = _.find(itemsToTransfer, (e) => _.isEqual(e, item));
            if (!doc) {
                itemsToTransfer.push(item);
            };
        });
        const toDCRows = _.filter(itemsToTransfer, (e) => e.toDC);
        const toShopRows = _.filter(itemsToTransfer, (e) => !e.toDC);
        const toDCDocsRaw = _.toPairs(_.groupBy(toDCRows, 'shopGuid'));
        const toShopDocsRaw = _.toPairs(_.groupBy(toShopRows, 'shopGuid'));
        const transferDocs = [];
        _.forEach(toDCDocsRaw, (doc) => {
            const newDoc = {
                w_sender: doc[0],
                w_receiver: DCguid,
                items: _.map(doc[1], (e) => {
                    return {
                        item_id: e.item_id,
                        count: e.count,
                    }
                }),
            };
            transferDocs.push(newDoc);
        });
        _.forEach(toShopDocsRaw, (doc) => {
            const newDoc = {
                w_sender: DCguid,
                w_receiver: doc[0],
                items: _.map(doc[1], (e) => {
                    return {
                        item_id: e.item_id,
                        count: e.count,
                    }
                }),
            };
            transferDocs.push(newDoc);
        });
        return transferDocs;
    }

    const Transfers = {
        workingDate: settingsParams.workingDate,
        docs: getTransferDocs(),
    }



    console.log("Передача данных на сервер");
    fetch(`http://${ROOT_URL}:${ROOT_PORT}/apply`, {
        method: 'POST',
        body: JSON.stringify({
            login: authData.login,
            password: authData.password,
            set_price_data: SPDataWithWorkingDate.data.length > 0 ? SPDataWithWorkingDate : null,
            set_segments_data: SegmentsData.length > 0 ? SegmentsData : null,
            set_manual_motivation_data: AddManualMotivation.items.length > 0 ? AddManualMotivation : null,
            unset_manual_motivation_data: RemoveManualMotivation.items.length > 0 ? RemoveManualMotivation : null,
            transfer_docs_data: Transfers.docs.length > 0 ? Transfers : null,
        }),
        headers: defaultHeaders,
    }).then(async (response) => {
        if (!response.ok) {
            console.log('Ошибка передачи данных на сервер');
            console.log(await response.text());
            return;
        }
        const resultJSON = await response.json();
        let reloadAnswer;
        if (Array.isArray(resultJSON) && _.isEmpty(resultJSON)) {
            reloadAnswer = window.confirm('Данные успешно переданы на сервер. Обновить страницу?');
            localStorage.removeItem('changedItems');
            if(reloadAnswer) {
                window.location.reload();
            } else {
                window.location.pathname = `/settings`;
            }
        } else {
            const errors = [];
            for (let i = 0; i < resultJSON.length; i++) {
                const error = resultJSON[i]?.["Объект"] + ': ' + resultJSON[i]?.["ТекстОшибки"];
                errors.push(error);
            }
            reloadAnswer = window.confirm(
            `Данные переданы, но с ошибками:
            ${errors.join('\n')}
            Документы с ошибками были записаны, но не проведены!
            Обновить страницу?`);
            if(reloadAnswer) {
                window.location.reload();
            } else {
                window.location.pathname = `/settings`;
            }
        }
    }).catch((error) => {
        console.log('Ошибка передачи данных на сервер');
        console.log(error);
    }).finally(() => {
        console.log('Операция завершена');
        localStorage.removeItem('changedItems');
    });
}