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
 * Fetch logged-in user details and render user stats in the header.
 * Returns user object or null if failed.
 */
async function loadUserData() {
  const token = getToken();
  const userId = getUserId();

  try {
    // Fetch user profile from backend
    const response = await fetch(`${currentUrl}/user/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    // Handle expired/invalid token
    if (response.status === 401) {
      showNotification("Session expired. Please login again.", "error");
      logout();
      return null;
    }

    if (!response.ok) throw new Error("Failed to fetch user data");

    // Backend returns array, user record is first element
    const data = await response.json();
    const user = data[0];

    // Update UI text
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
 * Fetch garden plots for the user and render exactly 20 plots.
 * Empty plot -> show "Empty"
 * Planted plot -> show plant image + name + value + harvest button
 */
async function loadGardenPlots() {
  const token = getToken();
  const userId = getUserId();
  const gardenPlotsDiv = document.getElementById("garden-plots");

  // Show loading state while fetching
  gardenPlotsDiv.innerHTML = '<div class="loading">Loading garden...</div>';

  try {
    // Fetch all plots for user
    const response = await fetch(`${currentUrl}/garden/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    // Handle expired/invalid token
    if (response.status === 401) {
      showNotification("Session expired. Please login again.", "error");
      logout();
      return;
    }

    if (!response.ok) throw new Error("Failed to fetch garden plots");

    const plots = await response.json();

    // Stats counters for display
    let plotsUsed = 0;
    let totalValue = 0;

    // Clear existing plots before rendering
    gardenPlotsDiv.innerHTML = "";

    // Render plots #1 to #20
    for (let i = 1; i <= 20; i++) {
      // Find plot record matching plot number (may be undefined if empty)
      const plot = plots.find((p) => p.plot_number === i);
      const isEmpty = !plot || !plot.plant_id;

      // Update stats if plot is planted
      if (!isEmpty) {
        plotsUsed++;
        totalValue += plot.value || 0;
      }

      // Create plot container element
      const plotDiv = document.createElement("div");
      plotDiv.className = "garden-plot";
      plotDiv.dataset.plotNumber = i;

      // Empty plot UI
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
        // Planted plot UI (with harvest button)
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

      // Add plot to page
      gardenPlotsDiv.appendChild(plotDiv);
    }

    // Update summary stats UI
    document.getElementById("plots-used").textContent = plotsUsed;
    document.getElementById("garden-value").textContent = totalValue;

    // Add click handlers to each harvest button
    document.querySelectorAll(".btn-harvest").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation(); // prevents plot click side effects (if any)
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
 * Harvest/sell a single plant from a plot.
 * Backend handles cooldown check and point awarding.
 */
async function harvestPlant(plotNumber) {
  const token = getToken();
  const userId = getUserId();

  try {
    // Sell plant endpoint
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

    // Handle expired/invalid token
    if (response.status === 401) {
      showNotification("Session expired. Please login again.", "error");
      logout();
      return;
    }

    // Parse JSON safely (in case backend returns no JSON)
    const result = await response.json().catch(() => ({}));

    // If backend returns error (e.g. cooldown not met)
    if (!response.ok) {
      throw new Error(result.message || "Failed to harvest plant");
    }

    showNotification(result.message || "Harvested!", "success");

    // Refresh user stats and garden UI
    await loadUserData();
    await loadGardenPlots();
  } catch (error) {
    console.error("Error harvesting plant:", error);
    showNotification("Error harvesting plant: " + error.message, "error");
  }
}

/**
 * Harvest all plants that are ready (30 mins cooldown).
 * Only harvests plots that are past cooldown.
 */
async function harvestAllPlants() {
  const token = getToken();
  const userId = getUserId();

  try {
    // Fetch all plots first (to know which ones are planted + cooldown)
    const response = await fetch(`${currentUrl}/garden/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error("No plants planted");

    const plots = await response.json();

    // Filter only plots that have a plant
    const plantedPlots = plots.filter((p) => p.plant_id !== null);

    if (plantedPlots.length === 0) {
      showNotification("No plants to harvest!", "error");
      return;
    }

    // Cooldown: 30 minutes (match backend rule)
    const now = new Date();
    const cooldownMs = 30 * 60 * 1000;

    // Only harvest plants that have passed cooldown
    const harvestablePlots = plantedPlots.filter((plot) => {
      const plantedTime = new Date(plot.planted_on);
      return now - plantedTime >= cooldownMs;
    });

    if (harvestablePlots.length === 0) {
      showNotification("No plants ready to harvest! All plants are still on cooldown.", "error");
      return;
    }

    // Track success count + cooldown count for message
    let harvested = 0;
    const onCooldown = plantedPlots.length - harvestablePlots.length;

    // Harvest each plot one by one
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

        // Count only successful harvests
        if (sellResponse.ok) harvested++;
      } catch (err) {
        console.error("Error harvesting plot:", plot.plot_number, err);
      }
    }

    // Show summary message
    let message = `Harvested ${harvested} plants!`;
    if (onCooldown > 0) message += ` (${onCooldown} still on cooldown)`;

    showNotification(message, "success");

    // Refresh UI after harvesting
    await loadUserData();
    await loadGardenPlots();
  } catch (error) {
    console.error("Error harvesting all plants:", error);
    showNotification("Error harvesting all plants: " + error.message, "error");
  }
}

// ---------------- Page Init ----------------
document.addEventListener("DOMContentLoaded", async () => {
  // Ensure user has token; redirect/logout if not
  checkAuth();

  // Load user stats + garden
  await loadUserData();
  await loadGardenPlots();

  // Logout button
  document.getElementById("logout-btn").addEventListener("click", logout);

  // Harvest all button (if exists on this page)
  const harvestAllBtn = document.getElementById("harvest-all-btn");
  if (harvestAllBtn) harvestAllBtn.addEventListener("click", harvestAllPlants);
});
