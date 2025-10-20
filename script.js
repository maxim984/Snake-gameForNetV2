const SUPABASE_URL = 'https://uxkbeldvmmayqflsqpzw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4a2JlbGR2bW1heXFmbHNxcHp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3MDk0OTcsImV4cCI6MjA3NjI4NTQ5N30.55B-bBS0yAD4G1srxbPx0CdwSCZgnS2gycAg_hLmwb0';

let canvas, ctx;
let snake = [];
let food = {};
let gridSize = 20;
let direction = 'right';
let lastDirection = 'right';
let nextDirection;
let gameLoop;
let isPaused = false;
let isAutoSave = true;
let isGameOver = false;
let isSaved = true;
let currentScore = 0;
let levelScore = 0;
let currentLevel = 1;
let snakeLength = 2;
let gameSpeed = 6;
let playerName = '';
let currentSkin = 'classic';

const skins = {
    classic: { head: '#4CAF50', tail: '#8BC34A', food: '#ff6b6b' },
    fire: { head: '#ff6b6b', tail: '#ffa726', food: '#4FC3F7' },
    ice: { head: '#4FC3F7', tail: '#fff', food: '#ff6b6b' },
    rainbow: { head: '#FF4081', tail: '#7C4DFF', food: '#4CAF50' }
};

function login() {
    const username = document.getElementById('username').value.trim();
    
    playerName = username;
    localStorage.setItem('currentPlayer', username);
    showGameScreen();
}

function logout() {
    localStorage.removeItem('currentPlayer');
    showLoginScreen();
}

function showLoginScreen() {
    document.getElementById('loginScreen').style.display = 'block';
    document.getElementById('gameScreen').style.display = 'none';
}

function showGameScreen() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('gameScreen').style.display = 'block';
    document.getElementById('current-player').textContent = playerName;
    initGame();
    loadScores();
}

function initGame() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    adjustCanvasSize();
    resetGame();
    document.addEventListener('keydown', handleKeyPress);
    window.addEventListener('resize', adjustCanvasSize);
}

function adjustCanvasSize() {
    const container = document.querySelector('.game-container');
    const maxWidth = container.clientWidth - 40;
    const aspectRatio = 600 / 400;
    const newWidth = Math.min(600, maxWidth);
    const newHeight = newWidth / aspectRatio;
    
    canvas.style.width = newWidth + 'px';
    canvas.style.height = newHeight + 'px';
}

function resetGame() {
    snake = [{x: 5, y: 10}, {x: 6, y: 10}];
    snakeLength = 2;
    createFood();
    currentScore = 0;
    levelScore = 0;
    currentLevel = 1;
    gameSpeed = 6;
    direction = 'right';
    isGameOver = false;
    isPaused = false;
    updatePauseButton();
    document.getElementById('gameOver').style.display = 'none';
    updateDisplay();
}

function startGame() {
    if (!playerName) { alert('Сначала авторизуйтесь!'); return; }
    if (gameLoop) clearInterval(gameLoop);
    resetGame();
    gameLoop = setInterval(updateGame, 1000/gameSpeed);
}

function togglePause() {
    if (isGameOver) return;
    isPaused = !isPaused;
    updatePauseButton();
    if (isPaused) clearInterval(gameLoop);
    else gameLoop = setInterval(updateGame, 1000/gameSpeed);
}

function toggleAutoSave() {
    isAutoSave = !isAutoSave;
    updateAutoSaveButton();
}

function updatePauseButton() {
    document.getElementById('pauseBtn').textContent = isPaused ? '▶️ Продолжить' : '⏸️ Пауза';
}

function updateAutoSaveButton() {
    document.getElementById('autoSaveBtn').textContent = isAutoSave ? '✅ Авто Сохранения' : '❌ Авто Сохранения';
}

function updateGame() {
    if (isPaused || isGameOver) return;
    moveSnake();
    if (!checkCollision()) gameOver();
    checkFood();
    drawGame();
}

function moveSnake() {
    const head = {...snake[0]};
    lastDirection = direction;
    switch(direction) {
        case 'up': head.y--; break;
        case 'down': head.y++; break;
        case 'left': head.x--; break;
        case 'right': head.x++; break;
    }
    snake.unshift(head);
    if (snake.length > snakeLength) snake.pop();
    if (nextDirection) {
        direction = nextDirection
        nextDirection = undefined
    }
}

function checkCollision() {
    return (snake[0].x >= 0 && snake[0].x < canvas.width / gridSize 
        && snake[0].y >= 0 && snake[0].y < canvas.height/gridSize 
        && !snake.slice(1).some(o => o.x == snake[0].x && o.y == snake[0].y)
    );
}

