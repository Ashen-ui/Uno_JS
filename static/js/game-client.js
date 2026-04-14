// Game Page - Client-side JavaScript
let currentUserId = null;
let currentRoomName = null;
let gameState = null;
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

    if (!currentRoomName) {
        // No room selected, redirect back to lobby
        window.location.href = '/lobby';
        return;
    }

    // Set header
    document.getElementById('header-username').textContent = savedUsername;

    // Set up button listeners
    const drawBtn = document.getElementById('draw-btn');
    if (drawBtn) {
        drawBtn.addEventListener('click', drawCard);
    }

    const unoBtn = document.getElementById('uno-btn');
    if (unoBtn) {
        unoBtn.addEventListener('click', sayUno);
    }

    const contraUnoBtn = document.getElementById('contra-uno-btn');
    if (contraUnoBtn) {
        contraUnoBtn.addEventListener('click', contraUno);
    }

    // Initialize game display
    initializeGameDisplay();

    // Refresh game state every 1 second
    refreshInterval = setInterval(loadGameState, 1000);
});

async function initializeGameDisplay() {
    try {
        // Load game state to get initialized game
        const response = await fetch(`/api/lobbies/${encodeURIComponent(currentRoomName)}/game`);
        
        if (!response.ok) {
            console.error('Error loading game state');
            return;
        }

        const result = await response.json();
        if (result.success && result.game) {
            gameState = result.game;
            updateGameDisplay();
        }

    } catch (error) {
        console.error('Error initializing game display:', error);
    }
}

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

    // Update status
    const statusEl = document.getElementById('header-current-player');
    if (statusEl && gameState.players && gameState.players.length > gameState.currentPlayerIndex) {
        statusEl.textContent = gameState.players[gameState.currentPlayerIndex]?.pseudo || 'Joueur';
    }

    // Update current player
    const currentPlayerEl = document.getElementById('header-current-player');
    if (currentPlayerEl && gameState.players && gameState.players.length > gameState.currentPlayerIndex) {
        currentPlayerEl.textContent = gameState.players[gameState.currentPlayerIndex]?.pseudo || 'Joueur';
    }

    // Update round
    if (document.getElementById('header-round')) {
        document.getElementById('header-round').textContent = gameState.Round || 0;
    }

    // Update last card display with image
    if (document.getElementById('top-card') && gameState.lastcard) {
        const topCard = document.getElementById('top-card');
        topCard.className = `card card-display`;
        
        // Use skin image if available, otherwise show color/value
        if (gameState.lastcard.skin) {
            topCard.style.backgroundImage = `url('${gameState.lastcard.skin}')`;
        } else {
            topCard.textContent = gameState.lastcard.value;
            topCard.style.backgroundColor = getCardColor(gameState.lastcard.color);
        }
    }

    // Update deck count
    if (document.getElementById('deck-count') && gameState.deck) {
        document.getElementById('deck-count').textContent = gameState.deck.cardsLeft;
    }

    // Display players
    displayPlayersInfo();
    
    // Display mutations
    displayMutations();
    
    // Display player's current hand
    displayPlayerHand();
}

function displayPlayersInfo() {
    if (!gameState || !gameState.players) return;

    const playersArea = document.getElementById('players-area');
    playersArea.innerHTML = '';

    const numPlayers = gameState.players.length;
    const angles = [];
    
    // Calculate positions around the circle
    for (let i = 0; i < numPlayers; i++) {
        angles.push((360 / numPlayers) * i);
    }

    gameState.players.forEach((player, idx) => {
        // Skip current player (will show in player-section at bottom)
        if (player.id === currentUserId) {
            return;
        }

        const playerDiv = document.createElement('div');
        playerDiv.className = 'player-card';
        if (idx === gameState.currentPlayerIndex) {
            playerDiv.classList.add('active');
        }

        const angle = angles[idx];
        const radius = 140;
        const rad = (angle * Math.PI) / 180;
        const x = Math.cos(rad) * radius;
        const y = Math.sin(rad) * radius;

        playerDiv.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
        playerDiv.style.left = '50%';
        playerDiv.style.top = '50%';

        const playerName = document.createElement('span');
        playerName.className = 'player-name';
        playerName.textContent = player.pseudo;

        const playerHandSize = document.createElement('span');
        playerHandSize.className = 'player-hand-size';
        playerHandSize.textContent = `🎴 ${player.handSize || 0}`;

        playerDiv.appendChild(playerName);
        playerDiv.appendChild(playerHandSize);

        // Display opponent's hand (cards back hidden)
        if (player.hand && player.hand.length > 0) {
            const handContainer = document.createElement('div');
            handContainer.className = 'opponent-hand-display';
            
            player.hand.forEach((card, cardIdx) => {
                const cardDiv = document.createElement('div');
                cardDiv.className = 'opponent-card';
                
                // Always show card back for opponent cards
                if (card.skin_back) {
                    cardDiv.style.backgroundImage = `url('${card.skin_back}')`;
                } else {
                    cardDiv.style.backgroundColor = '#4da3ff';
                }
                
                handContainer.appendChild(cardDiv);
            });

            playerDiv.appendChild(handContainer);
        }

        playersArea.appendChild(playerDiv);
    });
}

