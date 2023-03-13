import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { BrowserRouter } from "react-router-dom";

import { multipleColumnSelection } from "./globalListener/multipleColumnSelection";

// on dom load render the app
document.addEventListener("DOMContentLoaded", () => {
    const oce = console.error;
    console.error = function () { };
    console.throw = oce;

//   чуть позже можно будет восстановить и доделать, есть идея
    // document.body.addEventListener('click', e => multipleColumnSelection(e));

    const root = ReactDOM.createRoot(document.querySelector(`#mainApp`));

    if (window.location.pathname === "/")
        window.location.pathname = "/settings";

    root.render(
        <React.StrictMode> 
            <BrowserRouter>
                <App />
            </BrowserRouter>
        </React.StrictMode>
    );
});
