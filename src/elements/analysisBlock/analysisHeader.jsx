import { Button, Modal } from 'antd';
import { useState } from 'react';
import { GetDataForApply } from '../../scripts/analysis';

export function AnalysisHeader({presetTable, settingsParams, authData, params, col }) {
    const [isModalVisible, setIsModalVisible] = useState(false);

    const onAnalysisBlockClick = () => {
        presetTable.current(0);
    }
    const onTransformBlockClick = () => {
        presetTable.current(1);
    }
    const onShowAllClick = () => {
        presetTable.current(2);
    }
    const modalProps = {
        title: 'Применить изменения',
        visible: isModalVisible,
        onOk: window.getChangedItems().length > 0 ? () => {
            if (window.getChangedItems().length > 0) GetDataForApply({settingsParams, authData, params, col});
            setIsModalVisible(false);
            document.body.innerHTML = `<h1 style="display: flex; justify-content: center;">Применение изменений, ожидайте...</h1>`;
        } : () => {
            setIsModalVisible(false);
        },
        onCancel: () => setIsModalVisible(false),
    };
    const element = (
        <div className="analysis-header">
            <Modal {...modalProps}>
                {window.getChangedItems().length > 0 ? `Вы уверены, что хотите применить изменения?`: `Нет изменений для применения`}
            </Modal>
            <Button onClick={() => setIsModalVisible(true)} type="primary" danger size="small">Применить изменения</Button>
            <div className='analysis-header_presetting'>
                <Button size="small" onClick={onAnalysisBlockClick}>Блок анализа</Button>
                <Button size="small" onClick={onTransformBlockClick}>Блок перемещений</Button>
                <Button size="small" onClick={onShowAllClick}>Показать все</Button>
            </div>
        </div>
    );
    return element;
}