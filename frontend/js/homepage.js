// js/homepage.js

const API_BASE = window.location.origin;

// Get JWT from localStorage
function getToken() {
    return localStorage.getItem('token');
}

// Get user ID from localStorage
function getUserId() {
    return localStorage.getItem('userId');
}

// Redirect if not authenticated
function checkAuth() {
    if (!getToken() || !getUserId()) {
        window.location.href = 'login.html';
    }
}

// Logout functionality
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    window.location.href = 'login.html';
}

// Fetch user data and update stats
async function loadUserData() {
    const token = getToken();
    const userId = getUserId();
    
    try {
        const response = await fetch(`${API_BASE}/user/${userId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.status === 401) {
            logout();
            return;
        }
        
        if (!response.ok) throw new Error('Failed to fetch user data');
        
        const data = await response.json();
        const user = data[0];
        
        document.getElementById('username-display').textContent = user.username;
        document.getElementById('points-display').textContent = `Points: ${user.points}`;
        document.getElementById('networth-display').textContent = `Net Worth: $${user.net_worth}`;
        
        localStorage.setItem('username', user.username);
    } catch (error) {
        console.error('Error loading user data:', error);
    }
}

// Load challenges preview
async function loadChallenges() {
    const token = getToken();
    
    try {
        const response = await fetch(`${API_BASE}/challenges`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to fetch challenges');
        
        const challenges = await response.json();
        const challengesList = document.getElementById('challenges-list');
        
        if (challenges.length === 0) {
            challengesList.innerHTML = '<p>No challenges available</p>';
            return;
        }
        
        challengesList.innerHTML = challenges.slice(0, 3).map(challenge => `
            <div class="challenge-item">
                <h4>${challenge.description}</h4>
                <p>Points: ${challenge.points}</p>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading challenges:', error);
        document.getElementById('challenges-list').innerHTML = '<p>Error loading challenges</p>';
    }
}

// Load inventory count
async function loadInventoryCount() {
    const token = getToken();
    const userId = getUserId();
    
    try {
        const response = await fetch(`${API_BASE}/plants/${userId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.status === 404) {
            document.getElementById('plant-count').textContent = '0';
            return;
        }
        
        if (!response.ok) throw new Error('Failed to fetch inventory');
        
        const plants = await response.json();
        document.getElementById('plant-count').textContent = plants.length;
    } catch (error) {
        console.error('Error loading inventory:', error);
        document.getElementById('plant-count').textContent = '0';
    }
}

// Load garden plots count
async function loadGardenInfo() {
    const token = getToken();
    const userId = getUserId();
    
    try {
        const response = await fetch(`${API_BASE}/garden/${userId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to fetch garden info');
        
        const plots = await response.json();
        const plantedCount = plots.filter(plot => plot.plant_id !== null).length;
        document.getElementById('plots-used').textContent = plantedCount;
    } catch (error) {
        console.error('Error loading garden info:', error);
        document.getElementById('plots-used').textContent = '0';
    }
}

// Calculate and display shop refresh timer
function startShopRefreshTimer() {
    function updateTimer() {
        const now = new Date();
        const minutes = now.getMinutes();
        const seconds = now.getSeconds();
        
        // Calculate time until next 5-minute mark
        const minutesMod = minutes % 5;
        const minutesUntilRefresh = (5 - minutesMod) % 5;
        const secondsUntilRefresh = 60 - seconds;
        
        const totalSeconds = (minutesUntilRefresh * 60 + secondsUntilRefresh) % 300;
        const displayMinutes = Math.floor(totalSeconds / 60);
        const displaySeconds = totalSeconds % 60;
        
        document.getElementById('shop-refresh-timer').textContent = 
            `Shop refreshes in: ${displayMinutes}:${displaySeconds.toString().padStart(2, '0')}`;
    }
    
    updateTimer();
    setInterval(updateTimer, 1000);
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadUserData();
    loadChallenges();
    loadInventoryCount();
    loadGardenInfo();
    startShopRefreshTimer();
    
    // Event listeners
    document.getElementById('logout-btn').addEventListener('click', logout);
    document.getElementById('view-shop-btn').addEventListener('click', () => {
        window.location.href = 'shop.html';
    });
    document.getElementById('view-inventory-btn').addEventListener('click', () => {
        window.location.href = 'inventory.html';
    });
    document.getElementById('view-garden-btn').addEventListener('click', () => {
        window.location.href = 'garden.html';
    });
});