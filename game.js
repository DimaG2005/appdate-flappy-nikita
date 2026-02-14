const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// --- ФОН ---
const bgImage = new Image();
bgImage.src = "komar.jpg";

// --- МУЗЫКА ---
const music = new Audio("gufmusic.mp3");
music.loop = true;
music.volume = 0.5;
let musicStarted = false;
function startMusic() {
    if (!musicStarted) {
        music.play().catch(() => {});
        musicStarted = true;
    }
}

// --- ПТИЦЯ ---
let bird = {
    x: 100,
    y: canvas.height / 2,
    size: 40,
    velocity: 0
};

let gravity = 0.35;
let jumpPower = -9;
let pipes = [];
let score = 0;
let gameActive = true;

// --- АДАПТИВНЫЕ ПАРАМЕТРЫ ---
function updateGameParameters() {
    const scale = canvas.height / 800; // базовая высота = 800px
    gravity = 0.35 * scale;
    jumpPower = -9 * scale;
    pipeGap = 220 * scale;      // расстояние между трубами
    pipeSpacing = 1500 * scale; // интервал появления труб в мс
}

// --- СПАВН ТРУБ ---
let pipeGap = 220;
let pipeSpacing = 1500;
function spawnPipe() {
    const topHeight = Math.random() * (canvas.height - pipeGap - 100) + 50;
    pipes.push({
        x: canvas.width,
        top: topHeight,
        bottom: topHeight + pipeGap,
        passed: false
    });
}

// интервал появления труб адаптивный
let pipeInterval = setInterval(spawnPipe, pipeSpacing);

// --- КЕРУВАННЯ ---
function jump() {
    if (!gameActive) {
        restart();
        return;
    }
    bird.velocity = jumpPower;
    startMusic();
}

document.addEventListener("click", jump);
document.addEventListener("touchstart", jump);
document.addEventListener("keydown", e => {
    if (e.code === "Space") jump();
});

// --- UPDATE ---
function update() {
    if (!gameActive) return;

    bird.velocity += gravity;
    bird.y += bird.velocity;

    if (bird.y < 0 || bird.y + bird.size > canvas.height) {
        gameActive = false;
    }

    pipes.forEach(pipe => {
        pipe.x -= 4;

        if (
            bird.x < pipe.x + 70 &&
            bird.x + bird.size > pipe.x &&
            (bird.y < pipe.top || bird.y + bird.size > pipe.bottom)
        ) {
            gameActive = false;
        }

        if (!pipe.passed && bird.x > pipe.x + 70) {
            pipe.passed = true;
            score++;
        }
    });

    pipes = pipes.filter(p => p.x > -80);
}

// --- ФОН С COVER ---
function drawBackgroundCover() {
    if (!bgImage.complete || bgImage.naturalWidth === 0) {
        ctx.fillStyle = "#87CEEB";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        return;
    }

    const scale = Math.max(
        canvas.width / bgImage.width,
        canvas.height / bgImage.height
    );

    const x = (canvas.width - bgImage.width * scale) / 2;
    const y = (canvas.height - bgImage.height * scale) / 2;

    ctx.drawImage(bgImage, x, y, bgImage.width * scale, bgImage.height * scale);
}

// --- DRAW ---
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawBackgroundCover();

    // Птица
    ctx.fillStyle = "yellow";
    ctx.fillRect(bird.x, bird.y, bird.size, bird.size);

    // Трубы
    ctx.fillStyle = "green";
    pipes.forEach(pipe => {
        ctx.fillRect(pipe.x, 0, 70, pipe.top);
        ctx.fillRect(pipe.x, pipe.bottom, 70, canvas.height - pipe.bottom);
    });

    // Счёт
    ctx.fillStyle = "white";
    ctx.font = "40px Arial";
    ctx.fillText("Score: " + score, 40, 70);

    // Game Over
    if (!gameActive) {
        ctx.fillStyle = "red";
        ctx.font = "60px Arial";
        ctx.fillText("GAME OVER", canvas.width / 2 - 180, canvas.height / 2);
        ctx.font = "30px Arial";
        ctx.fillText("Нажми экран чтобы начать заново", canvas.width / 2 - 190, canvas.height / 2 + 50);
    }
}

// --- RESTART ---
function restart() {
    bird.y = canvas.height / 2;
    bird.velocity = 0;
    pipes = [];
    score = 0;
    gameActive = true;
}

// --- LOOP ---
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// --- RESIZE ---
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    updateGameParameters();

    clearInterval(pipeInterval); // пересоздаем интервал для труб с новым масштабом
    pipeInterval = setInterval(spawnPipe, pipeSpacing);
}
window.addEventListener("resize", resizeCanvas);

// --- ЗАПУСК ---
bgImage.onload = () => {
    updateGameParameters();
    gameLoop();
};


// --- РЕКОРД ИГРОКА ---
function sendScoreToBot(score) {
    if (window.Telegram.WebApp) {
        Telegram.WebApp.sendData(JSON.stringify({ score: score }));
    }
}
if (!gameActive) {
    drawGameOverScreen();
    sendScoreToBot(score);
}

bgImage.onerror = () => {
    console.error("Failed to load background image.");
};

