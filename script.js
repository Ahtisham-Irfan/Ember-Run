const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const W = canvas.width;
const H = canvas.height;

const scoreEl = document.getElementById('score');
const bestEl = document.getElementById('best');
const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const startBtn = document.getElementById('startBtn');
const retryBtn = document.getElementById('retryBtn');
const finalScoreEl = document.getElementById('finalScore');
const finalBestEl = document.getElementById('finalBest');
const tapHint = document.getElementById('tapHint');

const isTouchDevice = 'ontouchstart' in window;
if (isTouchDevice) tapHint.classList.add('show');

const GROUND_Y = 340;

let state = 'start'; // start | playing | over
let score = 0;
let best = 0;
let speed = 6;
let elapsed = 0;
let shakeTime = 0;

// ---------- audio (tiny synth beeps, no assets needed) ----------
let audioCtx = null;
function beep(freq, duration, type, gain) {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.type = type || 'sine';
    osc.frequency.value = freq;
    g.gain.value = gain || 0.06;
    osc.connect(g);
    g.connect(audioCtx.destination);
    osc.start();
    g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
  } catch (e) { /* audio not available, ignore */ }
}

// ---------- player (ember fox) ----------
const player = {
  x: 130,
  y: GROUND_Y,
  vy: 0,
  w: 46,
  h: 40,
  jumping: false,
  jumpsLeft: 2,
  runPhase: 0,
  squash: 1
};

const GRAVITY = 0.62;
const JUMP_FORCE = -12.6;

function jump() {
  if (state === 'start') { startGame(); return; }
  if (state === 'over') return;
  if (player.jumpsLeft > 0) {
    player.vy = JUMP_FORCE;
    player.jumping = true;
    player.jumpsLeft--;
    player.squash = 1.25;
    spawnDust(player.x + player.w / 2, GROUND_Y + player.h, 6);
    beep(player.jumpsLeft === 1 ? 420 : 560, 0.12, 'triangle', 0.05);
  }
}

// ---------- input ----------
window.addEventListener('keydown', (e) => {
  if (e.code === 'Space' || e.code === 'ArrowUp') {
    e.preventDefault();
    jump();
  }
});
canvas.addEventListener('pointerdown', jump);
startBtn.addEventListener('click', startGame);
retryBtn.addEventListener('click', startGame);

// ---------- obstacles ----------
let obstacles = [];
let nextObstacleAt = 60;

function spawnObstacle() {
  const variants = [
    { w: 26, h: 40 },
    { w: 34, h: 30 },
    { w: 22, h: 56 }
  ];
  const v = variants[Math.floor(Math.random() * variants.length)];
  obstacles.push({ x: W + 40, y: GROUND_Y + player.h - v.h, w: v.w, h: v.h });
}

// ---------- collectibles ----------
let embers = [];
let nextEmberAt = 130;

function spawnEmber() {
  const y = GROUND_Y - 60 - Math.random() * 90;
  embers.push({ x: W + 40, y, r: 10, collected: false, bob: Math.random() * Math.PI * 2 });
}

// ---------- particles ----------
let particles = [];
function spawnDust(x, y, count) {
  for (let i = 0; i < count; i++) {
    particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 2.4,
      vy: -Math.random() * 1.6,
      life: 24 + Math.random() * 10,
      maxLife: 34,
      size: 2 + Math.random() * 2.5,
      color: '160,105,90'
    });
  }
}
function spawnBurst(x, y, color, count) {
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
    const spd = 2 + Math.random() * 3;
    particles.push({
      x, y,
      vx: Math.cos(angle) * spd,
      vy: Math.sin(angle) * spd,
      life: 30 + Math.random() * 14,
      maxLife: 44,
      size: 2 + Math.random() * 3,
      color
    });
  }
}

// ---------- parallax offsets ----------
let farOffset = 0;
let nearOffset = 0;
let groundOffset = 0;

// ---------- game control ----------
function startGame() {
  state = 'playing';
  score = 0;
  speed = 6;
  elapsed = 0;
  obstacles = [];
  embers = [];
  particles = [];
  nextObstacleAt = 70;
  nextEmberAt = 140;
  player.y = GROUND_Y;
  player.vy = 0;
  player.jumping = false;
  player.jumpsLeft = 2;
  startScreen.classList.add('hidden');
  gameOverScreen.classList.add('hidden');
}

function endGame() {
  state = 'over';
  best = Math.max(best, Math.floor(score));
  finalScoreEl.textContent = Math.floor(score);
  finalBestEl.textContent = best;
  bestEl.textContent = best;
  gameOverScreen.classList.remove('hidden');
  shakeTime = 14;
  beep(140, 0.35, 'sawtooth', 0.08);
}

function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

