// js/inventory.js
// Loads user's inventory plants and allows planting them into a garden plot.

import { showNotification } from './notifications.js';
import { getToken, getUserId, checkAuth, logout } from './auth.js';

// ---------------- Load User Data ----------------
// Fetch current user data (points, net worth) and update UI header
async function loadUserData() {
    const token = getToken();
    const userId = getUserId();

    try {
        const response = await fetch(`${currentUrl}/user/${userId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        // If token expired/invalid, logout
        if (response.status === 401) {
            logout();
            return;
        }

        if (!response.ok) throw new Error('Failed to fetch user data');

        // Backend returns array, user object is first item
        const data = await response.json();
        const user = data[0];

        // Update UI stats
        document.getElementById('points-display').textContent = `Points: ${user.points}`;
        document.getElementById('networth-display').textContent = `Net Worth: $${user.net_worth}`;
    } catch (error) {
        console.error('Error loading user data:', error);
    }
}

// ---------------- Load Inventory ----------------
// Fetch plants owned by user and render inventory grid
async function loadInventory() {
    const token = getToken();
    const userId = getUserId();

    try {
        // GET plants owned by user (backend endpoint returns owned plants)
        const response = await fetch(`${currentUrl}/plants/${userId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        // If backend uses 404 to mean "no plants"
        if (response.status === 404) {
            document.getElementById('inventory-grid').style.display = 'none';
            document.getElementById('empty-inventory').style.display = 'block';
            return;
        }

        if (!response.ok) throw new Error('Failed to fetch inventory');

        const plants = await response.json();
        const inventoryGrid = document.getElementById('inventory-grid');

        // If empty array returned, show empty state
        if (plants.length === 0) {
            document.getElementById('inventory-grid').style.display = 'none';
            document.getElementById('empty-inventory').style.display = 'block';
            return;
        }

        // Show grid and hide empty state
        document.getElementById('inventory-grid').style.display = 'grid';
        document.getElementById('empty-inventory').style.display = 'none';

        // Render inventory items
        inventoryGrid.innerHTML = plants.map(plant => `
            <div class="inventory-item"
                 data-user-plant-id="${plant.user_plant_id}"
                 data-plant-id="${plant.plant_id}"
                 data-plant-name="${plant.name}">
                <h3>${plant.name}</h3>
                <span class="rarity ${plant.rarity}">${plant.rarity.toUpperCase()}</span>
                <p>Base Value: $${plant.value}</p>
                <p>Acquired: ${new Date(plant.acquired_on).toLocaleDateString()}</p>
            </div>
        `).join('');

        // Attach click handlers to open modal for planting
        document.querySelectorAll('.inventory-item').forEach(item => {
            item.addEventListener('click', () => {
                const userPlantId = item.dataset.userPlantId; // inventory record ID
                const plantId = item.dataset.plantId;         // plant type ID (not used in request)
                const plantName = item.dataset.plantName;

                openPlantModal(userPlantId, plantId, plantName);
            });
        });

    } catch (error) {
        console.error('Error loading inventory:', error);
        document.getElementById('inventory-grid').innerHTML = '<p>Error loading inventory</p>';
    }
}

// ---------------- Plant Modal ----------------
// Opens modal and wires submit action to planting request
function openPlantModal(userPlantId, plantId, plantName) {
    const modal = document.getElementById('plant-modal');

    // Display selected plant name in modal header
    document.getElementById('modal-plant-name').textContent = `Plant: ${plantName}`;

    // Show modal
    modal.classList.add('active');

    // Set form submit handler for this selected plant
    const form = document.getElementById('plant-form');
    form.onsubmit = async (e) => {
        e.preventDefault();

        // Read plot number input (1–20)
        const plotNumber = parseInt(document.getElementById('plot-number').value);

        // Plant the inventory plant into the chosen plot
        await plantInGarden(userPlantId, plotNumber);
    };
}

// Closes modal and resets input
function closeModal() {
    const modal = document.getElementById('plant-modal');
    modal.classList.remove('active');
    document.getElementById('plot-number').value = '';
}

// ---------------- Plant in Garden ----------------
// Sends planting request to backend
async function plantInGarden(userPlantId, plotNumber) {
    const token = getToken();
    const userId = getUserId();

    // Frontend validation: plot range
    if (plotNumber < 1 || plotNumber > 20) {
        showNotification('Plot number must be between 1 and 20', 'error');
        return;
    }

    try {
        // POST request to plant the plant into the plot
        const response = await fetch(`${currentUrl}/garden/plant`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                user_id: parseInt(userId),                 // logged-in user
                user_plant_id: parseInt(userPlantId),      // inventory plant record ID
                plot_number: plotNumber                    // garden plot number
            })
        });

        // If token expired/invalid
        if (response.status === 401) {
            logout();
            return;
        }

        // Handle backend validation errors (plot occupied, not in inventory, etc.)
        if (!response.ok) {
            const error = await response.json();
            showNotification(error.message || 'Failed to plant', 'error');
            return;
        }

        // Successful plant response
        const data = await response.json();
        showNotification(`${data.message} in ${plotNumber}!`, 'success');

        // Close modal and refresh inventory list
        closeModal();
        await loadInventory();

    } catch (error) {
        console.error('Error planting:', error);
        showNotification('Error planting in garden', 'error');
    }
}

// ---------------- Page Init ----------------
document.addEventListener('DOMContentLoaded', () => {
    // Ensure user is logged in
    checkAuth();

    // Load header stats and inventory plants
    loadUserData();
    loadInventory();

    // Logout button handler
    document.getElementById('logout-btn').addEventListener('click', logout);

    // Modal close handlers
    document.querySelector('.close-modal').addEventListener('click', closeModal);

    // Close modal when clicking outside modal content
    window.addEventListener('click', (e) => {
        if (e.target === document.getElementById('plant-modal')) {
            closeModal();
        }
    });
});
