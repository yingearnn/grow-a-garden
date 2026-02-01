// js/inventory.js

import { showNotification } from './notifications.js';
import { getToken } from './auth.js';
import { getUserId } from './auth.js';
import { checkAuth } from './auth.js';
import { logout } from './auth.js';


async function loadUserData() {
    const token = getToken();
    const userId = getUserId();
    
    try {
        const response = await fetch(`${currentUrl}/user/${userId}`, {
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
        const response = await fetch(`${currentUrl}/plants/${userId}`, {
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

        // Pass user_plant_id instead of plant_id
        await plantInGarden(userPlantId, plotNumber);
    };
}

function closeModal() {
    const modal = document.getElementById('plant-modal');
    modal.classList.remove('active');
    document.getElementById('plot-number').value = '';
}

async function plantInGarden(userPlantId, plotNumber) {
    const token = getToken();
    const userId = getUserId();

    
    if (plotNumber < 1 || plotNumber > 20) {
        showNotification('Plot number must be between 1 and 20' , 'error');
        return;
    }
    
    try {
        const response = await fetch(`${currentUrl}/garden/plant`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
           body: JSON.stringify({
    user_id: parseInt(userId),
    user_plant_id: parseInt(userPlantId), // MUST be user_plant_id
    plot_number: plotNumber
})
        });
        
        if (response.status === 401) {
            logout();
            return;
        }
        
        if (!response.ok) {
            const error = await response.json();
             showNotification(error.message || 'Failed to plant', 'error');
            return;
        }
        
        const data = await response.json();
        showNotification(`Plant planted successfully in plot ${plotNumber}!` , 'success');
        
        closeModal();
        await loadInventory();
    } catch (error) {
        console.error('Error planting:', error);
        showNotification('Error planting in garden' , 'error');
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