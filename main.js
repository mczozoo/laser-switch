const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreValue = document.getElementById('scoreValue');
const bestValue = document.getElementById('bestValue');
const message = document.getElementById('message');

const COLORS = {
  RED: { name: 'RED', fill: '#f54b64' },
  BLUE: { name: 'BLUE', fill: '#4ba3f5' },
};

const START_SPEED = 320; // px/s
const SPEED_CAP = 720;
const SPEED_RAMP_INTERVAL = 5000;
const SPEED_RAMP_FACTOR = 1.02;
const PLAYER_RADIUS = 24;
const PLAYER_X_RATIO = 0.28;
const GATE_WIDTH = 48;
const GATE_HEIGHT = 28;
const TOGGLE_DEBOUNCE = 80; // ms
const MIN_GATE_INTERVAL = 700; // ms

const stats = {
  deaths: 0,
  retries: 0,
};

let bestScore = Number(localStorage.getItem('laser-switch-best') || 0);
let state = 'idle';
let lastToggle = 0;
let lastTime = 0;
let speed = START_SPEED;
let gateTimer = 0;
let rampTimer = 0;
let sessionStart = 0;
let currentScore = 0;
let currentRunGates = 0;
let gates = [];

const player = {
  x: canvas.width * PLAYER_X_RATIO,
  y: canvas.height / 2,
  radius: PLAYER_RADIUS,
  color: COLORS.RED,
};

function resizeCanvas() {
  const { width, height } = canvas.getBoundingClientRect();
  canvas.width = width;
  canvas.height = height;
  player.x = canvas.width * PLAYER_X_RATIO;
  player.y = canvas.height / 2;
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

updateBestDisplay();
drawScene();

canvas.addEventListener('pointerdown', handleTap);
canvas.addEventListener('pointerup', (event) => event.preventDefault());
canvas.addEventListener('pointercancel', (event) => event.preventDefault());

function handleTap(event) {
  event.preventDefault();
  if (state === 'idle' || state === 'gameover') {
    startRun();
    return;
  }

  const now = performance.now();
  if (now - lastToggle < TOGGLE_DEBOUNCE) {
    return;
  }

  togglePlayerColor();
  lastToggle = now;
}

function startRun() {
  const wasGameover = state === 'gameover';
  if (wasGameover) {
    stats.retries += 1;
  }

  state = 'playing';
  message.classList.add('hidden');
  speed = START_SPEED;
  gateTimer = 0;
  rampTimer = 0;
  sessionStart = performance.now();
  currentScore = 0;
  currentRunGates = 0;
  scoreValue.textContent = '0';
  gates = [];
  lastTime = performance.now();
  lastToggle = 0;
  player.color = COLORS.RED;
  requestAnimationFrame(loop);
}

function endRun() {
  state = 'gameover';
  stats.deaths += 1;
  message.textContent = 'Tap to Retry';
  message.classList.remove('hidden');
  const duration = (performance.now() - sessionStart) / 1000;
  console.groupCollapsed('Laser Switch session summary');
  console.log('Duration (s):', duration.toFixed(2));
  console.log('Gates cleared:', currentRunGates);
  console.log('Deaths:', stats.deaths);
  console.log('Retries:', stats.retries);
  console.groupEnd();
}

function togglePlayerColor() {
  player.color = player.color === COLORS.RED ? COLORS.BLUE : COLORS.RED;
}

function loop(now) {
  if (state !== 'playing') {
    return;
  }

  const delta = (now - lastTime) / 1000;
  lastTime = now;

  update(delta);
  drawScene();
  requestAnimationFrame(loop);
}

function update(delta) {
  if (delta > 0.1) {
    return;
  }

  updateSpeed(delta);
  handleSpawning(delta);
  updateGates(delta);
}

function updateSpeed(delta) {
  rampTimer += delta * 1000;
  if (rampTimer >= SPEED_RAMP_INTERVAL) {
    rampTimer -= SPEED_RAMP_INTERVAL;
    speed = Math.min(speed * SPEED_RAMP_FACTOR, SPEED_CAP);
  }
}

function handleSpawning(delta) {
  gateTimer += delta * 1000;
  if (gateTimer < MIN_GATE_INTERVAL) {
    return;
  }

  gateTimer = 0;
  spawnGate();
}

function spawnGate() {
  const color = Math.random() > 0.5 ? COLORS.RED : COLORS.BLUE;
  const gate = {
    x: canvas.width + GATE_WIDTH,
    y: canvas.height / 2 - GATE_HEIGHT / 2,
    width: GATE_WIDTH,
    height: GATE_HEIGHT,
    color,
    resolved: false,
  };
  gates.push(gate);
}

function updateGates(delta) {
  const move = speed * delta;
  for (const gate of gates) {
    gate.x -= move;
    if (!gate.resolved && isColliding(gate)) {
      if (gate.color !== player.color) {
        endRun();
        return;
      }
      resolveGate(gate);
    }
  }

  gates = gates.filter((gate) => gate.x + gate.width > -20);
}

function isColliding(gate) {
  const playerLeft = player.x - player.radius;
  const playerRight = player.x + player.radius;
  const gateLeft = gate.x;
  const gateRight = gate.x + gate.width;
  return gateRight >= playerLeft && gateLeft <= playerRight;
}

function resolveGate(gate) {
  gate.resolved = true;
  currentScore += 1;
  currentRunGates += 1;
  scoreValue.textContent = currentScore.toString();
  if (currentScore > bestScore) {
    bestScore = currentScore;
    localStorage.setItem('laser-switch-best', bestScore.toString());
    updateBestDisplay();
  }
}

function updateBestDisplay() {
  bestValue.textContent = bestScore.toString();
}

function drawScene() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground();
  drawGates();
  drawPlayer();
}

function drawBackground() {
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, '#10142a');
  gradient.addColorStop(1, '#05060f');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawGates() {
  for (const gate of gates) {
    ctx.fillStyle = gate.color.fill;
    ctx.globalAlpha = 0.85;
    ctx.fillRect(gate.x, gate.y, gate.width, gate.height);
    ctx.globalAlpha = 1;
  }
}

function drawPlayer() {
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
  ctx.fillStyle = '#0b0d1d';
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = player.color.fill;
  ctx.stroke();
}

// Accessibility keyboard support for testing on desktop
window.addEventListener('keydown', (event) => {
  if (event.code === 'Space' || event.code === 'Enter') {
    handleTap(event);
  }
});
