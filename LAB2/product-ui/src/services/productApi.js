const BASE_URL = 'https://dummyjson.com';

export const getProducts = async (limit = 12, skip = 0, keyword = '', category = 'All') => {
    let url = `${BASE_URL}/products?limit=${limit}&skip=${skip}`;

    if (category !== 'All') {
        url = `${BASE_URL}/products/category/${category}?limit=${limit}&skip=${skip}`;
    } 

    else if (keyword) {
        url = `${BASE_URL}/products/search?q=${keyword}&limit=${limit}&skip=${skip}`;
    }

    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
};