// ---------- update ----------
function update() {
  if (state !== 'playing') return;

  elapsed++;
  speed = 6 + Math.min(elapsed / 90, 8);
  score += speed * 0.045;
  scoreEl.textContent = Math.floor(score);

  farOffset = (farOffset + speed * 0.18) % 240;
  nearOffset = (nearOffset + speed * 0.4) % 200;
  groundOffset = (groundOffset + speed) % 40;

  // player physics
  player.vy += GRAVITY;
  player.y += player.vy;
  if (player.y >= GROUND_Y) {
    if (player.jumping) spawnDust(player.x + player.w / 2, GROUND_Y + player.h, 5);
    player.y = GROUND_Y;
    player.vy = 0;
    player.jumping = false;
    player.jumpsLeft = 2;
  }
  player.squash += (1 - player.squash) * 0.2;
  player.runPhase += speed * 0.05;

  // running dust
  if (!player.jumping && Math.floor(elapsed) % 6 === 0) {
    spawnDust(player.x + 8, GROUND_Y + player.h, 1);
  }

  // obstacles
  nextObstacleAt -= speed * 0.06;
  if (nextObstacleAt <= 0) {
    spawnObstacle();
    nextObstacleAt = 55 + Math.random() * 55 - Math.min(elapsed / 40, 25);
    nextObstacleAt = Math.max(nextObstacleAt, 32);
  }
  obstacles.forEach(o => o.x -= speed);
  obstacles = obstacles.filter(o => o.x + o.w > -20);

  const playerBox = { x: player.x + 8, y: player.y + 6, w: player.w - 16, h: player.h - 8 };
  for (const o of obstacles) {
    if (rectsOverlap(playerBox, o)) {
      spawnBurst(player.x + player.w / 2, player.y + player.h / 2, '255,92,108', 18);
      endGame();
      break;
    }
  }

  // embers
  nextEmberAt -= speed * 0.06;
  if (nextEmberAt <= 0) {
    spawnEmber();
    nextEmberAt = 90 + Math.random() * 70;
  }
  embers.forEach(e => { e.x -= speed; e.bob += 0.08; });
  embers = embers.filter(e => e.x > -20 && !e.collected);
  for (const e of embers) {
    const dx = (player.x + player.w / 2) - e.x;
    const dy = (player.y + player.h / 2) - (e.y + Math.sin(e.bob) * 6);
    if (Math.sqrt(dx * dx + dy * dy) < 30) {
      e.collected = true;
      score += 12;
      spawnBurst(e.x, e.y, '255,210,122', 10);
      beep(720, 0.1, 'sine', 0.05);
    }
  }

  // particles
  particles.forEach(p => {
    p.x += p.vx; p.y += p.vy; p.vy += 0.05; p.life--;
  });
  particles = particles.filter(p => p.life > 0);

  if (shakeTime > 0) shakeTime--;
}

// ---------- drawing ----------
function drawSky() {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#1a0f2e');
  g.addColorStop(0.45, '#3d1f4d');
  g.addColorStop(0.75, '#8a3f5c');
  g.addColorStop(1, '#e2703f');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // sun
  const sunX = W - 190, sunY = 130, sunR = 46;
  const sg = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunR * 2.2);
  sg.addColorStop(0, 'rgba(255,210,122,0.9)');
  sg.addColorStop(1, 'rgba(255,210,122,0)');
  ctx.fillStyle = sg;
  ctx.beginPath(); ctx.arc(sunX, sunY, sunR * 2.2, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ffe3a8';
  ctx.beginPath(); ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2); ctx.fill();

  // stars (top area only)
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  for (let i = 0; i < 26; i++) {
    const sx = (i * 137) % W;
    const sy = (i * 71) % 120;
    ctx.globalAlpha = 0.3 + ((i * 47) % 10) / 20;
    ctx.fillRect(sx, sy, 1.6, 1.6);
  }
  ctx.globalAlpha = 1;
}

function drawHillLayer(offset, baseY, amp, color, period) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-period, H);
  for (let x = -period; x <= W + period; x += 4) {
    const y = baseY - Math.sin((x + offset) / period * Math.PI * 2) * amp - amp;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(W + period, H);
  ctx.closePath();
  ctx.fill();
}

