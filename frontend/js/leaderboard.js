// js/leaderboard.js

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

async function loadLeaderboard() {
    const token = getToken();
    const userId = getUserId();
    
    try {
        const response = await fetch(`${currentUrl}/user/top10`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to fetch users');
        
        const users = await response.json();

        // Ensure sorted by net worth descending
        users.sort((a, b) => b.net_worth - a.net_worth);

        const leaderboardList = document.getElementById('leaderboard-list');
        const yourRankDiv = document.getElementById('your-rank');

        if (users.length === 0) {
            leaderboardList.innerHTML = '<div class="empty-state">No players yet</div>';
            yourRankDiv.innerHTML = '<span class="rank-number">Not Ranked</span>';
            return;
        }

        // Tie-aware ranking logic
        let currentRank = 1;
        let lastNetWorth = null;

        leaderboardList.innerHTML = users.map((user, index) => {

            if (lastNetWorth !== null && user.net_worth < lastNetWorth) {
                currentRank = index + 1;
            }

            lastNetWorth = user.net_worth;

            const rank = currentRank;
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

    } catch (error) {
        console.error('Error loading leaderboard:', error);
        document.getElementById('leaderboard-list').innerHTML =
            '<div class="empty-state">Error loading leaderboard</div>';
        document.getElementById('your-rank').innerHTML =
            '<span class="rank-number">Error</span>';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadUserData();
    loadLeaderboard();
    
    document.getElementById('logout-btn').addEventListener('click', logout);
});