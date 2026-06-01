const API = '/api';

function getToken() {
  return localStorage.getItem('access_token');
}

export async function api(url, options = {}) {
  const headers = { ...options.headers };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  const res = await fetch(API + url, { ...options, headers });
  if (res.status === 401) {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }
  return res;
}

export async function apiJson(url, options = {}) {
  const res = await api(url, options);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}
