//Senha fraca só para teste.
const senhaCorreta = "matrix88";
const senhaInserida = prompt("Digite a senha para acessar esta página:");

if (senhaInserida !== senhaCorreta) {
    window.location.href = "/"; // Redireciona se errar
}

// Elementos do DOM
const menu = document.getElementById('menu');
const startButton = document.getElementById('startButton');
const gameCanvas = document.getElementById('gameCanvas');
const gameOverScreen = document.getElementById('gameOver');
const finalScoreDisplay = document.getElementById('finalScore');
const highScoreDisplay = document.getElementById('highScore');
const restartButton = document.getElementById('restartButton');
const creditsButton = document.getElementById('creditsButton');
const creditsScreen = document.getElementById('creditsScreen');
const backButton = document.getElementById('backButton');
const backToMenuButton = document.getElementById('backToMenuButton');
const instructions = document.getElementById('instructions');
const pauseScreen = document.getElementById('pauseScreen');
const menuButton = document.getElementById('menuButton');
const settingsButton = document.getElementById('settingsButton');
const settingsScreen = document.getElementById('settingsScreen');
const resetScoresButton = document.getElementById('resetScoresButton');
const settingsBackButton = document.getElementById('settingsBackButton');
const resetConfirmation = document.getElementById('resetConfirmation');

// Elementos de áudio
const goodSound = document.getElementById('goodSound');
const badSound = document.getElementById('badSound');
const gameOverSound = document.getElementById('gameOverSound');

// Configurações do jogo
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score');
const timerDisplay = document.getElementById('timer');
const rootStyles = getComputedStyle(document.documentElement);

// Variáveis do jogo
const gameState = {
    timeLeft: 15,
    score: 0,
    highScore: localStorage.getItem('timeModeHighScore') || 0,
    gameRunning: false,
    isPaused: false,
    isNewHighScore: false
};
let survivalTime = 0;
let survivalHighScore = localStorage.getItem('SurvivalHighScore') || 0;
let gameInterval;
let animationFrame;
let currentMode = 'arcade';
let timerBlinkInterval;
let timerPulseInterval;
let greenNeonValue = rootStyles.getPropertyValue('--greenNeon').trim();
let whitePureValue = rootStyles.getPropertyValue('--whitePure').trim();
let pinkNeonValue = rootStyles.getPropertyValue('--pinkNeon').trim();
let redNeonValue = rootStyles.getPropertyValue('--redNeon').trim();
let yellowNeonValue = rootStyles.getPropertyValue('--yellowNeon').trim();


// Elementos dos modos de jogo
const gameModes = document.querySelectorAll('.game-mode');

// Configurar eventos dos modos de jogo
gameModes.forEach(mode => {
    mode.addEventListener('click', () => {
        gameModes.forEach(m => m.classList.remove('active'));
        mode.classList.add('active');
        currentMode = mode.dataset.mode;
        updateInstructions();
    });
});

//Ajute do volemu do áudio
[goodSound, badSound, gameOverSound].forEach(sound => {
    sound.volume = 0.2;
})

// Atualizar instruções baseadas no modo
function updateInstructions() {
    if (currentMode === 'arcade') {
        instructions.innerHTML = `
            <span class="mode-name">Modo arcade </span><span id="highScoreDisplay" class="mode-score">Score</span>
            <p>Colete anéis verdes em 60 segundos</p>
            <p>Evite os anéis rosa que reduzem sua pontuação</p>
            <p>Mova o mouse para controlar o anel branco</p>
        `;
    } else {
        instructions.innerHTML = `
            <span class="mode-name">Modo survival </span><span id="highScoreDisplay" class="mode-score">Score</span>
            <p>Sobreviva o máximo de tempo possível</p>
            <p>Cada anel verde aumenta seu tempo de sobrevivência</p>
            <p>Se tocar em um anel rosa, o jogo acaba!</p>
            <p>Mova o mouse para controlar o anel branco</p>
        `;
    }
}

// Evento do botão iniciar
startButton.addEventListener('click', () => {
    startGame();
});

