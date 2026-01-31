// js/challenges.js

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

async function loadChallenges() {
    const token = getToken();
    
    try {
        const response = await fetch(`${API_BASE}/challenges`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to fetch challenges');
        
        const challenges = await response.json();
        const challengesList = document.getElementById('challenges-list');
        
        if (challenges.length === 0) {
            challengesList.innerHTML = '<p>No challenges available</p>';
            return;
        }
        
        // Check current hour for bonus
        const currentHour = new Date().getHours();
        const isBonus = currentHour >= 10 && currentHour < 12;
        
        challengesList.innerHTML = challenges.map(challenge => {
            const points = isBonus ? Math.floor(challenge.points * 1.5) : challenge.points;
            return `
                <div class="challenge-card">
                    <h3>${challenge.description}</h3>
                    <p class="challenge-points">
                        ${points} points ${isBonus ? '(1.5x BONUS!)' : ''}
                    </p>
                    <button class="btn-complete" data-challenge-id="${challenge.challenge_id}" data-points="${points}" data-description="${challenge.description}">
                        Complete Challenge
                    </button>
                </div>
            `;
        }).join('');
        
        // Add event listeners
       document.querySelectorAll('.btn-complete').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const challengeId = e.currentTarget.dataset.challengeId;
        const points = e.currentTarget.dataset.points;
        const description = e.currentTarget.dataset.description;
        openCompletionModal(challengeId, points, description);
    });
});
    } catch (error) {
        console.error('Error loading challenges:', error);
        document.getElementById('challenges-list').innerHTML = '<p>Error loading challenges</p>';
    }
}

async function loadCompletedChallenges() {
    const token = getToken();
    const userId = getUserId();
    
    try {
        // We need to get all challenges first, then check which ones the user has completed
        const challengesResponse = await fetch(`${API_BASE}/challenges`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!challengesResponse.ok) throw new Error('Failed to fetch challenges');
        
        const challenges = await challengesResponse.json();
        const completedList = document.getElementById('completed-list');
        const completedChallenges = [];
        
        // Check each challenge for user completions
        for (const challenge of challenges) {
            try {
                const completionResponse = await fetch(`${API_BASE}/challenges/${challenge.challenge_id}/`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (completionResponse.ok) {
                    const completions = await completionResponse.json();
                    const userCompletion = completions.find(c => c.user_id === parseInt(userId));
                    
                    if (userCompletion) {
                        completedChallenges.push({
                            ...challenge,
                            completed_on: userCompletion.completed_on,
                            details: userCompletion.details
                        });
                    }
                }
            } catch (err) {
                console.log(`No completions found for challenge ${challenge.challenge_id}`);
            }
        }
        
        if (completedChallenges.length === 0) {
            completedList.innerHTML = '<p>You haven\'t completed any challenges yet.</p>';
            return;
        }
        
        // Sort by most recent first
        completedChallenges.sort((a, b) => new Date(b.completed_on) - new Date(a.completed_on));
        
        completedList.innerHTML = completedChallenges.map(challenge => {
            const completedDate = new Date(challenge.completed_on).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
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
        }).join('');
        
        // Add event listeners for view details buttons
        document.querySelectorAll('.btn-view-details').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const details = decodeURIComponent(e.currentTarget.dataset.details);
                showDetailsModal(details);
            });
        });
        
    } catch (error) {
        console.error('Error loading completed challenges:', error);
        document.getElementById('completed-list').innerHTML = '<p>Error loading completed challenges</p>';
    }
}

function showDetailsModal(details) {
    const modal = document.getElementById('details-modal');
    const content = document.getElementById('completion-details-content');
    
    content.innerHTML = `
        <div class="details-text">
            <h3>What you did:</h3>
            <p>${details}</p>
        </div>
    `;
    
    modal.classList.add('active');
}

function closeDetailsModal() {
    const modal = document.getElementById('details-modal');
    modal.classList.remove('active');
}

