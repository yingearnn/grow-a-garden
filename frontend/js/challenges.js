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
        const isBonus = currentHour >= 6 && currentHour < 8;
        
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
        const challengeId = e.currentTarget.dataset.challengeId;  // ✅ use currentTarget
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

function openCompletionModal(challengeId, points, description) {
    const modal = document.getElementById('completion-modal');
    document.getElementById('modal-challenge-name').textContent = description;
    document.getElementById('modal-challenge-points').textContent = `Reward: ${points} points`;

    modal.classList.add('active');

    const oldForm = document.getElementById('completion-form');
    const newForm = oldForm.cloneNode(true);  // ✅ clone to remove old listeners
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
    } catch (error) {
        console.error('Error completing challenge:', error);
        alert('Error completing challenge');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadUserData();
    loadChallenges();
    
    document.getElementById('logout-btn').addEventListener('click', logout);
    
    // Modal close handlers
    document.querySelector('.close-modal').addEventListener('click', closeModal);
    window.addEventListener('click', (e) => {
        if (e.target === document.getElementById('completion-modal')) {
            closeModal();
        }
    });
});