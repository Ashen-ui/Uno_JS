// Lobby client-side JavaScript
let currentUserId = null;

document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const savedUserId = sessionStorage.getItem('user_id');
    const savedUsername = sessionStorage.getItem('username');
    
    if (!savedUserId || !savedUsername) {
        // Not logged in, redirect to login
        window.location.href = '/connexion';
        return;
    }

    currentUserId = savedUserId;

    // Load user profile and rooms on page load
    loadUserProfile();
    loadRooms();

    // Set up create room button
    const createButton = document.getElementById('create-room-button');
    if (createButton) {
        createButton.addEventListener('click', createRoom);
    }
});


async function loadUserProfile() {
    try {
        // Get user info from sessionStorage
        const username = sessionStorage.getItem('username') || 'Joueur';
        const userEmail = sessionStorage.getItem('user_email') || '';
        
        document.getElementById('header-username').textContent = username;
        document.getElementById('profile-name').textContent = username;
        if (document.getElementById('profile-email')) {
            document.getElementById('profile-email').textContent = userEmail;
        }
    } catch (error) {
        console.error('Error loading user profile:', error);
    }
}

async function loadRooms() {
    try {
        const response = await fetch('/api/lobbies');
        const rooms = await response.json();

        const roomsList = document.getElementById('rooms-list');
        if (rooms.length === 0) {
            roomsList.innerHTML = '<div class="empty-state"><p>Aucune salle disponible</p></div>';
            return;
        }

        roomsList.innerHTML = rooms.map(room => `
            <div class="room-card">
                <div class="room-info">
                    <h3>${room.name}</h3>
                    <p>${room.playerCount}/${room.maxPlayers} joueurs</p>
                    ${room.passwordProtected ? '<span class="password-icon">🔒</span>' : ''}
                    ${room.mutations && room.mutations.length > 0 ? `<p class="mutations">Modificateurs: ${room.mutations.join(', ')}</p>` : ''}
                </div>
                <div class="room-actions">
                    <button class="btn join-btn" onclick="joinRoom('${room.name}')">Rejoindre</button>
                    ${room.creatorId === currentUserId ? `<button class="btn delete-btn" onclick="deleteRoom('${room.name}')">Supprimer</button>` : ''}
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading rooms:', error);
        document.getElementById('rooms-list').innerHTML = '<div class="empty-state"><p>Erreur lors du chargement des salles</p></div>';
    }
}

async function createRoom() {
    const roomName = document.getElementById('room-name-input').value.trim();
    const maxPlayers = document.getElementById('max-players-input').value;
    const password = document.getElementById('room-password-input').value.trim();

    // Get selected mutations
    const mutationCheckboxes = document.querySelectorAll('#mutation-options input[type="checkbox"]:checked');
    const mutations = Array.from(mutationCheckboxes).map(cb => cb.value);

    // Clear previous messages
    document.getElementById('create-error').style.display = 'none';
    document.getElementById('create-success').style.display = 'none';

    // Validate input
    if (!roomName) {
        showCreateError('Le nom de la salle est requis');
        return;
    }

    if (!maxPlayers || maxPlayers < 2 || maxPlayers > 8) {
        showCreateError('Le nombre de joueurs doit être entre 2 et 8');
        return;
    }

    try {
        const response = await fetch('/api/lobbies', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: roomName,
                maxPlayers: parseInt(maxPlayers),
                password: password || null,
                mutations: mutations,
                creatorId: currentUserId
            })
        });

        const result = await response.json();

        if (result.success) {
            // Store room info in session storage and redirect to gameWait
            sessionStorage.setItem('currentRoom', roomName);
            sessionStorage.setItem('currentPlayerId', currentUserId);
            // Redirect to gameWait page immediately
            window.location.href = '/gameWait';
        } else {
            showCreateError(result.message || 'Erreur lors de la création de la salle');
        }
    } catch (error) {
        console.error('Error creating room:', error);
        showCreateError('Erreur réseau lors de la création de la salle');
    }
}

function showCreateError(message) {
    const errorDiv = document.getElementById('create-error');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
}

function showCreateSuccess(message) {
    const successDiv = document.getElementById('create-success');
    successDiv.textContent = message;
    successDiv.style.display = 'block';
}

async function joinRoom(roomName) {
    // Get room info to check if password protected
    try {
        const response = await fetch('/api/lobbies');
        const rooms = await response.json();
        const room = rooms.find(r => r.name === roomName);

        if (!room) {
            alert('Salle non trouvée');
            return;
        }

        let password = null;
        if (room.passwordProtected) {
            password = prompt('Cette salle est protégée par mot de passe. Veuillez entrer le mot de passe:');
            if (password === null) {
                return; // User cancelled
            }
        }

        // Try to join the room
        const joinResponse = await fetch(`/api/lobbies/${encodeURIComponent(roomName)}/join`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                playerId: currentUserId,
                playerName: document.getElementById('profile-name').textContent || 'Joueur',
                password: password
            })
        });

        const result = await joinResponse.json();

        if (result.success) {
            // Store room info in session storage for game page
            sessionStorage.setItem('currentRoom', roomName);
            sessionStorage.setItem('currentPlayerId', currentUserId);
            // Redirect to game page
            window.location.href = '/gameWait';
        } else {
            alert(`Erreur: ${result.message}`);
        }
    } catch (error) {
        console.error('Error joining room:', error);
        alert('Erreur réseau lors de la connexion à la salle');
    }
}

async function deleteRoom(roomName) {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer la salle "${roomName}" ?`)) {
        return;
    }

    try {
        const response = await fetch(`/api/lobbies/${encodeURIComponent(roomName)}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                creatorId: currentUserId
            })
        });

        const result = await response.json();

        if (result.success) {
            alert('Salle supprimée avec succès !');
            loadRooms(); // Reload the rooms list
        } else {
            alert(`Erreur: ${result.message}`);
        }
    } catch (error) {
        console.error('Error deleting room:', error);
        alert('Erreur lors de la suppression de la salle');
    }
}