async function createChallenge(event) {
    event.preventDefault();
    
    const token = getToken();
    const userId = getUserId();
    const description = document.getElementById('challenge-description').value;
    const points = parseInt(document.getElementById('challenge-points').value);
 const pointsText = document.getElementById('points-display').textContent; // "Points: 25"
const UserCurpoints = parseInt(pointsText.replace('Points: ', ''), 10);

if (UserCurpoints < 10) {
    alert('Insufficient points to create new challenge');
    return;
}
    
    // Validation
    if (!userId) {
        alert('Please log in to create a challenge');
        return;
    }
    
    if (!description || !points) {
        alert('Please fill in all fields');
        return;
    }
    
    if (points > 50) {
        alert('Maximum 50 points allowed for a challenge');
        return;
    }

    if (UserCurpoints < 10) {
        alert('Insufficient points to create new challenge');
        return;
    }
    
    console.log('Creating challenge with:', {
        user_id: parseInt(userId),
        description: description,
        points: points
    });
    
    try {
        const response = await fetch(`${API_BASE}/challenges`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                user_id: parseInt(userId),
                description: description,
                points: points
            })
        });
        
        if (response.status === 401) {
            logout();
            return;
        }
        
        const data = await response.json();
        
        if (!response.ok) {
            alert(data.message || 'Failed to create challenge');
            return;
        }
        
        alert(`Challenge created successfully! "${description}" for ${points} points`);
        await loadUserData();
        
        // Clear form
        document.getElementById('create-challenge-form').reset();
        
        // Switch to available challenges tab and reload
        switchTab('available');
        await loadChallenges();
        
    } catch (error) {
        console.error('Error creating challenge:', error);
        alert('Error creating challenge. Please try again.');
    }
}

function openCompletionModal(challengeId, points, description) {
    const modal = document.getElementById('completion-modal');
    document.getElementById('modal-challenge-name').textContent = description;
    document.getElementById('modal-challenge-points').textContent = `Reward: ${points} points`;

    modal.classList.add('active');

    const oldForm = document.getElementById('completion-form');
    const newForm = oldForm.cloneNode(true);
    oldForm.parentNode.replaceChild(newForm, oldForm);

    newForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await completeChallenge(challengeId);
    });
}

function closeModal() {
    const modal = document.getElementById('completion-modal');
    modal.classList.remove('active');
    document.getElementById('completion-details').value = '';
}

async function completeChallenge(challengeId) {
    const token = getToken();
    const userId = getUserId();
    const details = document.getElementById('completion-details').value;
    
    try {
        const response = await fetch(`${API_BASE}/challenges/${challengeId}/complete`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                user_id: parseInt(userId),
                details: details
            })
        });
        
        if (response.status === 401) {
            logout();
            return;
        }
        
        if (!response.ok) {
            const error = await response.json();
            alert(error.message || 'Failed to complete challenge');
            return;
        }
        
        const data = await response.json();
        alert(`Challenge completed! You earned ${data.points_awarded} points!`);
        
        closeModal();
        await loadUserData();
        await loadCompletedChallenges(); // Refresh completed challenges
    } catch (error) {
        console.error('Error completing challenge:', error);
        alert('Error completing challenge');
    }
}

function switchTab(tabName) {
    // Remove active class from all tabs and content
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    // Add active class to selected tab and content
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(`${tabName}-tab`).classList.add('active');
    
    // Load content for the tab if needed
    if (tabName === 'completed') {
        loadCompletedChallenges();
    } else if (tabName === 'available') {
        loadChallenges();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadUserData();
    loadChallenges();
    
    document.getElementById('logout-btn').addEventListener('click', logout);
    
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tabName = e.currentTarget.dataset.tab;
            switchTab(tabName);
        });
    });
    
    // Create challenge form
    document.getElementById('create-challenge-form').addEventListener('submit', createChallenge);
    
    // Modal close handlers
    document.querySelector('.close-modal').addEventListener('click', closeModal);
    document.querySelector('.close-details-modal').addEventListener('click', closeDetailsModal);
    
    window.addEventListener('click', (e) => {
        if (e.target === document.getElementById('completion-modal')) {
            closeModal();
        }
        if (e.target === document.getElementById('details-modal')) {
            closeDetailsModal();
        }
    });
});