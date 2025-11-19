
document.addEventListener('DOMContentLoaded', () => {
    const lobby = document.getElementById('lobby');
    const createGameBtn = document.getElementById('create-game');
    const gameIdDisplay = document.getElementById('game-id-display');
    const gameIdInput = document.getElementById('game-id');
    const joinIdInput = document.getElementById('join-id-input');
    const joinGameBtn = document.getElementById('join-game');
    const statusEl = document.getElementById('status');
    const gameContainer = document.getElementById('game-container');
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');

    let peer;
    let conn;
    let isHost = false;
    let lastTickTime = 0;
    let gameSpeed = 100; // Initial speed: 100ms per tick

    const GRID_SIZE = 20;
    const CANVAS_WIDTH = canvas.width;
    const CANVAS_HEIGHT = canvas.height;

    let gameState = {
        players: [],
        fruit: {},
        score: 0,
        gameOver: false,
        winner: null
    };

    function initializePeer() {
        createGameBtn.disabled = true;
        joinGameBtn.disabled = true;
        statusEl.textContent = 'Connecting to signaling server...';

        peer = new Peer();
        peer.on('open', (id) => {
            statusEl.textContent = 'Connected! Ready to create or join a game.';
            createGameBtn.disabled = false;
            joinGameBtn.disabled = false;
        });
        peer.on('connection', (newConn) => {
            if (conn) {
                newConn.close();
                return;
            }
            conn = newConn;
            statusEl.textContent = 'Friend connected!';
            conn.on('open', () => {
                startGame();
            });
            conn.on('data', handleClientInput);
            conn.on('close', handleDisconnect);
        });
        peer.on('error', (err) => {
            statusEl.textContent = `Error: ${err.message}`;
        });
    }

    createGameBtn.addEventListener('click', () => {
        isHost = true;
        createGameBtn.disabled = true;
        joinGameBtn.disabled = true;

        if (peer && peer.id) {
            gameIdInput.value = peer.id;
            gameIdDisplay.classList.remove('hidden');
            statusEl.textContent = 'Waiting for a friend to join...';
        } else {
            statusEl.textContent = 'Error: Peer ID not available. Please refresh.';
        }
    });

    joinGameBtn.addEventListener('click', () => {
        const hostId = joinIdInput.value.trim();
        if (!hostId) {
            statusEl.textContent = 'Please enter a valid ID.';
            return;
        }
        conn = peer.connect(hostId);
        statusEl.textContent = 'Connecting to host...';
        conn.on('open', () => {
            statusEl.textContent = 'Connected to host!';
            // The game will start for the client when it receives the first game state
        });
        conn.on('data', (data) => {
            // First message will start the game for the client
            if (gameContainer.classList.contains('hidden')) {
                startGame();
            }
            updateGameState(data);
        });
        conn.on('close', handleDisconnect);
    });

    function handleDisconnect() {
        statusEl.textContent = 'Peer disconnected. Game over.';
        gameState.gameOver = true;
    }

    function startGame() {
        lobby.classList.add('hidden');
        gameContainer.classList.remove('hidden');
        if (isHost) {
            initializeGameState();
        }
        document.addEventListener('keydown', handleKeydown);
        requestAnimationFrame(gameLoop);
    }

    function initializeGameState() {
        gameState = {
            players: [
                { id: peer.id, snake: [{ x: 5, y: 5 }], direction: 'right', color: 'lightgreen' },
                { id: conn.peer, snake: [{ x: 15, y: 15 }], direction: 'left', color: 'lightblue' }
            ],
            fruit: generateFruit(),
            score: { [peer.id]: 0, [conn.peer]: 0 },
            gameOver: false,
            winner: null
        };
    }

    function generateFruit() {
        return {
            x: Math.floor(Math.random() * (CANVAS_WIDTH / GRID_SIZE)),
            y: Math.floor(Math.random() * (CANVAS_HEIGHT / GRID_SIZE)),
            color: 'red'
        };
    }

    function handleKeydown(e) {
        const key = e.key.toLowerCase();
        let direction;
        if (['w', 'arrowup'].includes(key)) direction = 'up';
        if (['s', 'arrowdown'].includes(key)) direction = 'down';
        if (['a', 'arrowleft'].includes(key)) direction = 'left';
        if (['d', 'arrowright'].includes(key)) direction = 'right';

        if (direction) {
            if (isHost) {
                const hostPlayer = gameState.players[0];
                if ((direction === 'up' && hostPlayer.direction !== 'down') ||
                    (direction === 'down' && hostPlayer.direction !== 'up') ||
                    (direction === 'left' && hostPlayer.direction !== 'right') ||
                    (direction === 'right' && hostPlayer.direction !== 'left')) {
                    hostPlayer.direction = direction;
                }
            } else {
                conn.send({ type: 'input', direction });
            }
        }
    }

    function handleClientInput(data) {
        if (data.type === 'input') {
            const clientPlayer = gameState.players[1];
             if ((data.direction === 'up' && clientPlayer.direction !== 'down') ||
                 (data.direction === 'down' && clientPlayer.direction !== 'up') ||
                 (data.direction === 'left' && clientPlayer.direction !== 'right') ||
                 (data.direction === 'right' && clientPlayer.direction !== 'left')) {
                clientPlayer.direction = data.direction;
            }
        }
    }

    function gameLoop(timestamp) {
        if (gameState.gameOver) {
            draw(); // Draw final game over screen
            return;
        }

        requestAnimationFrame(gameLoop);

        if (isHost) {
            const elapsed = timestamp - lastTickTime;
            if (elapsed > gameSpeed) {
                lastTickTime = timestamp;

                updateSnakes();
                checkCollisions();
                checkFruit();

                if (conn && conn.open) {
                    conn.send(gameState);
                }
            }
        }

        draw();
    }

    function updateSnakes() {
        gameState.players.forEach(player => {
            const head = { ...player.snake[0] };
            if (player.direction === 'up') head.y--;
            if (player.direction === 'down') head.y++;
            if (player.direction === 'left') head.x--;
            if (player.direction === 'right') head.x++;
            player.snake.unshift(head);
        });
    }

    function checkCollisions() {
        if (!gameState.players || gameState.players.length < 2) return;
        const [player1, player2] = gameState.players;
        const head1 = player1.snake[0];
        const head2 = player2.snake[0];

        if (!head1 || !head2) {
             gameState.gameOver = true;
             return;
        }

        if (head1.x < 0 || head1.x >= CANVAS_WIDTH / GRID_SIZE || head1.y < 0 || head1.y >= CANVAS_HEIGHT / GRID_SIZE) {
            gameState.gameOver = true;
            gameState.winner = player2.id;
        }
        if (head2.x < 0 || head2.x >= CANVAS_WIDTH / GRID_SIZE || head2.y < 0 || head2.y >= CANVAS_HEIGHT / GRID_SIZE) {
            gameState.gameOver = true;
            gameState.winner = player1.id;
        }

        for (let i = 1; i < player1.snake.length; i++) {
            if (head1.x === player1.snake[i].x && head1.y === player1.snake[i].y) {
                 gameState.gameOver = true;
                 gameState.winner = player2.id;
            }
        }
         for (let i = 1; i < player2.snake.length; i++) {
            if (head2.x === player2.snake[i].x && head2.y === player2.snake[i].y) {
                 gameState.gameOver = true;
                 gameState.winner = player1.id;
            }
        }

        for (let i = 0; i < player2.snake.length; i++) {
             if (head1.x === player2.snake[i].x && head1.y === player2.snake[i].y) {
                 gameState.gameOver = true;
                 gameState.winner = player2.id;
             }
        }
        for (let i = 0; i < player1.snake.length; i++) {
             if (head2.x === player1.snake[i].x && head2.y === player1.snake[i].y) {
                 gameState.gameOver = true;
                 gameState.winner = player1.id;
             }
        }
    }

    function checkFruit() {
         gameState.players.forEach(player => {
            const head = player.snake[0];
            if (head.x === gameState.fruit.x && head.y === gameState.fruit.y) {
                gameState.score[player.id]++;
                gameState.fruit = generateFruit();
                // Increase speed by reducing the tick interval, with a minimum speed
                if (gameSpeed > 30) {
                    gameSpeed -= 5;
                }
            } else {
                player.snake.pop();
            }
        });
    }

    function updateGameState(newState) {
        gameState = newState;
    }

    function draw() {
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        if (!gameState.fruit.x) return; // Don't draw if state is not initialized

        ctx.fillStyle = gameState.fruit.color;
        ctx.fillRect(gameState.fruit.x * GRID_SIZE, gameState.fruit.y * GRID_SIZE, GRID_SIZE, GRID_SIZE);

        gameState.players.forEach(player => {
            ctx.fillStyle = player.color;
            player.snake.forEach(segment => {
                ctx.fillRect(segment.x * GRID_SIZE, segment.y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
            });
        });

        if (gameState.gameOver) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            ctx.fillStyle = 'white';
            ctx.font = '50px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Game Over', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 25);
            ctx.font = '30px Arial';
            let winnerText;
            if (gameState.winner === (peer ? peer.id : '')) {
                winnerText = 'You Win!';
            } else {
                winnerText = isHost ? 'Friend Wins!' : 'Host Wins!';
            }
            ctx.fillText(winnerText, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 25);
        }
    }

    initializePeer();
});
