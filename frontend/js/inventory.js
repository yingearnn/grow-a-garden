// js/inventory.js

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

async function loadInventory() {
    const token = getToken();
    const userId = getUserId();
    
    try {
        const response = await fetch(`${API_BASE}/plants/${userId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.status === 404) {
            // No plants in inventory
            document.getElementById('inventory-grid').style.display = 'none';
            document.getElementById('empty-inventory').style.display = 'block';
            return;
        }
        
        if (!response.ok) throw new Error('Failed to fetch inventory');
        
        const plants = await response.json();
        const inventoryGrid = document.getElementById('inventory-grid');
        
        if (plants.length === 0) {
            document.getElementById('inventory-grid').style.display = 'none';
            document.getElementById('empty-inventory').style.display = 'block';
            return;
        }
        
        document.getElementById('inventory-grid').style.display = 'grid';
        document.getElementById('empty-inventory').style.display = 'none';
        
        inventoryGrid.innerHTML = plants.map(plant => `
            <div class="inventory-item" data-user-plant-id="${plant.user_plant_id}" data-plant-id="${plant.plant_id}" data-plant-name="${plant.name}">
                <h3>${plant.name}</h3>
                <span class="rarity ${plant.rarity}">${plant.rarity.toUpperCase()}</span>
                <p>Base Value: $${plant.value}</p>
                <p>Acquired: ${new Date(plant.acquired_on).toLocaleDateString()}</p>
            </div>
        `).join('');
        
        // Add click listeners
        document.querySelectorAll('.inventory-item').forEach(item => {
            item.addEventListener('click', () => {
                const userPlantId = item.dataset.userPlantId;
                const plantId = item.dataset.plantId;
                const plantName = item.dataset.plantName;
                openPlantModal(userPlantId, plantId, plantName);
            });
        });
    } catch (error) {
        console.error('Error loading inventory:', error);
        document.getElementById('inventory-grid').innerHTML = '<p>Error loading inventory</p>';
    }
}

function openPlantModal(userPlantId, plantId, plantName) {
    const modal = document.getElementById('plant-modal');
    document.getElementById('modal-plant-name').textContent = `Plant: ${plantName}`;
    
    modal.classList.add('active');
    
    const form = document.getElementById('plant-form');
    form.onsubmit = async (e) => {
        e.preventDefault();
        const plotNumber = parseInt(document.getElementById('plot-number').value);
        await plantInGarden(plantId, plotNumber);
    };
}

function closeModal() {
    const modal = document.getElementById('plant-modal');
    modal.classList.remove('active');
    document.getElementById('plot-number').value = '';
}

async function plantInGarden(plantId, plotNumber) {
    const token = getToken();
    const userId = getUserId();
    
    if (plotNumber < 1 || plotNumber > 20) {
        alert('Plot number must be between 1 and 20');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/garden/plant`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                user_id: parseInt(userId),
                plant_id: parseInt(plantId),
                plot_number: plotNumber
            })
        });
        
        if (response.status === 401) {
            logout();
            return;
        }
        
        if (!response.ok) {
            const error = await response.json();
            alert(error.message || 'Failed to plant');
            return;
        }
        
        const data = await response.json();
        alert(`Plant planted successfully in plot ${plotNumber}!`);
        
        closeModal();
        await loadInventory();
    } catch (error) {
        console.error('Error planting:', error);
        alert('Error planting in garden');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadUserData();
    loadInventory();
    
    document.getElementById('logout-btn').addEventListener('click', logout);
    
    // Modal close handlers
    document.querySelector('.close-modal').addEventListener('click', closeModal);
    window.addEventListener('click', (e) => {
        if (e.target === document.getElementById('plant-modal')) {
            closeModal();
        }
    });
});