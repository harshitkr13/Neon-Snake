/**
 * =====================================================
 * NEON SNAKE — Premium Edition
 * script.js — Complete Game Logic
 * =====================================================
 */

'use strict';

/* ─────────────────────────────────────────────────────────
   1. CONSTANTS & CONFIG
   ───────────────────────────────────────────────────────── */
const CELL = 20;         // cell size in pixels
const COLS = 25;         // grid columns
const ROWS = 25;         // grid rows

const DIFFICULTY_PRESETS = {
  easy:   { baseSpeed: 180, speedDecrement: 12, scoreMultiplier: 1 },
  medium: { baseSpeed: 140, speedDecrement: 15, scoreMultiplier: 1.5 },
  hard:   { baseSpeed: 100, speedDecrement: 20, scoreMultiplier: 2 },
};

const POWERUP_TYPES = {
  star:   { emoji: '⭐', label: 'Double Score', color: '#ffd700', duration: 10000 },
  bolt:   { emoji: '⚡', label: 'Speed Boost',  color: '#00c6ff', duration: 8000  },
  shield: { emoji: '🛡', label: 'Shield',       color: '#b967ff', duration: 0     }, // one-time use
};

const POINTS_PER_FOOD  = 10;
const SCORE_PER_LEVEL  = 50;         // score gap per level
const POWERUP_INTERVAL = 8000;       // ms between power-up spawns
const POWERUP_LIFETIME = 7000;       // ms before power-up disappears

/* ─────────────────────────────────────────────────────────
   2. STATE
   ───────────────────────────────────────────────────────── */
let snake, dir, nextDir, food;
let score, highScore, level;
let gameState;         // 'idle' | 'running' | 'paused' | 'dead'
let gameLoop;          // setInterval handle
let currentSpeed;

// Power-up tracking
let activePowerup = null;           // { type, x, y, spawnTime, expireTimer }
let activePowerupEffects = {};      // { star: true/false, bolt: true/false, shield: true/false }
let powerupTimers  = {};            // { star: timeoutHandle, bolt: timeoutHandle }
let powerupSpawnTimer = null;
let powerupEffectTimers = {};       // for countdown display

// Particles
let particles = [];

// Settings
let settings = {
  sound: true,
  grid: false,
  difficulty: 'easy',
  theme: 'green',
};

// AudioContext
let audioCtx = null;

/* ─────────────────────────────────────────────────────────
   3. DOM REFERENCES
   ───────────────────────────────────────────────────────── */
const canvas         = document.getElementById('gameCanvas');
const ctx            = canvas.getContext('2d');
const notifOverlay   = document.getElementById('notificationsOverlay');
const gameCanvasWrap = document.getElementById('gameCanvasWrap');

// Stat displays
const scoreDisplay      = document.getElementById('scoreDisplay');
const highScoreDisplay  = document.getElementById('highScoreDisplay');
const levelDisplay      = document.getElementById('levelDisplay');
const difficultyDisplay = document.getElementById('difficultyDisplay');
const powerupList       = document.getElementById('powerupList');

// Buttons
const startBtn          = document.getElementById('startBtn');
const pauseBtn          = document.getElementById('pauseBtn');
const restartBtn        = document.getElementById('restartBtn');
const pauseLabel        = document.getElementById('pauseLabel');
const settingsBtn       = document.getElementById('settingsBtn');

// Overlays
const welcomeOverlay    = document.getElementById('welcomeOverlay');
const gameOverOverlay   = document.getElementById('gameOverOverlay');
const pauseOverlay      = document.getElementById('pauseOverlay');
const settingsOverlay   = document.getElementById('settingsOverlay');

// Welcome overlay buttons
const welcomeStartBtn   = document.getElementById('welcomeStartBtn');
const welcomeSettingsBtn= document.getElementById('welcomeSettingsBtn');

// Game-over overlay elements
const goScore           = document.getElementById('goScore');
const goHighScore       = document.getElementById('goHighScore');
const goLevel           = document.getElementById('goLevel');
const newRecordBadge    = document.getElementById('newRecordBadge');
const playAgainBtn      = document.getElementById('playAgainBtn');
const goMenuBtn         = document.getElementById('goMenuBtn');

// Pause overlay buttons
const resumeBtn         = document.getElementById('resumeBtn');
const pauseRestartBtn   = document.getElementById('pauseRestartBtn');

// Settings elements
const closeSettingsBtn  = document.getElementById('closeSettingsBtn');
const saveSettingsBtn   = document.getElementById('saveSettingsBtn');
const soundToggle       = document.getElementById('soundToggle');
const gridToggle        = document.getElementById('gridToggle');
const difficultyGroup   = document.getElementById('difficultyGroup');
const themeGroup        = document.getElementById('themeGroup');

/* ─────────────────────────────────────────────────────────
   4. AUDIO ENGINE (Web Audio API only)
   ───────────────────────────────────────────────────────── */
function getAudioCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  // Resume if suspended (browser autoplay policy)
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

/**
 * Play a synthesized tone.
 * @param {string} type - oscillator type: 'sine','square','sawtooth','triangle'
 * @param {number} freq - frequency in Hz
 * @param {number} duration - seconds
 * @param {number} gain - volume (0–1)
 * @param {number} [detune=0] - cents
 */
function playTone(type, freq, duration, gain = 0.35, detune = 0) {
  if (!settings.sound) return;
  try {
    const ac  = getAudioCtx();
    const osc = ac.createOscillator();
    const g   = ac.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ac.currentTime);
    if (detune) osc.detune.setValueAtTime(detune, ac.currentTime);

    g.gain.setValueAtTime(gain, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + duration);

    osc.connect(g);
    g.connect(ac.destination);
    osc.start(ac.currentTime);
    osc.stop(ac.currentTime + duration);
  } catch (e) { /* Audio can fail silently */ }
}

const SFX = {
  eat() {
    playTone('sine', 440, 0.1, 0.3);
    setTimeout(() => playTone('sine', 660, 0.08, 0.25), 60);
  },
  gameOver() {
    playTone('sawtooth', 200, 0.2, 0.4);
    setTimeout(() => playTone('sawtooth', 150, 0.3, 0.4), 120);
    setTimeout(() => playTone('sawtooth', 100, 0.5, 0.35), 280);
  },
  click() {
    playTone('triangle', 600, 0.07, 0.2);
  },
  powerup() {
    playTone('sine', 523, 0.08, 0.3);
    setTimeout(() => playTone('sine', 659, 0.08, 0.3), 80);
    setTimeout(() => playTone('sine', 784, 0.12, 0.3), 160);
  },
  levelUp() {
    playTone('sine', 660, 0.1, 0.35);
    setTimeout(() => playTone('sine', 880, 0.1, 0.35), 100);
    setTimeout(() => playTone('sine', 1100, 0.18, 0.35), 200);
  },
};

/* ─────────────────────────────────────────────────────────
   5. SETTINGS MANAGEMENT
   ───────────────────────────────────────────────────────── */
function loadSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem('neonSnakeSettings') || '{}');
    settings = { ...settings, ...saved };
  } catch { /* ignore */ }
  applySettings();
}

function saveSettings() {
  localStorage.setItem('neonSnakeSettings', JSON.stringify(settings));
}

function applySettings() {
  // Theme
  document.body.className = '';
  if (settings.theme !== 'green') document.body.classList.add('theme-' + settings.theme);

  // Difficulty display
  const preset = DIFFICULTY_PRESETS[settings.difficulty];
  difficultyDisplay.textContent = capitalize(settings.difficulty);

  // Sync settings UI
  soundToggle.checked = settings.sound;
  gridToggle.checked  = settings.grid;

  setActiveOption(difficultyGroup, settings.difficulty);
  setActiveOption(themeGroup, settings.theme);
}

function setActiveOption(group, value) {
  group.querySelectorAll('.option-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.value === value);
  });
}

/* ─────────────────────────────────────────────────────────
   6. CANVAS SETUP
   ───────────────────────────────────────────────────────── */
function setupCanvas() {
  canvas.width  = COLS * CELL;
  canvas.height = ROWS * CELL;
  // Make canvas-wrap match canvas size
  gameCanvasWrap.style.width  = canvas.width  + 'px';
  gameCanvasWrap.style.height = canvas.height + 'px';
}

/* ─────────────────────────────────────────────────────────
   7. GAME INITIALIZATION
   ───────────────────────────────────────────────────────── */
function initGame() {
  // Build initial snake (3 segments, horizontal center)
  const startX = Math.floor(COLS / 2);
  const startY = Math.floor(ROWS / 2);
  snake = [
    { x: startX,     y: startY },
    { x: startX - 1, y: startY },
    { x: startX - 2, y: startY },
  ];

  dir     = { x: 1, y: 0 };
  nextDir = { x: 1, y: 0 };
  score   = 0;
  level   = 1;
  particles = [];

  // Cancel all power-up timers
  clearAllPowerupTimers();
  activePowerup = null;
  activePowerupEffects = {};

  // Spawn food
  food = spawnFood();

  // Update speed
  updateSpeed();
  updateUI();

  // Schedule power-up spawning
  schedulePowerupSpawn();
}

function updateSpeed() {
  const preset = DIFFICULTY_PRESETS[settings.difficulty];
  const decrement = (level - 1) * preset.speedDecrement;
  currentSpeed = Math.max(60, preset.baseSpeed - decrement);

  // If bolt (speed boost) active, halve the interval
  if (activePowerupEffects.bolt) currentSpeed = Math.max(50, Math.floor(currentSpeed * 0.55));
}

/* ─────────────────────────────────────────────────────────
   8. GAME STATE MACHINE
   ───────────────────────────────────────────────────────── */
