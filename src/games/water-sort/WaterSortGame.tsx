import { useEffect, useRef, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'

// ─── Types ─────────────────────────────────────────────────────────────────
type Color = string

interface Cup {
  colors: Color[]   // bottom to top
  capacity: number
}

interface Level {
  cups: Cup[]
  extraCups: number  // number of empty cups provided
}

interface AnimState {
  fromCup: number
  toCup: number
  color: Color
  count: number
  progress: number  // 0..1
  phase: 'lift' | 'move' | 'pour' | 'down'
}

// ─── Level Generator ───────────────────────────────────────────────────────
const PALETTES: Color[][] = [
  ['#ef4444', '#22c55e', '#3b82f6', '#eab308'],
  ['#ef4444', '#22c55e', '#3b82f6', '#eab308', '#a855f7'],
  ['#ef4444', '#22c55e', '#3b82f6', '#eab308', '#a855f7', '#ec4899'],
  ['#ef4444', '#22c55e', '#3b82f6', '#eab308', '#a855f7', '#ec4899', '#f97316'],
  ['#ef4444', '#22c55e', '#3b82f6', '#eab308', '#a855f7', '#ec4899', '#f97316', '#06b6d4'],
  ['#ef4444', '#22c55e', '#3b82f6', '#eab308', '#a855f7', '#ec4899', '#f97316', '#06b6d4', '#84cc16'],
  ['#ef4444', '#22c55e', '#3b82f6', '#eab308', '#a855f7', '#ec4899', '#f97316', '#06b6d4', '#84cc16', '#14b8a6'],
]

function generateLevel(levelNum: number): Level {
  const numColors = Math.min(4 + Math.floor(levelNum / 2), 10)
  const capacity = 4
  const palette = PALETTES[Math.min(numColors - 4, PALETTES.length - 1)]
  const colors = palette.slice(0, numColors)

  // ── Build from solved state, then shuffle via valid pours ──────────
  // This guarantees every level is solvable.
  // Add 2 empty cups (always 2 for good maneuverability)
  const extraCups = 2

  for (let attempt = 0; attempt < 50; attempt++) {
    // Start with sorted cups: each color fills one cup completely
    const cups: Cup[] = []
    for (const c of colors) {
      cups.push({ colors: [c, c, c, c], capacity })
    }
    // Empty cups for sorting room
    for (let i = 0; i < extraCups; i++) {
      cups.push({ colors: [], capacity })
    }

    // Shuffle by making random valid pours from the solved state
    // More moves = more shuffled = harder puzzle
    const shuffleMoves = 20 + levelNum * 8 + Math.floor(Math.random() * 10)
    for (let m = 0; m < shuffleMoves; m++) {
      // Collect all valid pours
      const validPours: [number, number][] = []
      for (let f = 0; f < cups.length; f++) {
        if (cups[f].colors.length === 0) continue
        for (let t = 0; t < cups.length; t++) {
          if (f === t) continue
          if (canPour(cups[f], cups[t])) validPours.push([f, t])
        }
      }
      if (validPours.length === 0) break

      // Pick a random valid pour (bias toward "interesting" moves)
      // Prefer moves that don't just undo the last move
      const [fIdx, tIdx] = validPours[Math.floor(Math.random() * validPours.length)]
      const from = cups[fIdx]
      const to = cups[tIdx]
      const count = pourCount(from, to)
      const topColor = from.colors[from.colors.length - 1]
      for (let i = 0; i < count; i++) {
        from.colors.pop()
        to.colors.push(topColor)
      }
    }

    // Verify: not already solved and no cup is fully sorted already
    if (!isLevelComplete(cups)) {
      const sortedCount = cups.filter(c => c.colors.length === capacity && c.colors.every(cl => cl === c.colors[0])).length
      // At least some cups should be mixed up
      if (sortedCount < numColors - 1) {
        return { cups, extraCups }
      }
    }
  }

  // Fallback: return a simple but solvable level
  const cups: Cup[] = []
  for (let i = 0; i < numColors; i++) {
    cups.push({ colors: [colors[i], colors[(i + 1) % numColors], colors[i], colors[(i + 1) % numColors]], capacity })
  }
  for (let i = 0; i < extraCups; i++) {
    cups.push({ colors: [], capacity })
  }
  return { cups, extraCups }
}

function isCupComplete(cup: Cup): boolean {
  if (cup.colors.length === 0) return true
  if (cup.colors.length !== cup.capacity) return false
  return cup.colors.every(c => c === cup.colors[0])
}

function isLevelComplete(cups: Cup[]): boolean {
  return cups.every(c => isCupComplete(c))
}

function canPour(from: Cup, to: Cup): boolean {
  if (from.colors.length === 0) return false
  if (to.colors.length >= to.capacity) return false
  if (to.colors.length === 0) return true
  return from.colors[from.colors.length - 1] === to.colors[to.colors.length - 1]
}

function pourCount(from: Cup, to: Cup): number {
  const topColor = from.colors[from.colors.length - 1]
  let count = 0
  for (let i = from.colors.length - 1; i >= 0; i--) {
    if (from.colors[i] === topColor) count++
    else break
  }
  const room = to.capacity - to.colors.length
  return Math.min(count, room)
}

// ─── Game State ────────────────────────────────────────────────────────────
interface GameState {
  cups: Cup[]
  level: number
  selectedCup: number | null
  moves: number
  anim: AnimState | null
  won: boolean
  undoStack: Cup[][]
}

function createLevelState(level: number): GameState {
  const lvl = generateLevel(level)
  return {
    cups: lvl.cups.map(c => ({ ...c, colors: [...c.colors] })),
    level,
    selectedCup: null,
    moves: 0,
    anim: null,
    won: false,
    undoStack: [],
  }
}

// ─── Rendering ─────────────────────────────────────────────────────────────
const CUP_W = 56
const CUP_H = 140
const SEG_H = 30
const CUP_GAP = 16

function getLayout(cups: Cup[], canvasW: number, canvasH: number) {
  const totalCups = cups.length
  const maxPerRow = Math.min(totalCups, Math.floor(canvasW / (CUP_W + CUP_GAP)))
  const rows = Math.ceil(totalCups / maxPerRow)
  const cupsPerRow = Math.ceil(totalCups / rows)

  const rowWidth = cupsPerRow * CUP_W + (cupsPerRow - 1) * CUP_GAP
  const startX = (canvasW - rowWidth) / 2

  return cups.map((_, i) => {
    const row = Math.floor(i / cupsPerRow)
    const col = i % cupsPerRow
    const rowCount = Math.min(cupsPerRow, totalCups - row * cupsPerRow)
    const rowW = rowCount * CUP_W + (rowCount - 1) * CUP_GAP
    const rx = (canvasW - rowW) / 2
    const x = rx + col * (CUP_W + CUP_GAP)
    const y = 120 + row * (CUP_H + 50)
    return { x, y }
  })
}

function drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

function renderGame(ctx: CanvasRenderingContext2D, s: GameState, W: number, H: number) {
  // Background
  const grad = ctx.createLinearGradient(0, 0, 0, H)
  grad.addColorStop(0, '#0f0f2a')
  grad.addColorStop(1, '#1a1035')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, W, H)

  // Title
  ctx.fillStyle = '#a855f7'
  ctx.font = 'bold 28px monospace'
  ctx.textAlign = 'center'
  ctx.fillText(`Level ${s.level + 1}`, W / 2, 38)

  ctx.fillStyle = '#8888aa'
  ctx.font = '14px monospace'
  ctx.fillText(`Moves: ${s.moves}`, W / 2, 62)

  const layout = getLayout(s.cups, W, H)

  // Draw cups
  for (let i = 0; i < s.cups.length; i++) {
    const cup = s.cups[i]
    const pos = layout[i]
    const isSelected = s.selectedCup === i
    const isComplete = isCupComplete(cup) && cup.colors.length > 0

    // Cup body (glass)
    ctx.fillStyle = isSelected ? 'rgba(168, 85, 247, 0.15)' : 'rgba(255,255,255,0.05)'
    ctx.strokeStyle = isSelected ? '#a855f7' : (isComplete ? '#22c55e' : 'rgba(255,255,255,0.2)')
    ctx.lineWidth = isSelected ? 3 : 2

    // Draw cup shape (trapezoid)
    const cupTopW = CUP_W + 8
    const cupBotW = CUP_W - 8
    const topX = pos.x - 4
    const botX = pos.x + 4

    ctx.beginPath()
    ctx.moveTo(topX, pos.y)
    ctx.lineTo(topX + cupTopW, pos.y)
    ctx.lineTo(botX + cupBotW, pos.y + CUP_H)
    ctx.lineTo(botX, pos.y + CUP_H)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()

    // Water segments (bottom to top)
    const segH = (CUP_H - 8) / cup.capacity
    for (let j = 0; j < cup.colors.length; j++) {
      const color = cup.colors[j]
      const segY = pos.y + CUP_H - (j + 1) * segH - 2

      // Calculate the trapezoid width at this height
      const t = (j + 1) / cup.capacity
      const leftEdge = topX + (botX - topX) * t
      const rightEdge = (topX + cupTopW) + ((botX + cupBotW) - (topX + cupTopW)) * t
      const leftEdgePrev = topX + (botX - topX) * (j / cup.capacity)
      const rightEdgePrev = (topX + cupTopW) + ((botX + cupBotW) - (topX + cupTopW)) * (j / cup.capacity)

      ctx.fillStyle = color
      ctx.beginPath()
      ctx.moveTo(leftEdgePrev + 2, segY)
      ctx.lineTo(rightEdgePrev - 2, segY)
      ctx.lineTo(rightEdge - 2, segY + segH)
      ctx.lineTo(leftEdge + 2, segY + segH)
      ctx.closePath()
      ctx.fill()

      // Highlight on top of water
      ctx.fillStyle = 'rgba(255,255,255,0.15)'
      ctx.fillRect(leftEdgePrev + 4, segY, rightEdgePrev - leftEdgePrev - 8, 3)
    }

    // Cup number label
    ctx.fillStyle = '#666'
    ctx.font = '11px monospace'
    ctx.textAlign = 'center'
    ctx.fillText(`${i + 1}`, pos.x + CUP_W / 2, pos.y + CUP_H + 16)

    // Complete checkmark
    if (isComplete) {
      ctx.fillStyle = '#22c55e'
      ctx.font = 'bold 20px monospace'
      ctx.fillText('✓', pos.x + CUP_W / 2, pos.y - 8)
    }
  }

  // Win overlay
  if (s.won) {
    ctx.fillStyle = 'rgba(0,0,0,0.8)'
    ctx.fillRect(0, 0, W, H)
    ctx.textAlign = 'center'

    ctx.fillStyle = '#22c55e'
    ctx.font = 'bold 42px monospace'
    ctx.fillText('LEVEL COMPLETE!', W / 2, H / 2 - 40)

    ctx.fillStyle = '#fff'
    ctx.font = '20px monospace'
    ctx.fillText(`Completed in ${s.moves} moves`, W / 2, H / 2 + 5)

    ctx.fillStyle = '#a855f7'
    ctx.font = '16px monospace'
    ctx.fillText('Press ENTER for next level', W / 2, H / 2 + 45)

    ctx.textAlign = 'left'
  }

  // Bottom hint
  ctx.fillStyle = '#555'
  ctx.font = '12px monospace'
  ctx.textAlign = 'center'
  ctx.fillText('Click a cup to select, then click another to pour | U = Undo | R = Restart', W / 2, H - 12)
  ctx.textAlign = 'left'
}

