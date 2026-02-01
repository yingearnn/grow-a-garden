

// ---------------- Shop Cache Helpers ----------------
const SHOP_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

function getShopCache() {
    return JSON.parse(localStorage.getItem('shopCache'));
}

function setShopCache(data) {
    localStorage.setItem('shopCache', JSON.stringify(data));
}

function isShopExpired() {
    const cache = getShopCache();
    if (!cache || !cache.lastRefresh) return true;
    return Date.now() - cache.lastRefresh >= SHOP_REFRESH_INTERVAL;
}

// ---------------- Auth Helpers ----------------
import { getToken } from './auth.js';
import { getUserId } from './auth.js';
import { checkAuth } from './auth.js';
import { logout } from './auth.js';

// ---------------- Error Handling ----------------
function handleFetchError(error, fallbackMessage = 'An error occurred') {
    console.error(error);
    alert(fallbackMessage);
}

function handleUnauthorized() {
    alert('Session expired. Please login again.');
    logout();
}

// ---------------- Load User Data ----------------
async function loadUserData() {
    const token = getToken();
    const userId = getUserId();

    const response = await fetch(`${currentUrl}/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
    });

    if (response.status === 401) return handleUnauthorized();
    if (!response.ok) throw new Error('Failed to fetch user data');

    const data = await response.json();
    const user = data[0];

    document.getElementById('points-display').textContent = `Points: ${user.points}`;
    document.getElementById('networth-display').textContent = `Net Worth: $${user.net_worth}`;

    return user;
}

// ---------------- Render Plants ----------------
function renderPlants(plants) {
    const plantsGrid = document.getElementById('plants-grid');

    plantsGrid.innerHTML = plants.map(plant => {
        const outOfStock = plant.stock <= 0;
        return `
            <div class="shop-item ${outOfStock ? 'out-of-stock' : ''}">
                <h3>${plant.name}</h3>
                <span class="rarity ${plant.rarity}">${plant.rarity.toUpperCase()}</span>
                <p>Base Value: $${plant.value}</p>
                <p class="price">Cost: ${plant.points} points</p>
                <p class="stock">Stock: ${plant.stock}/${plant.max_stock}</p>
                <button class="btn-buy"
                    data-plant-id="${plant.plant_id}"
                    data-cost="${plant.points}"
                    ${outOfStock ? 'disabled' : ''}>
                    ${outOfStock ? 'Out of Stock' : 'Buy Plant'}
                </button>
            </div>
        `;
    }).join('');

    document.querySelectorAll('#plants-grid .btn-buy:not([disabled])').forEach(btn => {
        btn.addEventListener('click', async e => {
            const plantId = e.target.dataset.plantId;
            const cost = parseInt(e.target.dataset.cost);

            const success = await buyPlant(plantId, cost);
            if (!success) return;

           const cache = getShopCache();

          if (!cache || !cache.plants) return;

        const plantIndex = cache.plants.findIndex(p => p.plant_id == plantId);
        if (plantIndex === -1) return;

        cache.plants[plantIndex].stock -= 1;

        setShopCache({
         ...cache,
        plants: cache.plants
         });

renderPlants(cache.plants);
        });
    });
}

// ---------------- Load Plants ----------------
async function loadPlants(forceRefresh = false) {
    const cache = getShopCache();

    if (!forceRefresh && cache?.plants && !isShopExpired()) {
        renderPlants(cache.plants);
        return;
    }

    const response = await fetch(`${currentUrl}/plants`, {
        headers: { Authorization: `Bearer ${getToken()}` }
    });

    if (!response.ok) throw new Error('Failed to fetch plants');

    const plants = await response.json();
    const available = plants.filter(p => p.stock > 0);
    const source = available.length >= 3 ? [...available] : [...plants];

    const featuredPlants = [];
    while (featuredPlants.length < 3 && source.length > 0) {
        const idx = Math.floor(Math.random() * source.length);
        featuredPlants.push(source.splice(idx, 1)[0]);
    }

    setShopCache({
        ...cache,
        plants: featuredPlants,
        lastRefresh: Date.now()
    });

    renderPlants(featuredPlants);
}

// ---------------- Render Tools ----------------
function renderTools(tools) {
    const toolsGrid = document.getElementById('tools-grid');

    toolsGrid.innerHTML = tools.map(tool => {
        const outOfStock = tool.stock <= 0;
        return `
            <div class="shop-item ${outOfStock ? 'out-of-stock' : ''}">
                <h3>${tool.name}</h3>
                <p>Multiplier: ${tool.multiplier}x</p>
                <p class="price">Cost: ${tool.cost} points</p>
                <p class="stock">Stock: ${tool.stock}/${tool.max_stock}</p>
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

    document.querySelectorAll('#tools-grid .btn-buy:not([disabled])').forEach(btn => {
        btn.addEventListener('click', async e => {
            const toolId = e.target.dataset.toolId;
            const cost = parseInt(e.target.dataset.cost);
            const multiplier = parseFloat(e.target.dataset.multiplier);

            const success = await buyTool(toolId, cost, multiplier);
            if (!success) return;

           const cache = getShopCache();

           const index = cache.tools.findIndex(t => t.item_id == toolId);
           if (index === -1) return;

           cache.tools[index].stock -= 1;

           setShopCache({
           ...cache,
            tools: cache.tools
                });

          renderTools(cache.tools);
        });
    });
}

// ---------------- Load Tools ----------------
async function loadTools(forceRefresh = false) {
    const cache = getShopCache();

    if (!forceRefresh && cache?.tools && !isShopExpired()) {
        renderTools(cache.tools);
        return;
    }

    const response = await fetch(`${currentUrl}/tools`, {
        headers: { Authorization: `Bearer ${getToken()}` }
    });

    if (!response.ok) throw new Error('Failed to fetch tools');

    const tools = await response.json();
    const available = tools.filter(t => t.stock > 0);
    const featuredTool = available.length
        ? available[Math.floor(Math.random() * available.length)]
        : tools[Math.floor(Math.random() * tools.length)];

    setShopCache({
        ...cache,
        tools: [featuredTool],
        lastRefresh: Date.now()
    });

    renderTools([featuredTool]);
}

// ---------------- Buy APIs ----------------
async function buyPlant(plantId, cost) {
    const user = await loadUserData();
    if (user.points < cost) return alert('Insufficient points!'), false;

    const res = await fetch(`${currentUrl}/plants/${plantId}/buy`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify({ user_id: parseInt(getUserId()) })
    });

    if (!res.ok) return false;
    await loadUserData();
    return true;
}

