// js/shop.js

const API_BASE = window.location.origin;

function getToken() {
    return localStorage.getItem('token');
}

function getUserId() {
    return localStorage.getItem('userId');
}

function checkAuth() {
    if (!getToken() || !getUserId()) {
        window.location.href = 'login.html';
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    window.location.href = 'login.html';
}

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
        
        document.getElementById('points-display').textContent = `Points: ${user.points}`;
        document.getElementById('networth-display').textContent = `Net Worth: $${user.net_worth}`;
        
        return user;
    } catch (error) {
        console.error('Error loading user data:', error);
    }
}

async function loadPlants() {
    const token = getToken();
    
    try {
        const response = await fetch(`${API_BASE}/plants`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to fetch plants');
        
        const plants = await response.json();
        const plantsGrid = document.getElementById('plants-grid');
        
        if (plants.length === 0) {
            plantsGrid.innerHTML = '<p>No plants available</p>';
            return;
        }
        
        plantsGrid.innerHTML = plants.map(plant => {
            // Random availability - not all plants appear
            const isAvailable = Math.random() > 0.3;
            if (!isAvailable) return '';
            
            return `
                <div class="shop-item">
                    <h3>${plant.name}</h3>
                    <span class="rarity ${plant.rarity}">${plant.rarity.toUpperCase()}</span>
                    <p>Base Value: $${plant.value}</p>
                    <p class="price">Cost: ${plant.points} points</p>
                    <button class="btn-buy" data-plant-id="${plant.plant_id}" data-cost="${plant.points}">
                        Buy Plant
                    </button>
                </div>
            `;
        }).filter(Boolean).join('');
        
        // Add event listeners to buy buttons
        document.querySelectorAll('.btn-buy').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const plantId = e.target.dataset.plantId;
                const cost = parseInt(e.target.dataset.cost);
                await buyPlant(plantId, cost);
            });
        });
    } catch (error) {
        console.error('Error loading plants:', error);
        document.getElementById('plants-grid').innerHTML = '<p>Error loading plants</p>';
    }
}

async function loadTools() {
    const token = getToken();
    
    try {
        const response = await fetch(`${API_BASE}/tools`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to fetch tools');
        
        const tools = await response.json();
        const toolsGrid = document.getElementById('tools-grid');
        
        if (tools.length === 0) {
            toolsGrid.innerHTML = '<p>No tools available</p>';
            return;
        }
        
        toolsGrid.innerHTML = tools.map(tool => {
            const outOfStock = tool.stock <= 0;
            return `
                <div class="shop-item ${outOfStock ? 'out-of-stock' : ''}">
                    <h3>${tool.name}</h3>
                    <p>Multiplier: ${tool.multiplier}x</p>
                    <p class="price">Cost: ${tool.cost} points</p>
                    <p class="stock">Stock: ${tool.stock}/${tool.max_stock}</p>
                    <button class="btn-buy" data-tool-id="${tool.item_id}" data-cost="${tool.cost}" data-multiplier="${tool.multiplier}" ${outOfStock ? 'disabled' : ''}>
                        ${outOfStock ? 'Out of Stock' : 'Buy Tool'}
                    </button>
                </div>
            `;
        }).join('');
        
        // Add event listeners to buy buttons
        document.querySelectorAll('.btn-buy:not([disabled])').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const toolId = e.target.dataset.toolId;
                const cost = parseInt(e.target.dataset.cost);
                const multiplier = parseFloat(e.target.dataset.multiplier);
                await buyTool(toolId, cost, multiplier);
            });
        });
    } catch (error) {
        console.error('Error loading tools:', error);
        document.getElementById('tools-grid').innerHTML = '<p>Error loading tools</p>';
    }
}

async function buyPlant(plantId, cost) {
    const token = getToken();
    const userId = getUserId();
    
    // Check user has enough points
    const user = await loadUserData();
    if (!user || user.points < cost) {
        alert('Insufficient points!');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/plants/${plantId}/buy`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ user_id: parseInt(userId) })
        });
        
        if (response.status === 401) {
            logout();
            return;
        }
        
        if (!response.ok) {
            const error = await response.json();
            alert(error.message || 'Failed to purchase plant');
            return;
        }
        
        const data = await response.json();
        alert('Plant purchased successfully! Check your inventory.');
        
        // Reload user data and plants
        await loadUserData();
        await loadPlants();
    } catch (error) {
        console.error('Error buying plant:', error);
        alert('Error purchasing plant');
    }
}

async function buyTool(toolId, cost, multiplier) {
    const token = getToken();
    const userId = getUserId();
    
    // Check user has enough points
    const user = await loadUserData();
    if (!user || user.points < cost) {
        alert('Insufficient points!');
        return;
    }
    
    if (!confirm(`This tool will multiply all your planted plants' value by ${multiplier}x. Continue?`)) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/tools/${toolId}/buy`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ user_id: parseInt(userId) })
        });
        
        if (response.status === 401) {
            logout();
            return;
        }
        
        if (!response.ok) {
            const error = await response.json();
            alert(error.message || 'Failed to purchase tool');
            return;
        }
        
        const data = await response.json();
        alert('Tool purchased! All planted plants have been boosted!');
        
        // Reload user data and tools
        await loadUserData();
        await loadTools();
    } catch (error) {
        console.error('Error buying tool:', error);
        alert('Error purchasing tool');
    }
}

function startShopRefreshTimer() {
    function updateTimer() {
        const now = new Date();
        const minutes = now.getMinutes();
        const seconds = now.getSeconds();
        
        const minutesMod = minutes % 5;
        const minutesUntilRefresh = (5 - minutesMod) % 5;
        const secondsUntilRefresh = 60 - seconds;
        
        const totalSeconds = (minutesUntilRefresh * 60 + secondsUntilRefresh) % 300;
        const displayMinutes = Math.floor(totalSeconds / 60);
        const displaySeconds = totalSeconds % 60;
        
        document.getElementById('timer-value').textContent = 
            `${displayMinutes}:${displaySeconds.toString().padStart(2, '0')}`;
        
        // Reload shop when timer hits 0
        if (totalSeconds === 0) {
            loadPlants();
            loadTools();
        }
    }
    
    updateTimer();
    setInterval(updateTimer, 1000);
}

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadUserData();
    loadPlants();
    loadTools();
    startShopRefreshTimer();
    
    document.getElementById('logout-btn').addEventListener('click', logout);
    document.getElementById('refresh-shop-btn').addEventListener('click', () => {
        loadPlants();
        loadTools();
    });
});