// Evento do botão reiniciar
restartButton.addEventListener('click', () => {
    gameOverScreen.style.display = 'none';
    startGame();
});

// Evento do botão de créditos
creditsButton.addEventListener('click', () => {
    menu.style.display = 'none';
    creditsScreen.style.display = 'flex';
});

// Evento do botão voltar
backButton.addEventListener('click', () => {
    creditsScreen.style.display = 'none';
    menu.style.display = 'flex';
});

// Evento do botão voltar para menu
backToMenuButton.addEventListener('click', () => {
    gameOverScreen.style.display = 'none';
    menu.style.display = 'flex';
    updateHighScoreDisplay();
});

// Evento do botão de menu na pausa
menuButton.addEventListener('click', () => {
    endGame(false);
    pauseScreen.style.display = 'none';
    menu.style.display = 'flex';
});

// Evento do botão de configurações
settingsButton.addEventListener('click', () => {
    menu.style.display = 'none';
    settingsScreen.style.display = 'flex';
});

// Evento do botão voltar das configurações
settingsBackButton.addEventListener('click', () => {
    settingsScreen.style.display = 'none';
    menu.style.display = 'flex';
    resetConfirmation.style.display = 'none';
});

// Evento do botão resetar placares
resetScoresButton.addEventListener('click', () => {
    // Resetar os placares salvos
    localStorage.removeItem('timeModeHighScore');
    localStorage.removeItem('SurvivalHighScore');

    // Atualizar as variáveis locais
    gameState.highScore = 0;
    survivalHighScore = 0;

    // Mostrar confirmação
    resetConfirmation.style.display = 'block';

    // Esconder a confirmação após 3 segundos
    setTimeout(() => {
        resetConfirmation.style.display = 'none';
    }, 3000);

    // Atualizar o placar na tela
    updateHighScoreDisplay();
});

// Evento da tecla ESC para pausar
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && gameState.gameRunning) {
        togglePause();
    }
});

// Função para pausar/despausar o jogo
function togglePause() {
    if (gameState.isPaused) {
        // Despausar
        gameState.isPaused = false;
        pauseScreen.style.display = 'none';
        document.body.style.cursor = 'none';

        if (currentMode === 'arcade') {
            gameInterval = setInterval(updateTimer, 1000);
        } else {
            gameInterval = setInterval(updateSurvivalTimer, 1000);
        }

        draw();
    } else {
        // Pausar
        gameState.isPaused = true;
        pauseScreen.style.display = 'flex';
        document.body.style.cursor = 'default';

        clearInterval(gameInterval);
        cancelAnimationFrame(animationFrame);

        // Parar efeitos do timer se estiverem ativos
        if (timerBlinkInterval) clearInterval(timerBlinkInterval);
        if (timerPulseInterval) clearInterval(timerPulseInterval);
        timerDisplay.style.color = whitePureValue;
        timerDisplay.style.fontSize = '28px';
    }
}

// Função para formatar tempo no modo survival
function formatTime(seconds) {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    let timeString = '';
    if (hrs > 0) timeString += `${hrs.toString().padStart(2, '0')}:`;
    if (mins > 0 || hrs > 0) timeString += `${mins.toString().padStart(2, '0')}:`;
    timeString += `${secs.toString().padStart(2, '0')}`;

    return timeString;
}

// Função para mostrar tela de game over
function showGameOver() {
    gameOverSound.play();
    gameOverScreen.style.display = 'flex';

    if (currentMode === 'arcade') {
        finalScoreDisplay.textContent = `Pontuação Atual: ${gameState.score}`;

        if (gameState.score > gameState.highScore) {
            gameState.highScore = gameState.score;
            localStorage.setItem('timeModeHighScore', gameState.highScore);
            highScoreDisplay.textContent = `Nova Pontuação MÁXIMA! 🏆`;
        } else {
            highScoreDisplay.textContent = `Pontuação MÁXIMA: ${gameState.highScore}`;
        }
    } else {
        finalScoreDisplay.textContent = `Pontuação Atual: ${gameState.score}`;

        if (gameState.score > survivalHighScore) {
            survivalHighScore = gameState.score;
            localStorage.setItem('SurvivalHighScore', survivalHighScore);
            highScoreDisplay.textContent = `Nova Pontuação MÁXIMA! 🏆`;
        } else {
            highScoreDisplay.textContent = `Pontuação MÁXIMA: ${survivalHighScore}`;
        }
    }
}

