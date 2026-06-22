const $ = (id) => document.getElementById(id);
const keys = {};

window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  keys[key] = true;
  if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(key)) {
    event.preventDefault();
  }
});

window.addEventListener("keyup", (event) => {
  keys[event.key.toLowerCase()] = false;
});

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
}

function showRoute() {
  const route = (location.hash || "#home").replace("#", "");
  document.querySelectorAll(".screen").forEach((screen) => {
    screen.classList.toggle("active", screen.id === route);
  });
}

window.addEventListener("hashchange", showRoute);
showRoute();

function drawIslandScene() {
  const canvas = $("home-art");
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, "#82d5df");
  sky.addColorStop(0.58, "#f5d98e");
  sky.addColorStop(1, "#1d9bb5");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = "#f0b637";
  ctx.beginPath();
  ctx.arc(735, 86, 42, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(255,255,255,0.55)";
  for (const cloud of [[120, 80, 48], [178, 86, 34], [245, 66, 38], [540, 118, 42]]) {
    ctx.beginPath();
    ctx.arc(cloud[0], cloud[1], cloud[2], 0, Math.PI * 2);
    ctx.arc(cloud[0] + 45, cloud[1] + 6, cloud[2] * 0.7, 0, Math.PI * 2);
    ctx.arc(cloud[0] - 42, cloud[1] + 10, cloud[2] * 0.62, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = "#21684e";
  ctx.beginPath();
  ctx.ellipse(420, 330, 310, 78, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#e9cf91";
  ctx.beginPath();
  ctx.ellipse(420, 348, 260, 58, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#8b6038";
  ctx.fillRect(317, 208, 18, 105);
  ctx.fillRect(570, 228, 16, 84);
  ctx.fillStyle = "#28745a";
  for (const palm of [[325, 205], [578, 228]]) {
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      ctx.beginPath();
      ctx.ellipse(palm[0] + Math.cos(angle) * 30, palm[1] + Math.sin(angle) * 12, 54, 13, angle, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.fillStyle = "#6b4429";
  ctx.fillRect(402, 265, 108, 58);
  ctx.fillStyle = "#d46c3f";
  ctx.beginPath();
  ctx.moveTo(385, 268);
  ctx.lineTo(458, 220);
  ctx.lineTo(528, 268);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#241a17";
  ctx.fillRect(445, 286, 22, 37);

  ctx.fillStyle = "#141829";
  for (const monster of [[196, 330, 18], [696, 323, 22], [750, 352, 15]]) {
    ctx.beginPath();
    ctx.arc(monster[0], monster[1], monster[2], 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#f0b637";
    ctx.fillRect(monster[0] - 7, monster[1] - 4, 4, 4);
    ctx.fillRect(monster[0] + 4, monster[1] - 4, 4, 4);
    ctx.fillStyle = "#141829";
  }
}

function drawPreviews() {
  document.querySelectorAll(".card-canvas").forEach((canvas) => {
    const ctx = canvas.getContext("2d");
    const type = canvas.dataset.preview;
    ctx.fillStyle = type === "escape" ? "#141829" : type === "sorter" ? "#d9eef0" : "#8bd0bd";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (type === "survivor") {
      ctx.fillStyle = "#e9cf91";
      ctx.beginPath();
      ctx.ellipse(180, 128, 128, 40, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#28745a";
      ctx.fillRect(172, 58, 18, 72);
      ctx.beginPath();
      ctx.arc(181, 54, 42, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#e95d47";
      ctx.fillRect(220, 98, 48, 34);
      ctx.fillStyle = "#141829";
      ctx.beginPath();
      ctx.arc(88, 126, 13, 0, Math.PI * 2);
      ctx.arc(290, 120, 18, 0, Math.PI * 2);
      ctx.fill();
    } else if (type === "sorter") {
      const colors = ["#e95d47", "#f0b637", "#1d9bb5", "#28745a"];
      for (let i = 0; i < 5; i++) {
        const x = 64 + i * 54;
        ctx.strokeStyle = "#123b55";
        ctx.lineWidth = 4;
        ctx.strokeRect(x, 42, 34, 104);
        for (let j = 0; j < 4; j++) {
          ctx.fillStyle = colors[(i + j) % colors.length];
          ctx.fillRect(x + 3, 121 - j * 22, 28, 18);
        }
      }
    } else {
      ctx.strokeStyle = "#f0b637";
      ctx.lineWidth = 4;
      for (let i = 0; i < 13; i++) {
        const x = 25 + i * 28;
        const y = 28 + (i % 5) * 31;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + 24, y + 8);
        ctx.lineTo(x + 15, y + 14);
        ctx.stroke();
      }
      ctx.fillStyle = "#1d9bb5";
      ctx.beginPath();
      ctx.arc(180, 95, 17, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

drawIslandScene();
drawPreviews();

const survivor = {
  canvas: $("survivor-canvas"),
  ctx: $("survivor-canvas").getContext("2d"),
  running: false,
  over: false,
  player: { x: 440, y: 280, hp: 100, speed: 190 },
  supplies: [],
  monsters: [],
  shots: [],
  particles: [],
  time: 0,
  supplyCount: 0,
  shelter: 0,
  spawnTimer: 0,
  supplyTimer: 0,
  shotTimer: 0,
  rescueAt: 150
};

function resetSurvivor() {
  survivor.running = true;
  survivor.over = false;
  survivor.player = { x: 440, y: 280, hp: 100, speed: 190 };
  survivor.supplies = [];
  survivor.monsters = [];
  survivor.shots = [];
  survivor.particles = [];
  survivor.time = 0;
  survivor.supplyCount = 0;
  survivor.shelter = 0;
  survivor.spawnTimer = 0;
  survivor.supplyTimer = 0;
  survivor.shotTimer = 0;
  $("survivor-overlay").classList.add("hidden");
  $("survivor-start").textContent = "Restart Run";
}

function spawnSupply() {
  survivor.supplies.push({
    x: 45 + Math.random() * 790,
    y: 55 + Math.random() * 455,
    r: 8,
    kind: Math.random() > 0.5 ? "wood" : "crate"
  });
}

function spawnMonster() {
  const side = Math.floor(Math.random() * 4);
  const pos = [
    { x: -25, y: Math.random() * 560 },
    { x: 905, y: Math.random() * 560 },
    { x: Math.random() * 880, y: -25 },
    { x: Math.random() * 880, y: 585 }
  ][side];
  const night = Math.sin(survivor.time / 18) > 0.15;
  survivor.monsters.push({
    x: pos.x,
    y: pos.y,
    hp: night ? 36 : 22,
    speed: night ? 60 + Math.random() * 28 : 38 + Math.random() * 22,
    r: night ? 17 : 13
  });
}

function updateSurvivor(dt) {
  if (!survivor.running) return;
  const p = survivor.player;
  let dx = 0;
  let dy = 0;
  if (keys.w || keys.arrowup) dy -= 1;
  if (keys.s || keys.arrowdown) dy += 1;
  if (keys.a || keys.arrowleft) dx -= 1;
  if (keys.d || keys.arrowright) dx += 1;
  if (dx || dy) {
    const len = Math.hypot(dx, dy);
    p.x = clamp(p.x + (dx / len) * p.speed * dt, 18, 862);
    p.y = clamp(p.y + (dy / len) * p.speed * dt, 18, 542);
  }

  survivor.time += dt;
  survivor.supplyTimer += dt;
  survivor.spawnTimer += dt;
  survivor.shotTimer += dt;

  if (survivor.supplyTimer > 1.8) {
    survivor.supplyTimer = 0;
    if (survivor.supplies.length < 11) spawnSupply();
  }

  const spawnRate = Math.max(0.55, 2.3 - survivor.time / 55);
  if (survivor.spawnTimer > spawnRate) {
    survivor.spawnTimer = 0;
    spawnMonster();
  }

  survivor.supplies = survivor.supplies.filter((supply) => {
    if (Math.hypot(supply.x - p.x, supply.y - p.y) < 27) {
      survivor.supplyCount++;
      survivor.shelter = clamp(survivor.shelter + 7, 0, 100);
      survivor.particles.push({ x: supply.x, y: supply.y, life: 0.35, color: "#f0b637" });
      return false;
    }
    return true;
  });

  if (survivor.shotTimer > Math.max(0.22, 0.55 - survivor.shelter / 400)) {
    survivor.shotTimer = 0;
    let target = null;
    let best = 210 + survivor.shelter * 2;
    for (const monster of survivor.monsters) {
      const d = Math.hypot(monster.x - p.x, monster.y - p.y);
      if (d < best) {
        target = monster;
        best = d;
      }
    }
    if (target) {
      const angle = Math.atan2(target.y - p.y, target.x - p.x);
      survivor.shots.push({ x: p.x, y: p.y, vx: Math.cos(angle) * 420, vy: Math.sin(angle) * 420, r: 4 });
    }
  }

  survivor.shots = survivor.shots.filter((shot) => {
    shot.x += shot.vx * dt;
    shot.y += shot.vy * dt;
    for (const monster of survivor.monsters) {
      if (Math.hypot(shot.x - monster.x, shot.y - monster.y) < monster.r + shot.r) {
        monster.hp -= 22 + survivor.shelter / 4;
        survivor.particles.push({ x: shot.x, y: shot.y, life: 0.22, color: "#e95d47" });
        return false;
      }
    }
    return shot.x > -20 && shot.x < 900 && shot.y > -20 && shot.y < 580;
  });

  survivor.monsters = survivor.monsters.filter((monster) => {
    const angle = Math.atan2(p.y - monster.y, p.x - monster.x);
    monster.x += Math.cos(angle) * monster.speed * dt;
    monster.y += Math.sin(angle) * monster.speed * dt;
    if (Math.hypot(monster.x - p.x, monster.y - p.y) < monster.r + 15) {
      p.hp -= (survivor.shelter >= 100 ? 8 : 13) * dt;
    }
    if (monster.hp <= 0) {
      survivor.particles.push({ x: monster.x, y: monster.y, life: 0.4, color: "#141829" });
      return false;
    }
    return true;
  });

  survivor.particles = survivor.particles.filter((part) => {
    part.life -= dt;
    return part.life > 0;
  });

  if (p.hp <= 0 || survivor.time >= survivor.rescueAt) {
    survivor.running = false;
    survivor.over = true;
    $("survivor-overlay").classList.remove("hidden");
    $("survivor-overlay").querySelector("h2").textContent = p.hp <= 0 ? "The island got you." : "Rescue spotted!";
    $("survivor-overlay").querySelector("p").textContent = p.hp <= 0
      ? "Grab more supplies and finish the shelter earlier next run."
      : "You kept the shelter standing long enough to escape.";
  }
}

function drawSurvivor() {
  const ctx = survivor.ctx;
  const w = survivor.canvas.width;
  const h = survivor.canvas.height;
  const night = Math.sin(survivor.time / 18) > 0.15;
  ctx.fillStyle = night ? "#121829" : "#7dcfbd";
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "#1d9bb5";
  ctx.fillRect(0, 455, w, 105);
  ctx.fillStyle = "#e9cf91";
  ctx.beginPath();
  ctx.ellipse(445, 300, 340, 195, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#28745a";
  ctx.beginPath();
  ctx.ellipse(300, 270, 120, 64, -0.3, 0, Math.PI * 2);
  ctx.ellipse(585, 310, 140, 70, 0.15, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#7d5135";
  ctx.fillRect(410, 245, 72, 46);
  ctx.fillStyle = survivor.shelter >= 100 ? "#28745a" : "#d46c3f";
  ctx.beginPath();
  ctx.moveTo(395, 250);
  ctx.lineTo(446, 214);
  ctx.lineTo(497, 250);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#f0b637";
  ctx.fillRect(397, 300, 98 * (survivor.shelter / 100), 8);

  for (const supply of survivor.supplies) {
    ctx.fillStyle = supply.kind === "wood" ? "#7d5135" : "#f0b637";
    ctx.fillRect(supply.x - 8, supply.y - 8, 16, 16);
  }

  for (const shot of survivor.shots) {
    ctx.fillStyle = "#fff4a8";
    ctx.beginPath();
    ctx.arc(shot.x, shot.y, shot.r, 0, Math.PI * 2);
    ctx.fill();
  }

  for (const monster of survivor.monsters) {
    ctx.fillStyle = "#141829";
    ctx.beginPath();
    ctx.arc(monster.x, monster.y, monster.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#f0b637";
    ctx.fillRect(monster.x - 7, monster.y - 4, 4, 4);
    ctx.fillRect(monster.x + 4, monster.y - 4, 4, 4);
  }

  ctx.fillStyle = "#e95d47";
  ctx.beginPath();
  ctx.arc(survivor.player.x, survivor.player.y, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#123b55";
  ctx.fillRect(survivor.player.x - 5, survivor.player.y - 22, 10, 12);

  for (const part of survivor.particles) {
    ctx.globalAlpha = part.life * 2;
    ctx.fillStyle = part.color;
    ctx.beginPath();
    ctx.arc(part.x, part.y, 16 * part.life, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  $("survivor-time").textContent = formatTime(survivor.time);
  $("survivor-health").textContent = Math.max(0, Math.ceil(survivor.player.hp));
  $("survivor-shelter").textContent = `${Math.floor(survivor.shelter)}%`;
  $("survivor-supplies").textContent = survivor.supplyCount;
}

$("survivor-start").addEventListener("click", resetSurvivor);

const palettes = [
  ["#e95d47", "#f0b637", "#1d9bb5", "#28745a"],
  ["#e95d47", "#f0b637", "#1d9bb5", "#28745a", "#6e59a5"],
  ["#e95d47", "#f0b637", "#1d9bb5", "#28745a", "#6e59a5", "#d85c9a"]
];
const sorter = {
  canvas: $("sorter-canvas"),
  ctx: $("sorter-canvas").getContext("2d"),
  level: 1,
  cups: [],
  selected: null,
  moves: 0,
  history: [],
  best: Number(localStorage.getItem("sorterBest") || 0)
};

function newSorterLevel(next = false) {
  if (next) sorter.level++;
  const colors = palettes[Math.min(palettes.length - 1, Math.floor((sorter.level - 1) / 2))];
  const pool = [];
  colors.forEach((color) => {
    for (let i = 0; i < 4; i++) pool.push(color);
  });
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  sorter.cups = [];
  for (let i = 0; i < colors.length; i++) {
    sorter.cups.push(pool.slice(i * 4, i * 4 + 4));
  }
  sorter.cups.push([], []);
  sorter.selected = null;
  sorter.moves = 0;
  sorter.history = [];
  $("sorter-overlay").classList.add("hidden");
}

function topRun(cup) {
  if (!cup.length) return { color: null, count: 0 };
  const color = cup[cup.length - 1];
  let count = 0;
  for (let i = cup.length - 1; i >= 0 && cup[i] === color; i--) count++;
  return { color, count };
}

function canPour(from, to) {
  if (!from.length || to.length >= 4) return false;
  return !to.length || from[from.length - 1] === to[to.length - 1];
}

function pour(fromIndex, toIndex) {
  const from = sorter.cups[fromIndex];
  const to = sorter.cups[toIndex];
  if (fromIndex === toIndex || !canPour(from, to)) return false;
  sorter.history.push(sorter.cups.map((cup) => cup.slice()));
  const run = topRun(from);
  const amount = Math.min(run.count, 4 - to.length);
  for (let i = 0; i < amount; i++) to.push(from.pop());
  sorter.moves++;
  if (isSorterWon()) {
    if (!sorter.best || sorter.moves < sorter.best) {
      sorter.best = sorter.moves;
      localStorage.setItem("sorterBest", sorter.best);
    }
    $("sorter-overlay").classList.remove("hidden");
  }
  return true;
}

function isSorterWon() {
  return sorter.cups.every((cup) => cup.length === 0 || (cup.length === 4 && cup.every((color) => color === cup[0])));
}

function getCupAt(x, y) {
  const rect = sorter.canvas.getBoundingClientRect();
  const scaleX = sorter.canvas.width / rect.width;
  const scaleY = sorter.canvas.height / rect.height;
  const mx = (x - rect.left) * scaleX;
  const my = (y - rect.top) * scaleY;
  const layout = sorterLayout();
  return layout.findIndex((pos) => mx >= pos.x && mx <= pos.x + 62 && my >= pos.y && my <= pos.y + 150);
}

function sorterLayout() {
  const count = sorter.cups.length;
  const perRow = Math.ceil(count / 2);
  const gap = 26;
  const cupW = 62;
  return sorter.cups.map((_, i) => {
    const row = Math.floor(i / perRow);
    const col = i % perRow;
    const rowCount = Math.min(perRow, count - row * perRow);
    const rowW = rowCount * cupW + (rowCount - 1) * gap;
    return {
      x: (sorter.canvas.width - rowW) / 2 + col * (cupW + gap),
      y: 130 + row * 205
    };
  });
}

sorter.canvas.addEventListener("click", (event) => {
  const index = getCupAt(event.clientX, event.clientY);
  if (index < 0) return;
  if (sorter.selected === null) {
    if (sorter.cups[index].length) sorter.selected = index;
  } else {
    pour(sorter.selected, index);
    sorter.selected = null;
  }
});

$("sorter-new").addEventListener("click", () => newSorterLevel(isSorterWon()));
$("sorter-undo").addEventListener("click", () => {
  const last = sorter.history.pop();
  if (last) {
    sorter.cups = last;
    sorter.moves = Math.max(0, sorter.moves - 1);
    sorter.selected = null;
    $("sorter-overlay").classList.add("hidden");
  }
});

function drawSorter() {
  const ctx = sorter.ctx;
  ctx.fillStyle = "#d9eef0";
  ctx.fillRect(0, 0, sorter.canvas.width, sorter.canvas.height);
  ctx.fillStyle = "#123b55";
  ctx.font = "900 30px Arial";
  ctx.textAlign = "center";
  ctx.fillText(`Level ${sorter.level}`, sorter.canvas.width / 2, 58);
  const layout = sorterLayout();
  for (let i = 0; i < sorter.cups.length; i++) {
    const cup = sorter.cups[i];
    const pos = layout[i];
    ctx.save();
    if (sorter.selected === i) ctx.translate(0, -15);
    ctx.fillStyle = "rgba(255,255,255,0.65)";
    ctx.strokeStyle = sorter.selected === i ? "#e95d47" : "#123b55";
    ctx.lineWidth = sorter.selected === i ? 5 : 3;
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    ctx.lineTo(pos.x + 62, pos.y);
    ctx.lineTo(pos.x + 52, pos.y + 150);
    ctx.lineTo(pos.x + 10, pos.y + 150);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    for (let j = 0; j < cup.length; j++) {
      ctx.fillStyle = cup[j];
      ctx.fillRect(pos.x + 10, pos.y + 118 - j * 32, 42, 28);
    }
    ctx.restore();
  }
  $("sorter-level").textContent = sorter.level;
  $("sorter-moves").textContent = sorter.moves;
  $("sorter-best").textContent = sorter.best || "--";
}

newSorterLevel();

const escape = {
  canvas: $("escape-canvas"),
  ctx: $("escape-canvas").getContext("2d"),
  running: false,
  player: { x: 440, y: 280, r: 14, speed: 220, dash: 0, dashCooldown: 0 },
  arrows: [],
  particles: [],
  score: 0,
  time: 0,
  near: 0,
  spawn: 0
};

function resetEscape() {
  escape.running = true;
  escape.player = { x: 440, y: 280, r: 14, speed: 220, dash: 0, dashCooldown: 0 };
  escape.arrows = [];
  escape.particles = [];
  escape.score = 0;
  escape.time = 0;
  escape.near = 0;
  escape.spawn = 0;
  $("escape-overlay").classList.add("hidden");
  $("escape-start").textContent = "Restart Dodge";
}

function spawnArrow() {
  const side = Math.floor(Math.random() * 4);
  const start = [
    { x: Math.random() * 880, y: -30 },
    { x: 910, y: Math.random() * 560 },
    { x: Math.random() * 880, y: 590 },
    { x: -30, y: Math.random() * 560 }
  ][side];
  const angle = Math.atan2(escape.player.y - start.y, escape.player.x - start.x) + (Math.random() - 0.5) * 0.75;
  const speed = 170 + escape.time * 2.5 + Math.random() * 75;
  escape.arrows.push({
    x: start.x,
    y: start.y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    angle,
    scored: false
  });
}

function updateEscape(dt) {
  if (!escape.running) return;
  const p = escape.player;
  let dx = 0;
  let dy = 0;
  if (keys.w || keys.arrowup) dy -= 1;
  if (keys.s || keys.arrowdown) dy += 1;
  if (keys.a || keys.arrowleft) dx -= 1;
  if (keys.d || keys.arrowright) dx += 1;
  if (keys[" "] && p.dashCooldown <= 0) {
    p.dash = 0.18;
    p.dashCooldown = 1.8;
  }
  if (p.dash > 0) p.dash -= dt;
  if (p.dashCooldown > 0) p.dashCooldown -= dt;
  const speed = p.dash > 0 ? p.speed * 3 : p.speed;
  if (dx || dy) {
    const len = Math.hypot(dx, dy);
    p.x = clamp(p.x + (dx / len) * speed * dt, p.r, 880 - p.r);
    p.y = clamp(p.y + (dy / len) * speed * dt, p.r, 560 - p.r);
  }

  escape.time += dt;
  escape.score += dt * (12 + escape.time / 3);
  escape.spawn += dt;
  const rate = Math.max(0.18, 0.95 - escape.time / 75);
  if (escape.spawn > rate) {
    escape.spawn = 0;
    spawnArrow();
    if (escape.time > 22 && Math.random() > 0.55) spawnArrow();
  }

  if (Math.floor(escape.time) % 18 === 0 && Math.floor(escape.time) !== Math.floor(escape.time - dt)) {
    for (let i = 0; i < 10; i++) {
      const angle = (i / 10) * Math.PI * 2;
      escape.arrows.push({
        x: p.x + Math.cos(angle) * 520,
        y: p.y + Math.sin(angle) * 520,
        vx: Math.cos(angle + Math.PI) * 210,
        vy: Math.sin(angle + Math.PI) * 210,
        angle: angle + Math.PI,
        scored: false
      });
    }
  }

  escape.arrows = escape.arrows.filter((arrow) => {
    arrow.x += arrow.vx * dt;
    arrow.y += arrow.vy * dt;
    const d = Math.hypot(arrow.x - p.x, arrow.y - p.y);
    if (d < p.r + 6 && p.dash <= 0) {
      escape.running = false;
      $("escape-overlay").classList.remove("hidden");
      $("escape-overlay").querySelector("h2").textContent = "Run ended.";
      $("escape-overlay").querySelector("p").textContent = `Score ${Math.floor(escape.score)} with ${escape.near} near misses.`;
      return false;
    }
    if (d < 38 && !arrow.scored) {
      arrow.scored = true;
      escape.near++;
      escape.score += 40;
      escape.particles.push({ x: p.x, y: p.y, life: 0.35 });
    }
    return arrow.x > -70 && arrow.x < 950 && arrow.y > -70 && arrow.y < 630;
  });
  escape.particles = escape.particles.filter((part) => {
    part.life -= dt;
    return part.life > 0;
  });
}

function drawEscape() {
  const ctx = escape.ctx;
  ctx.fillStyle = "#141829";
  ctx.fillRect(0, 0, escape.canvas.width, escape.canvas.height);
  ctx.strokeStyle = "#24304c";
  ctx.lineWidth = 1;
  for (let x = 0; x < 880; x += 44) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 560);
    ctx.stroke();
  }
  for (let y = 0; y < 560; y += 44) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(880, y);
    ctx.stroke();
  }
  for (const arrow of escape.arrows) {
    ctx.save();
    ctx.translate(arrow.x, arrow.y);
    ctx.rotate(arrow.angle);
    ctx.strokeStyle = "#f0b637";
    ctx.fillStyle = "#e95d47";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-16, 0);
    ctx.lineTo(18, 0);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(23, 0);
    ctx.lineTo(9, -8);
    ctx.lineTo(9, 8);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  for (const part of escape.particles) {
    ctx.globalAlpha = part.life * 2;
    ctx.strokeStyle = "#1d9bb5";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(part.x, part.y, 40 * (1 - part.life), 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  ctx.fillStyle = escape.player.dash > 0 ? "#f0b637" : "#1d9bb5";
  ctx.beginPath();
  ctx.arc(escape.player.x, escape.player.y, escape.player.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 3;
  ctx.stroke();
  $("escape-score").textContent = Math.floor(escape.score);
  $("escape-time").textContent = formatTime(escape.time);
  $("escape-misses").textContent = escape.near;
}

$("escape-start").addEventListener("click", resetEscape);

let last = performance.now();
function loop(now) {
  const dt = Math.min(0.033, (now - last) / 1000);
  last = now;
  updateSurvivor(dt);
  updateEscape(dt);
  drawSurvivor();
  drawSorter();
  drawEscape();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