function displayMutations() {
    if (!gameState || !gameState.mutations) return;

    const mutationsList = document.getElementById('mutations-list');
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
    
    // Find current player's hand
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

    // Update UNO button visibility
    updateUnoButtonDisplay(handLength);

    currentPlayer.hand.forEach((card, idx) => {
        const cardDiv = document.createElement('div');
        cardDiv.className = `hand-card`;
        cardDiv.onclick = () => playCard(idx, card);
        cardDiv.title = `${card.color.toUpperCase()} ${card.value}`;
        
        // Use skin image if available
        if (card.skin) {
            cardDiv.style.backgroundImage = `url('${card.skin}')`;
        } else {
            // Fallback to gradient if no image
            cardDiv.style.backgroundColor = getCardColor(card.color);
            const specialCards = ['+2', '+4', 'skip', 'reverse', '0+', '7+', 'C+2', 'C+4', 'Exodia_part'];
            const isSpecial = specialCards.includes(card.value);
            
            if (isSpecial) {
                cardDiv.innerHTML = `<span class="card-symbol">${getCardSymbol(card.value)}</span>`;
            } else if (card.value === 'wild') {
                cardDiv.innerHTML = `<span class="card-symbol">🌈</span>`;
            } else {
                cardDiv.innerHTML = `<span class="card-value">${card.value}</span>`;
            }
        }

        handContainer.appendChild(cardDiv);
    });
}

function updateUnoButtonDisplay(handLength) {
    const unoBtn = document.getElementById('uno-btn');
    const contraUnoBtn = document.getElementById('contra-uno-btn');
    
    if (unoBtn) {
        // Show UNO button only if player has exactly 1 card
        unoBtn.style.display = handLength === 1 ? 'block' : 'none';
    }
    
    if (contraUnoBtn) {
        // Always show Contra UNO button (for challenging opponents)
        contraUnoBtn.style.display = 'block';
    }
}

function getCardSymbol(value) {
    const symbols = {
        '+2': '➕2',
        '+4': '➕4',
        'skip': '⏭️',
        'reverse': '🔄',
        '0+': '0️⃣',
 

function getCardColor(colorName) {
    const colors = {
        'red': 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
        'blue': 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
        'yellow': 'linear-gradient(135deg, #f39c12 0%, #e67e22 100%)',
        'green': 'linear-gradient(135deg, #27ae60 0%, #229954 100%)',
        'wild': 'linear-gradient(45deg, #e74c3c 0%, #3498db 25%, #f39c12 50%, #27ae60 75%, #2c3e50 100%)'
    };
    return colors[colorName] || '#34495e';
}       '7+': '7️⃣',
        'C+2': '🎯➕',
        'C+4': '🎯➕4',
        'Exodia_part': '✨'
    };
    return symbols[value] || value;
}

// Placeholder functions for game actions (to be implemented with real game logic)
async function playCard(cardIndex, card) {
    console.log('Playing card at index:', cardIndex, card);
    
    try {
        const response = await fetch(`/api/lobbies/${encodeURIComponent(currentRoomName)}/game/play`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                playerId: currentUserId,
                cardIndex: cardIndex
            })
        });

        const result = await response.json();

        if (result.success) {
            console.log('Card played successfully');
            // Game will refresh automatically on next polling cycle
        } else {
            alert(`Erreur: ${result.message}`);
        }
    } catch (error) {
        console.error('Error playing card:', error);
        alert('Erreur lors de la lecture de la carte');
    }
}

async function drawCard() {
    console.log('Drawing a card');
    
    const drawBtn = document.getElementById('draw-btn');
    if (drawBtn) {
        drawBtn.disabled = true;
        drawBtn.textContent = '📥 Pioche...';
    }

    try {
        const response = await fetch(`/api/lobbies/${encodeURIComponent(currentRoomName)}/game/draw`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                playerId: currentUserId
            })
        });

        const result = await response.json();

        if (result.success) {
            console.log('Card drawn successfully');
            // Game will refresh automatically on next polling cycle
        } else {
            alert(`Erreur: ${result.message}`);
        }
    } catch (error) {
        console.error('Error drawing card:', error);
        alert('Erreur lors de la pioche');
    } finally {
        if (drawBtn) {
            drawBtn.disabled = false;
            drawBtn.textContent = '📥 Piocher';
        }
    }
}

async function sayUno() {
    console.log('UNO!');
    
    try {
        const response = await fetch(`/api/lobbies/${encodeURIComponent(currentRoomName)}/game/uno`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                playerId: currentUserId
            })
        });

        const result = await response.json();

        if (result.success) {
            console.log('UNO declared');
            const unoBtn = document.getElementById('uno-btn');
            if (unoBtn) {
                unoBtn.style.animation = 'pulse 0.5s';
            }
        } else {
            alert(`Erreur: ${result.message}`);
        }
    } catch (error) {
        console.error('Error declaring UNO:', error);
        alert('Erreur lors de la déclaration UNO');
    }
}

async function contraUno() {
    console.log('Contra UNO!');
    
    // For now, we'll need to implement player selection UI
    // For testing, target the opponent with the fewest cards
    if (!gameState || !gameState.players) {
        alert('État du jeu non disponible');
        return;
    }

    let targetPlayer = null;
    let minCards = Infinity;
    
    for (const player of gameState.players) {
        if (player.id !== currentUserId && player.handSize < minCards && player.handSize === 1) {
            targetPlayer = player;
            minCards = player.handSize;
        }
    }

    if (!targetPlayer) {
        alert('Aucun joueur à contrer');
        return;
    }

    try {
        const response = await fetch(`/api/lobbies/${encodeURIComponent(currentRoomName)}/game/contrauno`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                playerId: currentUserId,
                targetPlayerId: targetPlayer.id
            })
        });

        const result = await response.json();

        if (result.success) {
            console.log('Contra UNO applied');
            const contraUnoBtn = document.getElementById('contra-uno-btn');
            if (contraUnoBtn) {
                contraUnoBtn.style.animation = 'pulse 0.5s';
            }
        } else {
            alert(`Erreur: ${result.message}`);
        }
    } catch (error) {
        console.error('Error declaring Contra UNO:', error);
        alert('Erreur lors du Contre UNO');
    }
}

// Clean up on page unload
window.addEventListener('beforeunload', function() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
    }
});
