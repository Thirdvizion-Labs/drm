import { useEffect } from 'react';

let addToast;

export function toast(message, type = 'info') {
  if (addToast) addToast(message, type);
}

export function ToastContainer() {
  useEffect(() => {
    const container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
    addToast = (msg, type) => {
      const el = document.createElement('div');
      el.className = `toast ${type}`;
      el.textContent = msg;
      container.appendChild(el);
      setTimeout(() => el.remove(), 3000);
    };
    return () => { container.remove(); addToast = null; };
  }, []);
  return null;
}
