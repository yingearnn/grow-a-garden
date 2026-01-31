// ---------------- Notifications ----------------
import { showNotification } from './notifications.js';

const API_BASE = window.location.origin;

// ---------------- Auth Helpers ----------------
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



// ---------------- User Data ----------------
async function loadUserData() {
    const token = getToken();
    const userId = getUserId();

    try {
        const res = await fetch(`${API_BASE}/user/${userId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.status === 401) {
            showNotification('Session expired. Please login again.', 'error');
            logout();
            return;
        }

        if (!res.ok) throw new Error('Failed to fetch user data');

        const data = await res.json();
        const user = data[0];

        document.getElementById('username-display').textContent = user.username;
        document.getElementById('points-display').textContent = `Points: ${user.points}`;
        document.getElementById('networth-display').textContent = `Net Worth: $${user.net_worth}`;

        return user;
    } catch (err) {
        console.error(err);
        showNotification('Error loading user data', 'error');
    }
}

// ---------------- Garden Plots ----------------
async function loadGardenPlots() {
    const token = getToken();
    const userId = getUserId();
    const gardenPlotsDiv = document.getElementById('garden-plots');

    gardenPlotsDiv.innerHTML = '<div class="loading">Loading garden...</div>';

    try {
        const res = await fetch(`${API_BASE}/garden/${userId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.status === 401) {
            showNotification('Session expired. Please login again.', 'error');
            logout();
            return;
        }

        if (!res.ok) throw new Error('Failed to fetch garden plots');

        const plots = await res.json();
        gardenPlotsDiv.innerHTML = '';

        let plotsUsed = 0;
        let totalValue = 0;

        for (let i = 1; i <= 20; i++) {
            const plot = plots.find(p => p.plot_number === i);
            const isEmpty = !plot || !plot.plant_id;

            if (!isEmpty) {
                plotsUsed++;
                totalValue += plot.value || 0;
            }

            const plotDiv = document.createElement('div');
            plotDiv.className = 'garden-plot';
            plotDiv.dataset.plotNumber = i;

            if (isEmpty) {
                plotDiv.dataset.empty = 'true';
            } else {
                plotDiv.dataset.empty = 'false';
                plotDiv.dataset.plantName = plot.name;
                plotDiv.dataset.plantValue = plot.value || 0;
                plotDiv.dataset.plantImage = plot.plantImage;
            }

            gardenPlotsDiv.appendChild(plotDiv);
        }

        document.getElementById('plots-used').textContent = plotsUsed;
        document.getElementById('garden-value').textContent = totalValue;

        document.querySelectorAll('.btn-harvest').forEach(btn => {
            btn.addEventListener('click', async e => {
                e.stopPropagation();
                const plotNumber = e.currentTarget.dataset.plotNumber;
                await harvestPlant(plotNumber);
            });
        });
    } catch (err) {
        console.error(err);
        gardenPlotsDiv.innerHTML = '<p>Error loading garden plots</p>';
        showNotification('Error loading garden', 'error');
    }
}

// ---------------- Harvest Plant ----------------
async function harvestPlant(plotNumber) {
    const token = getToken();
    const userId = getUserId();

    try {
        const res = await fetch(`${API_BASE}/garden/sell`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ user_id: parseInt(userId), plot_number: parseInt(plotNumber) })
        });

        if (res.status === 401) {
            showNotification('Session expired. Please login again.', 'error');
            logout();
            return;
        }

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.message || 'Failed to harvest plant');
        }

        await res.json();
        showNotification('Plant harvested successfully! Check your net worth.', 'success');
        await loadUserData();
        await loadGardenPlots();
    } catch (err) {
        console.error(err);
        showNotification('Error harvesting plant: ' + err.message, 'error');
    }
}

// ---------------- Harvest All Plants ----------------
async function harvestAllPlants() {
    const token = getToken();
    const userId = getUserId();

    try {
        const res = await fetch(`${API_BASE}/garden/${userId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) throw new Error('No plants planted');

        const plots = await res.json();
        const plantedPlots = plots.filter(p => p.plant_id !== null);

        if (plantedPlots.length === 0) {
            showNotification('No plants to harvest!', 'info');
            return;
        }

        let harvested = 0;
        for (const plot of plantedPlots) {
            try {
                const sellRes = await fetch(`${API_BASE}/garden/sell`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ user_id: parseInt(userId), plot_number: plot.plot_number })
                });

                if (sellRes.ok) harvested++;
            } catch (err) {
                console.error('Error harvesting plot', plot.plot_number, err);
            }
        }

        showNotification(`Harvested ${harvested} plants! Check your points and net worth.`, 'success');
        await loadUserData();
        await loadGardenPlots();
    } catch (err) {
        console.error(err);
        showNotification('Error harvesting all plants: ' + err.message, 'error');
    }
}

// ---------------- Init ----------------
document.addEventListener('DOMContentLoaded', async () => {
    checkAuth();
    await loadUserData();
    await loadGardenPlots();

    document.getElementById('logout-btn').addEventListener('click', logout);

    const harvestAllBtn = document.getElementById('harvest-all-btn');
    if (harvestAllBtn) harvestAllBtn.addEventListener('click', harvestAllPlants);
});
