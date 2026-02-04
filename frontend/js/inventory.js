// js/inventory.js
import { showNotification } from './notifications.js';
import { getToken, checkAuth, logout } from './auth.js';

// ---------------- Load User Data ----------------
async function loadUserData() {
  const token = getToken();
  const userId = localStorage.getItem("userId"); // or getUserId() if you want

  try {
    const response = await fetch(`${currentUrl}/user/${userId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (response.status === 401) {
      logout();
      return;
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      showNotification(data.message || "Failed to fetch user data", "error");
      return;
    }

    const user = data[0];
    document.getElementById('points-display').textContent = `Points: ${user.points}`;
    document.getElementById('networth-display').textContent = `Net Worth: $${user.net_worth}`;
  } catch (error) {
    console.error('Error loading user data:', error);
    showNotification("Network error loading user data", "error");
  }
}

// ---------------- Load Inventory ----------------
async function loadInventory() {
  const token = getToken();
  const userId = localStorage.getItem("userId");

  try {
    const response = await fetch(`${currentUrl}/plants/${userId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    // If backend uses 404 to mean "no plants"
    if (response.status === 401) {
      logout();
      return;
    }

    if (response.status === 404) {
      document.getElementById('inventory-grid').style.display = 'none';
      document.getElementById('empty-inventory').style.display = 'block';
      return;
    }

    const plants = await response.json().catch(() => []);

    if (!response.ok) {
      showNotification(plants.message || "Failed to fetch inventory", "error");
      return;
    }

    const inventoryGrid = document.getElementById('inventory-grid');

    if (!plants || plants.length === 0) {
      document.getElementById('inventory-grid').style.display = 'none';
      document.getElementById('empty-inventory').style.display = 'block';
      return;
    }

    document.getElementById('inventory-grid').style.display = 'grid';
    document.getElementById('empty-inventory').style.display = 'none';

    inventoryGrid.innerHTML = plants.map(plant => `
      <div class="inventory-item"
           data-user-plant-id="${plant.user_plant_id}"
           data-plant-name="${plant.name}">
        <h3>${plant.name}</h3>
        <span class="rarity ${plant.rarity}">${plant.rarity.toUpperCase()}</span>
        <p>Base Value: $${plant.value}</p>
        <p>Acquired: ${new Date(plant.acquired_on).toLocaleDateString()}</p>
      </div>
    `).join('');

    document.querySelectorAll('.inventory-item').forEach(item => {
      item.addEventListener('click', () => {
        openPlantModal(item.dataset.userPlantId, item.dataset.plantName);
      });
    });

  } catch (error) {
    console.error('Error loading inventory:', error);
    showNotification("Network error loading inventory", "error");
  }
}

// ---------------- Plant Modal ----------------
function openPlantModal(userPlantId, plantName) {
  const modal = document.getElementById('plant-modal');
  document.getElementById('modal-plant-name').textContent = `Plant: ${plantName}`;
  modal.classList.add('active');

  const form = document.getElementById('plant-form');
  form.onsubmit = async (e) => {
    e.preventDefault();

    const raw = document.getElementById('plot-number').value;
    const plotNumber = parseInt(raw, 10);

    // Keep only basic "is number" validation.
    if (Number.isNaN(plotNumber)) {
      showNotification("Please enter a plot number.", "error");
      return;
    }

    await plantInGarden(userPlantId, plotNumber);
  };
}

function closeModal() {
  document.getElementById('plant-modal').classList.remove('active');
  document.getElementById('plot-number').value = '';
}

// ---------------- Plant in Garden ----------------
async function plantInGarden(userPlantId, plotNumber) {
  const token = getToken();

  try {
    const response = await fetch(`${currentUrl}/garden/plant`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        user_plant_id: parseInt(userPlantId, 10),
        plot_number: parseInt(plotNumber, 10)
      })
    });

    if (response.status === 401) {
      logout();
      return;
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      showNotification(data.message || "Failed to plant", "error");
      return;
    }

    showNotification(data.message || "Planted successfully!", "success");
    closeModal();
    await loadInventory();

  } catch (error) {
    console.error('Error planting:', error);
    showNotification("Network error planting", "error");
  }
}

// ---------------- Page Init ----------------
document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  loadUserData();
  loadInventory();

  document.getElementById('logout-btn').addEventListener('click', logout);
  document.querySelector('.close-modal').addEventListener('click', closeModal);

  window.addEventListener('click', (e) => {
    if (e.target === document.getElementById('plant-modal')) closeModal();
  });
});