function drawGround() {
  ctx.fillStyle = '#160b28';
  ctx.fillRect(0, GROUND_Y + player.h, W, H - (GROUND_Y + player.h));
  ctx.strokeStyle = 'rgba(255,177,94,0.35)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y + player.h);
  ctx.lineTo(W, GROUND_Y + player.h);
  ctx.stroke();
  // dashed texture
  ctx.strokeStyle = 'rgba(255,177,94,0.18)';
  ctx.lineWidth = 3;
  ctx.setLineDash([16, 22]);
  ctx.lineDashOffset = -groundOffset;
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y + player.h + 14);
  ctx.lineTo(W, GROUND_Y + player.h + 14);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawFox() {
  const cx = player.x + player.w / 2;
  const cy = player.y + player.h / 2;
  const bob = player.jumping ? 0 : Math.sin(player.runPhase * 2) * 2;
  const legPhase = player.runPhase;

  ctx.save();
  ctx.translate(cx, cy + bob);
  ctx.scale(1 / player.squash, player.squash);

  // glow
  const glow = ctx.createRadialGradient(0, 4, 4, 0, 4, 34);
  glow.addColorStop(0, 'rgba(255,177,94,0.35)');
  glow.addColorStop(1, 'rgba(255,177,94,0)');
  ctx.fillStyle = glow;
  ctx.beginPath(); ctx.arc(0, 4, 34, 0, Math.PI * 2); ctx.fill();

  // tail
  ctx.fillStyle = '#ff7a4d';
  ctx.beginPath();
  ctx.ellipse(-20 - Math.sin(legPhase) * 3, 2, 12, 6, -0.4, 0, Math.PI * 2);
  ctx.fill();

  // legs (behind body)
  ctx.strokeStyle = '#c94f2e';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  if (!player.jumping) {
    for (let i = 0; i < 2; i++) {
      const ph = legPhase + i * Math.PI;
      const lx = -6 + i * 12;
      ctx.beginPath();
      ctx.moveTo(lx, 10);
      ctx.lineTo(lx + Math.sin(ph) * 8, 20 + Math.abs(Math.cos(ph)) * 4);
      ctx.stroke();
    }
  } else {
    ctx.beginPath(); ctx.moveTo(-6, 10); ctx.lineTo(-10, 20); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(6, 10); ctx.lineTo(11, 18); ctx.stroke();
  }

  // body
  ctx.fillStyle = '#ffb15e';
  ctx.beginPath();
  ctx.ellipse(0, 0, 20, 14, 0, 0, Math.PI * 2);
  ctx.fill();

  // chest patch
  ctx.fillStyle = '#fff1de';
  ctx.beginPath();
  ctx.ellipse(4, 6, 10, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  // head
  ctx.fillStyle = '#ffb15e';
  ctx.beginPath();
  ctx.arc(16, -6, 11, 0, Math.PI * 2);
  ctx.fill();

  // ears
  ctx.fillStyle = '#ff7a4d';
  ctx.beginPath();
  ctx.moveTo(10, -14); ctx.lineTo(14, -24); ctx.lineTo(18, -14); ctx.closePath(); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(20, -14); ctx.lineTo(25, -23); ctx.lineTo(27, -13); ctx.closePath(); ctx.fill();

  // snout
  ctx.fillStyle = '#fff1de';
  ctx.beginPath();
  ctx.ellipse(24, -3, 6, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2a1720';
  ctx.beginPath(); ctx.arc(28, -3, 1.6, 0, Math.PI * 2); ctx.fill();

  // eye (blink occasionally)
  const blink = Math.floor(elapsed / 90) % 40 === 0;
  ctx.fillStyle = '#2a1720';
  if (blink) {
    ctx.fillRect(15, -9, 5, 1.6);
  } else {
    ctx.beginPath(); ctx.arc(18, -9, 2, 0, Math.PI * 2); ctx.fill();
  }

  ctx.restore();
}

function drawObstacles() {
  for (const o of obstacles) {
    ctx.fillStyle = '#2b1240';
    ctx.strokeStyle = 'rgba(255,92,108,0.5)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(o.x, o.y + o.h);
    ctx.lineTo(o.x + o.w / 2, o.y);
    ctx.lineTo(o.x + o.w, o.y + o.h);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
}

function drawEmbers() {
  for (const e of embers) {
    const y = e.y + Math.sin(e.bob) * 6;
    const g = ctx.createRadialGradient(e.x, y, 0, e.x, y, 18);
    g.addColorStop(0, 'rgba(255,210,122,0.9)');
    g.addColorStop(1, 'rgba(255,210,122,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(e.x, y, 18, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffe3a8';
    ctx.beginPath(); ctx.arc(e.x, y, 6, 0, Math.PI * 2); ctx.fill();
  }
}

function drawParticles() {
  for (const p of particles) {
    ctx.globalAlpha = Math.max(p.life / p.maxLife, 0);
    ctx.fillStyle = `rgb(${p.color})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function render() {
  ctx.save();
  if (shakeTime > 0) {
    ctx.translate((Math.random() - 0.5) * shakeTime * 0.8, (Math.random() - 0.5) * shakeTime * 0.8);
  }

  drawSky();
  drawHillLayer(farOffset, 300, 22, '#4a2c5e', 260);
  drawHillLayer(nearOffset, 330, 16, '#341f45', 190);
  drawGround();
  drawEmbers();
  drawObstacles();
  drawFox();
  drawParticles();

  ctx.restore();
}

function loop() {
  update();
  render();
  requestAnimationFrame(loop);
}

bestEl.textContent = best;
loop();
