import React, { useEffect } from "react";
import { Button, Input, Tooltip, Form, Checkbox } from "antd";
import { InfoCircleOutlined, UserOutlined, EyeInvisibleOutlined, EyeTwoTone } from '@ant-design/icons';
import * as env from "../../scripts/env";
import { useState } from "react";

import "../../styles/auth.css";

export function AuthForm({ setAuthData }) {

    const [login, setLogin] = useState("");
    const [password, setPassword] = useState("");
    const [btnIsDisabled, setBtnIsDisabled] = useState(true);

    const handleChangePassword = (event) => {
        setPassword(event.target.value);
        switchButtonDisable();
    }

    const handleChangeLogin = (event) => {
        setLogin(event.target.value);
        switchButtonDisable();
    }

    const switchButtonDisable = (e) => {
        if (login === "" || password === "") {
            setBtnIsDisabled(true);
        } else {
            setBtnIsDisabled(false);
        }
    }

    const inputLogin = (
        <Input
            placeholder="Введите логин"
            onChange={handleChangeLogin}
            prefix={<UserOutlined className="site-form-item-icon" />}
            suffix={
                <Tooltip title="Введите логин и пароль от 1С">
                    <InfoCircleOutlined
                        style={{
                            color: 'rgba(0,0,0,.45)',
                        }}
                    />
                </Tooltip>
            }
        />
    );

    const inputPassword = (
        <Input.Password
            placeholder="Введите пароль"
            onChange={handleChangePassword}
            iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
        />
    );

    const [isChecked, setIsChecked] = useState(false);
    const onCheck = (e) => {
        setIsChecked(e.target.checked);
    }

    let clickHandler = (e) => {
        e.preventDefault();
        fetch(`http://${env.ROOT_URL}:${env.ROOT_PORT}/auth`, {
            method: 'POST',
            headers: env.defaultHeaders,
            body: JSON.stringify({
                login: login,
                password: password
            })
        }).then(async (r) => {
            if (r.status !== 200) {
                throw new Error(r.statusText + '\n' + await r.text());
            }
            return r.json()
        }).then((data) => {
            const authData = {
                token: data,
                login: login,
                password: password,
                state: true
            }
            setAuthData(authData);
            if(isChecked) {
                localStorage.setItem('authData', JSON.stringify(authData));
            } else {
                sessionStorage.setItem('authData', JSON.stringify(authData));
            }
        }).catch((e) => {
            alert(e);
        });
    }

    const btn = (
        <Button
            type="primary"
            disabled={btnIsDisabled}
            onClick={clickHandler}
        >
            Войти
        </Button>
    );

    useEffect(() => {
        switchButtonDisable();
    });

    const element = (
        <div className="auth-window">
            <div className="ui attached message">
                <div className="header">Добро пожаловать в Призму!</div>
                <p>Пожалуйста, авторизуйтесь</p>
            </div>
            <form className="auth-form-input">
                {inputLogin}
                {inputPassword}
                <Checkbox checked={isChecked} onChange={onCheck}>Запомнить</Checkbox>
                {btn}
            </form>
        </div>
    );
    return element;
}
