import { getToken } from "./tokenUtils";

export const baseUrl = process.env.REACT_APP_BASE_URL;

export const getData = async (endpoint: string, method: string = 'GET', body: unknown = null) => {
    const url = `${baseUrl}/api${endpoint}`;
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`,
    };

    const options: RequestInit = {
        method,
        headers,
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(url, options);
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error);
        }
        return data;
    } catch (error) {
        console.error('Error fetching data:', error);
        throw error;
    }
};