function startGame() {
  SFX.click();
  initGame();
  gameState = 'running';
  hideAllOverlays();
  startBtn.disabled   = true;
  pauseBtn.disabled   = false;
  restartBtn.disabled = false;

  clearInterval(gameLoop);
  gameLoop = setInterval(gameTick, currentSpeed);
  draw();
}

function pauseGame() {
  if (gameState !== 'running' && gameState !== 'paused') return;
  SFX.click();
  if (gameState === 'running') {
    gameState = 'paused';
    clearInterval(gameLoop);
    clearTimeout(powerupSpawnTimer);
    pauseLabel.textContent = 'Resume';
    showOverlay(pauseOverlay);
  } else {
    resumeGame();
  }
}

function resumeGame() {
  if (gameState !== 'paused') return;
  SFX.click();
  gameState = 'running';
  hideAllOverlays();
  pauseLabel.textContent = 'Pause';
  gameLoop = setInterval(gameTick, currentSpeed);
  schedulePowerupSpawn();
}

function restartGame() {
  SFX.click();
  clearInterval(gameLoop);
  clearTimeout(powerupSpawnTimer);
  gameState = 'idle';
  startGame();
}

function endGame() {
  gameState = 'dead';
  clearInterval(gameLoop);
  clearAllPowerupTimers();
  clearTimeout(powerupSpawnTimer);

  SFX.gameOver();

  // Save high score
  const prevHigh = highScore;
  highScore = Math.max(score, highScore);
  localStorage.setItem('neonSnakeHighScore', highScore);

  // Show game over overlay
  goScore.textContent    = score;
  goHighScore.textContent = highScore;
  goLevel.textContent    = level;
  newRecordBadge.classList.toggle('hidden', score <= prevHigh || score === 0);

  showOverlay(gameOverOverlay);

  // Update high score display
  highScoreDisplay.textContent = highScore;

  // Clean up canvas effects
  gameCanvasWrap.classList.remove('shield-active', 'double-active');

  // Draw final frame
  draw();
}

/* ─────────────────────────────────────────────────────────
   9. CORE GAME TICK
   ───────────────────────────────────────────────────────── */
function gameTick() {
  if (gameState !== 'running') return;

  // Apply buffered direction
  dir = { ...nextDir };

  // Calculate new head position
  const head = {
    x: snake[0].x + dir.x,
    y: snake[0].y + dir.y,
  };

  // --- Collision Detection ---
  // Wall collision
  if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) {
    if (activePowerupEffects.shield) {
      consumeShield();
      return; // Survive!
    }
    endGame();
    return;
  }

  // Self collision (skip tail tip — it will move away unless we just grew)
  for (let i = 0; i < snake.length - 1; i++) {
    if (snake[i].x === head.x && snake[i].y === head.y) {
      if (activePowerupEffects.shield) {
        consumeShield();
        return;
      }
      endGame();
      return;
    }
  }

  // Move snake: prepend new head
  snake.unshift(head);

  // --- Check food collision ---
  if (head.x === food.x && head.y === food.y) {
    eatFood(head);
  } else {
    snake.pop(); // Remove tail (no growth)
  }

  // --- Check power-up collision ---
  if (activePowerup && head.x === activePowerup.x && head.y === activePowerup.y) {
    collectPowerup();
  }

  // --- Check power-up expiry ---
  if (activePowerup) {
    const age = Date.now() - activePowerup.spawnTime;
    if (age >= POWERUP_LIFETIME) {
      activePowerup = null; // Power-up disappeared
    }
  }

  draw();
}

/* ─────────────────────────────────────────────────────────
   10. FOOD
   ───────────────────────────────────────────────────────── */
function spawnFood() {
  let pos;
  // Keep trying until position is free of snake and power-up
  do {
    pos = { x: randInt(0, COLS - 1), y: randInt(0, ROWS - 1) };
  } while (
    isCellOccupied(pos.x, pos.y) ||
    (activePowerup && activePowerup.x === pos.x && activePowerup.y === pos.y)
  );
  return pos;
}

function eatFood(head) {
  const preset = DIFFICULTY_PRESETS[settings.difficulty];
  const pts    = POINTS_PER_FOOD * preset.scoreMultiplier * (activePowerupEffects.star ? 2 : 1);
  score += pts;

  SFX.eat();
  spawnParticleBurst(head.x, head.y, '#ff4757');
  showFloatNotif(`+${pts}`, head.x, head.y, '#ff4757');
  animateScore();

  // Level up check
  const newLevel = Math.floor(score / SCORE_PER_LEVEL) + 1;
  if (newLevel > level) {
    level = newLevel;
    SFX.levelUp();
    showFloatNotif(`Level ${level}!`, Math.floor(COLS/2), Math.floor(ROWS/2), '#ffd700');
    // Restart loop with new speed
    clearInterval(gameLoop);
    updateSpeed();
    gameLoop = setInterval(gameTick, currentSpeed);
  }

  updateUI();
  food = spawnFood(); // Spawn new food
}

