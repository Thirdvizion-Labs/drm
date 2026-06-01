let authToken = localStorage.getItem('access_token');

function getCurrentUser() {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
}

function logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    window.location.href = '/login';
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function toggleMobileMenu() {
    const navLinks = document.querySelector('.nav-links');
    if (navLinks) {
        navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex';
    }
}

async function apiRequest(url, options = {}) {
    const headers = { ...options.headers };
    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }
    if (options.body && !(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }
    return fetch(url, { ...options, headers });
}

document.addEventListener('DOMContentLoaded', () => {
    const user = getCurrentUser();
    const navUser = document.querySelector('.nav-user span');
    if (user && navUser) {
        navUser.textContent = user.name;
    }
});
