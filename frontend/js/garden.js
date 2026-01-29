// js/garden.js

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
    } catch (error) {
        console.error('Error loading user data:', error);
    }
}

async function loadGarden() {
    const token = getToken();
    const userId = getUserId();
    
    try {
        const response = await fetch(`${API_BASE}/garden/${userId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to fetch garden');
        
        const plots = await response.json();
        const gardenGrid = document.getElementById('garden-grid');
        
        // Count planted plots
        const plantedCount = plots.filter(plot => plot.plant_id !== null).length;
        document.getElementById('plots-used').textContent = plantedCount;
        
        // Generate 20 plot cells
        gardenGrid.innerHTML = plots.map(plot => {
            const isEmpty = plot.plant_id === null;
            return `
                <div class="garden-plot ${isEmpty ? 'empty' : 'planted'}" 
                     data-plot-number="${plot.plot_number}"
                     data-plant-id="${plot.plant_id || ''}"
                     data-plant-name="${plot.name || ''}"
                     data-value="${plot.value || 0}">
                    <div class="plot-number">#${plot.plot_number}</div>
                    ${isEmpty ? `
                        <div class="plot-icon">🌱</div>
                        <div class="plot-name">Empty</div>
                    ` : `
                        <div class="plot-icon">🌿</div>
                        <div class="plot-name">${plot.name}</div>
                        <div class="plot-value">$${plot.value}</div>
                    `}
                </div>
            `;
        }).join('');
        
        // Add click listeners for planted plots only
        document.querySelectorAll('.garden-plot.planted').forEach(plot => {
            plot.addEventListener('click', () => {
                const plotNumber = plot.dataset.plotNumber;
                const plantName = plot.dataset.plantName;
                const value = plot.dataset.value;
                openSellModal(plotNumber, plantName, value);
            });
        });
    } catch (error) {
        console.error('Error loading garden:', error);
        document.getElementById('garden-grid').innerHTML = '<p>Error loading garden</p>';
    }
}

let currentPlotToSell = null;

function openSellModal(plotNumber, plantName, value) {
    currentPlotToSell = plotNumber;
    const modal = document.getElementById('sell-modal');
    document.getElementById('modal-plant-info').textContent = `Plant: ${plantName} (Plot #${plotNumber})`;
    document.getElementById('modal-sell-value').textContent = `Sell for: $${value}`;
    
    modal.classList.add('active');
}

function closeModal() {
    const modal = document.getElementById('sell-modal');
    modal.classList.remove('active');
    currentPlotToSell = null;
}

async function sellPlant() {
    const token = getToken();
    const userId = getUserId();
    
    if (!currentPlotToSell) return;
    
    try {
        const response = await fetch(`${API_BASE}/garden/sell`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                user_id: parseInt(userId),
                plot_number: parseInt(currentPlotToSell)
            })
        });
        
        if (response.status === 401) {
            logout();
            return;
        }
        
        if (!response.ok) {
            const error = await response.json();
            alert(error.message || 'Failed to sell plant');
            return;
        }
        
        const data = await response.json();
        alert('Plant sold successfully! Your net worth has increased.');
        
        closeModal();
        await loadUserData();
        await loadGarden();
    } catch (error) {
        console.error('Error selling plant:', error);
        alert('Error selling plant');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadUserData();
    loadGarden();
    
    document.getElementById('logout-btn').addEventListener('click', logout);
    
    // Modal handlers
    document.querySelector('.close-modal').addEventListener('click', closeModal);
    document.getElementById('confirm-sell-btn').addEventListener('click', sellPlant);
    document.getElementById('cancel-sell-btn').addEventListener('click', closeModal);
    
    window.addEventListener('click', (e) => {
        if (e.target === document.getElementById('sell-modal')) {
            closeModal();
        }
    });
});