/* ─────────────────────────────────────────────────────────
   11. POWER-UPS
   ───────────────────────────────────────────────────────── */
function schedulePowerupSpawn() {
  clearTimeout(powerupSpawnTimer);
  if (gameState !== 'running') return;
  powerupSpawnTimer = setTimeout(() => {
    if (gameState === 'running' && !activePowerup) {
      spawnPowerup();
    }
    schedulePowerupSpawn(); // Schedule next
  }, POWERUP_INTERVAL + randInt(-2000, 2000));
}

function spawnPowerup() {
  const types = Object.keys(POWERUP_TYPES);
  const type  = types[randInt(0, types.length - 1)];
  let pos;
  do {
    pos = { x: randInt(0, COLS - 1), y: randInt(0, ROWS - 1) };
  } while (
    isCellOccupied(pos.x, pos.y) ||
    (food.x === pos.x && food.y === pos.y)
  );

  activePowerup = { type, x: pos.x, y: pos.y, spawnTime: Date.now() };
}

function collectPowerup() {
  if (!activePowerup) return;
  const { type } = activePowerup;
  const info = POWERUP_TYPES[type];

  SFX.powerup();
  spawnParticleBurst(activePowerup.x, activePowerup.y, info.color);
  showFloatNotif(`${info.emoji} ${info.label}!`, activePowerup.x, activePowerup.y, info.color);
  activePowerup = null;

  // Apply effect
  activePowerupEffects[type] = true;

  if (type === 'star') {
    clearTimeout(powerupTimers.star);
    powerupTimers.star = setTimeout(() => {
      activePowerupEffects.star = false;
      updatePowerupUI();
      gameCanvasWrap.classList.remove('double-active');
    }, info.duration);
    gameCanvasWrap.classList.add('double-active');
  }

  if (type === 'bolt') {
    clearTimeout(powerupTimers.bolt);
    updateSpeed(); // Will use bolt speed
    clearInterval(gameLoop);
    gameLoop = setInterval(gameTick, currentSpeed);
    powerupTimers.bolt = setTimeout(() => {
      activePowerupEffects.bolt = false;
      updatePowerupUI();
      // Restore normal speed
      updateSpeed();
      clearInterval(gameLoop);
      gameLoop = setInterval(gameTick, currentSpeed);
    }, info.duration);
  }

  if (type === 'shield') {
    gameCanvasWrap.classList.add('shield-active');
  }

  updatePowerupUI();
}

function consumeShield() {
  activePowerupEffects.shield = false;
  gameCanvasWrap.classList.remove('shield-active');
  showFloatNotif('🛡 Shield Blocked!', snake[0].x, snake[0].y, '#b967ff');
  spawnParticleBurst(snake[0].x, snake[0].y, '#b967ff');
  updatePowerupUI();
  SFX.powerup();
}

function clearAllPowerupTimers() {
  clearTimeout(powerupTimers.star);
  clearTimeout(powerupTimers.bolt);
  activePowerupEffects = {};
  activePowerup = null;
  gameCanvasWrap.classList.remove('shield-active', 'double-active');
}

function updatePowerupUI() {
  powerupList.innerHTML = '';
  const active = Object.entries(activePowerupEffects).filter(([, v]) => v);
  if (active.length === 0) {
    powerupList.innerHTML = '<span class="no-powerup">None</span>';
    return;
  }
  active.forEach(([type]) => {
    const info = POWERUP_TYPES[type];
    const badge = document.createElement('div');
    badge.className = 'pu-badge';
    badge.innerHTML = `<span>${info.emoji}</span><span>${info.label}</span>`;
    powerupList.appendChild(badge);
  });
}

/* ─────────────────────────────────────────────────────────
   12. RENDERING
   ───────────────────────────────────────────────────────── */
function draw() {
  // Clear
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Background
  ctx.fillStyle = 'rgba(5, 10, 20, 0.95)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Grid
  if (settings.grid) drawGrid();

  // Power-up (if any)
  if (activePowerup) drawPowerup();

  // Food
  drawFood();

  // Snake body
  drawSnake();

  // Particles
  drawParticles();
}

