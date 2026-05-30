let authToken = localStorage.getItem('access_token');

function getCurrentUser() {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
}

function logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
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
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

function toggleMobileMenu() {
    const navLinks = document.querySelector('.nav-links');
    if (navLinks) {
        navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex';
    }
}

async function refreshToken() {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
        logout();
        return null;
    }
    
    try {
        const response = await fetch('/api/auth/refresh', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${refreshToken}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('access_token', data.access_token);
            authToken = data.access_token;
            return data.access_token;
        } else {
            logout();
            return null;
        }
    } catch (error) {
        logout();
        return null;
    }
}

async function apiRequest(url, options = {}) {
    let token = authToken;
    
    if (!token) {
        token = await refreshToken();
    }
    
    const defaultHeaders = {
        'Authorization': `Bearer ${token}`
    };
    
    if (options.body && !(options.body instanceof FormData)) {
        defaultHeaders['Content-Type'] = 'application/json';
    }
    
    const response = await fetch(url, {
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers
        }
    });
    
    if (response.status === 401) {
        token = await refreshToken();
        if (token) {
            return fetch(url, {
                ...options,
                headers: {
                    ...defaultHeaders,
                    ...options.headers
                }
            });
        }
    }
    
    return response;
}

if (authToken) {
    const user = getCurrentUser();
    if (user) {
        document.addEventListener('DOMContentLoaded', () => {
            const navUser = document.querySelector('.nav-user');
            if (navUser) {
                navUser.querySelector('span').textContent = user.name;
            }
        });
    }
}
