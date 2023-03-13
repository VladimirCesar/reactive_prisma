import { ROOT_URL, ROOT_PORT } from "../../scripts/env";
import { Select } from "antd";
import { useEffect, useState } from "react";

export let chosen;

export function Segments({ settingsParams }) {

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasResponse, setHasResponse] = useState(false);
  const [value, setValue] = useState([]);

  useEffect(() => {
    if (hasResponse) return;
    else setHasResponse(true);

    const getOptions = async () => {
      let data = [];
      try {
        const response = await fetch(
          `http://${ROOT_URL}:${ROOT_PORT}/segments`
        );
        data = await response.json();
      } catch (error) {
        console.log("Ошибка загрузки сегментов\n" + error);
      }
      return data;
    };

    getOptions()
      .then((o) => {
        setData(o);
        setValue(settingsParams.get().segments);
        setLoading(false);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [hasResponse, settingsParams]);

  const handleChange = (value) => {
    setValue(value);
    settingsParams.add({ segments: value });
    chosen = value;
  };

  const element = (
    <div className="settings-group settings-group-segments">
      <header>
        <i class="external alternate icon" />
        &nbsp;Сегменты (дополнительные характеристики)
      </header>
      <Select
        onChange={handleChange}
        value={value}
        loading={loading}
        mode="multiple"
        options={data}
        placeholder="Выбор сегментов"
        optionFilterProp="label"
        virtual={false}
      />
    </div>
  );
  return element;
}
