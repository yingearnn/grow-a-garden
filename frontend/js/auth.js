export function getToken() {
    return localStorage.getItem('token');
}

export function getUserId() {
    return localStorage.getItem('userId');
}

export function checkAuth() {
    if (!getToken() || !getUserId()) {
        window.location.href = 'login.html';
    }
}

export function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    window.location.href = 'login.html';
}