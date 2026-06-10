import { useEffect, useRef, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'

// ─── Types ─────────────────────────────────────────────────────────────────
interface Vec2 { x: number; y: number }
interface Enemy { x: number; y: number; hp: number; maxHp: number; speed: number; damage: number; type: string; radius: number; flash: number; attackCd: number }
interface XPGem { x: number; y: number; value: number }
interface Bullet { x: number; y: number; vx: number; vy: number; damage: number; pierce: number; radius: number }
interface Upgrade { id: string; name: string; desc: string; apply: (s: any) => void }
interface Particle { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; color: string; size: number }

const W = 800, H = 600
const ARENA_W = 2000, ARENA_H = 2000

// ─── Game Engine ───────────────────────────────────────────────────────────
function createGame() {
  const state = {
    player: { x: ARENA_W / 2, y: ARENA_H / 2, hp: 100, maxHp: 100, speed: 3, damage: 15, attackSpeed: 1, attackRange: 200, bulletCount: 1, xp: 0, level: 1, xpNeeded: 20, invuln: 0 } as Vec2 & { hp: number; maxHp: number; speed: number; damage: number; attackSpeed: number; attackRange: number; bulletCount: number; xp: number; level: number; xpNeeded: number; invuln: number },
    enemies: [] as Enemy[],
    bullets: [] as Bullet[],
    gems: [] as XPGem[],
    particles: [] as Particle[],
    camera: { x: 0, y: 0 } as Vec2,
    keys: {} as Record<string, boolean>,
    mouse: { x: 0, y: 0 } as Vec2,
    attackTimer: 0,
    spawnTimer: 0,
    wave: 1,
    waveTimer: 0,
    score: 0,
    kills: 0,
    time: 0,
    running: false,
    gameOver: false,
    levelUpPending: false,
    levelUpChoices: [] as Upgrade[],
    frameId: 0,
    lastTime: 0,
  }
  return state
}

type GameState = ReturnType<typeof createGame>

const UPGRADE_POOL: Upgrade[] = [
  { id: 'dmg', name: 'Damage Up', desc: '+30% damage', apply: (s: any) => { s.player.damage *= 1.3 } },
  { id: 'spd', name: 'Speed Up', desc: '+20% move speed', apply: (s: any) => { s.player.speed *= 1.2 } },
  { id: 'atkspd', name: 'Attack Speed', desc: '+25% attack speed', apply: (s: any) => { s.player.attackSpeed *= 1.25 } },
  { id: 'atkrange', name: 'Range Up', desc: '+30% range', apply: (s: any) => { s.player.attackRange *= 1.3 } },
  { id: 'hp', name: 'Max HP', desc: '+25 max HP & heal', apply: (s: any) => { s.player.maxHp += 25; s.player.hp = Math.min(s.player.hp + 25, s.player.maxHp) } },
  { id: 'multi', name: 'Multi Shot', desc: '+1 projectile', apply: (s: any) => { s.player.bulletCount += 1 } },
  { id: 'heal', name: 'Heal', desc: 'Restore 40 HP', apply: (s: any) => { s.player.hp = Math.min(s.player.hp + 40, s.player.maxHp) } },
]

function getRandomUpgrades(s: GameState, count: number): Upgrade[] {
  const shuffled = [...UPGRADE_POOL].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

function spawnEnemy(s: GameState) {
  const angle = Math.random() * Math.PI * 2
  const dist = 500 + Math.random() * 200
  const ex = s.player.x + Math.cos(angle) * dist
  const ey = s.player.y + Math.sin(angle) * dist
  const isBoss = s.wave % 5 === 0 && Math.random() < 0.3
  s.enemies.push({
    x: Math.max(20, Math.min(ARENA_W - 20, ex)),
    y: Math.max(20, Math.min(ARENA_H - 20, ey)),
    hp: isBoss ? 200 + s.wave * 20 : 20 + s.wave * 5,
    maxHp: isBoss ? 200 + s.wave * 20 : 20 + s.wave * 5,
    speed: isBoss ? 0.8 : 1 + Math.random() * 0.8,
    damage: isBoss ? 20 : 8 + s.wave,
    type: isBoss ? 'boss' : (Math.random() < 0.3 ? 'fast' : 'normal'),
    radius: isBoss ? 20 : (12),
    flash: 0,
    attackCd: 0,
  })
}

function fireBullets(s: GameState) {
  // Find nearest enemy
  let nearest: Enemy | null = null
  let nearDist = s.player.attackRange
  for (const e of s.enemies) {
    const d = Math.hypot(e.x - s.player.x, e.y - s.player.y)
    if (d < nearDist) { nearDist = d; nearest = e }
  }
  if (!nearest) return

  const baseAngle = Math.atan2(nearest.y - s.player.y, nearest.x - s.player.x)
  const count = s.player.bulletCount
  const spread = count > 1 ? 0.3 : 0
  for (let i = 0; i < count; i++) {
    const offset = (i - (count - 1) / 2) * spread
    const a = baseAngle + offset
    s.bullets.push({
      x: s.player.x, y: s.player.y,
      vx: Math.cos(a) * 8, vy: Math.sin(a) * 8,
      damage: s.player.damage, pierce: 1, radius: 5,
    })
  }
}

function updateGame(s: GameState, dt: number) {
  if (s.gameOver || s.levelUpPending) return
  s.time += dt

  // Player movement
  let dx = 0, dy = 0
  if (s.keys['w'] || s.keys['arrowup']) dy -= 1
  if (s.keys['s'] || s.keys['arrowdown']) dy += 1
  if (s.keys['a'] || s.keys['arrowleft']) dx -= 1
  if (s.keys['d'] || s.keys['arrowright']) dx += 1
  if (dx || dy) {
    const len = Math.hypot(dx, dy)
    dx /= len; dy /= len
    s.player.x = Math.max(20, Math.min(ARENA_W - 20, s.player.x + dx * s.player.speed))
    s.player.y = Math.max(20, Math.min(ARENA_H - 20, s.player.y + dy * s.player.speed))
  }

  if (s.player.invuln > 0) s.player.invuln -= dt

  // Auto-attack
  s.attackTimer += dt
  if (s.attackTimer >= 1 / s.player.attackSpeed) {
    s.attackTimer = 0
    fireBullets(s)
  }

  // Spawn enemies
  s.spawnTimer += dt
  const spawnRate = Math.max(0.3, 2 - s.wave * 0.1)
  if (s.spawnTimer >= spawnRate) {
    s.spawnTimer = 0
    const count = Math.min(3, 1 + Math.floor(s.wave / 3))
    for (let i = 0; i < count; i++) spawnEnemy(s)
  }

  // Wave timer
  s.waveTimer += dt
  if (s.waveTimer >= 15) {
    s.waveTimer = 0
    s.wave++
  }

  // Update bullets
  s.bullets = s.bullets.filter(b => {
    b.x += b.vx; b.y += b.vy
    if (b.x < 0 || b.x > ARENA_W || b.y < 0 || b.y > ARENA_H) return false
    for (let i = s.enemies.length - 1; i >= 0; i--) {
      const e = s.enemies[i]
      if (Math.hypot(b.x - e.x, b.y - e.y) < e.radius + b.radius) {
        e.hp -= b.damage
        e.flash = 0.1
        s.particles.push({ x: b.x, y: b.y, vx: (Math.random() - 0.5) * 3, vy: (Math.random() - 0.5) * 3, life: 0.3, maxLife: 0.3, color: '#ff4444', size: 4 })
        if (e.hp <= 0) {
          s.score += e.type === 'boss' ? 50 : 10
          s.kills++
          const gemValue = e.type === 'boss' ? 15 : 3 + Math.floor(s.wave / 2)
          s.gems.push({ x: e.x, y: e.y, value: gemValue })
          for (let j = 0; j < 5; j++) {
            s.particles.push({ x: e.x, y: e.y, vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.5) * 6, life: 0.5, maxLife: 0.5, color: e.type === 'boss' ? '#ff8800' : '#ff4444', size: 3 + Math.random() * 3 })
          }
          s.enemies.splice(i, 1)
        }
        b.pierce--
        if (b.pierce <= 0) return false
      }
    }
    return true
  })

  // Update enemies
  for (const e of s.enemies) {
    const edx = s.player.x - e.x
    const edy = s.player.y - e.y
    const edist = Math.hypot(edx, edy)
    if (edist > 5) {
      e.x += (edx / edist) * e.speed
      e.y += (edy / edist) * e.speed
    }
    e.attackCd -= dt
    if (edist < 30 && e.attackCd <= 0 && s.player.invuln <= 0) {
      s.player.hp -= e.damage
      s.player.invuln = 0.5
      e.attackCd = 1
      s.particles.push({ x: s.player.x, y: s.player.y, vx: 0, vy: 0, life: 0.3, maxLife: 0.3, color: '#ff0000', size: 10 })
    }
    if (e.flash > 0) e.flash -= dt
  }

  // Collect gems
  s.gems = s.gems.filter(g => {
    if (Math.hypot(g.x - s.player.x, g.y - s.player.y) < 40) {
      s.player.xp += g.value
      if (s.player.xp >= s.player.xpNeeded) {
        s.player.xp -= s.player.xpNeeded
        s.player.level++
        s.player.xpNeeded = Math.floor(s.player.xpNeeded * 1.4)
        s.levelUpPending = true
        s.levelUpChoices = getRandomUpgrades(s, 3)
      }
      return false
    }
    return true
  })

  // Update particles
  s.particles = s.particles.filter(p => {
    p.x += p.vx; p.y += p.vy
    p.life -= dt
    return p.life > 0
  })

  // Camera
  s.camera.x = s.player.x - W / 2
  s.camera.y = s.player.y - H / 2

  // Death check
  if (s.player.hp <= 0) {
    s.gameOver = true
    s.running = false
  }
}

function renderGame(ctx: CanvasRenderingContext2D, s: GameState) {
  const cam = s.camera

  // Background
  ctx.fillStyle = '#1a1a2e'
  ctx.fillRect(0, 0, W, H)

  // Grid
  ctx.strokeStyle = '#252540'
  ctx.lineWidth = 1
  const gridSize = 80
  const startX = -(cam.x % gridSize)
  const startY = -(cam.y % gridSize)
  for (let x = startX; x < W; x += gridSize) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke()
  }
  for (let y = startY; y < H; y += gridSize) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke()
  }

  // Arena border
  ctx.strokeStyle = '#6c5ce7'
  ctx.lineWidth = 3
  ctx.strokeRect(-cam.x, -cam.y, ARENA_W, ARENA_H)

  // XP gems
  for (const g of s.gems) {
    const sx = g.x - cam.x, sy = g.y - cam.y
    if (sx < -20 || sx > W + 20 || sy < -20 || sy > H + 20) continue
    ctx.fillStyle = '#00ff88'
    ctx.shadowColor = '#00ff88'
    ctx.shadowBlur = 8
    ctx.beginPath()
    ctx.arc(sx, sy, 5, 0, Math.PI * 2)
    ctx.fill()
    ctx.shadowBlur = 0
  }

  // Enemies
  for (const e of s.enemies) {
    const sx = e.x - cam.x, sy = e.y - cam.y
    if (sx < -30 || sx > W + 30 || sy < -30 || sy > H + 30) continue
    ctx.fillStyle = e.flash > 0 ? '#ffffff' : (e.type === 'boss' ? '#ff4400' : (e.type === 'fast' ? '#ff8800' : '#ee3333'))
    ctx.beginPath()
    ctx.arc(sx, sy, e.radius, 0, Math.PI * 2)
    ctx.fill()
    // Eyes
    ctx.fillStyle = '#000'
    ctx.beginPath(); ctx.arc(sx - 4, sy - 3, 2, 0, Math.PI * 2); ctx.fill()
    ctx.beginPath(); ctx.arc(sx + 4, sy - 3, 2, 0, Math.PI * 2); ctx.fill()
    // HP bar
    if (e.hp < e.maxHp) {
      ctx.fillStyle = '#333'
      ctx.fillRect(sx - 15, sy - e.radius - 8, 30, 4)
      ctx.fillStyle = '#ff4444'
      ctx.fillRect(sx - 15, sy - e.radius - 8, 30 * e.hp / e.maxHp, 4)
    }
  }

  // Bullets
  ctx.fillStyle = '#ffdd44'
  ctx.shadowColor = '#ffdd44'
  ctx.shadowBlur = 6
  for (const b of s.bullets) {
    const sx = b.x - cam.x, sy = b.y - cam.y
    ctx.beginPath(); ctx.arc(sx, sy, b.radius, 0, Math.PI * 2); ctx.fill()
  }
  ctx.shadowBlur = 0

  // Player
  const px = s.player.x - cam.x, py = s.player.y - cam.y
  // Body
  ctx.fillStyle = s.player.invuln > 0 ? 'rgba(100,200,255,0.5)' : '#4488ff'
  ctx.beginPath(); ctx.arc(px, py, 14, 0, Math.PI * 2); ctx.fill()
  // Eyes
  ctx.fillStyle = '#fff'
  ctx.beginPath(); ctx.arc(px - 4, py - 3, 4, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.arc(px + 4, py - 3, 4, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = '#111'
  ctx.beginPath(); ctx.arc(px - 3, py - 3, 2, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.arc(px + 5, py - 3, 2, 0, Math.PI * 2); ctx.fill()

  // Particles
  for (const p of s.particles) {
    const sx = p.x - cam.x, sy = p.y - cam.y
    ctx.globalAlpha = p.life / p.maxLife
    ctx.fillStyle = p.color
    ctx.fillRect(sx - p.size / 2, sy - p.size / 2, p.size, p.size)
  }
  ctx.globalAlpha = 1

  // HUD
  // HP bar
  ctx.fillStyle = '#333'
  ctx.fillRect(10, 10, 200, 16)
  ctx.fillStyle = '#44ff44'
  ctx.fillRect(10, 10, 200 * Math.max(0, s.player.hp) / s.player.maxHp, 16)
  ctx.strokeStyle = '#888'
  ctx.strokeRect(10, 10, 200, 16)
  ctx.fillStyle = '#fff'
  ctx.font = 'bold 12px monospace'
  ctx.fillText(`HP: ${Math.ceil(s.player.hp)}/${s.player.maxHp}`, 15, 23)

  // XP bar
  ctx.fillStyle = '#333'
  ctx.fillRect(10, 30, 200, 12)
  ctx.fillStyle = '#6c5ce7'
  ctx.fillRect(10, 30, 200 * s.player.xp / s.player.xpNeeded, 12)
  ctx.strokeStyle = '#888'
  ctx.strokeRect(10, 30, 200, 12)
  ctx.fillText(`Lv.${s.player.level} XP: ${s.player.xp}/${s.player.xpNeeded}`, 15, 40)

  // Wave, score, kills
  ctx.fillStyle = '#fff'
  ctx.font = 'bold 14px monospace'
  ctx.fillText(`Wave ${s.wave}  |  Score: ${s.score}  |  Kills: ${s.kills}`, 10, 60)
  ctx.fillText(`Time: ${Math.floor(s.time)}s`, 10, 78)

  // Level up overlay
  if (s.levelUpPending && s.levelUpChoices.length > 0) {
    ctx.fillStyle = 'rgba(0,0,0,0.7)'
    ctx.fillRect(0, 0, W, H)
    ctx.fillStyle = '#6c5ce7'
    ctx.font = 'bold 32px monospace'
    ctx.textAlign = 'center'
    ctx.fillText('LEVEL UP!', W / 2, 120)
    ctx.font = '16px monospace'
    ctx.fillStyle = '#ccc'
    ctx.fillText('Choose an upgrade:', W / 2, 155)

    for (let i = 0; i < s.levelUpChoices.length; i++) {
      const u = s.levelUpChoices[i]
      const bx = W / 2 - 150, by = 180 + i * 90
      ctx.fillStyle = '#1a1a3e'
      ctx.fillRect(bx, by, 300, 70)
      ctx.strokeStyle = '#6c5ce7'
      ctx.lineWidth = 2
      ctx.strokeRect(bx, by, 300, 70)
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 18px monospace'
      ctx.fillText(`[${i + 1}] ${u.name}`, W / 2, by + 28)
      ctx.fillStyle = '#aaa'
      ctx.font = '14px monospace'
      ctx.fillText(u.desc, W / 2, by + 52)
    }
    ctx.textAlign = 'left'
  }

  // Game over overlay
  if (s.gameOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.8)'
    ctx.fillRect(0, 0, W, H)
    ctx.textAlign = 'center'
    ctx.fillStyle = '#ff4444'
    ctx.font = 'bold 48px monospace'
    ctx.fillText('GAME OVER', W / 2, H / 2 - 40)
    ctx.fillStyle = '#fff'
    ctx.font = '20px monospace'
    ctx.fillText(`Score: ${s.score}  |  Wave: ${s.wave}  |  Kills: ${s.kills}`, W / 2, H / 2 + 10)
    ctx.fillStyle = '#6c5ce7'
    ctx.font = '16px monospace'
    ctx.fillText('Press R to restart', W / 2, H / 2 + 50)
    ctx.textAlign = 'left'
  }
}

// ─── React Component ──────────────────────────────────────────────────────
export default function SurvivorGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameRef = useRef<GameState>(createGame())
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'over'>('idle')

  const startGame = useCallback(() => {
    const g = createGame()
    g.running = true
    gameRef.current = g
    setGameState('playing')
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const g = gameRef.current

    const handleKeyDown = (e: KeyboardEvent) => {
      g.keys[e.key.toLowerCase()] = true
      if (e.key.toLowerCase() === 'r' && g.gameOver) {
        startGame()
      }
      if (g.levelUpPending && ['1', '2', '3'].includes(e.key)) {
        const idx = parseInt(e.key) - 1
        if (idx < g.levelUpChoices.length) {
          g.levelUpChoices[idx].apply(g)
          g.levelUpPending = false
          g.levelUpChoices = []
        }
      }
    }
    const handleKeyUp = (e: KeyboardEvent) => { g.keys[e.key.toLowerCase()] = false }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    let animId = 0
    const loop = (time: number) => {
      const dt = Math.min((time - g.lastTime) / 1000, 0.05)
      g.lastTime = time
      if (g.running) {
        updateGame(g, dt)
        if (g.gameOver) setGameState('over')
      }
      renderGame(ctx, g)
      animId = requestAnimationFrame(loop)
    }
    g.lastTime = performance.now()
    animId = requestAnimationFrame(loop)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      cancelAnimationFrame(animId)
    }
  }, [gameState, startGame])

  return (
    <div className="game-page">
      <div className="game-header">
        <Link to="/">← Back</Link>
        <h1>Survivor.io</h1>
      </div>
      <div className="game-canvas-wrapper">
        <canvas ref={canvasRef} width={W} height={H} />
        {gameState === 'idle' && (
          <div className="game-overlay">
            <h2 style={{ color: '#6c5ce7' }}>Survivor.io</h2>
            <p>Fight waves of enemies! Auto-attack, collect XP, level up!</p>
            <p style={{ fontSize: '0.9rem', color: '#666' }}>WASD to move | Auto-attack nearest enemy</p>
            <button className="btn" onClick={startGame}>Start Game</button>
          </div>
        )}
      </div>
      <div className="game-hud">
        <span>WASD: Move</span>
        <span>Auto-attack nearest enemy</span>
        <span>1/2/3: Choose upgrade on level up</span>
      </div>
    </div>
  )
}
