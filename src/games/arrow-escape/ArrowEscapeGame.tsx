import { useEffect, useRef, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'

// ─── Types ─────────────────────────────────────────────────────────────────
interface Arrow {
  x: number; y: number; vx: number; vy: number; angle: number; speed: number; length: number
}
interface Particle {
  x: number; y: number; vx: number; vy: number; life: number; maxLife: number; color: string; size: number
}
interface GameState {
  player: { x: number; y: number; radius: number; speed: number; dashCd: number; dashTimer: number; invuln: number; trail: { x: number; y: number }[] }
  arrows: Arrow[]
  particles: Particle[]
  keys: Record<string, boolean>
  score: number
  highScore: number
  time: number
  difficulty: number
  spawnTimer: number
  spawnRate: number
  running: boolean
  gameOver: boolean
  lastTime: number
  screenShake: number
  combo: number
  comboTimer: number
  nearMisses: number
  arrowsAvoided: number
}

const W = 800, H = 600

function createGame(): GameState {
  return {
    player: { x: W / 2, y: H / 2, radius: 12, speed: 4, dashCd: 0, dashTimer: 0, invuln: 0, trail: [] },
    arrows: [],
    particles: [],
    keys: {},
    score: 0, highScore: 0,
    time: 0, difficulty: 1,
    spawnTimer: 0, spawnRate: 1.2,
    running: false, gameOver: false,
    lastTime: 0,
    screenShake: 0,
    combo: 0, comboTimer: 0,
    nearMisses: 0, arrowsAvoided: 0,
  }
}

function spawnArrow(s: GameState) {
  const side = Math.floor(Math.random() * 4) // 0=top, 1=right, 2=bottom, 3=left
  let x: number, y: number, angle: number

  // Aim roughly at player with some randomness
  switch (side) {
    case 0: x = Math.random() * W; y = -20; break
    case 1: x = W + 20; y = Math.random() * H; break
    case 2: x = Math.random() * W; y = H + 20; break
    default: x = -20; y = Math.random() * H; break
  }

  angle = Math.atan2(s.player.y - y, s.player.x - x) + (Math.random() - 0.5) * 0.8
  const speed = 3 + s.difficulty * 0.5 + Math.random() * 2

  // Special arrow patterns
  const isBurst = Math.random() < 0.1 * s.difficulty
  const count = isBurst ? 3 + Math.floor(s.difficulty / 3) : 1
  const spreadAngle = 0.15

  for (let i = 0; i < count; i++) {
    const a = angle + (i - (count - 1) / 2) * spreadAngle
    s.arrows.push({
      x, y,
      vx: Math.cos(a) * speed,
      vy: Math.sin(a) * speed,
      angle: a,
      speed,
      length: 20 + Math.random() * 10,
    })
  }
}

function spawnWave(s: GameState) {
  const cx = s.player.x, cy = s.player.y
  const count = 8 + Math.floor(s.difficulty * 2)
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2
    const dist = 500
    const x = cx + Math.cos(a) * dist
    const y = cy + Math.sin(a) * dist
    const speed = 2.5 + s.difficulty * 0.3
    s.arrows.push({
      x, y,
      vx: Math.cos(a + Math.PI) * speed,
      vy: Math.sin(a + Math.PI) * speed,
      angle: a + Math.PI,
      speed,
      length: 22,
    })
  }
}