// Função para iniciar o jogo
function startGame() {
    // Esconder o menu
    menu.style.display = 'none';

    // Mostrar o canvas
    gameCanvas.style.display = 'block';

    // Resetar o cursor
    document.body.style.cursor = 'none';

    // Resetar variáveis do jogo
    if (currentMode === 'arcade') {
        gameState.timeLeft = 15;
        gameState.score = 0;
        gameState.isNewHighScore = false;
        timerDisplay.textContent = `TIME: ${gameState.timeLeft}`;
        timerDisplay.style.color = whitePureValue;
    } else {
        survivalTime = 0;
        gameState.score = 0;
        gameState.isNewHighScore = false;
        timerDisplay.textContent = `TIME: ${formatTime(survivalTime)}`;
        timerDisplay.style.color = whitePureValue;
    }

    scoreDisplay.textContent = `SCORE: ${gameState.score}`;
    scoreDisplay.classList.remove('score-pulse');
    gameState.gameRunning = true;
    gameState.isPaused = false;

    // Limpar arrays de objetos do jogo
    ringsPink.length = 0;
    greenCollected = 0;

    // Reposicionar o anel verde
    ringGreen.respawn();

    // Iniciar o temporizador
    clearInterval(gameInterval);

    if (currentMode === 'arcade') {
        gameInterval = setInterval(updateTimer, 1000);
    } else {
        gameInterval = setInterval(updateSurvivalTimer, 1000);
    }

    // Iniciar o loop do jogo
    cancelAnimationFrame(animationFrame);
    draw();
}

// Ajustar o canvas para o tamanho da janela
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Ring White (jogador)
const ringWhite = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: 20,
    color: whitePureValue,
    glow: whitePureValue,
    lineWidth: 7
};

// Ring Green (alvo)
const ringGreen = {
    x: Math.random() * (canvas.width - 100) + 50,
    y: Math.random() * (canvas.height - 100) + 50,
    radius: 27.5,
    color: greenNeonValue,
    glow: greenNeonValue,
    lineWidth: 7,
    respawn: function () {
        this.x = Math.random() * (canvas.width - 100) + 50;
        this.y = Math.random() * (canvas.height - 100) + 50;
    }
};

// Rings Pink (obstáculos)
const ringsPink = [];

// Velocidade dos Rings Pink
const pinkRingSpeed = 5;

// Contador de coletas de Rings Green
let greenCollected = 0;

// Capturar movimento do mouse
window.addEventListener('mousemove', (e) => {
    if (gameState.gameRunning && !gameState.isPaused) {
        ringWhite.x = e.clientX;
        ringWhite.y = e.clientY;
    }
});

// Atualizar o temporizador no modo arcade
function updateTimer() {
    if (gameState.timeLeft > 0) {
        gameState.timeLeft--;

        // Atualizar cor do timer conforme o tempo diminui
        if (gameState.timeLeft <= 10) {
            if (gameState.timeLeft <= 5) {
                // Efeito de piscar nos últimos 5 segundos
                if (!timerBlinkInterval) {
                    timerBlinkInterval = setInterval(() => {
                        timerDisplay.style.color = timerDisplay.style.color === redNeonValue ? 'transparent' : redNeonValue;
                    }, 300); // Piscar mais rápido (300ms em vez de 500ms)
                }

                // Adicionar classe para animação de pulsação suave
                timerDisplay.classList.add('timer-pulse');
            } else {
                // Transição de amarelo para laranja entre 10 e 5 segundos
                const progress = (10 - gameState.timeLeft) / 5; // 0 a 1
                const r = 255;
                const g = Math.floor(255 - (255 - 153) * progress);
                const b = Math.floor(0 + (25 * progress));
                timerDisplay.style.color = `rgb(${r}, ${g}, ${b})`;

                // Remover animações se ativas
                timerDisplay.classList.remove('timer-pulse');

                if (timerBlinkInterval) {
                    clearInterval(timerBlinkInterval);
                    timerBlinkInterval = null;
                }
            }
        } else {
            timerDisplay.style.color = whitePureValue;
            timerDisplay.classList.remove('timer-pulse');
        }

        timerDisplay.textContent = `TIME: ${gameState.timeLeft}`;
    } else {
        endGame();
    }
}

