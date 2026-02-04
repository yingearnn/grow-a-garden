// js/leaderboard.js
// Loads current user stats + top 10 leaderboard and renders them in the UI.

import { getToken, getUserId, checkAuth, logout } from './auth.js';

// ---------------- Load Current User Data ----------------
// Fetch current user's points and net worth and display them at the top UI
async function loadUserData() {
    const token = getToken();
    const userId = getUserId();

    try {
        // Request current user's profile from backend
        const response = await fetch(`${currentUrl}/user/${userId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        // If token expired/invalid, logout to force login again
        if (response.status === 401) {
            logout();
            return;
        }

        // Any other non-OK response
        if (!response.ok) throw new Error('Failed to fetch user data');

        // Backend returns array, user object is first element
        const data = await response.json();
        const user = data[0];

        // Update UI elements with latest user stats
        document.getElementById('points-display').textContent = `Points: ${user.points}`;
        document.getElementById('networth-display').textContent = `Net Worth: $${user.net_worth}`;

    } catch (error) {
        // Log error but do not crash the page
        console.error('Error loading user data:', error);
    }
}

// ---------------- Load Leaderboard ----------------
// Fetch top 10 users and render them with tie-aware ranking
async function loadLeaderboard() {
    const token = getToken();
    const userId = getUserId();

    try {
        // Request leaderboard data from backend
        const response = await fetch(`${currentUrl}/user/top10`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error('Failed to fetch users');

        // Users list returned from backend
        const users = await response.json();

        // Ensure users are sorted by net worth descending (highest first)
        users.sort((a, b) => b.net_worth - a.net_worth);

        // UI containers
        const leaderboardList = document.getElementById('leaderboard-list');
        const yourRankDiv = document.getElementById('your-rank');

        // If there are no users to show
        if (users.length === 0) {
            leaderboardList.innerHTML = '<div class="empty-state">No players yet</div>';
            yourRankDiv.innerHTML = '<span class="rank-number">Not Ranked</span>';
            return;
        }

        // Tie-aware ranking:
        // same net_worth = same rank, rank increases only when net_worth decreases
        let currentRank = 1;
        let lastNetWorth = null;

        // Render all leaderboard entries
        leaderboardList.innerHTML = users.map((user, index) => {

            // If net worth is lower than the previous user's, rank increases
            if (lastNetWorth !== null && user.net_worth < lastNetWorth) {
                currentRank = index + 1;
            }

            // Store last net worth for tie comparisons
            lastNetWorth = user.net_worth;

            const rank = currentRank;

            // Highlight if this row is the logged-in user
            const isCurrentUser = user.user_id === parseInt(userId);

            return `
                <div class="leaderboard-item rank-${rank} ${isCurrentUser ? 'current-user' : ''}">
                    <div class="rank-badge">
                        ${rank <= 3 ? ['🥇', '🥈', '🥉'][rank - 1] : `#${rank}`}
                    </div>
                    <div class="player-info">
                        <div class="player-name">
                            ${user.username}${isCurrentUser ? ' (You)' : ''}
                        </div>
                        <div class="player-stats">${user.points} points</div>
                    </div>
                    <div class="score-badge">$${user.net_worth}</div>
                </div>
            `;
        }).join('');

        // NOTE: You currently don't calculate/display "your rank" separately here,
        // but you DO highlight the current user in the list if they appear in top10.

    } catch (error) {
        // Handle failed fetch or server errors
        console.error('Error loading leaderboard:', error);

        // Show error state in UI
        document.getElementById('leaderboard-list').innerHTML =
            '<div class="empty-state">Error loading leaderboard</div>';
        document.getElementById('your-rank').innerHTML =
            '<span class="rank-number">Error</span>';
    }
}

// ---------------- Page Init ----------------
// Runs when leaderboard page loads
document.addEventListener('DOMContentLoaded', () => {
    // Checks if user is logged in; redirects/logouts if not
    checkAuth();

    // Load current user stats and leaderboard
    loadUserData();
    loadLeaderboard();

    // Hook up logout button
    document.getElementById('logout-btn').addEventListener('click', logout);
});
