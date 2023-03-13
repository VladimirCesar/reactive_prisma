import { Link } from "react-router-dom";
import { MainHeader } from "../elements/mainHeader";
function Transfer({allowToContinue}) {
    document.title = "Призма | Блок перемещений";
    return (
        <>
            <MainHeader allowToContinue={allowToContinue}/>
            <div>Transfer</div>
        </>
    );
}

export { Transfer };
