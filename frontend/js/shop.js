// shop.js
// Handles shop UI: loading plants/tools, caching shop state, buying items, and refresh timer.

import { showNotification } from './notifications.js';

// Auth helpers (grouped import to reduce redundancy)
import { getToken, getUserId, checkAuth, logout } from './auth.js';

// ---------------- Shop State Management ----------------
// Key used to store randomized “featured items” so the shop doesn't re-randomize on every refresh
const SHOP_STORAGE_KEY = 'shop_state';

// Shop refresh interval for cache validity (1 minute)
const SHOP_REFRESH_INTERVAL = 60000; // ms

// Save featured shop items + timestamp into localStorage
function saveShopState(plants, tools) {
    const state = {
        plants,
        tools,
        timestamp: Date.now()
    };
    localStorage.setItem(SHOP_STORAGE_KEY, JSON.stringify(state));
}

// Read shop state from localStorage if still within refresh window
function getShopState() {
    const stored = localStorage.getItem(SHOP_STORAGE_KEY);
    if (!stored) return null;

    const state = JSON.parse(stored);
    const now = Date.now();
    const elapsed = now - state.timestamp;

    // If at least 1 refresh interval passed, invalidate cache
    const refreshesSinceStored = Math.floor(elapsed / SHOP_REFRESH_INTERVAL);
    if (refreshesSinceStored > 0) {
        localStorage.removeItem(SHOP_STORAGE_KEY);
        return null;
    }

    return state;
}

// Clear cached shop state (forces re-randomize)
function clearShopState() {
    localStorage.removeItem(SHOP_STORAGE_KEY);
}

// ---------------- Error Handling ----------------
// Logs error and shows an on-screen notification
function handleFetchError(error, fallbackMessage = 'An error occurred') {
    console.error(error);
    showNotification(fallbackMessage, 'error');
}

// Handles expired/invalid token by notifying user and logging out
function handleUnauthorized() {
    showNotification('Session expired. Please login again.', 'error');
    logout();
}