function drawGrid() {
  ctx.strokeStyle = 'rgba(255,255,255,0.04)';
  ctx.lineWidth = 0.5;
  for (let x = 0; x <= COLS; x++) {
    ctx.beginPath();
    ctx.moveTo(x * CELL, 0);
    ctx.lineTo(x * CELL, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y <= ROWS; y++) {
    ctx.beginPath();
    ctx.moveTo(0, y * CELL);
    ctx.lineTo(canvas.width, y * CELL);
    ctx.stroke();
  }
}

function drawFood() {
  const { x, y } = food;
  const cx = x * CELL + CELL / 2;
  const cy = y * CELL + CELL / 2;
  const r  = CELL / 2 - 2;
  const t  = Date.now() / 400;
  const pulseFactor = 0.9 + Math.sin(t) * 0.1;

  // Glow
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 2.5 * pulseFactor);
  grad.addColorStop(0, 'rgba(255, 71, 87, 0.5)');
  grad.addColorStop(1, 'rgba(255, 71, 87, 0)');
  ctx.beginPath();
  ctx.arc(cx, cy, r * 2.5 * pulseFactor, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();

  // Core
  ctx.beginPath();
  ctx.arc(cx, cy, r * pulseFactor, 0, Math.PI * 2);
  const foodGrad = ctx.createRadialGradient(cx - 2, cy - 2, 0, cx, cy, r * pulseFactor);
  foodGrad.addColorStop(0, '#ff6b7a');
  foodGrad.addColorStop(1, '#c0392b');
  ctx.fillStyle = foodGrad;
  ctx.fill();

  // Shine
  ctx.beginPath();
  ctx.arc(cx - r * 0.3, cy - r * 0.3, r * 0.25, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.fill();
}

function drawPowerup() {
  const { type, x, y, spawnTime } = activePowerup;
  const info = POWERUP_TYPES[type];
  const cx = x * CELL + CELL / 2;
  const cy = y * CELL + CELL / 2;
  const r  = CELL / 2 - 1;
  const age = Date.now() - spawnTime;
  const remaining = 1 - age / POWERUP_LIFETIME;

  // Fade out when expiring
  const alpha = remaining < 0.25 ? remaining / 0.25 : 1;
  ctx.globalAlpha = alpha;

  // Rotating outer ring
  const t = Date.now() / 500;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(t);

  // Dashed outer ring
  ctx.beginPath();
  ctx.arc(0, 0, r + 4, 0, Math.PI * 2);
  ctx.strokeStyle = info.color;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 4]);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  // Glow halo
  const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 2);
  glow.addColorStop(0, info.color + '44');
  glow.addColorStop(1, 'transparent');
  ctx.beginPath();
  ctx.arc(cx, cy, r * 2, 0, Math.PI * 2);
  ctx.fillStyle = glow;
  ctx.fill();

  // Background pill
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(10, 15, 30, 0.9)';
  ctx.fill();

  // Emoji
  ctx.font = `${CELL * 0.7}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(info.emoji, cx, cy + 1);

  // Expiry arc (shrinking)
  ctx.beginPath();
  ctx.arc(cx, cy, r + 1, -Math.PI / 2, -Math.PI / 2 + remaining * Math.PI * 2);
  ctx.strokeStyle = info.color;
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.globalAlpha = 1;
}

function drawSnake() {
  const len = snake.length;

  // Draw body segments (tail → head)
  for (let i = len - 1; i >= 0; i--) {
    const seg = snake[i];
    const isHead = i === 0;
    const x = seg.x * CELL;
    const y = seg.y * CELL;
    const r = isHead ? 7 : 5;
    const progress = 1 - i / len; // 0 at tail → 1 at head

    if (isHead) {
      drawSnakeHead(seg);
    } else {
      // Body gradient by position
      const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#00ff88';
      const headRGB = hexToRgb(accentColor) || { r: 0, g: 255, b: 136 };
      const tailAlpha = 0.3 + progress * 0.7;
      const bodyR = Math.round(headRGB.r * progress);
      const bodyG = Math.round(headRGB.g * progress);
      const bodyB = Math.round(headRGB.b * progress);

      ctx.beginPath();
      roundRect(ctx, x + 2, y + 2, CELL - 4, CELL - 4, r);
      const segGrad = ctx.createLinearGradient(x, y, x + CELL, y + CELL);
      segGrad.addColorStop(0, `rgba(${bodyR},${bodyG},${bodyB},${tailAlpha})`);
      segGrad.addColorStop(1, `rgba(${Math.min(255,bodyR+30)},${Math.min(255,bodyG+30)},${Math.min(255,bodyB+30)},${tailAlpha * 0.8})`);
      ctx.fillStyle = segGrad;
      ctx.fill();

      // Inner glow for body
      if (progress > 0.5) {
        ctx.beginPath();
        roundRect(ctx, x + 4, y + 4, CELL - 8, CELL - 8, r - 2);
        ctx.fillStyle = `rgba(${headRGB.r},${headRGB.g},${headRGB.b},${(progress - 0.5) * 0.25})`;
        ctx.fill();
      }
    }
  }
}

function drawSnakeHead(seg) {
  const x  = seg.x * CELL;
  const y  = seg.y * CELL;
  const cx = x + CELL / 2;
  const cy = y + CELL / 2;
  const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#00ff88';
  const rgb = hexToRgb(accentColor) || { r: 0, g: 255, b: 136 };

  // Head glow
  const headGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, CELL);
  headGlow.addColorStop(0, `rgba(${rgb.r},${rgb.g},${rgb.b},0.3)`);
  headGlow.addColorStop(1, 'transparent');
  ctx.beginPath();
  ctx.arc(cx, cy, CELL, 0, Math.PI * 2);
  ctx.fillStyle = headGlow;
  ctx.fill();

  // Head body
  ctx.beginPath();
  roundRect(ctx, x + 1, y + 1, CELL - 2, CELL - 2, 8);
  const hGrad = ctx.createLinearGradient(x, y, x + CELL, y + CELL);
  hGrad.addColorStop(0, accentColor);
  hGrad.addColorStop(1, darkenColor(accentColor, 0.6));
  ctx.fillStyle = hGrad;
  ctx.fill();

  // Shine on head
  ctx.beginPath();
  roundRect(ctx, x + 3, y + 2, CELL * 0.5, CELL * 0.3, 4);
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.fill();

  // Draw eyes based on direction
  drawSnakeEyes(x, y, dir);
}

function drawSnakeEyes(x, y, d) {
  // Eye positions relative to direction
  let eye1, eye2;
  const ec = CELL;

  if (d.x === 1) { // Moving right
    eye1 = { x: x + ec * 0.75, y: y + ec * 0.25 };
    eye2 = { x: x + ec * 0.75, y: y + ec * 0.75 };
  } else if (d.x === -1) { // Moving left
    eye1 = { x: x + ec * 0.25, y: y + ec * 0.25 };
    eye2 = { x: x + ec * 0.25, y: y + ec * 0.75 };
  } else if (d.y === -1) { // Moving up
    eye1 = { x: x + ec * 0.25, y: y + ec * 0.25 };
    eye2 = { x: x + ec * 0.75, y: y + ec * 0.25 };
  } else { // Moving down
    eye1 = { x: x + ec * 0.25, y: y + ec * 0.75 };
    eye2 = { x: x + ec * 0.75, y: y + ec * 0.75 };
  }

  const eyeR = 2.8;
  const pupilR = 1.4;

  [eye1, eye2].forEach(e => {
    // Sclera
    ctx.beginPath();
    ctx.arc(e.x, e.y, eyeR, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    // Pupil
    ctx.beginPath();
    ctx.arc(e.x + d.x * 0.8, e.y + d.y * 0.8, pupilR, 0, Math.PI * 2);
    ctx.fillStyle = '#111';
    ctx.fill();
    // Eye shine
    ctx.beginPath();
    ctx.arc(e.x - 0.5, e.y - 0.5, 0.8, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fill();
  });
}

/* ─────────────────────────────────────────────────────────
   13. PARTICLES
   ───────────────────────────────────────────────────────── */
function spawnParticleBurst(cellX, cellY, color) {
  const cx = cellX * CELL + CELL / 2;
  const cy = cellY * CELL + CELL / 2;
  const count = 12;

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
    const speed = 2 + Math.random() * 3;
    particles.push({
      x: cx, y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      color,
      alpha: 1,
      size: 2 + Math.random() * 3,
      decay: 0.04 + Math.random() * 0.03,
    });
  }
}

function drawParticles() {
  particles = particles.filter(p => p.alpha > 0.01);
  particles.forEach(p => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fillStyle = p.color + Math.round(p.alpha * 255).toString(16).padStart(2, '0');
    ctx.fill();
    p.x     += p.vx;
    p.y     += p.vy;
    p.vx    *= 0.92;
    p.vy    *= 0.92;
    p.alpha -= p.decay;
    p.size  *= 0.97;
  });
}

/* ─────────────────────────────────────────────────────────
   14. FLOATING NOTIFICATIONS
   ───────────────────────────────────────────────────────── */
function showFloatNotif(text, cellX, cellY, color = '#00ff88') {
  const el = document.createElement('div');
  el.className = 'float-notif';
  el.textContent = text;
  el.style.color = color;
  el.style.textShadow = `0 0 12px ${color}aa`;

  // Position relative to overlay
  const pctX = (cellX / COLS) * 100;
  const pctY = (cellY / ROWS) * 100;
  el.style.left = `${pctX}%`;
  el.style.top  = `${pctY}%`;
  el.style.transform = 'translate(-50%, -50%)';

  notifOverlay.appendChild(el);
  el.addEventListener('animationend', () => el.remove());
}

/* ─────────────────────────────────────────────────────────
   15. UI UPDATES
   ───────────────────────────────────────────────────────── */
function updateUI() {
  scoreDisplay.textContent     = score;
  highScoreDisplay.textContent = Math.max(score, highScore);
  levelDisplay.textContent     = level;
}

function animateScore() {
  scoreDisplay.classList.remove('pop');
  void scoreDisplay.offsetWidth; // Force reflow
  scoreDisplay.classList.add('pop');
}

/* ─────────────────────────────────────────────────────────
   16. OVERLAY HELPERS
   ───────────────────────────────────────────────────────── */
function showOverlay(el) {
  [welcomeOverlay, gameOverOverlay, pauseOverlay, settingsOverlay].forEach(o => {
    o.classList.add('hidden');
  });
  if (el) el.classList.remove('hidden');
}

function hideAllOverlays() {
  [welcomeOverlay, gameOverOverlay, pauseOverlay, settingsOverlay].forEach(o => {
    o.classList.add('hidden');
  });
}

/* ─────────────────────────────────────────────────────────
   17. INPUT HANDLING — KEYBOARD
   ───────────────────────────────────────────────────────── */
const KEY_MAP = {
  ArrowUp:    { x: 0, y: -1 }, w: { x: 0, y: -1 }, W: { x: 0, y: -1 },
  ArrowDown:  { x: 0, y:  1 }, s: { x: 0, y:  1 }, S: { x: 0, y:  1 },
  ArrowLeft:  { x: -1, y: 0 }, a: { x: -1, y: 0 }, A: { x: -1, y: 0 },
  ArrowRight: { x: 1,  y: 0 }, d: { x: 1,  y: 0 }, D: { x: 1,  y: 0 },
};

document.addEventListener('keydown', e => {
  const newDir = KEY_MAP[e.key];

  if (newDir && gameState === 'running') {
    e.preventDefault();
    // Prevent 180° reversal
    if (newDir.x !== -dir.x || newDir.y !== -dir.y) {
      nextDir = newDir;
    }
    return;
  }

  // Start/Pause shortcuts
  if ((e.key === ' ' || e.key === 'Enter') && gameState === 'idle') {
    startGame();
    return;
  }

  if (e.key === 'p' || e.key === 'P') {
    if (gameState === 'running' || gameState === 'paused') pauseGame();
    return;
  }

  if (e.key === 'r' || e.key === 'R') {
    if (gameState === 'running' || gameState === 'paused' || gameState === 'dead') restartGame();
    return;
  }

  // Prevent page scrolling on arrows
  if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) {
    e.preventDefault();
  }
});

/* ─────────────────────────────────────────────────────────
   18. INPUT HANDLING — TOUCH SWIPE
   ───────────────────────────────────────────────────────── */
let touchStartX = 0, touchStartY = 0;

canvas.addEventListener('touchstart', e => {
  touchStartX = e.changedTouches[0].clientX;
  touchStartY = e.changedTouches[0].clientY;
  e.preventDefault();
}, { passive: false });

canvas.addEventListener('touchend', e => {
  const dx = e.changedTouches[0].clientX - touchStartX;
  const dy = e.changedTouches[0].clientY - touchStartY;
  const absDx = Math.abs(dx), absDy = Math.abs(dy);

  if (Math.max(absDx, absDy) < 15) return; // Too small

  let swipeDir;
  if (absDx > absDy) {
    swipeDir = dx > 0 ? { x: 1, y: 0 } : { x: -1, y: 0 };
  } else {
    swipeDir = dy > 0 ? { x: 0, y: 1 } : { x: 0, y: -1 };
  }

  if (gameState === 'idle') { startGame(); return; }
  if (gameState === 'paused') { resumeGame(); return; }

  if (gameState === 'running') {
    // Prevent 180° reversal
    if (swipeDir.x !== -dir.x || swipeDir.y !== -dir.y) {
      nextDir = swipeDir;
    }
  }
  e.preventDefault();
}, { passive: false });

// Prevent page scroll during gameplay
document.addEventListener('touchmove', e => {
  if (gameState === 'running') e.preventDefault();
}, { passive: false });

/* ─────────────────────────────────────────────────────────
   19. BUTTON BINDINGS
   ───────────────────────────────────────────────────────── */
startBtn.addEventListener('click', startGame);

pauseBtn.addEventListener('click', () => {
  if (gameState === 'running') pauseGame();
  else if (gameState === 'paused') resumeGame();
});

restartBtn.addEventListener('click', restartGame);

welcomeStartBtn.addEventListener('click', startGame);
welcomeSettingsBtn.addEventListener('click', () => {
  SFX.click();
  showOverlay(settingsOverlay);
});

playAgainBtn.addEventListener('click', restartGame);
goMenuBtn.addEventListener('click', () => {
  SFX.click();
  gameState = 'idle';
  clearInterval(gameLoop);
  showOverlay(welcomeOverlay);
  startBtn.disabled   = false;
  pauseBtn.disabled   = true;
  restartBtn.disabled = true;
});

resumeBtn.addEventListener('click', resumeGame);
pauseRestartBtn.addEventListener('click', restartGame);

settingsBtn.addEventListener('click', () => {
  SFX.click();
  showOverlay(settingsOverlay);
});

closeSettingsBtn.addEventListener('click', () => {
  SFX.click();
  // Return to previous state
  if (gameState === 'idle') showOverlay(welcomeOverlay);
  else hideAllOverlays();
});

saveSettingsBtn.addEventListener('click', () => {
  SFX.click();
  // Read values from UI
  settings.sound      = soundToggle.checked;
  settings.grid       = gridToggle.checked;
  settings.difficulty = difficultyGroup.querySelector('.active')?.dataset.value || 'easy';
  settings.theme      = themeGroup.querySelector('.active')?.dataset.value || 'green';

  saveSettings();
  applySettings();

  if (gameState === 'idle') showOverlay(welcomeOverlay);
  else hideAllOverlays();
});

// Difficulty option group
difficultyGroup.addEventListener('click', e => {
  const btn = e.target.closest('.option-btn');
  if (!btn) return;
  setActiveOption(difficultyGroup, btn.dataset.value);
});

// Theme option group
themeGroup.addEventListener('click', e => {
  const btn = e.target.closest('.option-btn');
  if (!btn) return;
  setActiveOption(themeGroup, btn.dataset.value);
});

/* ─────────────────────────────────────────────────────────
   20. BACKGROUND PARTICLES (CSS-animated DOM particles)
   ───────────────────────────────────────────────────────── */
function createBgParticles() {
  const container = document.getElementById('bgParticles');
  const count = 28;
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const size = 2 + Math.random() * 4;
    p.style.cssText = [
      `width: ${size}px`,
      `height: ${size}px`,
      `left: ${Math.random() * 100}%`,
      `--dur: ${10 + Math.random() * 15}s`,
      `--delay: ${-Math.random() * 15}s`,
      `--dx: ${(Math.random() - 0.5) * 120}px`,
      `--op: ${0.06 + Math.random() * 0.12}`,
    ].join(';');
    container.appendChild(p);
  }
}

/* ─────────────────────────────────────────────────────────
   21. ANIMATION LOOP (for canvas drawing between ticks)
   ───────────────────────────────────────────────────────── */
let rafHandle = null;

function animationLoop() {
  // Keep drawing for particle animations between game ticks
  if (particles.length > 0 || (gameState === 'running')) {
    draw();
  }
  rafHandle = requestAnimationFrame(animationLoop);
}

/* ─────────────────────────────────────────────────────────
   22. UTILITY FUNCTIONS
   ───────────────────────────────────────────────────────── */
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function isCellOccupied(x, y) {
  return snake.some(seg => seg.x === x && seg.y === y);
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Draw a rounded rectangle path (polyfill for older browsers).
 */
function roundRect(context, x, y, w, h, r) {
  if (typeof context.roundRect === 'function') {
    context.roundRect(x, y, w, h, r);
  } else {
    const clampR = Math.min(r, w / 2, h / 2);
    context.beginPath();
    context.moveTo(x + clampR, y);
    context.lineTo(x + w - clampR, y);
    context.arcTo(x + w, y, x + w, y + clampR, clampR);
    context.lineTo(x + w, y + h - clampR);
    context.arcTo(x + w, y + h, x + w - clampR, y + h, clampR);
    context.lineTo(x + clampR, y + h);
    context.arcTo(x, y + h, x, y + h - clampR, clampR);
    context.lineTo(x, y + clampR);
    context.arcTo(x, y, x + clampR, y, clampR);
    context.closePath();
  }
}

/**
 * Convert hex color to RGB object.
 */
function hexToRgb(hex) {
  const clean = hex.replace(/\s/g, '').replace('#', '');
  if (clean.length !== 6) return null;
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  };
}

/**
 * Darken a hex color by a factor (0–1).
 */
function darkenColor(hex, factor) {
  const rgb = hexToRgb(hex.replace(/\s/g, ''));
  if (!rgb) return hex;
  return `rgb(${Math.round(rgb.r * factor)},${Math.round(rgb.g * factor)},${Math.round(rgb.b * factor)})`;
}

/* ─────────────────────────────────────────────────────────
   23. LOAD HIGH SCORE
   ───────────────────────────────────────────────────────── */
function loadHighScore() {
  try {
    highScore = parseInt(localStorage.getItem('neonSnakeHighScore') || '0', 10) || 0;
  } catch { highScore = 0; }
  highScoreDisplay.textContent = highScore;
}

/* ─────────────────────────────────────────────────────────
   24. INITIALIZE APPLICATION
   ───────────────────────────────────────────────────────── */
function init() {
  loadSettings();
  loadHighScore();
  setupCanvas();
  createBgParticles();

  // Set initial game state
  gameState = 'idle';
  score = 0; level = 1;
  snake = []; food = { x: 12, y: 12 };

  // Show welcome overlay
  showOverlay(welcomeOverlay);

  // Start the RAF drawing loop
  animationLoop();

  // Draw idle board
  ctx.fillStyle = 'rgba(5,10,20,0.95)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (settings.grid) drawGrid();
}

// Boot
init();
