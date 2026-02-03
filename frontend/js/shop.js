// Don't redeclare currentUrl - it's already declared in getCurrentURL.js
import { showNotification } from './notifications.js';

// ---------------- Auth Helpers ----------------
import { getToken } from './auth.js';
import { getUserId } from './auth.js';
import { checkAuth } from './auth.js';
import { logout } from './auth.js';

// ---------------- Shop State Management ----------------
const SHOP_STORAGE_KEY = 'shop_state';
const SHOP_REFRESH_INTERVAL = 60000; // 1 minute in milliseconds

function saveShopState(plants, tools) {
    const state = {
        plants,
        tools,
        timestamp: Date.now()
    };
    localStorage.setItem(SHOP_STORAGE_KEY, JSON.stringify(state));
}

function getShopState() {
    const stored = localStorage.getItem(SHOP_STORAGE_KEY);
    if (!stored) return null;
    
    const state = JSON.parse(stored);
    const now = Date.now();
    const elapsed = now - state.timestamp;
    
    // Calculate if we've passed a refresh boundary
    const refreshesSinceStored = Math.floor(elapsed / SHOP_REFRESH_INTERVAL);
    
    if (refreshesSinceStored > 0) {
        // Time for a refresh - clear old state
        localStorage.removeItem(SHOP_STORAGE_KEY);
        return null;
    }
    
    return state;
}

function clearShopState() {
    localStorage.removeItem(SHOP_STORAGE_KEY);
}

// ---------------- Error Handling ----------------
function handleFetchError(error, fallbackMessage = 'An error occurred') {
    console.error(error);
    showNotification(fallbackMessage , 'error');
}

function handleUnauthorized() {
    showNotification('Session expired. Please login again.' , 'error');
    logout();
}

// ---------------- Load User Data ----------------
async function loadUserData() {
    const token = getToken();
    const userId = getUserId();

    try {
        const response = await fetch(`${currentUrl}/user/${userId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.status === 401) {
            handleUnauthorized();
            return;
        }

        if (!response.ok) throw new Error('Failed to fetch user data');

        const data = await response.json();
        const user = data[0];

        document.getElementById('points-display').textContent = `Points: ${user.points}`;
        document.getElementById('networth-display').textContent = `Net Worth: $${user.net_worth}`;

        return user;
    } catch (error) {
        handleFetchError(error, 'Error loading user data');
    }
}

// ---------------- Load Plants ----------------
async function loadPlants(forceRefresh = false) {
    const plantsGrid = document.getElementById('plants-grid');
    
    // Check for cached state first
    if (!forceRefresh) {
        const cachedState = getShopState();
        if (cachedState && cachedState.plants && cachedState.plants.length > 0) {
            renderPlants(cachedState.plants);
            return;
        }
    }

    const token = getToken();
    plantsGrid.innerHTML = '<div class="loading">Loading plants...</div>';

    try {
        const response = await fetch(`${currentUrl}/plants`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to fetch plants: ${response.status}`);
        }

        const plants = await response.json();
        
        // Generate featured plants
        const featuredPlants = generateFeaturedPlants(plants);
        
        // Save to localStorage - preserve existing tools
        const currentState = getShopState() || { plants: [], tools: [] };
        saveShopState(featuredPlants, currentState.tools);
        
        renderPlants(featuredPlants);

    } catch (error) {
        plantsGrid.innerHTML = `<p>Error loading plants: ${error.message}</p>`;
    }
}

function generateFeaturedPlants(plants) {
    if (!plants || plants.length === 0) return [];
    
    const availablePlants = plants.filter(p => p.stock > 0);
    const featuredPlants = [];
    const copy = availablePlants.length >= 3 ? [...availablePlants] : [...plants];

    for (let i = 0; i < 3 && copy.length > 0; i++) {
        const idx = Math.floor(Math.random() * copy.length);
        featuredPlants.push(copy[idx]);
        copy.splice(idx, 1);
    }
    
    return featuredPlants;
}

