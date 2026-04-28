// Game Page - Client-side JavaScript
let currentUserId = null;
let currentRoomName = null;
let gameState = null;
let refreshInterval = null;

document.addEventListener('DOMContentLoaded', function () {
    const savedUserId = sessionStorage.getItem('user_id');
    const savedUsername = sessionStorage.getItem('username');

    if (!savedUserId || !savedUsername) {
        window.location.href = '/connexion';
        return;
    }

    currentUserId = savedUserId;
    currentRoomName = sessionStorage.getItem('currentRoom');

    if (!currentRoomName) {
        window.location.href = '/lobby';
        return;
    }

    const headerUsername = document.getElementById('header-username');
    if (headerUsername) headerUsername.textContent = savedUsername;

    const drawBtn = document.getElementById('draw-btn');
    if (drawBtn) drawBtn.addEventListener('click', drawCard);

    const unoBtn = document.getElementById('uno-btn');
    if (unoBtn) unoBtn.addEventListener('click', sayUno);

    const contraUnoBtn = document.getElementById('contra-uno-btn');
    if (contraUnoBtn) contraUnoBtn.addEventListener('click', contraUno);

    loadGameState();
    refreshInterval = setInterval(loadGameState, 1000);
});

async function loadGameState() {
    try {
        const response = await fetch(`/api/lobbies/${encodeURIComponent(currentRoomName)}/game`);

        if (!response.ok) {
            return;
        }

        const result = await response.json();
        if (result.success && result.game) {
            gameState = result.game;
            updateGameDisplay();
        }
    } catch (error) {
        console.error('Error loading game state:', error);
    }
}

function updateGameDisplay() {
    if (!gameState) return;

    const currentPlayerEl = document.getElementById('header-current-player');
    if (currentPlayerEl && gameState.players && gameState.players.length > gameState.currentPlayerIndex) {
        currentPlayerEl.textContent = gameState.players[gameState.currentPlayerIndex]?.pseudo || 'Joueur';
    }

    const headerRound = document.getElementById('header-round');
    if (headerRound) headerRound.textContent = gameState.Round || 0;

    updateTopCard();

    const deckCountEl = document.getElementById('deck-count');
    if (deckCountEl && gameState.deck) {
        deckCountEl.textContent = gameState.deck.cardsLeft;
    }

    displayPlayersInfo();
    displayMutations();
    displayPlayerHand();
}

function updateTopCard() {
    const topCard = document.getElementById('top-card');
    if (!topCard || !gameState.lastcard) return;

    topCard.className = 'card card-display';
    topCard.innerHTML = '';
    topCard.style.backgroundImage = '';
    topCard.style.background = '';
    topCard.style.backgroundColor = '';

    if (gameState.lastcard.skin) {
        topCard.style.backgroundImage = `url('${gameState.lastcard.skin}')`;
    } else {
        topCard.style.background = getCardColor(gameState.lastcard.color);
        topCard.innerHTML = `<span class="card-value">${getCardLabel(gameState.lastcard)}</span>`;
    }
}

function displayPlayersInfo() {
    if (!gameState || !gameState.players) return;

    const topArea = document.getElementById('players-top-area');
    const leftArea = document.getElementById('players-left-area');
    const rightArea = document.getElementById('players-right-area');
    if (!topArea || !leftArea || !rightArea) return;

    topArea.innerHTML = '';
    leftArea.innerHTML = '';
    rightArea.innerHTML = '';

    const opponents = gameState.players.filter(p => p.id !== currentUserId);
    const activePlayerId = gameState.players[gameState.currentPlayerIndex]?.id;

    opponents.forEach((player) => {
        const playerDiv = document.createElement('div');
        playerDiv.className = 'player-card';
        if (player.id === activePlayerId) {
            playerDiv.classList.add('active');
        }

        const playerName = document.createElement('span');
        playerName.className = 'player-name';
        playerName.textContent = player.pseudo;

        const playerHandSize = document.createElement('span');
        playerHandSize.className = 'player-hand-size';
        const count = (player.hand && player.hand.length) || player.handSize || 0;
        playerHandSize.textContent = `Cartes: ${count}`;

        playerDiv.appendChild(playerName);
        playerDiv.appendChild(playerHandSize);

        if (player.hand && player.hand.length > 0) {
            const handContainer = document.createElement('div');
            handContainer.className = 'opponent-hand-display';

            player.hand.forEach((card) => {
                const cardDiv = document.createElement('div');
                cardDiv.className = 'opponent-card';

                if (card.skin_back) {
                    cardDiv.style.backgroundImage = `url('${card.skin_back}')`;
                } else {
                    cardDiv.style.backgroundColor = '#4da3ff';
                }

                handContainer.appendChild(cardDiv);
            });

            playerDiv.appendChild(handContainer);
        }

        if (topArea.children.length < 2) {
            topArea.appendChild(playerDiv);
        } else if (leftArea.children.length <= rightArea.children.length) {
            leftArea.appendChild(playerDiv);
        } else {
            rightArea.appendChild(playerDiv);
        }
    });
}

