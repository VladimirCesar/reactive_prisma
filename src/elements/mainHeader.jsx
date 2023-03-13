import { useNavigate } from "react-router-dom";
export function MainHeader({allowToContinue}) {

    const btnClass = (path) => {
        if (window.location.pathname === path) {
            return `ui secondary button`;
        }
        return `ui button`;
    }
    const navigate = useNavigate();

    const analysis = "/analysis";
    const settings = "/settings";

    // const onSettingsBtnClick = useCallback();

    const element = (
        <header className="main_header">
            <nav className="tiny ui buttons four">
                <button className={btnClass(analysis)} onClick={
                    () => {
                        navigate(analysis);
                    }
                }>Таблица</button>
                {/* <button className={btnClass(transfer)} onClick={Go(transfer, !allowToContinue, "Неправильно заполнены настройки")}>Блок перемещений</button> */}
                {/* <button className={btnClass(docs)} onClick={Go(docs)}>Созданные документы</button> */}
                {/* <button className={btnClass(settings)} onClick={Go(settings)}>Настройки</button> */}
                <button className={btnClass(settings)} onClick={
                    () => {
                        localStorage.removeItem('changedItems');
                        navigate(settings);
                    }
                }>Настройки</button>
            </nav>
        </header>
    );
    return element;
}