function renderPlants(plants) {
    const plantsGrid = document.getElementById('plants-grid');
    
    if (!plants || plants.length === 0) {
        plantsGrid.innerHTML = '<p>No plants available</p>';
        return;
    }

    plantsGrid.innerHTML = plants.map(plant => {
        const outOfStock = plant.stock <= 0;
        return `
            <div class="shop-item ${outOfStock ? 'out-of-stock' : ''}">
                <h3>${plant.name}</h3>
                <span class="rarity ${plant.rarity}">${plant.rarity.toUpperCase()}</span>
                <p>Base Value: $${plant.value}</p>
                <p class="price">Cost: ${plant.points} points</p>
                <p class="stock">Stock: ${plant.stock}</p>
                <button class="btn-buy" 
                    data-plant-id="${plant.plant_id}" 
                    data-cost="${plant.points}" 
                    ${outOfStock ? 'disabled' : ''}>
                    ${outOfStock ? 'Out of Stock' : 'Buy Plant'}
                </button>
            </div>
        `;
    }).join('');

    // Add click handlers
    attachPlantBuyHandlers();
}

function attachPlantBuyHandlers() {
    document.querySelectorAll('#plants-grid .btn-buy:not([disabled])').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const plantId = e.target.dataset.plantId;
            const cost = parseInt(e.target.dataset.cost);
            const card = e.target.closest('.shop-item');
            const stockText = card.querySelector('p.stock');

            const success = await buyPlant(plantId, cost);

            if (success) {
                // Extract just the number from "Stock: 4"
                let current = parseInt(stockText.textContent.match(/\d+/)[0]);
                current--;
                stockText.textContent = `Stock: ${current}`;

                if (current <= 0) {
                    e.target.disabled = true;
                    e.target.textContent = 'Out of Stock';
                    card.classList.add('out-of-stock');
                }
                
                // Update localStorage with new stock
                updatePlantStockInStorage(plantId, current);
            }
        });
    });
}

function updatePlantStockInStorage(plantId, newStock) {
    const state = getShopState();
    if (state && state.plants) {
        const plant = state.plants.find(p => p.plant_id == plantId);
        if (plant) {
            plant.stock = newStock;
            saveShopState(state.plants, state.tools || []);
        }
    }
}

// ---------------- Load Tools ----------------
async function loadTools(forceRefresh = false) {
    const toolsGrid = document.getElementById('tools-grid');
    
    // Check for cached state first
    if (!forceRefresh) {
        const cachedState = getShopState();
        if (cachedState && cachedState.tools && cachedState.tools.length > 0) {
            renderTools(cachedState.tools);
            return;
        }
    }

    const token = getToken();
    toolsGrid.innerHTML = '<div class="loading">Loading tools...</div>';

    try {
        const response = await fetch(`${currentUrl}/tools`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error('Failed to fetch tools');
        }

        const tools = await response.json();
        const featuredTools = generateFeaturedTools(tools);
        
        // Save to localStorage - preserve existing plants
        const currentState = getShopState() || { plants: [], tools: [] };
        saveShopState(currentState.plants, featuredTools);
        
        renderTools(featuredTools);

    } catch (error) {
        toolsGrid.innerHTML = `<p>Error loading tools: ${error.message}</p>`;
    }
}

function generateFeaturedTools(tools) {
    if (!tools || tools.length === 0) return [];
    
    const availableTools = tools.filter(t => t.stock > 0);
    const toolToFeature = availableTools.length > 0 
        ? availableTools[Math.floor(Math.random() * availableTools.length)]
        : tools[Math.floor(Math.random() * tools.length)];

    return [toolToFeature];
}