function displayMutations() {
    if (!gameState || !gameState.mutations) return;

    const mutationsList = document.getElementById('mutations-list');
    if (!mutationsList) return;
    mutationsList.innerHTML = '';

    for (const [mutation, active] of Object.entries(gameState.mutations)) {
        if (active) {
            const badge = document.createElement('span');
            badge.className = 'mutation-badge active';
            badge.textContent = mutation;
            mutationsList.appendChild(badge);
        }
    }

    if (mutationsList.children.length === 0) {
        mutationsList.innerHTML = '<span style="color: var(--text-muted); font-size: 12px;">Aucune mutation</span>';
    }
}

function displayPlayerHand() {
    if (!gameState || !gameState.players) return;

    const handContainer = document.getElementById('player-hand-cards');
    const handCountEl = document.getElementById('hand-count');
    if (!handContainer || !handCountEl) return;

    const currentPlayer = gameState.players.find(p => p.id === currentUserId);

    if (!currentPlayer || !currentPlayer.hand) {
        handCountEl.textContent = '0 cartes';
        handContainer.innerHTML = '<p style="color: var(--text-muted); text-align: center;">Aucune carte</p>';
        updateUnoButtonDisplay(0);
        return;
    }

    const handLength = currentPlayer.hand.length;
    handCountEl.textContent = `${handLength} carte${handLength > 1 ? 's' : ''}`;
    handContainer.innerHTML = '';

    updateUnoButtonDisplay(handLength);

    currentPlayer.hand.forEach((card, idx) => {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'hand-card';
        cardDiv.onclick = () => playCard(idx, card);
        cardDiv.title = `${(card.color || '').toUpperCase()} ${card.value}`;

        if (card.skin) {
            cardDiv.style.backgroundImage = `url('${card.skin}')`;
        } else {
            cardDiv.style.background = getCardColor(card.color);
            cardDiv.innerHTML = `<span class="card-value">${getCardLabel(card)}</span>`;
        }

        handContainer.appendChild(cardDiv);
    });
}

function updateUnoButtonDisplay(handLength) {
    const unoBtn = document.getElementById('uno-btn');
    const contraUnoBtn = document.getElementById('contra-uno-btn');

    if (unoBtn) {
        unoBtn.style.display = handLength === 1 ? 'block' : 'none';
    }
    if (contraUnoBtn) {
        contraUnoBtn.style.display = 'block';
    }
}

function getCardLabel(card) {
    if (!card) return '';
    const labels = {
        skip: 'PASSE',
        reverse: 'INV',
        wild: 'JOKER'
    };
    return labels[card.value] || card.value;
}

function getCardColor(colorName) {
    const colors = {
        red: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
        blue: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
        yellow: 'linear-gradient(135deg, #f39c12 0%, #e67e22 100%)',
        green: 'linear-gradient(135deg, #27ae60 0%, #229954 100%)',
        wild: 'linear-gradient(45deg, #e74c3c 0%, #3498db 25%, #f39c12 50%, #27ae60 75%, #2c3e50 100%)'
    };
    return colors[colorName] || '#34495e';
}

async function playCard(cardIndex, card) {
    try {
        const response = await fetch(`/api/lobbies/${encodeURIComponent(currentRoomName)}/game/play`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ playerId: currentUserId, cardIndex })
        });

        const result = await response.json();
        if (!result.success) {
            alert(`Erreur: ${result.message}`);
        }
    } catch (error) {
        console.error('Error playing card:', error);
        alert('Erreur lors de la lecture de la carte');
    }
}

async function drawCard() {
    const drawBtn = document.getElementById('draw-btn');
    if (drawBtn) {
        drawBtn.disabled = true;
        drawBtn.textContent = 'Pioche...';
    }

    try {
        const response = await fetch(`/api/lobbies/${encodeURIComponent(currentRoomName)}/game/draw`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ playerId: currentUserId })
        });

        const result = await response.json();
        if (!result.success) {
            alert(`Erreur: ${result.message}`);
        }
    } catch (error) {
        console.error('Error drawing card:', error);
        alert('Erreur lors de la pioche');
    } finally {
        if (drawBtn) {
            drawBtn.disabled = false;
            drawBtn.textContent = 'Piocher';
        }
    }
}

async function sayUno() {
    try {
        const response = await fetch(`/api/lobbies/${encodeURIComponent(currentRoomName)}/game/uno`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ playerId: currentUserId })
        });

        const result = await response.json();
        if (!result.success) {
            alert(`Erreur: ${result.message}`);
        }
    } catch (error) {
        console.error('Error declaring UNO:', error);
        alert('Erreur lors de la déclaration UNO');
    }
}

async function contraUno() {
    if (!gameState || !gameState.players) {
        alert('État du jeu non disponible');
        return;
    }

    let targetPlayer = null;
    for (const player of gameState.players) {
        if (player.id !== currentUserId && player.handSize === 1) {
            targetPlayer = player;
            break;
        }
    }

    if (!targetPlayer) {
        alert('Aucun joueur à contrer');
        return;
    }

    try {
        const response = await fetch(`/api/lobbies/${encodeURIComponent(currentRoomName)}/game/contrauno`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ playerId: currentUserId, targetPlayerId: targetPlayer.id })
        });

        const result = await response.json();
        if (!result.success) {
            alert(`Erreur: ${result.message}`);
        }
    } catch (error) {
        console.error('Error declaring Contra UNO:', error);
        alert('Erreur lors du Contre UNO');
    }
}

window.addEventListener('beforeunload', function () {
    if (refreshInterval) clearInterval(refreshInterval);
});
