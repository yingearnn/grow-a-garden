import { showNotification } from './notifications.js';
// ---------------- Auth Helpers ----------------
import { getToken } from './auth.js';
import { getUserId } from './auth.js';
import { checkAuth } from './auth.js';
import { logout } from './auth.js';

// ---------------- Load User Data ----------------
async function loadUserData() {
    const token = getToken();
    const userId = getUserId();

    try {
        const response = await fetch(`${currentUrl}/user/${userId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.status === 401) {
            showNotification('Session expired. Please login again.' , 'error');
            logout();
            return;
        }

        if (!response.ok) throw new Error('Failed to fetch user data');

        const data = await response.json();
        const user = data[0];

        document.getElementById('username-display').textContent = user.username;
        document.getElementById('points-display').textContent = `Points: ${user.points}`;
        document.getElementById('networth-display').textContent = `Net Worth: $${user.net_worth}`;

        return user;
    } catch (error) {
        console.error('Error loading user data:', error);
        showNotification('Error loading user data: ' + error.message , 'error');
    }
}

// ---------------- Load Garden Plots ----------------
async function loadGardenPlots() {
    const token = getToken();
    const userId = getUserId();
    const gardenPlotsDiv = document.getElementById('garden-plots');

    gardenPlotsDiv.innerHTML = '<div class="loading">Loading garden...</div>';

    try {
        // FIXED: Use correct endpoint /garden/:userId
        const response = await fetch(`${currentUrl}/garden/${userId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.status === 401) {
            showNotification('Session expired. Please login again.' , 'error');
            logout();
            return;
        }

        if (!response.ok) {
            console.error('Garden fetch failed:', response.status, response.statusText);
            throw new Error('Failed to fetch garden plots');
        }

        const plots = await response.json();
        console.log('Garden plots:', plots);

        let plotsUsed = 0;
        let totalValue = 0;

        // Create 20 plots
        gardenPlotsDiv.innerHTML = '';
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
                plotDiv.innerHTML = `
                    <div class="plot-visual empty">
                        <div class="plot-content">
                            <p class="plot-status">Empty</p>
                        </div>
                    </div>
                    <div class="plot-info">
                        <p class="plot-number">#${i}</p>
                    </div>
                `;
            } else {
                plotDiv.innerHTML = `
                    <div class="plot-visual planted">
                     <img
  class="plant-image"
 src="pixel_plants/${plot.plantImage}"
  alt="${plot.name || 'Unknown'}"
  onerror="this.onerror=null; this.src='frontend/pixel_plants/unknown.png';"
/>
                    </div>
                    <div class="plot-info">
                        <div>
                            <p class="plot-number">#${i}</p>
                            <p class="plant-name">${plot.name || 'Unknown'}</p>
                            <p class="plant-value">$${plot.value || 0}</p>
                        </div>
                        <button class="btn-harvest" data-plot-number="${plot.plot_number}">Harvest</button>
                    </div>
                `;
            }

            gardenPlotsDiv.appendChild(plotDiv);
        }

        // Update stats
        document.getElementById('plots-used').textContent = plotsUsed;
        document.getElementById('garden-value').textContent = totalValue;

        // Add harvest button handlers
        document.querySelectorAll('.btn-harvest').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const plotNumber = e.target.dataset.plotNumber;
                await harvestPlant(plotNumber);
            });
        });

    } catch (error) {
        console.error('Error loading garden plots:', error);
        gardenPlotsDiv.innerHTML = `<p>Error loading garden: ${error.message}</p>`;
    }
}

// ---------------- Harvest Plant ----------------
async function harvestPlant(plotNumber) {
    const token = getToken();
    const userId = getUserId();

    try {
        // Use the existing /garden/sell endpoint
        const response = await fetch(`${currentUrl}/garden/sell`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                user_id: parseInt(userId),
                plot_number: parseInt(plotNumber)
            })
        });

        if (response.status === 401) {
            showNotification('Session expired. Please login again.', 'error');
            logout();
            return;
        }

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to harvest plant');
        }

        const result = await response.json();
        showNotification(result.message, 'success');
        
        // Reload user data and garden
        await loadUserData();
        await loadGardenPlots();

    } catch (error) {
        console.error('Error harvesting plant:', error);
        showNotification('Error harvesting plant: ' + error.message , 'error');
    }
}

// ---------------- Harvest All Plants ----------------
async function harvestAllPlants() {
    const token = getToken();                      // /:userId
    const userId = getUserId();

    try {
        // Get all plots first
        const response = await fetch(`${currentUrl}/garden/${userId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('No plants planted');

        const plots = await response.json();
        const plantedPlots = plots.filter(p => p.plant_id !== null);

        if (plantedPlots.length === 0) {
            showNotification('No plants to harvest!' , 'error');
            return;
        }

        let harvested = 0;
        for (const plot of plantedPlots) {
            try {
                const sellResponse = await fetch(`${currentUrl}/garden/sell`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        user_id: parseInt(userId),
                        plot_number: plot.plot_number
                    })
                });

                if (sellResponse.ok) {
                    harvested++;
                }
            } catch (err) {
                console.error('Error harvesting plot:', plot.plot_number, err);
            }
        }

        showNotification(`Harvested ${harvested} plants! Check your points and net worth.` , 'success');
        
        // Reload user data and garden
        await loadUserData();
        await loadGardenPlots();

    } catch (error) {
        console.error('Error harvesting all plants:', error);
        showNotification('Error harvesting all plants: ' + error.message , 'error');
    }
}

// ---------------- DOMContentLoaded ----------------
document.addEventListener('DOMContentLoaded', async () => {
    checkAuth();

    // Load user data and garden
    await loadUserData();
    await loadGardenPlots();

    // Add event listeners
    document.getElementById('logout-btn').addEventListener('click', logout);
    
    const harvestAllBtn = document.getElementById('harvest-all-btn');
    if (harvestAllBtn) {
        harvestAllBtn.addEventListener('click', harvestAllPlants);
    }
});