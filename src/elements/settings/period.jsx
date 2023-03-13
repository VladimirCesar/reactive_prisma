import { DatePicker } from "antd";
import { Select } from "antd";
import moment from 'moment'
import "antd/dist/antd.css";
import "../../styles/settings.css";
import { useCallback, useEffect, useState } from "react";
import * as _ from 'lodash';
import { ROOT_URL, ROOT_PORT } from "../../scripts/env";

export let period, workingDate;

const getOptions = async () => {
    let data = [];
    try {
        const response = await fetch(`http://${ROOT_URL}:${ROOT_PORT}/settings_periods`);
        data = await response.json();
    } catch (error) {
        console.log('Ошибка загрузки периода\n' + error);
    }
    return data;
}

const { RangePicker } = DatePicker;
const dateFormat = "DD.MM.YYYY";
// let periodSelectValueSave = null;
export function SettingsPeriod({ settingsParams }) {
    const [periods, setPeriods] = useState([]);
    const [loading, setLoading] = useState(true);
    const [hasResponse, setHasResponse] = useState(false);
    const [periodValue, setPeriodValue] = useState([]);
    const [periodSelectValue, setPeriodSelectValue] = useState();
    const [workingDateValue, setWorkingDateValue] = useState(moment());
    
    const setPeriod = (v) => {
        setPeriodValue(v);
        period = v;
        // sry 4 this
        try {
            const periodStart = period[0].format('YYYY-MM-DD');
            const periodEnd = period[1].format('YYYY-MM-DD');
            settingsParams.add({ periodStart, periodEnd });
        } catch (e) {
            settingsParams.add({ periodStart: '', periodEnd: '' });
        }
    };

    useEffect(() => {
        if (hasResponse) return;
        else setHasResponse(true);

        getOptions().then((o) => {
            setPeriods(o);
            setLoading(false);
        })

        let period = JSON.parse(localStorage.getItem('period'));
        let date = moment().format('YYYY-MM-DD');
        if (period && period?.date == date) {

            const workingDateISO = moment(period.workingDate).format('YYYY-MM-DD');
            const periodValue = (period?.periodValue && !_.isEmpty(period.periodValue[0]) && !_.isEmpty(period.periodValue[1])) 
                                    ? [moment(period.periodValue[0]), moment(period.periodValue[1])] 
                                    : ['',''];
            
            setWorkingDateValue(moment(period.workingDate));
            setPeriod(periodValue)
            setPeriodSelectValue(period?.periodSelectValue ?? null);
            
            settingsParams.add({ workingDate: workingDateISO });
            settingsParams.add({ periodSelectValue: period.periodSelectValue ?? ['', ''] });
            localStorage.setItem('period', JSON.stringify(period));
        } else {
            if (period) localStorage.removeItem('period');

            setPeriod(['', '']);
            const workingDateISO = workingDateValue.format('YYYY-MM-DD');
            settingsParams.add({ workingDate: workingDateISO });
        }

    }, [hasResponse, settingsParams, workingDateValue]);

    const onChangePeriod = (value) => {
        setPeriod(value);
    }

    const onChangeWorkDate = (value) => {
        if (_.isEmpty(value)) value = moment();
        workingDate = value;
        setWorkingDateValue(value);
        const workingDateISO = value.format('YYYY-MM-DD');
        settingsParams.add({ workingDate: workingDateISO });
    };

    const onChangePeriodSelect = (value, selectedPeriod) => {
        const today = moment();
        const ago = moment().subtract(value, 'days');
        setPeriodSelectValue(selectedPeriod);
        setPeriod([ago, today]);
        settingsParams.add({ periodSelectValue: selectedPeriod });
    }
    
    useEffect(() => {
        let date = moment().format('YYYY-MM-DD');
        let period = {
            workingDate: workingDateValue,
            date: date,
            periodValue: periodValue,
            periodSelectValue: periodSelectValue,
        }
        localStorage.setItem('period', JSON.stringify(period));
    }, [onChangePeriodSelect, onChangePeriod, onChangeWorkDate]);

    const element = (
        <div className="settings-group settings-group-period">
            <header>
                <i class="clock icon" />
                &nbsp;Период
            </header>
            <Select
                value={(periodSelectValue?.value) ? periodSelectValue.value : null}
                onChange={onChangePeriodSelect}
                loading={loading}
                options={periods}
                placeholder="Выбор периода"
                filterSort={(a, b) => { return a.value - b.value }}
                virtual={false}

            />
            <RangePicker
                onChange={onChangePeriod}
                format={dateFormat}
                placeholder={["Дата начала", "Дата окончания"]}
                value={periodValue}
            />
            <label className="settings-group-period-workDate">
                <span>Рабочая дата:</span>
                <DatePicker onChange={onChangeWorkDate} value={workingDateValue} placeholder="Рабочая дата" format={dateFormat} />
            </label>
        </div>
    );
    return element;
}