function renderTools(tools) {
    const toolsGrid = document.getElementById('tools-grid');
    
    if (!tools || tools.length === 0) {
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
                <p class="stock">Stock: ${tool.stock}</p>
                <button class="btn-buy" 
                    data-tool-id="${tool.item_id}" 
                    data-cost="${tool.cost}" 
                    data-multiplier="${tool.multiplier}" 
                    ${outOfStock ? 'disabled' : ''}>
                    ${outOfStock ? 'Out of Stock' : 'Buy Tool'}
                </button>
            </div>
        `;
    }).join('');

    attachToolBuyHandlers();
}

function attachToolBuyHandlers() {
    document.querySelectorAll('#tools-grid .btn-buy:not([disabled])').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const toolId = e.target.dataset.toolId;
            const cost = parseInt(e.target.dataset.cost);
            const multiplier = parseFloat(e.target.dataset.multiplier);
            const card = e.target.closest('.shop-item');
            const stockText = card.querySelector('p.stock');

            const success = await buyTool(toolId, cost, multiplier);

            if (success) {
                // Extract just the number from "Stock: 4"
                let current = parseInt(stockText.textContent.match(/\d+/)[0]);
                current--;
                stockText.textContent = `Stock: ${current}`;

                if (current <= 0) {
                    e.target.disabled = true;
                    e.target.textContent = 'Out of Stock';
                    card.classList.add('out-of-stock');
                }
                
                updateToolStockInStorage(toolId, current);
            }
        });
    });
}

function updateToolStockInStorage(toolId, newStock) {
    const state = getShopState();
    if (state && state.tools) {
        const tool = state.tools.find(t => t.item_id == toolId);
        if (tool) {
            tool.stock = newStock;
            saveShopState(state.plants || [], state.tools);
        }
    }
}

// ---------------- Buy Plant ----------------
async function buyPlant(plantId, cost) {
    const user = await loadUserData();
    if (!user || user.points < cost) {
        showNotification('Insufficient points!' , 'error');
        return false;
    }

    try {
        const response = await fetch(`${currentUrl}/plants/${plantId}/buy`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json', 
                'Authorization': `Bearer ${getToken()}` 
            },
            body: JSON.stringify({ user_id: parseInt(getUserId()) })
        });

        if (response.status === 401) {
            handleUnauthorized();
            return false;
        }

        if (!response.ok) {
            const error = await response.json();
            handleFetchError(error, error.message || 'Failed to purchase plant');
            return false;
        }

       //removed notification for plant purchased success
        await loadUserData();
        return true;
    } catch (error) {
        handleFetchError(error, 'Error purchasing plant');
        return false;
    }
}

// ---------------- Buy Tool ----------------
async function buyTool(toolId, cost, multiplier) {
    const user = await loadUserData();
    if (!user || user.points < cost) {
        showNotification('Insufficient points!' , 'error');
        return false;
    }

    try {
        const response = await fetch(`${currentUrl}/tools/${toolId}/buy`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
            body: JSON.stringify({ user_id: parseInt(getUserId()) })
        });

        if (response.status === 401) {
            handleUnauthorized();
            return false;
        }
        
        if (!response.ok) {
            const error = await response.json();
            handleFetchError(error, error.message || 'Failed to purchase tool');
            return false;
        }

        await loadUserData();
        return true;

    } catch (error) {
        handleFetchError(error, 'Error purchasing tool');
        return false;
    }
}

// ---------------- Shop Refresh Timer ----------------
async function startShopRefreshTimer() {
    async function updateTimer() {
        const now = new Date();
        const minutes = now.getMinutes();
        const seconds = now.getSeconds();

        const minutesMod = minutes % 1;
        const minutesUntilRefresh = (1 - minutesMod) % 1;
        const secondsUntilRefresh = 60 - seconds;

        const totalSeconds = (minutesUntilRefresh * 60 + secondsUntilRefresh) % 60;
        const displayMinutes = Math.floor(totalSeconds / 60);
        const displaySeconds = totalSeconds % 60;

        document.getElementById('timer-value').textContent =
            `${displayMinutes}:${displaySeconds.toString().padStart(2, '0')}`;

        if (totalSeconds === 0) {
            clearShopState(); // Clear the cache
            await loadPlants(true); // Force refresh
            await loadTools(true);
        }
    }

    updateTimer();
    setInterval(updateTimer, 1000);
}

// ---------------- DOMContentLoaded ----------------
document.addEventListener('DOMContentLoaded', async () => {
    checkAuth();

    await loadUserData();

    await loadPlants();
    await loadTools();

    startShopRefreshTimer();

    document.getElementById('logout-btn').addEventListener('click', logout);
});