// Atualizar o temporizador no modo survival
function updateSurvivalTimer() {
    survivalTime++;
    timerDisplay.textContent = `TIME: ${formatTime(survivalTime)}`;
}

// Finalizar o jogo
function endGame(showGameOverScreen = true) {
    gameState.gameRunning = false;

    // Limpar efeitos de animação do timer
    timerDisplay.classList.remove('timer-pulse');
    if (timerBlinkInterval) {
        clearInterval(timerBlinkInterval);
        timerBlinkInterval = null;
    }

    //  Limpar efeitos animação do score
    scoreDisplay.classList.remove('score-pulse');
    isNewHighScore = false;

    if (currentMode === 'arcade') {
        timerDisplay.textContent = "TIME: 0";
    }

    // Mostrar tela de game over se necessário
    if (showGameOverScreen) {
        gameOverSound.play();
        showGameOver();
    }

    // Limpar intervalos
    clearInterval(gameInterval);
    cancelAnimationFrame(animationFrame);

    // Mostrar o cursor novamente
    document.body.style.cursor = 'default';
}

// Função para verificar colisão entre rings
function checkCollision(ring1, ring2) {
    const dx = ring1.x - ring2.x;
    const dy = ring1.y - ring2.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < ring1.radius + ring2.radius;
}

// Criar novo Ring Pink (obstáculo)
function createPinkRing() {
    const ringPink = {
        radius: 20,
        color: pinkNeonValue,
        glow: pinkNeonValue,
        lineWidth: 7,
        isHorizontal: greenCollected % 2 === 0,
        direction: 1 // 1 = direita/baixo, -1 = esquerda/cima
    };

    if (ringPink.isHorizontal) {
        // Movimento horizontal (altura aleatória)
        ringPink.x = ringPink.radius; // Começar um pouco afastado da borda
        ringPink.y = Math.random() * (canvas.height - 100) + 50;
    } else {
        // Movimento vertical (largura aleatória)
        ringPink.x = Math.random() * (canvas.width - 100) + 50;
        ringPink.y = ringPink.radius; // Começar um pouco afastado da borda
    }

    ringsPink.push(ringPink);
}

// Função para desenhar um ring com efeito neon
function drawNeonRing(x, y, radius, color, glowColor, lineWidth) {
    // Efeito de sombra (glow)
    ctx.beginPath();
    ctx.shadowBlur = 10;
    ctx.shadowColor = glowColor;
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
    ctx.closePath();

    // Resetar sombra para não afetar outros elementos
    ctx.shadowBlur = 0;
}

// Função que verificar se é um novo recorde
function checkIsNewHighScore() {
    if (currentMode === 'arcade') {
        // Verificar se é um novo recorde
        if (gameState.score > gameState.highScore && gameState.highScore !== 0) {
            gameState.isNewHighScore = true;
        } else {
            gameState.isNewHighScore = false;
        }
    } else {
        // Verificar se é um novo recorde no modo Survival
        if (gameState.score > survivalHighScore && survivalHighScore !== 0) {
            gameState.isNewHighScore = true;
        } else {
            gameState.isNewHighScore = false;
        }
    }
}

function addScorePulse() {
    // Adicionar classe da animação de pulsação ao score
    if (gameState.isNewHighScore) {

        // Adicionar classe da animação de pulsação ao score
        scoreDisplay.classList.add('score-pulse');
    } else {
        scoreDisplay.classList.remove('score-pulse');
    }
}

