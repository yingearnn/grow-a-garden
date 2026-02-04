// js/challenges.js
import { showNotification } from './notifications.js';
import { getToken } from './auth.js';
import { getUserId } from './auth.js';
import { checkAuth } from './auth.js';
import { logout } from './auth.js';



function openEditModal(challengeId, description, points) {
    const modal = document.getElementById('edit-modal');
    document.getElementById('edit-description').value = description;
    document.getElementById('edit-points').value = points;
    modal.classList.add('active');

    const oldForm = document.getElementById('edit-form');
    const newForm = oldForm.cloneNode(true);
    oldForm.parentNode.replaceChild(newForm, oldForm);

    newForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await editChallenge(challengeId);
    });
}

async function editChallenge(challengeId) {
    const token = getToken();
    const userId = getUserId();
    const description = document.getElementById('edit-description').value;
    const points = parseInt(document.getElementById('edit-points').value);

    try {
        const response = await fetch(`${currentUrl}/challenges/${challengeId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ 
                user_id: parseInt(userId),
                description,
                points
            })
        });

        if (!response.ok) {
            const error = await response.json();
            showNotification(error.message || 'Failed to update challenge', 'error');
            return;
        }

        showNotification('Challenge updated successfully!', 'success');
        document.getElementById('edit-modal').classList.remove('active');
        await loadChallenges();

    } catch (error) {
        console.error('Error editing challenge:', error);
        showNotification('Error updating challenge', 'error');
    }
}

async function deleteChallenge(challengeId, description) {
    const token = getToken();

    try {
        const response = await fetch(`${currentUrl}/challenges/${challengeId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.status === 401) {
            logout();
            return;
        }

        // Status 204 means success with no content
        if (response.status === 204) {
            showNotification('Challenge deleted successfully!', 'success');
            await loadChallenges();
            return;
        }

        if (!response.ok) {
            // Try to get error message from response
            try {
                const error = await response.json();
                showNotification(error.message || 'Failed to delete challenge', 'error');
            } catch {
                showNotification('Failed to delete challenge', 'error');
            }
            return;
        }

        showNotification('Challenge deleted successfully!', 'success');
        await loadChallenges();

    } catch (error) {
        console.error('Error deleting challenge:', error);
        showNotification('Error deleting challenge', 'error');
    }
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

async function loadChallenges() {
    const token = getToken();
    
    try {
        const response = await fetch(`${currentUrl}/challenges`, {
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
        
        // Check current hour for bonus indicator (display only)
        const currentHour = new Date().getHours();
        
        const userId = getUserId();

        challengesList.innerHTML = challenges.map(challenge => {
    const isCreator = parseInt(challenge.creator_id) === parseInt(userId);

    return `
        <div class="challenge-card">
            <h3>${challenge.description}</h3>

            <p class="challenge-points">
                ${challenge.effective_points}
                ${challenge.has_bonus ? 'points (1.5x)' : 'points'}
            </p>

            <button class="btn-complete" 
                data-challenge-id="${challenge.challenge_id}">
                Complete Challenge
            </button>

            ${isCreator ? `
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
            ` : ''}
        </div>
    `;
}).join('');
        // Add event listeners
        document.querySelector('.close-edit-modal').addEventListener('click', () => {
            document.getElementById('edit-modal').classList.remove('active');
        });

        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const challengeId = e.currentTarget.dataset.challengeId;
                const description = e.currentTarget.dataset.description;
                const points = e.currentTarget.dataset.points;
                openEditModal(challengeId, description, points);
            });
        });

        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const challengeId = e.currentTarget.dataset.challengeId;
                const description = e.currentTarget.dataset.description;
                deleteChallenge(challengeId, description);
            });
        });

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
        const challengesResponse = await fetch(`${currentUrl}/challenges`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!challengesResponse.ok) throw new Error('Failed to fetch challenges');
        
        const challenges = await challengesResponse.json();
        const completedList = document.getElementById('completed-list');
        const completedChallenges = [];
        
        for (const challenge of challenges) {
            try {
                const completionResponse = await fetch(`${currentUrl}/challenges/${challenge.challenge_id}/`, {
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
    const pointsText = document.getElementById('points-display').textContent;
    const UserCurpoints = parseInt(pointsText.replace('Points: ', ''), 10);

    if (UserCurpoints < 10) {
        showNotification('Insufficient points to create new challenge', 'error');
        return;
    }
    
    if (!userId) {
        showNotification('Please log in to create a challenge', 'error');
        return;
    }
    
    if (!description || !points) {
        showNotification('Please fill in all fields', 'error');
        return;
    }
    
    if (points > 50) {
        showNotification('Maximum 50 points allowed for a challenge', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${currentUrl}/challenges`, {
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
            showNotification(data.message || 'Failed to create challenge', 'error');
            return;
        }
        
        showNotification(`Challenge created successfully! "${description}" for ${points} points`, 'success');
        await loadUserData();
        
        document.getElementById('create-challenge-form').reset();
        
        switchTab('available');
        await loadChallenges();
        
    } catch (error) {
        console.error('Error creating challenge:', error);
        showNotification('Error creating challenge. Please try again.', 'error');
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
        const response = await fetch(`${currentUrl}/challenges/${challengeId}/complete`, {
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
            showNotification(error.message || 'Failed to complete challenge', 'error');
            return;
        }
        
        const data = await response.json();
        showNotification(`Challenge completed! You earned ${data.points_awarded} points!`, 'success');
        
        closeModal();
        await loadUserData();
        await loadCompletedChallenges();
    } catch (error) {
        console.error('Error completing challenge:', error);
        showNotification('Error completing challenge', 'error');
    }
}

function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(`${tabName}-tab`).classList.add('active');
    
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
    
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tabName = e.currentTarget.dataset.tab;
            switchTab(tabName);
        });
    });
    
    document.getElementById('create-challenge-form').addEventListener('submit', createChallenge);
    
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