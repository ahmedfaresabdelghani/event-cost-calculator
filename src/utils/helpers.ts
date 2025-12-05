import { v4 as uuidv4 } from 'uuid';

export const generateId = () => uuidv4();

export const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', {
        style: 'currency',
        currency: 'EGP',
    }).format(amount);
};

export const encodeData = (data: any): string => {
    try {
        const json = JSON.stringify(data);
        return btoa(unescape(encodeURIComponent(json)));
    } catch (e) {
        console.error("Encoding failed", e);
        return "";
    }
};

export const decodeData = (code: string): any | null => {
    try {
        const json = decodeURIComponent(escape(atob(code)));
        return JSON.parse(json);
    } catch (e) {
        console.error("Decoding failed", e);
        return null;
    }
};