function updateGame(s: GameState, dt: number) {
  if (s.gameOver) return
  s.time += dt
  s.difficulty = 1 + s.time / 15

  // Player movement
  let dx = 0, dy = 0
  if (s.keys['w'] || s.keys['arrowup']) dy -= 1
  if (s.keys['s'] || s.keys['arrowdown']) dy += 1
  if (s.keys['a'] || s.keys['arrowleft']) dx -= 1
  if (s.keys['d'] || s.keys['arrowright']) dx += 1

  const speed = s.player.dashTimer > 0 ? s.player.speed * 3 : s.player.speed
  if (dx || dy) {
    const len = Math.hypot(dx, dy)
    s.player.x += (dx / len) * speed
    s.player.y += (dy / len) * speed
  }
  s.player.x = Math.max(s.player.radius, Math.min(W - s.player.radius, s.player.x))
  s.player.y = Math.max(s.player.radius, Math.min(H - s.player.radius, s.player.y))

  // Trail
  s.player.trail.push({ x: s.player.x, y: s.player.y })
  if (s.player.trail.length > 15) s.player.trail.shift()

  // Dash
  if (s.player.dashCd > 0) s.player.dashCd -= dt
  if (s.player.dashTimer > 0) s.player.dashTimer -= dt
  if (s.player.invuln > 0) s.player.invuln -= dt

  // Spawn arrows
  s.spawnRate = Math.max(0.15, 1.2 - s.difficulty * 0.08)
  s.spawnTimer += dt
  if (s.spawnTimer >= s.spawnRate) {
    s.spawnTimer = 0
    spawnArrow(s)
    // Extra arrows at higher difficulty
    if (s.difficulty > 3 && Math.random() < 0.3) spawnArrow(s)
    if (s.difficulty > 6 && Math.random() < 0.3) spawnArrow(s)
  }

  // Wave spawns
  if (Math.floor(s.time) % 20 === 0 && Math.floor(s.time) !== Math.floor(s.time - dt)) {
    spawnWave(s)
  }

  // Update arrows
  const nearDist = 30
  s.arrows = s.arrows.filter(a => {
    a.x += a.vx
    a.y += a.vy

    // Off screen removal
    if (a.x < -50 || a.x > W + 50 || a.y < -50 || a.y > H + 50) {
      s.arrowsAvoided++
      return false
    }

    // Collision with player
    const dist = Math.hypot(a.x - s.player.x, a.y - s.player.y)
    if (dist < s.player.radius + 4 && s.player.invuln <= 0 && s.player.dashTimer <= 0) {
      // Hit!
      s.gameOver = true
      s.running = false
      s.screenShake = 15
      for (let i = 0; i < 20; i++) {
        s.particles.push({
          x: s.player.x, y: s.player.y,
          vx: (Math.random() - 0.5) * 10, vy: (Math.random() - 0.5) * 10,
          life: 0.8, maxLife: 0.8,
          color: Math.random() < 0.5 ? '#ff4444' : '#ff8844', size: 3 + Math.random() * 5,
        })
      }
      return false
    }

    // Near miss detection
    if (dist < nearDist && dist > s.player.radius + 4) {
      // Already counted for this arrow? (simple approach)
      const key = `${Math.round(a.x)}_${Math.round(a.y)}`
      if (!(s as any)._nearSet) (s as any)._nearSet = new Set()
      if (!(s as any)._nearSet.has(key)) {
        (s as any)._nearSet.add(key)
        s.nearMisses++
        s.combo++
        s.comboTimer = 2
        s.score += 5 * s.combo
        s.particles.push({
          x: s.player.x, y: s.player.y - 25,
          vx: 0, vy: -1, life: 0.8, maxLife: 0.8,
          color: '#ffdd44', size: 12,
        })
      }
    }

    return true
  })

  // Score
  s.score += dt * 10 * s.difficulty

  // Combo timer
  if (s.comboTimer > 0) {
    s.comboTimer -= dt
    if (s.comboTimer <= 0) s.combo = 0
  }

  // Particles
  s.particles = s.particles.filter(p => {
    p.x += p.vx; p.y += p.vy
    p.vy += 0.1
    p.life -= dt
    return p.life > 0
  })

  // Screen shake
  if (s.screenShake > 0) s.screenShake -= dt * 30
}