// ─── React Component ──────────────────────────────────────────────────────
export default function WaterSortGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameRef = useRef<GameState>(createLevelState(0))
  const [phase, setPhase] = useState<'idle' | 'playing' | 'won'>('idle')
  const animRef = useRef<number>(0)
  const W = 800, H = 600

  const startGame = useCallback(() => {
    gameRef.current = createLevelState(0)
    setPhase('playing')
  }, [])

  const nextLevel = useCallback(() => {
    const next = gameRef.current.level + 1
    gameRef.current = createLevelState(next)
    setPhase('playing')
  }, [])

  const restart = useCallback(() => {
    gameRef.current = createLevelState(gameRef.current.level)
    setPhase('playing')
  }, [])

  const undo = useCallback(() => {
    const s = gameRef.current
    if (s.undoStack.length > 0) {
      s.cups = s.undoStack.pop()!.map(c => ({ ...c, colors: [...c.colors] }))
      s.moves = Math.max(0, s.moves - 1)
      s.selectedCup = null
    }
  }, [])

  // Click handler
  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const s = gameRef.current
    if (s.won) return
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const mx = (e.clientX - rect.left) * (W / rect.width)
    const my = (e.clientY - rect.top) * (H / rect.height)

    const layout = getLayout(s.cups, W, H)

    // Find clicked cup
    let clickedCup = -1
    for (let i = 0; i < layout.length; i++) {
      const p = layout[i]
      if (mx >= p.x - 4 && mx <= p.x + CUP_W + 4 && my >= p.y && my <= p.y + CUP_H + 20) {
        clickedCup = i
        break
      }
    }

    if (clickedCup < 0) {
      s.selectedCup = null
      return
    }

    if (s.selectedCup === null) {
      // Select a cup (must have colors)
      if (s.cups[clickedCup].colors.length > 0) {
        s.selectedCup = clickedCup
      }
    } else if (s.selectedCup === clickedCup) {
      // Deselect
      s.selectedCup = null
    } else {
      // Try to pour
      const from = s.cups[s.selectedCup]
      const to = s.cups[clickedCup]

      if (canPour(from, to)) {
        // Save undo state
        s.undoStack.push(s.cups.map(c => ({ ...c, colors: [...c.colors] })))

        const count = pourCount(from, to)
        const topColor = from.colors[from.colors.length - 1]
        for (let i = 0; i < count; i++) {
          from.colors.pop()
          to.colors.push(topColor)
        }
        s.moves++
        s.selectedCup = null

        // Check win
        if (isLevelComplete(s.cups)) {
          s.won = true
          setPhase('won')
        }
      } else {
        // Select the new cup instead if it has colors
        if (s.cups[clickedCup].colors.length > 0) {
          s.selectedCup = clickedCup
        } else {
          s.selectedCup = null
        }
      }
    }
  }, [])

  // Keyboard handler
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const s = gameRef.current
      if (e.key === 'Enter' && s.won) nextLevel()
      if (e.key.toLowerCase() === 'r') restart()
      if (e.key.toLowerCase() === 'u') undo()

      // Number key to select cup
      const num = parseInt(e.key)
      if (num >= 1 && num <= s.cups.length) {
        const idx = num - 1
        if (s.selectedCup === null) {
          if (s.cups[idx].colors.length > 0) s.selectedCup = idx
        } else if (s.selectedCup === idx) {
          s.selectedCup = null
        } else {
          // Simulate pour
          const from = s.cups[s.selectedCup]
          const to = s.cups[idx]
          if (canPour(from, to)) {
            s.undoStack.push(s.cups.map(c => ({ ...c, colors: [...c.colors] })))
            const count = pourCount(from, to)
            const topColor = from.colors[from.colors.length - 1]
            for (let i = 0; i < count; i++) { from.colors.pop(); to.colors.push(topColor) }
            s.moves++
            s.selectedCup = null
            if (isLevelComplete(s.cups)) { s.won = true; setPhase('won') }
          } else if (s.cups[idx].colors.length > 0) {
            s.selectedCup = idx
          }
        }
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [nextLevel, restart, undo])

  // Render loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!

    const loop = () => {
      renderGame(ctx, gameRef.current, W, H)
      animRef.current = requestAnimationFrame(loop)
    }
    animRef.current = requestAnimationFrame(loop)

    return () => cancelAnimationFrame(animRef.current)
  }, [])

  return (
    <div className="game-page">
      <div className="game-header">
        <Link to="/">← Back</Link>
        <h1>Cups - Water Sort</h1>
      </div>
      <div className="game-canvas-wrapper">
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          onClick={handleClick}
          style={{ cursor: 'pointer' }}
        />
        {phase === 'idle' && (
          <div className="game-overlay">
            <h2 style={{ color: '#a855f7' }}>Cups - Water Sort</h2>
            <p>Sort the colored water into cups so each cup has only one color!</p>
            <p style={{ fontSize: '0.9rem', color: '#666' }}>Click cups to pour | Match top colors | Fill cups with one color</p>
            <button className="btn" onClick={startGame}>Start Game</button>
          </div>
        )}
      </div>
      <div className="game-hud">
        <span>Click: Select & Pour</span>
        <span>U: Undo</span>
        <span>R: Restart Level</span>
        <span>1-9: Quick select cup</span>
      </div>
    </div>
  )
}
