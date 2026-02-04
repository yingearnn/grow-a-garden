//////////////////////////////////////////////////////
// homepage.js
// Dashboard page:
// - Loads user profile (username, points, net worth)
// - Loads garden plots (20 plots)
// - Allows harvesting plants (single + harvest all)
//////////////////////////////////////////////////////

import { showNotification } from "./notifications.js";
import { getToken, getUserId, checkAuth, logout } from "./auth.js";

/**
 * Fetch logged-in user details and render stats.
 */
async function loadUserData() {
  const token = getToken();
  const userId = getUserId();

  try {
    const response = await fetch(`${currentUrl}/user/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 401) {
      showNotification("Session expired. Please login again.", "error");
      logout();
      return null;
    }

    if (!response.ok) throw new Error("Failed to fetch user data");

    const data = await response.json();
    const user = data[0];

    document.getElementById("username-display").textContent = user.username;
    document.getElementById("points-display").textContent = `Points: ${user.points}`;
    document.getElementById("networth-display").textContent = `Net Worth: $${user.net_worth}`;

    return user;
  } catch (error) {
    console.error("Error loading user data:", error);
    showNotification("Error loading user data: " + error.message, "error");
    return null;
  }
}

/**
 * Fetch garden plots and render 20 plots.
 * Empty plot -> show "Empty"
 * Planted plot -> show plant + harvest button
 */
async function loadGardenPlots() {
  const token = getToken();
  const userId = getUserId();
  const gardenPlotsDiv = document.getElementById("garden-plots");

  gardenPlotsDiv.innerHTML = '<div class="loading">Loading garden...</div>';

  try {
    const response = await fetch(`${currentUrl}/garden/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 401) {
      showNotification("Session expired. Please login again.", "error");
      logout();
      return;
    }

    if (!response.ok) throw new Error("Failed to fetch garden plots");

    const plots = await response.json();

    let plotsUsed = 0;
    let totalValue = 0;

    gardenPlotsDiv.innerHTML = "";

    // Render plots #1 to #20
    for (let i = 1; i <= 20; i++) {
      const plot = plots.find((p) => p.plot_number === i);
      const isEmpty = !plot || !plot.plant_id;

      if (!isEmpty) {
        plotsUsed++;
        totalValue += plot.value || 0;
      }

      const plotDiv = document.createElement("div");
      plotDiv.className = "garden-plot";
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
              alt="${plot.name || "Unknown"}"
              onerror="this.onerror=null; this.src='images/soil.jpg';"
            />
          </div>
          <div class="plot-info">
            <div>
              <p class="plot-number">#${i}</p>
              <p class="plant-name">${plot.name || "Unknown"}</p>
              <p class="plant-value">$${plot.value || 0}</p>
            </div>
            <button class="btn-harvest" data-plot-number="${plot.plot_number}">Harvest</button>
          </div>
        `;
      }

      gardenPlotsDiv.appendChild(plotDiv);
    }

    // Update stats display
    document.getElementById("plots-used").textContent = plotsUsed;
    document.getElementById("garden-value").textContent = totalValue;

    // Attach handlers to harvest buttons
    document.querySelectorAll(".btn-harvest").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const plotNumber = e.currentTarget.dataset.plotNumber;
        await harvestPlant(plotNumber);
      });
    });
  } catch (error) {
    console.error("Error loading garden plots:", error);
    gardenPlotsDiv.innerHTML = `<p>Error loading garden: ${error.message}</p>`;
  }
}

/**
 * Harvest a single plant from a plot.
 */
async function harvestPlant(plotNumber) {
  const token = getToken();
  const userId = getUserId();

  try {
    const response = await fetch(`${currentUrl}/garden/sell`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        user_id: parseInt(userId),
        plot_number: parseInt(plotNumber),
      }),
    });

    if (response.status === 401) {
      showNotification("Session expired. Please login again.", "error");
      logout();
      return;
    }

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(result.message || "Failed to harvest plant");
    }

    showNotification(result.message || "Harvested!", "success");

    // Refresh UI
    await loadUserData();
    await loadGardenPlots();
  } catch (error) {
    console.error("Error harvesting plant:", error);
    showNotification("Error harvesting plant: " + error.message, "error");
  }
}

/**
 * Harvest all plants that are ready (30 mins cooldown).
 */
async function harvestAllPlants() {
  const token = getToken();
  const userId = getUserId();

  try {
    const response = await fetch(`${currentUrl}/garden/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error("No plants planted");

    const plots = await response.json();
    const plantedPlots = plots.filter((p) => p.plant_id !== null);

    if (plantedPlots.length === 0) {
      showNotification("No plants to harvest!", "error");
      return;
    }

    // Cooldown check: 30 minutes
    const now = new Date();
    const cooldownMs = 30 * 60 * 1000;

    const harvestablePlots = plantedPlots.filter((plot) => {
      const plantedTime = new Date(plot.planted_on);
      return now - plantedTime >= cooldownMs;
    });

    if (harvestablePlots.length === 0) {
      showNotification("No plants ready to harvest! All plants are still on cooldown.", "error");
      return;
    }

    let harvested = 0;
    const onCooldown = plantedPlots.length - harvestablePlots.length;

    for (const plot of harvestablePlots) {
      try {
        const sellResponse = await fetch(`${currentUrl}/garden/sell`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            user_id: parseInt(userId),
            plot_number: plot.plot_number,
          }),
        });

        if (sellResponse.ok) harvested++;
      } catch (err) {
        console.error("Error harvesting plot:", plot.plot_number, err);
      }
    }

    let message = `Harvested ${harvested} plants!`;
    if (onCooldown > 0) message += ` (${onCooldown} still on cooldown)`;

    showNotification(message, "success");

    // Refresh UI
    await loadUserData();
    await loadGardenPlots();
  } catch (error) {
    console.error("Error harvesting all plants:", error);
    showNotification("Error harvesting all plants: " + error.message, "error");
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  checkAuth();

  await loadUserData();
  await loadGardenPlots();

  document.getElementById("logout-btn").addEventListener("click", logout);

  const harvestAllBtn = document.getElementById("harvest-all-btn");
  if (harvestAllBtn) harvestAllBtn.addEventListener("click", harvestAllPlants);
});