function renderGame(ctx: CanvasRenderingContext2D, s: GameState) {
  const shake = s.screenShake > 0 ? (Math.random() - 0.5) * s.screenShake : 0
  ctx.save()
  ctx.translate(shake, shake)

  // Background - dark gradient
  const grad = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, 500)
  grad.addColorStop(0, '#1a0a2e')
  grad.addColorStop(1, '#0a0a1a')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, W, H)

  // Grid
  ctx.strokeStyle = '#1a1a3a'
  ctx.lineWidth = 1
  for (let x = 0; x < W; x += 60) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke()
  }
  for (let y = 0; y < H; y += 60) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke()
  }

  // Player trail
  for (let i = 0; i < s.player.trail.length; i++) {
    const t = s.player.trail[i]
    const alpha = i / s.player.trail.length * 0.3
    ctx.fillStyle = `rgba(100, 200, 255, ${alpha})`
    ctx.beginPath()
    ctx.arc(t.x, t.y, s.player.radius * (i / s.player.trail.length), 0, Math.PI * 2)
    ctx.fill()
  }

  // Arrows
  for (const a of s.arrows) {
    ctx.save()
    ctx.translate(a.x, a.y)
    ctx.rotate(a.angle)

    // Arrow shaft
    ctx.fillStyle = '#ff6644'
    ctx.fillRect(-a.length, -1.5, a.length, 3)

    // Arrow head
    ctx.fillStyle = '#ff8866'
    ctx.beginPath()
    ctx.moveTo(3, 0)
    ctx.lineTo(-6, -5)
    ctx.lineTo(-6, 5)
    ctx.closePath()
    ctx.fill()

    // Glow
    ctx.shadowColor = '#ff4422'
    ctx.shadowBlur = 6
    ctx.fillStyle = 'transparent'
    ctx.fillRect(0, 0, 0, 0)
    ctx.shadowBlur = 0

    ctx.restore()
  }

  // Player
  const p = s.player
  const isDashing = p.dashTimer > 0
  const isInvuln = p.invuln > 0

  // Glow
  ctx.shadowColor = isDashing ? '#88ddff' : '#4488ff'
  ctx.shadowBlur = isDashing ? 20 : 10
  ctx.fillStyle = isInvuln ? 'rgba(100,200,255,0.4)' : (isDashing ? '#88ddff' : '#4488ff')
  ctx.beginPath()
  ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
  ctx.fill()
  ctx.shadowBlur = 0

  // Inner
  ctx.fillStyle = isDashing ? '#bbf0ff' : '#88bbff'
  ctx.beginPath()
  ctx.arc(p.x, p.y, p.radius * 0.6, 0, Math.PI * 2)
  ctx.fill()

  // Eye
  ctx.fillStyle = '#fff'
  ctx.beginPath(); ctx.arc(p.x - 3, p.y - 2, 3, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.arc(p.x + 3, p.y - 2, 3, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = '#111'
  ctx.beginPath(); ctx.arc(p.x - 2, p.y - 2, 1.5, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.arc(p.x + 4, p.y - 2, 1.5, 0, Math.PI * 2); ctx.fill()

  // Particles
  for (const pt of s.particles) {
    ctx.globalAlpha = pt.life / pt.maxLife
    ctx.fillStyle = pt.color
    ctx.fillRect(pt.x - pt.size / 2, pt.y - pt.size / 2, pt.size, pt.size)
  }
  ctx.globalAlpha = 1

  // HUD
  ctx.fillStyle = 'rgba(0,0,0,0.6)'
  ctx.fillRect(0, 0, W, 45)

  ctx.fillStyle = '#fff'
  ctx.font = 'bold 18px monospace'
  ctx.fillText(`Score: ${Math.floor(s.score)}`, 10, 30)

  ctx.fillStyle = '#ff8866'
  ctx.fillText(`Time: ${s.time.toFixed(1)}s`, 200, 30)

  ctx.fillStyle = '#ffdd44'
  ctx.fillText(`Difficulty: ${s.difficulty.toFixed(1)}`, 380, 30)

  // Dash cooldown
  if (p.dashCd > 0) {
    ctx.fillStyle = '#666'
    ctx.fillText(`Dash: ${p.dashCd.toFixed(1)}s`, 600, 30)
  } else {
    ctx.fillStyle = '#44ff88'
    ctx.fillText('Dash: READY [SPACE]', 560, 30)
  }

  // Combo
  if (s.combo > 1) {
    ctx.fillStyle = '#ffdd44'
    ctx.font = 'bold 24px monospace'
    ctx.textAlign = 'center'
    ctx.fillText(`x${s.combo} COMBO!`, W / 2, 80)
    ctx.textAlign = 'left'
  }

  // Near miss text
  ctx.font = '12px monospace'
  ctx.fillStyle = '#888'
  ctx.fillText(`Near Misses: ${s.nearMisses}`, 10, H - 10)

  // Game Over
  if (s.gameOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.8)'
    ctx.fillRect(0, 0, W, H)
    ctx.textAlign = 'center'

    ctx.fillStyle = '#ff4444'
    ctx.font = 'bold 48px monospace'
    ctx.fillText('GAME OVER', W / 2, H / 2 - 50)

    ctx.fillStyle = '#fff'
    ctx.font = '20px monospace'
    ctx.fillText(`Score: ${Math.floor(s.score)}`, W / 2, H / 2)

    ctx.fillStyle = '#ffdd44'
    ctx.font = '16px monospace'
    ctx.fillText(`Time Survived: ${s.time.toFixed(1)}s  |  Near Misses: ${s.nearMisses}  |  Arrows Avoided: ${s.arrowsAvoided}`, W / 2, H / 2 + 35)

    ctx.fillStyle = '#6c5ce7'
    ctx.font = '16px monospace'
    ctx.fillText('Press R to restart', W / 2, H / 2 + 70)

    ctx.textAlign = 'left'
  }

  ctx.restore()
}

// ─── React Component ──────────────────────────────────────────────────────
export default function ArrowEscapeGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameRef = useRef<GameState>(createGame())
  const [phase, setPhase] = useState<'idle' | 'playing' | 'over'>('idle')

  const startGame = useCallback(() => {
    const g = createGame()
    g.running = true
    gameRef.current = g
    setPhase('playing')
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const s = gameRef.current

    const handleKeyDown = (e: KeyboardEvent) => {
      s.keys[e.key.toLowerCase()] = true
      if (e.key.toLowerCase() === 'r' && s.gameOver) startGame()
      if (e.key === ' ' && s.player.dashCd <= 0 && !s.gameOver && s.running) {
        s.player.dashTimer = 0.2
        s.player.dashCd = 2
        s.player.invuln = 0.2
        s.particles.push({
          x: s.player.x, y: s.player.y,
          vx: 0, vy: 0, life: 0.3, maxLife: 0.3,
          color: '#88ddff', size: 20,
        })
      }
    }
    const handleKeyUp = (e: KeyboardEvent) => { s.keys[e.key.toLowerCase()] = false }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    let animId = 0
    const loop = (time: number) => {
      const dt = Math.min((time - s.lastTime) / 1000, 0.05)
      s.lastTime = time
      if (s.running) {
        updateGame(s, dt)
        if (s.gameOver) setPhase('over')
      }
      renderGame(ctx, s)
      animId = requestAnimationFrame(loop)
    }
    s.lastTime = performance.now()
    animId = requestAnimationFrame(loop)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      cancelAnimationFrame(animId)
    }
  }, [phase, startGame])

  return (
    <div className="game-page">
      <div className="game-header">
        <Link to="/">← Back</Link>
        <h1>Arrow Escape</h1>
      </div>
      <div className="game-canvas-wrapper">
        <canvas ref={canvasRef} width={W} height={H} />
        {phase === 'idle' && (
          <div className="game-overlay">
            <h2 style={{ color: '#ff6644' }}>Arrow Escape</h2>
            <p>Dodge arrows from every direction! How long can you survive?</p>
            <p style={{ fontSize: '0.9rem', color: '#666' }}>WASD: Move | SPACE: Dash | Near misses = bonus!</p>
            <button className="btn" onClick={startGame}>Start Game</button>
          </div>
        )}
      </div>
      <div className="game-hud">
        <span>WASD: Move</span>
        <span>SPACE: Dash (invulnerable)</span>
        <span>Near misses give bonus points!</span>
      </div>
    </div>
  )
}
