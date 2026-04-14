// Game Waiting Page - Client-side JavaScript
let currentUserId = null;
let currentRoomName = null;
let currentPlayerId = null;
let refreshInterval = null;

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

    // Get room info from sessionStorage
    currentRoomName = sessionStorage.getItem('currentRoom');
    currentPlayerId = sessionStorage.getItem('currentPlayerId');

    if (!currentRoomName || !currentPlayerId) {
        // No room info, redirect back to lobby
        window.location.href = '/lobby';
        return;
    }

    // Load room info and set up refresh
    loadRoomInfo();

    // Refresh room info every 2 seconds to check for new players
    refreshInterval = setInterval(loadRoomInfo, 2000);

    // Set up navigation
    document.getElementById('header-username').textContent = savedUsername;
});

async function loadRoomInfo() {
    try {
        const response = await fetch(`/api/lobbies/${encodeURIComponent(currentRoomName)}`);
        
        if (!response.ok) {
            console.error('Error loading room info:', response.status);
            return;
        }

        const result = await response.json();

        if (!result.success || !result.lobby) {
            console.error('Room not found or error loading room');
            return;
        }

        const lobby = result.lobby;

        // If game has started, redirect to game page
        if (lobby.status === 'playing') {
            if (refreshInterval) {
                clearInterval(refreshInterval);
            }
            window.location.href = '/game';
            return;
        }

        // Update game ID
        document.getElementById('game-id').textContent = currentRoomName;

        // Update player count
        document.getElementById('connected-players').textContent = lobby.playerCount;

        // Update players list
        updatePlayersList(lobby.players);

        // Check if lobby is full and user is creator
        if (lobby.playerCount === lobby.maxPlayers && currentUserId === lobby.creatorId) {
            showStartButton();
        } else {
            hideStartButton();
        }

    } catch (error) {
        console.error('Error loading room info:', error);
    }
}

function updatePlayersList(players) {
    const playersList = document.getElementById('players-list');
    
    // Create players list if it doesn't exist
    if (!playersList) {
        const section = document.querySelector('.game-Waiting-board');
        const div = document.createElement('div');
        div.id = 'players-list';
        div.className = 'players-list';
        section.appendChild(div);
    }

    const playersList2 = document.getElementById('players-list');
    playersList2.innerHTML = '<h3>Joueurs connectés:</h3>' + 
        (players && players.length > 0 
            ? '<ul>' + players.map(p => `<li>${p.pseudo || p.name || 'Joueur'}</li>`).join('') + '</ul>'
            : '<p>Aucun joueur pour le moment</p>');
}

function showStartButton() {
    let startBtn = document.getElementById('start-game-btn');
    
    if (!startBtn) {
        const section = document.querySelector('.game-Waiting-board');
        startBtn = document.createElement('button');
        startBtn.id = 'start-game-btn';
        startBtn.className = 'btn btn-primary';
        startBtn.textContent = 'Lancer la partie';
        startBtn.onclick = startGame;
        section.appendChild(startBtn);
    } else {
        startBtn.style.display = 'block';
    }
}

function hideStartButton() {
    const startBtn = document.getElementById('start-game-btn');
    if (startBtn) {
        startBtn.style.display = 'none';
    }
}

async function startGame() {
    // Clear the interval
    if (refreshInterval) {
        clearInterval(refreshInterval);
    }

    try {
        const response = await fetch(`/api/lobbies/${encodeURIComponent(currentRoomName)}/start`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                creatorId: currentUserId
            })
        });

        const result = await response.json();

        if (result.success) {
            // Store game state in sessionStorage and navigate to game page
            sessionStorage.setItem('gameStarted', 'true');
            window.location.href = '/game';
        } else {
            alert(`Erreur: ${result.message || 'Impossible de lancer la partie'}`);
            // Restart the refresh interval
            refreshInterval = setInterval(loadRoomInfo, 2000);
        }
    } catch (error) {
        console.error('Error starting game:', error);
        alert('Erreur lors du lancement de la partie');
        // Restart the refresh interval
        refreshInterval = setInterval(loadRoomInfo, 2000);
    }
}

// Clean up on page unload
window.addEventListener('beforeunload', function() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
    }
});
