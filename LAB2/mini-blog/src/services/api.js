const BASE_URL = 'https://dummyjson.com/posts';

export const getPosts = async (limit = 10, skip = 0) => {
  const res = await fetch(`${BASE_URL}?limit=${limit}&skip=${skip}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

export const searchPosts = async (keyword) => {
  const res = await fetch(`${BASE_URL}/search?q=${keyword}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

export const getComments = async (id) => {
  const res = await fetch(`${BASE_URL}/${id}/comments`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

export const addPost = async (data) => {
  const res = await fetch(`${BASE_URL}/add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...data, userId: 1 }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

export const deletePost = async (id) => {
  const res = await fetch(`${BASE_URL}/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};