// Função principal de desenho
function draw() {
    if (gameState.isPaused) return;

    // Limpar a tela
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Desenhar o Ring Green (alvo)
    drawNeonRing(ringGreen.x, ringGreen.y, ringGreen.radius, ringGreen.color, ringGreen.glow, ringGreen.lineWidth);

    // Desenhar Rings Pink (obstáculos)
    for (let i = 0; i < ringsPink.length; i++) {
        const ringPink = ringsPink[i];

        // Desenhar o Ring Pink
        drawNeonRing(ringPink.x, ringPink.y, ringPink.radius, ringPink.color, ringPink.glow, ringPink.lineWidth);

        // Mover os Rings Pink
        if (ringPink.isHorizontal) {
            ringPink.x += pinkRingSpeed * ringPink.direction;

            // Verificar se bateu na parede (horizontal)
            if ((ringPink.direction > 0 && ringPink.x >= canvas.width - ringPink.radius) ||
                (ringPink.direction < 0 && ringPink.x <= ringPink.radius)) {
                ringPink.direction *= -1;
            }
        } else {
            ringPink.y += pinkRingSpeed * ringPink.direction;

            // Verificar se bateu na parede (vertical)
            if ((ringPink.direction > 0 && ringPink.y >= canvas.height - ringPink.radius) ||
                (ringPink.direction < 0 && ringPink.y <= ringPink.radius)) {
                ringPink.direction *= -1;
            }
        }

        // Verificar colisão com o Ring White
        if (checkCollision(ringWhite, ringPink)) {
            if (currentMode === 'arcade') {
                // Perder um ponto e remover o Ring Pink
                gameState.score--;
                scoreDisplay.textContent = `SCORE: ${gameState.score}`;
                ringsPink.splice(i, 1);
                i--; // Ajustar o índice após a remoção
                checkIsNewHighScore();
                addScorePulse();
                badSound.currentTime = 0;
                badSound.play();
            } else {
                // No modo survival, perder um ponto acaba o jogo
                endGame();
                return;
            }
        }
    }

    // Desenhar o Ring White (jogador)
    drawNeonRing(ringWhite.x, ringWhite.y, ringWhite.radius, ringWhite.color, ringWhite.glow, ringWhite.lineWidth);

    // Verificar colisão com o Ring Green
    if (checkCollision(ringWhite, ringGreen)) {
        // Ganhar um ponto
        gameState.score++;
        scoreDisplay.textContent = `SCORE: ${gameState.score}`;

        // Funcão que verifica o novo recorde
        checkIsNewHighScore();

        // Adicionar animação de pulsação ao score
        addScorePulse();

        // Reposicionar o Ring Green
        ringGreen.respawn();

        // Criar novo Ring Pink
        createPinkRing();

        // Incrementar contador para alternar movimento
        greenCollected++;

        // Tocar som positivo
        goodSound.currentTime = 0;
        goodSound.play();
    }

    // Continuar o loop de jogo
    if (gameState.gameRunning && !gameState.isPaused) {
        animationFrame = requestAnimationFrame(draw);
    }
}

// Atualizar o placar da melhor pontuação com base no modo de jogo
function updateHighScoreDisplay() {
    const highScoreDisplay = document.getElementById('highScoreDisplay');
    if (currentMode === 'arcade') {
        highScoreDisplay.textContent = `🏆${gameState.highScore}`;
    } else {
        highScoreDisplay.textContent = `🏆${survivalHighScore}`;
    }
}

// Atualizar o placar ao carregar a página
document.addEventListener('DOMContentLoaded', function () {
    // Seu código aqui será executado quando o DOM estiver pronto
    updateHighScoreDisplay();
});

// Atualizar o placar ao mudar o modo de jogo
gameModes.forEach(mode => {
    mode.addEventListener('click', () => {
        updateHighScoreDisplay();
    });
});

//Verificar códido, acho que não precisa
// // Atualizar o placar ao iniciar o jogo
// startButton.addEventListener('click', () => {
//     updateHighScoreDisplay();
// });