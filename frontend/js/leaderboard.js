// js/leaderboard.js


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
        
        // Sort by net worth (descending) - in case backend doesn't sort
        users.sort((a, b) => b.net_worth - a.net_worth);
        
        const leaderboardList = document.getElementById('leaderboard-list');
        const yourRankDiv = document.getElementById('your-rank');
        
        if (users.length === 0) {
            leaderboardList.innerHTML = '<div class="empty-state">No players yet</div>';
            yourRankDiv.innerHTML = '<span class="rank-number">Not Ranked</span>';
            return;
        }
        
        // Find current user's rank in top 10
        const userRank = users.findIndex(u => u.user_id === parseInt(userId)) + 1;
        const currentUser = users.find(u => u.user_id === parseInt(userId));
        
        // Show user rank (or say they're not in top 10)
        if (currentUser && userRank > 0) {
            yourRankDiv.innerHTML = `
                <span class="rank-number">#${userRank}</span>
                <div class="rank-stats">
                    <p>$${currentUser.net_worth}</p>
                    <p>${currentUser.points} points</p>
                </div>
            `;
        } else {
            yourRankDiv.innerHTML = `
                <span class="rank-number">Not in Top 10</span>
            `;
        }
        
        // Display all returned users (should be top 10 from backend)
        leaderboardList.innerHTML = users.map((user, index) => {
            const rank = index + 1;
            const isCurrentUser = user.user_id === parseInt(userId);
            
            return `
                <div class="leaderboard-item rank-${rank} ${isCurrentUser ? 'current-user' : ''}">
                    <div class="rank-badge">${rank <= 3 ? ['🥇', '🥈', '🥉'][rank - 1] : `#${rank}`}</div>
                    <div class="player-info">
                        <div class="player-name">${user.username}${isCurrentUser ? ' (You)' : ''}</div>
                        <div class="player-stats">${user.points} points</div>
                    </div>
                    <div class="score-badge">$${user.net_worth}</div>
                </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Error loading leaderboard:', error);
        document.getElementById('leaderboard-list').innerHTML = '<div class="empty-state">Error loading leaderboard</div>';
        document.getElementById('your-rank').innerHTML = '<span class="rank-number">Error</span>';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadUserData();
    loadLeaderboard();
    
    document.getElementById('logout-btn').addEventListener('click', logout);
});