//////////////////////////////////////////////////////
// challenges.js
// Features:
// - List all challenges (available tab)
// - Complete challenge with details (modal)
// - Show completed challenges (completed tab)
// - Create challenge (create tab)
// - Edit/Delete ONLY if you are the creator
//////////////////////////////////////////////////////

import { showNotification } from "./notifications.js";
import { getToken, getUserId, checkAuth, logout } from "./auth.js";

/**
 * Open Edit modal and bind submit handler for this specific challenge.
 */
function openEditModal(challengeId, description, points) {
  const modal = document.getElementById("edit-modal");
  document.getElementById("edit-description").value = description;
  document.getElementById("edit-points").value = points;
  modal.classList.add("active");

  // Clone the form to remove any previous event listeners
  const oldForm = document.getElementById("edit-form");
  const newForm = oldForm.cloneNode(true);
  oldForm.parentNode.replaceChild(newForm, oldForm);

  newForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    await editChallenge(challengeId);
  });
}

/**
 * PUT /challenges/:id to update a challenge (creator only).
 */
async function editChallenge(challengeId) {
  const token = getToken();
  const userId = getUserId();
  const description = document.getElementById("edit-description").value.trim();
  const points = parseInt(document.getElementById("edit-points").value, 10);

  // Keep only basic required check
  if (!description || Number.isNaN(points)) {
    showNotification("Please fill in all fields", "error");
    return;
  }

  try {
    const response = await fetch(`${currentUrl}/challenges/${challengeId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        user_id: parseInt(userId),
        description,
        points,
      }),
    });

    const data = await response.json().catch(() => ({}));

    // Show backend message directly
    if (!response.ok) {
      showNotification(data.message || "Failed to update challenge", "error");
      return;
    }

    showNotification("Challenge updated successfully!", "success");
    document.getElementById("edit-modal").classList.remove("active");
    await loadChallenges();
  } catch (error) {
    console.error("Error editing challenge:", error);
    showNotification("Error updating challenge", "error");
  }
}

/**
 * DELETE /challenges/:id (creator only).
 */
async function deleteChallenge(challengeId) {
  const token = getToken();

  try {
    const response = await fetch(`${currentUrl}/challenges/${challengeId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 401) {
      logout();
      return;
    }

    // 204 No Content = success
    if (response.status === 204) {
      showNotification("Challenge deleted successfully!", "success");
      await loadChallenges();
      return;
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      showNotification(data.message || "Failed to delete challenge", "error");
      return;
    }

    showNotification("Challenge deleted successfully!", "success");
    await loadChallenges();
  } catch (error) {
    console.error("Error deleting challenge:", error);
    showNotification("Error deleting challenge", "error");
  }
}

/**
 * Loads current user stats (points/net worth) for top bar.
 */
async function loadUserData() {
  const token = getToken();
  const userId = getUserId();

  try {
    const response = await fetch(`${currentUrl}/user/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 401) {
      logout();
      return;
    }

    if (!response.ok) throw new Error("Failed to fetch user data");

    const data = await response.json();
    const user = data[0];

    document.getElementById("points-display").textContent = `Points: ${user.points}`;
    document.getElementById("networth-display").textContent = `Net Worth: $${user.net_worth}`;
  } catch (error) {
    console.error("Error loading user data:", error);
  }
}

/**
 * GET /challenges and render Available challenges list.
 * FIX: add dataset values for Complete button (points + description).
 */
async function loadChallenges() {
  const token = getToken();

  try {
    const response = await fetch(`${currentUrl}/challenges`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error("Failed to fetch challenges");

    const challenges = await response.json();
    const challengesList = document.getElementById("challenges-list");

    if (challenges.length === 0) {
      challengesList.innerHTML = "<p>No challenges available</p>";
      return;
    }

    const userId = getUserId();

    challengesList.innerHTML = challenges
      .map((challenge) => {
        const isCreator = parseInt(challenge.creator_id) === parseInt(userId);

        // Use effective_points if backend sends bonus-adjusted points for display
        const displayPoints = challenge.effective_points ?? challenge.points;

        return `
          <div class="challenge-card">
            <h3>${challenge.description}</h3>

            <p class="challenge-points">
              ${displayPoints} ${challenge.has_bonus ? 'points (1.5x)' : 'points'}
            </p>

            <!-- FIX: store points+description for modal -->
            <button class="btn-complete"
              data-challenge-id="${challenge.challenge_id}"
              data-points="${displayPoints}"
              data-description="${challenge.description}">
              Complete Challenge
            </button>

            ${
              isCreator
                ? `
              <div class="creator-actions">
                <button class="btn-edit"
                  data-challenge-id="${challenge.challenge_id}"
                  data-description="${challenge.description}"
                  data-points="${challenge.points}">
                  Edit
                </button>
                <button class="btn-delete"
                  data-challenge-id="${challenge.challenge_id}">
                  Delete
                </button>
              </div>
            `
                : ""
            }
          </div>
        `;
      })
      .join("");

    // Edit modal close
    document.querySelector(".close-edit-modal").addEventListener("click", () => {
      document.getElementById("edit-modal").classList.remove("active");
    });

    // Edit buttons
    document.querySelectorAll(".btn-edit").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const challengeId = e.currentTarget.dataset.challengeId;
        const description = e.currentTarget.dataset.description;
        const points = e.currentTarget.dataset.points;
        openEditModal(challengeId, description, points);
      });
    });

    // Delete buttons
    document.querySelectorAll(".btn-delete").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const challengeId = e.currentTarget.dataset.challengeId;
        deleteChallenge(challengeId);
      });
    });

    // Complete buttons
    document.querySelectorAll(".btn-complete").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const challengeId = e.currentTarget.dataset.challengeId;
        const points = e.currentTarget.dataset.points;
        const description = e.currentTarget.dataset.description;
        openCompletionModal(challengeId, points, description);
      });
    });
  } catch (error) {
    console.error("Error loading challenges:", error);
    document.getElementById("challenges-list").innerHTML = "<p>Error loading challenges</p>";
  }
}

/**
 * Loads completed challenges for THIS user.
 * Strategy: fetch all challenges -> for each challenge, check completions -> match current user.
 */
async function loadCompletedChallenges() {
  const token = getToken();
  const userId = getUserId();

  try {
    const challengesResponse = await fetch(`${currentUrl}/challenges`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!challengesResponse.ok) throw new Error("Failed to fetch challenges");

    const challenges = await challengesResponse.json();
    const completedList = document.getElementById("completed-list");
    const completedChallenges = [];

    for (const challenge of challenges) {
      try {
        // Backend route uses trailing slash: GET /challenges/:id/
        const completionResponse = await fetch(`${currentUrl}/challenges/${challenge.challenge_id}/`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (completionResponse.ok) {
          const completions = await completionResponse.json();
          const userCompletion = completions.find((c) => c.user_id === parseInt(userId));

          if (userCompletion) {
            completedChallenges.push({
              ...challenge,
              completed_on: userCompletion.completed_on,
              details: userCompletion.details,
            });
          }
        }
      } catch {
        // If this challenge has no completion records, ignore it
      }
    }

    if (completedChallenges.length === 0) {
      completedList.innerHTML = "<p>You haven't completed any challenges yet.</p>";
      return;
    }

    // Sort newest first
    completedChallenges.sort((a, b) => new Date(b.completed_on) - new Date(a.completed_on));

    completedList.innerHTML = completedChallenges
      .map((challenge) => {
        const completedDate = new Date(challenge.completed_on).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });

        return `
          <div class="completed-card">
            <div class="completed-header">
              <h3>${challenge.description}</h3>
              <span class="completed-badge">✓ Completed</span>
            </div>
            <div class="completed-info">
              <p class="completed-points">Points Earned: ${challenge.points}</p>
              <p class="completed-date">Completed: ${completedDate}</p>
            </div>
            <button class="btn-view-details" data-details="${encodeURIComponent(challenge.details)}">
              View Details
            </button>
          </div>
        `;
      })
      .join("");

    document.querySelectorAll(".btn-view-details").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const details = decodeURIComponent(e.currentTarget.dataset.details);
        showDetailsModal(details);
      });
    });
  } catch (error) {
    console.error("Error loading completed challenges:", error);
    document.getElementById("completed-list").innerHTML = "<p>Error loading completed challenges</p>";
  }
}

/**
 * Show completion details modal.
 */
function showDetailsModal(details) {
  const modal = document.getElementById("details-modal");
  const content = document.getElementById("completion-details-content");

  content.innerHTML = `
    <div class="details-text">
      <h3>What you did:</h3>
      <p>${details}</p>
    </div>
  `;

  modal.classList.add("active");
}

function closeDetailsModal() {
  document.getElementById("details-modal").classList.remove("active");
}

/**
 * Create new challenge (POST /challenges).
 * Includes frontend validation (max 50 points).
 */
async function createChallenge(event) {
  event.preventDefault();

  const token = getToken();
  const userId = getUserId();
  const description = document.getElementById("challenge-description").value.trim();
  const points = parseInt(document.getElementById("challenge-points").value, 10);

  // Keep only basic required check
  if (!description || Number.isNaN(points)) {
    showNotification("Please fill in all fields", "error");
    return;
  }

  // NOTE: backend currently does NOT check "must have >=10 points to create"
  // So keep this frontend check unless you add it to backend
  const pointsText = document.getElementById("points-display").textContent;
  const userCurPoints = parseInt(pointsText.replace("Points: ", ""), 10);
  if (userCurPoints < 10) {
    showNotification("Insufficient points to create new challenge", "error");
    return;
  }

  try {
    const response = await fetch(`${currentUrl}/challenges`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        description,
        points
      }),
    });

    if (response.status === 401) {
      logout();
      return;
    }

    const data = await response.json().catch(() => ({}));

    // Show backend message directly (cooldown/max points/etc.)
    if (!response.ok) {
      showNotification(data.message || "Failed to create challenge", "error");
      return;
    }

    showNotification(`Challenge created: "${description}" (${points} points)`, "success");

    await loadUserData();
    document.getElementById("create-challenge-form").reset();
    switchTab("available");
    await loadChallenges();
  } catch (error) {
    console.error("Error creating challenge:", error);
    showNotification("Error creating challenge. Please try again.", "error");
  }
}


/**
 * Open completion modal for a challenge.
 */
function openCompletionModal(challengeId, points, description) {
  const modal = document.getElementById("completion-modal");
  document.getElementById("modal-challenge-name").textContent = description;
  document.getElementById("modal-challenge-points").textContent = `Reward: ${points} points`;

  modal.classList.add("active");

  // Clone form to remove previous listeners
  const oldForm = document.getElementById("completion-form");
  const newForm = oldForm.cloneNode(true);
  oldForm.parentNode.replaceChild(newForm, oldForm);

  newForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    await completeChallenge(challengeId);
  });
}

function closeModal() {
  document.getElementById("completion-modal").classList.remove("active");
  document.getElementById("completion-details").value = "";
}

/**
 * POST /challenges/:id/complete with "details".
 * Backend enforces cooldown rules, and returns points_awarded.
 */
async function completeChallenge(challengeId) {
  const token = getToken();
  const userId = getUserId();

  // Do NOT block on frontend; let backend validate and return message
  const details = document.getElementById("completion-details").value;

  try {
    const response = await fetch(`${currentUrl}/challenges/${challengeId}/complete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        details // backend will trim + validate
      }),
    });

    if (response.status === 401) {
      logout();
      return;
    }

    const data = await response.json().catch(() => ({}));

    // Show backend error message directly
    if (!response.ok) {
      showNotification(data.message || "Failed to complete challenge", "error");
      return;
    }

    showNotification(`Challenge completed! You earned ${data.points_awarded} points!`, "success");

    closeModal();

    await loadUserData();
    await loadCompletedChallenges();
  } catch (error) {
    console.error("Error completing challenge:", error);
    showNotification("Error completing challenge", "error");
  }
}


/**
 * Switch between tabs.
 */
function switchTab(tabName) {
  document.querySelectorAll(".tab-btn").forEach((btn) => btn.classList.remove("active"));
  document.querySelectorAll(".tab-content").forEach((content) => content.classList.remove("active"));

  document.querySelector(`[data-tab="${tabName}"]`).classList.add("active");
  document.getElementById(`${tabName}-tab`).classList.add("active");

  if (tabName === "completed") loadCompletedChallenges();
  if (tabName === "available") loadChallenges();
}

document.addEventListener("DOMContentLoaded", () => {
  checkAuth();
  loadUserData();
  loadChallenges();

  document.getElementById("logout-btn").addEventListener("click", logout);

  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      switchTab(e.currentTarget.dataset.tab);
    });
  });

  document.getElementById("create-challenge-form").addEventListener("submit", createChallenge);

  document.querySelector(".close-modal").addEventListener("click", closeModal);
  document.querySelector(".close-details-modal").addEventListener("click", closeDetailsModal);

  window.addEventListener("click", (e) => {
    if (e.target === document.getElementById("completion-modal")) closeModal();
    if (e.target === document.getElementById("details-modal")) closeDetailsModal();
  });
});