// ---------------- Load User Data ----------------
// Fetch user data (points/net worth) and update UI
async function loadUserData() {
    const token = getToken();
    const userId = getUserId();

    try {
        const response = await fetch(`${currentUrl}/user/${userId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        // If token invalid/expired
        if (response.status === 401) {
            handleUnauthorized();
            return;
        }

        if (!response.ok) throw new Error('Failed to fetch user data');

        // Backend returns an array, so user is first element
        const data = await response.json();
        const user = data[0];

        // Update UI values
        document.getElementById('points-display').textContent = `Points: ${user.points}`;
        document.getElementById('networth-display').textContent = `Net Worth: $${user.net_worth}`;

        return user;
    } catch (error) {
        handleFetchError(error, 'Error loading user data');
    }
}

// ---------------- Load Plants ----------------
// Loads featured plants (3 random plants) and renders them
async function loadPlants(forceRefresh = false) {
    const plantsGrid = document.getElementById('plants-grid');

    // Use cached plants if not forcing refresh
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

        // Non-OK response = error
        if (!response.ok) {
            throw new Error(`Failed to fetch plants: ${response.status}`);
        }

        const plants = await response.json();

        // Randomize featured plants
        const featuredPlants = generateFeaturedPlants(plants);

        // Save featured plants to cache, keep existing tools if any
        const currentState = getShopState() || { plants: [], tools: [] };
        saveShopState(featuredPlants, currentState.tools);

        // Render plants into UI
        renderPlants(featuredPlants);

    } catch (error) {
        plantsGrid.innerHTML = `<p>Error loading plants: ${error.message}</p>`;
    }
}

// Select 3 random plants (prefer in-stock if possible)
function generateFeaturedPlants(plants) {
    if (!plants || plants.length === 0) return [];

    // Prefer plants with stock > 0
    const availablePlants = plants.filter(p => p.stock > 0);

    // If <3 in stock, allow selection from all plants
    const featuredPlants = [];
    const copy = availablePlants.length >= 3 ? [...availablePlants] : [...plants];

    // Pick up to 3 random plants without duplicates
    for (let i = 0; i < 3 && copy.length > 0; i++) {
        const idx = Math.floor(Math.random() * copy.length);
        featuredPlants.push(copy[idx]);
        copy.splice(idx, 1);
    }

    return featuredPlants;
}

// Render plant cards into the shop UI
function renderPlants(plants) {
    const plantsGrid = document.getElementById('plants-grid');

    if (!plants || plants.length === 0) {
        plantsGrid.innerHTML = '<p>No plants available</p>';
        return;
    }

    // Generate HTML for each plant
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

    // Attach buy click handlers
    attachPlantBuyHandlers();
}

// Attach click events to plant buy buttons
function attachPlantBuyHandlers() {
    document.querySelectorAll('#plants-grid .btn-buy:not([disabled])').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const plantId = e.target.dataset.plantId;
            const cost = parseInt(e.target.dataset.cost);
            const card = e.target.closest('.shop-item');
            const stockText = card.querySelector('p.stock');

            // Attempt purchase via backend
            const success = await buyPlant(plantId, cost);

            if (success) {
                // Decrease UI stock count
                let current = parseInt(stockText.textContent.match(/\d+/)[0]);
                current--;
                stockText.textContent = `Stock: ${current}`;

                // Disable button when stock reaches 0
                if (current <= 0) {
                    e.target.disabled = true;
                    e.target.textContent = 'Out of Stock';
                    card.classList.add('out-of-stock');
                }

                // Persist updated stock in cached shop state
                updatePlantStockInStorage(plantId, current);
            }
        });
    });
}

// Update cached plant stock value in localStorage
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
// Loads featured tools (1 random tool) and renders it
async function loadTools(forceRefresh = false) {
    const toolsGrid = document.getElementById('tools-grid');

    // Use cached tools if not forcing refresh
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
            throw new Error('Failed to fetch tools');
        }

        const tools = await response.json();

        // Randomize 1 featured tool
        const featuredTools = generateFeaturedTools(tools);

        // Save featured tools to cache, keep existing plants if any
        const currentState = getShopState() || { plants: [], tools: [] };
        saveShopState(currentState.plants, featuredTools);

        // Render tools into UI
        renderTools(featuredTools);

    } catch (error) {
        toolsGrid.innerHTML = `<p>Error loading tools: ${error.message}</p>`;
    }
}

// Select 1 random tool (prefer in-stock if possible)
function generateFeaturedTools(tools) {
    if (!tools || tools.length === 0) return [];

    const availableTools = tools.filter(t => t.stock > 0);

    // Choose from in-stock tools if possible, otherwise choose any
    const toolToFeature = availableTools.length > 0
        ? availableTools[Math.floor(Math.random() * availableTools.length)]
        : tools[Math.floor(Math.random() * tools.length)];

    return [toolToFeature];
}

// Render tool cards into the shop UI
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

    // Attach buy click handlers
    attachToolBuyHandlers();
}

// Attach click events to tool buy buttons
function attachToolBuyHandlers() {
    document.querySelectorAll('#tools-grid .btn-buy:not([disabled])').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const toolId = e.target.dataset.toolId;
            const cost = parseInt(e.target.dataset.cost);
            const multiplier = parseFloat(e.target.dataset.multiplier);
            const card = e.target.closest('.shop-item');
            const stockText = card.querySelector('p.stock');

            // Attempt purchase via backend
            const success = await buyTool(toolId, cost, multiplier);

            if (success) {
                // Decrease UI stock count
                let current = parseInt(stockText.textContent.match(/\d+/)[0]);
                current--;
                stockText.textContent = `Stock: ${current}`;

                // Disable button when stock reaches 0
                if (current <= 0) {
                    e.target.disabled = true;
                    e.target.textContent = 'Out of Stock';
                    card.classList.add('out-of-stock');
                }

                // Persist updated stock in cached shop state
                updateToolStockInStorage(toolId, current);
            }
        });
    });
}

// Update cached tool stock value in localStorage
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
// Sends request to backend to buy plant and updates user points display
async function buyPlant(plantId, cost) {
    const user = await loadUserData();

    // Frontend check: ensure user has enough points before calling backend
    if (!user || user.points < cost) {
        showNotification('Insufficient points!', 'error');
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

        // Handle expired/invalid session
        if (response.status === 401) {
            handleUnauthorized();
            return false;
        }

        // Handle backend error response
        if (!response.ok) {
            const error = await response.json();
            handleFetchError(error, error.message || 'Failed to purchase plant');
            return false;
        }

        // Refresh user data to update points display
        await loadUserData();
        return true;

    } catch (error) {
        handleFetchError(error, 'Error purchasing plant');
        return false;
    }
}

// ---------------- Buy Tool ----------------
// Sends request to backend to buy tool and updates user points display
async function buyTool(toolId, cost, multiplier) {
    const user = await loadUserData();

    // Frontend check: ensure user has enough points before calling backend
    if (!user || user.points < cost) {
        showNotification('Insufficient points!', 'error');
        return false;
    }

    try {
        const response = await fetch(`${currentUrl}/tools/${toolId}/buy`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify({ user_id: parseInt(getUserId()) })
        });

        // Handle expired/invalid session
        if (response.status === 401) {
            handleUnauthorized();
            return false;
        }

        // Handle backend error response
        if (!response.ok) {
            const error = await response.json();
            handleFetchError(error, error.message || 'Failed to purchase tool');
            return false;
        }

        // Refresh user data to update points display
        await loadUserData();
        return true;

    } catch (error) {
        handleFetchError(error, 'Error purchasing tool');
        return false;
    }
}

// ---------------- Shop Refresh Timer ----------------
// Updates countdown timer and refreshes shop every minute
async function startShopRefreshTimer() {

    async function updateTimer() {
        const now = new Date();
        const seconds = now.getSeconds();

        // Countdown until next minute boundary
        const secondsUntilRefresh = 60 - seconds;

        // Display as 0:SS
        document.getElementById('timer-value').textContent =
            `0:${secondsUntilRefresh.toString().padStart(2, '0')}`;

        // When timer hits 0, refresh featured items
        if (secondsUntilRefresh === 60) {
            clearShopState();
            await loadPlants(true);
            await loadTools(true);
        }
    }

    // Initial timer render + update every second
    updateTimer();
    setInterval(updateTimer, 1000);
}

// ---------------- DOMContentLoaded ----------------
// Runs when the page finishes loading
document.addEventListener('DOMContentLoaded', async () => {
    // Redirect/logout if token missing/invalid
    checkAuth();

    // Load points / net worth
    await loadUserData();

    // Load shop content
    await loadPlants();
    await loadTools();

    // Start refresh countdown timer
    startShopRefreshTimer();

    // Attach logout button action
    document.getElementById('logout-btn').addEventListener('click', logout);
});