async function buyTool(toolId, cost, multiplier) {
    const user = await loadUserData();
    if (user.points < cost) return alert('Insufficient points!'), false;


    const res = await fetch(`${currentUrl}/tools/${toolId}/buy`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify({ user_id: parseInt(getUserId()) })
    });

    if (!res.ok) return false;
    await loadUserData();
    return true;
}

// ---------------- Shop Refresh Timer ----------------
function startShopRefreshTimer() {
    const timerEl = document.getElementById('timer-value');

    function updateTimer() {
        const cache = getShopCache();

        // If no cache yet, wait
        if (!cache || !cache.lastRefresh) {
            timerEl.textContent = '5:00';
            return;
        }

        const now = Date.now();
        const expiry = cache.lastRefresh + SHOP_REFRESH_INTERVAL;
        let remaining = Math.max(0, expiry - now);

        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);

        timerEl.textContent =
            `${minutes}:${seconds.toString().padStart(2, '0')}`;

        // When expired → refresh shop ONCE
        if (remaining === 0) {
            loadPlants(true);
            loadTools(true);
        }
    }

    updateTimer();
    setInterval(updateTimer, 1000);
}

// ---------------- DOMContentLoaded ----------------
document.addEventListener('DOMContentLoaded', async () => {
    checkAuth();
    await loadUserData();
    loadPlants();
    loadTools();
    startShopRefreshTimer();
    document.getElementById('logout-btn').addEventListener('click', logout);
});