function checkFood() {
    const head = snake[0];
    if (head.x === food.x && head.y === food.y) {
        snakeLength++;
        currentScore += 10 * currentLevel;
        levelScore += 1
        const newLevel = Math.floor(levelScore / 10) + 1;
        if (newLevel > currentLevel) {
            currentLevel = newLevel;
            gameSpeed = 6+currentLevel;
            clearInterval(gameLoop);
            gameLoop = setInterval(updateGame, 1000/gameSpeed);
        }
        createFood();
        updateDisplay();
    }
}

function createFood() {
    food = {
        x: Math.floor(Math.random() * (canvas.width / gridSize)),
        y: Math.floor(Math.random() * (canvas.height / gridSize))
    };
    for (let segment of snake) {
        if (segment.x === food.x && segment.y === food.y) {
            createFood(); break;
        }
    }
}

function lerpColor(a, b, t) {
    a = a.slice(1);
    b = b.slice(1);
    if (a.length === 3) a = a.split('').map(c => c + c).join('');
    if (b.length === 3) b = b.split('').map(c => c + c).join('');

    const colorA = {
        r: parseInt(a.slice(0, 2), 16),
        g: parseInt(a.slice(2, 4), 16),
        b: parseInt(a.slice(4, 6), 16)
    };

    const colorB = {
        r: parseInt(b.slice(0, 2), 16),
        g: parseInt(b.slice(2, 4), 16),
        b: parseInt(b.slice(4, 6), 16)
    };

    const c = {
        r: Math.floor(colorA.r + (colorB.r - colorA.r) * t),
        g: Math.floor(colorA.g + (colorB.g - colorA.g) * t),
        b: Math.floor(colorA.b + (colorB.b - colorA.b) * t)
    };

    return `#${c.r.toString(16).padStart(2, '0')}${c.g.toString(16).padStart(2, '0')}${c.b.toString(16).padStart(2, '0')}`;
}


function drawGame() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const skin = skins[currentSkin];
    
    snake.forEach((segment, index) => {
        // console.log(lerpColor(skin.head, skin.tail, index / snakeLength));
        ctx.fillStyle = lerpColor(skin.head, skin.tail, index / snakeLength);
        ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize - 1, gridSize - 1);
    });
    
    ctx.fillStyle = skin.food;
    ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize - 1, gridSize - 1);
}

function gameOver() {
    isSaved = false;
    if (isAutoSave && currentScore > 0) saveScore();
    isGameOver = true;
    clearInterval(gameLoop);
    document.getElementById('final-score').textContent = currentScore;
    document.getElementById('final-level').textContent = currentLevel;
    document.getElementById('gameOver').style.display = 'block';
}

function handleKeyPress(e) {
    const actions = {
        ArrowUp: () => { if (isPaused || isGameOver) return; if (lastDirection !== 'down') direction = 'up'; else if (direction !== lastDirection) nextDirection = 'up'; },
        ArrowDown: () => { if (isPaused || isGameOver) return; if (lastDirection !== 'up') direction = 'down'; else if (direction !== lastDirection) nextDirection = 'down'; },
        ArrowLeft: () => { if (isPaused || isGameOver) return; if (lastDirection !== 'right') direction = 'left'; else if (direction !== lastDirection) nextDirection = 'left'; },
        ArrowRight: () => { if (isPaused || isGameOver) return; if (lastDirection !== 'left') direction = 'right'; else if (direction !== lastDirection) nextDirection = 'right'; },
        ' ': togglePause
    };
    if (!Object.keys(actions).includes(e.key)) return;
    e.preventDefault();
    actions[e.key]();
}

function changeDirection(newDirection) {
    if (isPaused || isGameOver) return;
    if ((newDirection === 'up' && direction !== 'down') ||
        (newDirection === 'down' && direction !== 'up') ||
        (newDirection === 'left' && direction !== 'right') ||
        (newDirection === 'right' && direction !== 'left')) {
        direction = newDirection;
    }
}

function updateDisplay() {
    document.getElementById('current-score').textContent = currentScore;
    document.getElementById('current-level').textContent = currentLevel;
    document.getElementById('snake-length').textContent = snakeLength;
}

// Система рекордов
const supabase = {
    async fetchScores() {
        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/scores?select=*&order=score.desc.nullslast`, {
                headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
            });
            if (!response.ok) throw new Error('Ошибка загрузки');
            return await response.json();
        } catch (error) {
            return getFromLocalStorage();
        }
    },
    
    async insertScore(name, score, level) {
        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/scores`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
                body: JSON.stringify({ player_name: name, score: score, level: level, created_at: new Date().toISOString() })
            });
            if (!response.ok) throw new Error('Ошибка сохранения');
            return await response.json();
        } catch (error) {
            saveToLocalStorage(name, score, level);
            return { success: true };
        }
    }
};

function getFromLocalStorage() {
    return JSON.parse(localStorage.getItem('allSnakeScores') || '[]');
}

