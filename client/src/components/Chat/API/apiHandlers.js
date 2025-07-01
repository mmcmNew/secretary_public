// utils/apiHandlers.js

// Централизованный обработчик fetch-запросов
async function apiRequest(url, { method = 'GET', body, headers = {} } = {}) {
    const options = {
        method,
        headers: { 'Content-Type': 'application/json', ...headers },
    };
    if (body) options.body = JSON.stringify(body);

    const response = await fetch(url, options);
    if (!response.ok) {
        let errorText = '';
        try {
            const err = await response.json();
            errorText = err.message || JSON.stringify(err);
        } catch {
            errorText = response.statusText;
        }
        throw new Error(errorText || 'Ошибка запроса');
    }
    return response.json();
}

export async function sendMessageToAI(payload) {
    const data = await apiRequest("/api/ai_record_fix", { method: "POST", body: payload });
    if (!data.result) throw new Error('Некорректный ответ от AI');
    return data.result;
}

export async function aiPostGenerate(payload) {
    const data = await apiRequest("/api/ai_post_generate", { method: "POST", body: payload });
    if (!data.result) throw new Error('Некорректный ответ от AI');
    return data.result;
}

export async function post_record_to_socials(payload) {
    const data = await apiRequest("/api/messengers/post_record_to_socials", { method: "POST", body: payload });
    if (!data.result) throw new Error('Некорректный ответ от AI');
    return data.result;
}

export const fetchAllFilters = async (tableName) => {
    try {
        return await apiRequest(`/get_tables_filters/${tableName}`);
    } catch (err) {
        console.error(err);
        return {};
    }
};

export async function fetchFilteredData(tableName, filters) {
    try {
        return await apiRequest('/get_records', {
            method: 'POST',
            body: { table_name: tableName, filters }
        });
    } catch (err) {
        console.error('fetchFilteredData error:', err);
        return { records: [], columns: [] };
    }
}

export async function fetchTablesList() {
    try {
        const data = await apiRequest('/get_tables');
        return data.tables;
    } catch (error) {
        console.error('There was a problem with the fetch operation:', error);
    }
}

export async function fetchTableData(tableName, date) {
    try {
        const timezoneOffset = new Date().getTimezoneOffset() * 60000;
        const data = await apiRequest(`/get_table_data?table_name=${tableName}&date=${date}&timezone_offset=${timezoneOffset}`);
        return data;
    } catch (error) {
        console.error('There was a problem with the fetch operation:', error);
        return { records: [], columns: [] };
    }
}

export async function fetchDatesList(tableName, month, year, timezone) {
    // Добавление ведущего нуля к месяцу, если он меньше 10
    const formattedMonth = month < 10 ? `0${month}` : `${month}`;
    try {
        const data = await apiRequest(`/get_days?table_name=${tableName}&month=${formattedMonth}&year=${year}&timezone=${timezone}`);
        if (data) {
            return data;
        } else {
            console.warn('No days found in response data:', data);
            return [];
        }
    } catch (error) {
        console.error('There was a problem with the fetch operation:', error);
    }
}

export async function updateRecordFromBlocks(table_name, records) {
    const url = '/update_record_from_blocks';
    try {
        return await apiRequest(url, {
            method: 'POST',
            body: { table_name, records }
        });
    } catch (error) {
        console.error('There was a problem with the fetch operation:', error);
    }
}

// Генерация изображения по тексту записи
export async function generateImageForRecord({ table_name, record_id, text }) {
    try {
        await apiRequest('/api/generate-image', {
            method: 'POST',
            body: { table_name, record_id, text }
        });
    } catch (e) {
        console.error('Ошибка генерации изображения:', e);
        throw e;
    }
}
