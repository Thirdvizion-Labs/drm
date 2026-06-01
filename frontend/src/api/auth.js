import { api, apiJson } from './client';

export async function login(email, password) {
  const data = await apiJson('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  localStorage.setItem('access_token', data.access_token);
  localStorage.setItem('user', JSON.stringify(data.user));
  return data.user;
}

export async function register(name, email, password) {
  const data = await apiJson('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  });
  return data.user;
}

export async function getMe() {
  return apiJson('/auth/me');
}

export function logout() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('user');
  window.location.href = '/login';
}

export function getUser() {
  const raw = localStorage.getItem('user');
  return raw ? JSON.parse(raw) : null;
}