function saveToLocalStorage(name, score, level) {
    const scores = JSON.parse(localStorage.getItem('allSnakeScores') || '[]');
    scores.push({ player_name: name, score: score, level: level, created_at: new Date().toISOString() });
    scores.sort((a, b) => b.score - a.score);
    const topScores = scores.slice(0, 50);
    localStorage.setItem('allSnakeScores', JSON.stringify(topScores));
}

async function saveScore() {
    if (isSaved) return;
    if (!playerName) { alert('Сначала авторизуйтесь!'); return; }
    if (currentScore > 0) {
        await supabase.insertScore(playerName, currentScore, currentLevel);
        await loadScores();
    } else { alert('Сыграйте хотя бы один раунд для сохранения!'); }
}

async function loadScores() {
    if (!playerName) return;
    
    try {
        const allScores = await supabase.fetchScores();
        updateLeaderboard(allScores);
        updatePersonalResults(allScores);
    } catch (error) {
        const fallbackData = getFromLocalStorage();
        updateLeaderboard(fallbackData);
        updatePersonalResults(fallbackData);
    }
}

function updateLeaderboard(allScores) {
    const leaderboardElement = document.getElementById('leaderboard');
    if (allScores.length === 0) {
        leaderboardElement.innerHTML = '<div class="score-item">Пока нет рекордов</div>';
        return;
    }
    const topScores = allScores.slice(0, 10);
    leaderboardElement.innerHTML = topScores.map((score, index) => {
        const isMyScore = score.player_name === playerName;
        return `<div class="score-item ${isMyScore ? 'my-score' : ''}">
            <div class="player">${index + 1}. ${score.player_name}</div>
            <div class="score">${score.score} очков</div>
            <div class="level">Уровень: ${score.level}</div>
            <div class="date">${new Date(score.created_at).toLocaleDateString('ru-RU')}</div>
        </div>`;
    }).join('');
}

function updatePersonalResults(allScores) {
    const personalResultsElement = document.getElementById('personal-results');
    const myScores = allScores.filter(score => score.player_name === playerName);
    if (myScores.length === 0) {
        personalResultsElement.innerHTML = '<div class="score-item">У вас пока нет сохраненных рекордов</div>';
        return;
    }
    personalResultsElement.innerHTML = myScores.map((score, index) => `
        <div class="score-item my-score ${index === 0 ? 'new-record' : ''}">
            <div class="score">${index + 1}. ${score.score} очков</div>
            <div class="level">Уровень: ${score.level}</div>
            <div class="date">${new Date(score.created_at).toLocaleDateString('ru-RU')}</div>
        </div>
    `).join('');
}

// Система скинов
function showSkinModal() {
    document.getElementById('skinModal').style.display = 'block';
}

function hideSkinModal() {
    document.getElementById('skinModal').style.display = 'none';
}

function selectSkin(skin) {
    currentSkin = skin;
    document.querySelectorAll('.skin-option').forEach(opt => opt.classList.remove('selected'));
    event.target.closest('.skin-option').classList.add('selected');
    if (!isPaused && !isGameOver) drawGame();
}

// Инициализация обработчиков событий
function initEventListeners() {
    document.getElementById('loginBtn').addEventListener('click', login);
    document.getElementById('logoutBtn').addEventListener('click', logout);
    document.getElementById('startBtn').addEventListener('click', startGame);
    document.getElementById('pauseBtn').addEventListener('click', togglePause);
    document.getElementById('saveBtn').addEventListener('click', saveScore);
    document.getElementById('autoSaveBtn').addEventListener('click', toggleAutoSave);
    document.getElementById('skinBtn').addEventListener('click', showSkinModal);
    document.getElementById('restartBtn').addEventListener('click', startGame);
    document.getElementById('refreshPersonalBtn').addEventListener('click', loadScores);
    document.getElementById('refreshLeaderboardBtn').addEventListener('click', loadScores);
    document.getElementById('closeSkinBtn').addEventListener('click', hideSkinModal);
    
    document.getElementById('upBtn').addEventListener('click', () => changeDirection('up'));
    document.getElementById('downBtn').addEventListener('click', () => changeDirection('down'));
    document.getElementById('leftBtn').addEventListener('click', () => changeDirection('left'));
    document.getElementById('rightBtn').addEventListener('click', () => changeDirection('right'));
    
    document.getElementById('classicSkin').addEventListener('click', () => selectSkin('classic'));
    document.getElementById('fireSkin').addEventListener('click', () => selectSkin('fire'));
    document.getElementById('iceSkin').addEventListener('click', () => selectSkin('ice'));
    document.getElementById('rainbowSkin').addEventListener('click', () => selectSkin('rainbow'));
    
    document.getElementById('username').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            login();
        }
    });
}

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('username').focus();
    initEventListeners();
    
    const currentPlayer = localStorage.getItem('currentPlayer');
    if (currentPlayer) {
        playerName = currentPlayer;
        showGameScreen();
    } else {
        showLoginScreen();
    }
});