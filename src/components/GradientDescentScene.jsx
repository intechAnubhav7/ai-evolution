/**
 * GradientDescentScene.jsx
 *
 * Interactive 3D loss landscape built with Three.js.
 * Shows a parametric surface (w1, w2) → Loss using a multi-well
 * function that looks like a real neural network loss landscape.
 *
 * Features:
 *   • Smooth wireframe + solid surface with color gradient (low=cyan, high=pink)
 *   • Animated ball rolling down the gradient with momentum
 *   • Configurable learning rate (0.01 → 0.9) — shows overshoot / convergence
 *   • Configurable optimizer: SGD, Momentum, Adam
 *   • Live readout: epoch, loss, weights (w1, w2)
 *   • Play / pause / reset controls
 *   • Orbit controls (mouse drag to rotate, scroll to zoom)
 *   • Pause RAF when off-screen via IntersectionObserver
 */

import { useEffect, useRef, useCallback, useState } from 'react'
import * as THREE from 'three'

/* ─── Surface math ─────────────────────────────────────────── */
// Multi-bowl loss landscape: two local minima + one global minimum
// Interesting enough to show SGD getting stuck vs Adam escaping
const GRID = 80          // resolution of the surface mesh
const RANGE = 3.0        // w1, w2 ∈ [-RANGE, RANGE]
const HEIGHT_SCALE = 1.4 // vertical exaggeration

function loss(w1, w2) {
  // Primary bowl (global min near 0,0)
  const bowl  = 0.18 * (w1 * w1 + w2 * w2)
  // Saddle perturbation
  const saddle = 0.08 * Math.cos(w1 * 1.4) * Math.cos(w2 * 1.1)
  // Local traps
  const trap1 = -0.55 * Math.exp(-((w1 + 1.5) ** 2 + (w2 + 1.2) ** 2) / 0.8)
  const trap2 = -0.40 * Math.exp(-((w1 - 1.8) ** 2 + (w2 - 0.8) ** 2) / 0.6)
  const trap3 = -0.30 * Math.exp(-((w1 - 0.5) ** 2 + (w2 + 1.8) ** 2) / 0.5)
  // Ridge
  const ridge = 0.12 * Math.sin(w1 * 2.2) * Math.sin(w2 * 1.8)
  return bowl + saddle + trap1 + trap2 + trap3 + ridge + 0.9
}

// Numerical gradient
function gradient(w1, w2) {
  const h = 0.0001
  return {
    dw1: (loss(w1 + h, w2) - loss(w1 - h, w2)) / (2 * h),
    dw2: (loss(w1, w2 + h) - loss(w1, w2 - h)) / (2 * h),
  }
}

/* ─── Color mapping (loss → color) ───────────────────────────── */
function lossColor(l, minL, maxL) {
  const t = Math.max(0, Math.min(1, (l - minL) / (maxL - minL)))
  // Cyan (#00d4ff) → Violet (#7b2fff) → Pink (#ff2d78)
  const r = t < 0.5 ? Math.round(0   + t * 2 * 123) : Math.round(123 + (t - 0.5) * 2 * 132)
  const g = t < 0.5 ? Math.round(212 - t * 2 * 170) : Math.round(42  - (t - 0.5) * 2 * 42)
  const b = t < 0.5 ? Math.round(255 - t * 2 * 8)   : Math.round(247 - (t - 0.5) * 2 * 169)
  return new THREE.Color(r / 255, g / 255, b / 255)
}

/* ─── Build surface geometry ──────────────────────────────────── */
function buildSurface() {
  const geo = new THREE.BufferGeometry()
  const positions = []
  const colors    = []
  const indices   = []

  // Compute all vertex positions
  const verts = []
  let minL = Infinity, maxL = -Infinity

  for (let i = 0; i <= GRID; i++) {
    for (let j = 0; j <= GRID; j++) {
      const w1 = -RANGE + (i / GRID) * 2 * RANGE
      const w2 = -RANGE + (j / GRID) * 2 * RANGE
      const l  = loss(w1, w2)
      if (l < minL) minL = l
      if (l > maxL) maxL = l
      verts.push({ x: w1, y: l * HEIGHT_SCALE, z: w2, l })
    }
  }

  // Build position + color arrays
  for (const v of verts) {
    positions.push(v.x, v.y, v.z)
    const c = lossColor(v.l, minL, maxL)
    colors.push(c.r, c.g, c.b)
  }

  // Build index array (two triangles per quad)
  for (let i = 0; i < GRID; i++) {
    for (let j = 0; j < GRID; j++) {
      const a = i * (GRID + 1) + j
      const b = a + 1
      const c = a + (GRID + 1)
      const d = c + 1
      indices.push(a, b, c,  b, d, c)
    }
  }

  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geo.setAttribute('color',    new THREE.Float32BufferAttribute(colors, 3))
  geo.setIndex(indices)
  geo.computeVertexNormals()

  return { geo, minL, maxL }
}

/* ─── Optimizer step functions ────────────────────────────────── */
function stepSGD(state, lr) {
  const { w1, w2 } = state
  const g = gradient(w1, w2)
  return { w1: w1 - lr * g.dw1, w2: w2 - lr * g.dw2 }
}

function stepMomentum(state, lr, momentum = 0.85) {
  const g  = gradient(state.w1, state.w2)
  const v1 = momentum * (state.v1 || 0) - lr * g.dw1
  const v2 = momentum * (state.v2 || 0) - lr * g.dw2
  return { w1: state.w1 + v1, w2: state.w2 + v2, v1, v2 }
}

function stepAdam(state, lr, t) {
  const beta1 = 0.9, beta2 = 0.999, eps = 1e-8
  const g  = gradient(state.w1, state.w2)
  const m1 = beta1 * (state.m1 || 0) + (1 - beta1) * g.dw1
  const m2 = beta1 * (state.m2 || 0) + (1 - beta1) * g.dw2
  const v1 = beta2 * (state.v1 || 0) + (1 - beta2) * g.dw1 ** 2
  const v2 = beta2 * (state.v2 || 0) + (1 - beta2) * g.dw2 ** 2
  const mh1 = m1 / (1 - beta1 ** t), mh2 = m2 / (1 - beta1 ** t)
  const vh1 = v1 / (1 - beta2 ** t), vh2 = v2 / (1 - beta2 ** t)
  return {
    w1: state.w1 - lr * mh1 / (Math.sqrt(vh1) + eps),
    w2: state.w2 - lr * mh2 / (Math.sqrt(vh2) + eps),
    m1, m2, v1, v2,
  }
}

/* ═══════════════════════════════════════════════════════════════
   React component
═══════════════════════════════════════════════════════════════ */
export default function GradientDescentScene() {
  const mountRef      = useRef(null)
  const sceneRef      = useRef(null)   // holds all Three.js state
  const animRef       = useRef(null)   // optimizer animation state
  const rafRef        = useRef(null)
  const visibleRef    = useRef(true)
  const isRunningRef  = useRef(false)

  // UI state (React)
  const [lr,         setLr]         = useState(0.05)
  const [optimizer,  setOptimizer]  = useState('adam')
  const [isRunning,  setIsRunning]  = useState(false)
  const [epoch,      setEpoch]      = useState(0)
  const [currentLoss,setCurrentLoss]= useState(null)
  const [w1Display,  setW1Display]  = useState(null)
  const [w2Display,  setW2Display]  = useState(null)
  const [converged,  setConverged]  = useState(false)
  const [trailLen,   setTrailLen]   = useState(0)

  /* ── Build Three.js scene ── */
  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const W = mount.clientWidth
    const H = mount.clientHeight

    /* Renderer */
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    renderer.setSize(W, H)
    renderer.setClearColor(0x000000, 0)
    mount.appendChild(renderer.domElement)

    /* Scene & camera */
    const scene  = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 100)
    camera.position.set(5, 4.5, 5)
    camera.lookAt(0, 0.5, 0)

    /* Orbit controls (manual — no import needed) */
    let isDragging = false, prevX = 0, prevY = 0
    let theta = Math.PI / 4, phi = Math.PI / 3.5, radius = 9
    const target = new THREE.Vector3(0, 0.5, 0)

    function updateCamera() {
      camera.position.set(
        target.x + radius * Math.sin(phi) * Math.sin(theta),
        target.y + radius * Math.cos(phi),
        target.z + radius * Math.sin(phi) * Math.cos(theta)
      )
      camera.lookAt(target)
    }
    updateCamera()

    const onMouseDown = (e) => { isDragging = true; prevX = e.clientX; prevY = e.clientY }
    const onMouseUp   = () => { isDragging = false }
    const onMouseMove = (e) => {
      if (!isDragging) return
      const dx = e.clientX - prevX, dy = e.clientY - prevY
      theta -= dx * 0.005
      phi    = Math.max(0.2, Math.min(Math.PI / 2, phi + dy * 0.005))
      prevX = e.clientX; prevY = e.clientY
      updateCamera()
    }
    const onWheel = (e) => {
      radius = Math.max(4, Math.min(16, radius + e.deltaY * 0.01))
      updateCamera()
      e.preventDefault()
    }
    // Touch support
    let prevTX = 0, prevTY = 0
    const onTouchStart = (e) => { if (e.touches.length === 1) { prevTX = e.touches[0].clientX; prevTY = e.touches[0].clientY } }
    const onTouchMove  = (e) => {
      if (e.touches.length !== 1) return
      const dx = e.touches[0].clientX - prevTX, dy = e.touches[0].clientY - prevTY
      theta -= dx * 0.005; phi = Math.max(0.2, Math.min(Math.PI / 2, phi + dy * 0.005))
      prevTX = e.touches[0].clientX; prevTY = e.touches[0].clientY
      updateCamera(); e.preventDefault()
    }

    renderer.domElement.addEventListener('mousedown',  onMouseDown)
    renderer.domElement.addEventListener('mousemove',  onMouseMove)
    renderer.domElement.addEventListener('mouseup',    onMouseUp)
    renderer.domElement.addEventListener('wheel',      onWheel,      { passive: false })
    renderer.domElement.addEventListener('touchstart', onTouchStart, { passive: true })
    renderer.domElement.addEventListener('touchmove',  onTouchMove,  { passive: false })

    /* Build surface */
    const { geo, minL, maxL } = buildSurface()

    // Solid surface
    const solidMat  = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide, transparent: true, opacity: 0.82 })
    const solidMesh = new THREE.Mesh(geo, solidMat)
    scene.add(solidMesh)

    // Wireframe overlay
    const wireMat  = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.04 })
    const wireMesh = new THREE.Mesh(geo, wireMat)
    scene.add(wireMesh)

    /* Lighting */
    scene.add(new THREE.AmbientLight(0xffffff, 0.6))
    const dirLight = new THREE.DirectionalLight(0x00d4ff, 0.8)
    dirLight.position.set(4, 8, 4)
    scene.add(dirLight)
    const dirLight2 = new THREE.DirectionalLight(0xff2d78, 0.4)
    dirLight2.position.set(-4, 4, -4)
    scene.add(dirLight2)

    /* Ball (optimizer position) */
    const ballGeo  = new THREE.SphereGeometry(0.12, 20, 16)
    const ballMat  = new THREE.MeshBasicMaterial({ color: 0xffffff })
    const ball     = new THREE.Mesh(ballGeo, ballMat)
    scene.add(ball)

    /* Ball glow sprite */
    const spriteMat = new THREE.SpriteMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    const sprite = new THREE.Sprite(spriteMat)
    sprite.scale.setScalar(0.6)
    scene.add(sprite)

    /* Trail (line of past positions) */
    const MAX_TRAIL = 300
    const trailPositions = new Float32Array(MAX_TRAIL * 3)
    const trailGeo  = new THREE.BufferGeometry()
    trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3))
    trailGeo.setDrawRange(0, 0)
    const trailMat  = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 })
    const trailLine = new THREE.Line(trailGeo, trailMat)
    scene.add(trailLine)

    /* Axes */
    const axisLen = RANGE + 0.3
    const makeAxis = (from, to, color) => {
      const g = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(...from), new THREE.Vector3(...to)])
      return new THREE.Line(g, new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.35 }))
    }
    scene.add(makeAxis([-axisLen, 0, 0], [axisLen, 0, 0], 0x00d4ff))
    scene.add(makeAxis([0, 0, -axisLen], [0, 0, axisLen], 0xff2d78))
    scene.add(makeAxis([0, 0, 0], [0, HEIGHT_SCALE * maxL + 0.3, 0], 0x7b2fff))

    /* Resize */
    const onResize = () => {
      const nW = mount.clientWidth, nH = mount.clientHeight
      camera.aspect = nW / nH; camera.updateProjectionMatrix()
      renderer.setSize(nW, nH)
    }
    window.addEventListener('resize', onResize, { passive: true })

    /* Visibility gate */
    const observer = new IntersectionObserver(
      ([e]) => { visibleRef.current = e.isIntersecting },
      { threshold: 0.05 }
    )
    observer.observe(mount)

    /* Store scene ref */
    sceneRef.current = { renderer, scene, camera, ball, sprite, trailGeo, trailPositions, trailLine, minL, maxL }

    /* Init ball position */
    const startW1 = -2.1, startW2 = 1.8
    const startL  = loss(startW1, startW2)
    ball.position.set(startW1, startL * HEIGHT_SCALE + 0.14, startW2)
    sprite.position.copy(ball.position)
    animRef.current = { w1: startW1, w2: startW2, t: 1, trailCount: 0 }

    /* RAF loop */
    const tick = () => {
      rafRef.current = requestAnimationFrame(tick)
      if (!visibleRef.current) return
      renderer.render(scene, camera)
    }
    tick()

    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', onResize)
      observer.disconnect()
      renderer.domElement.removeEventListener('mousedown',  onMouseDown)
      renderer.domElement.removeEventListener('mousemove',  onMouseMove)
      renderer.domElement.removeEventListener('mouseup',    onMouseUp)
      renderer.domElement.removeEventListener('wheel',      onWheel)
      renderer.domElement.removeEventListener('touchstart', onTouchStart)
      renderer.domElement.removeEventListener('touchmove',  onTouchMove)
      geo.dispose(); solidMat.dispose(); wireMat.dispose()
      ballGeo.dispose(); ballMat.dispose(); trailGeo.dispose(); trailMat.dispose()
      renderer.dispose()
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement)
      sceneRef.current = null
    }
  }, [])

  /* ── Optimizer animation loop (separate from render loop) ── */
  useEffect(() => {
    if (!isRunning) return

    const STEPS_PER_FRAME = 1   // one optimizer step per animation frame
    const PAUSE_MS = 28         // ~35 fps for the optimizer steps

    let stepId

    const doStep = () => {
      const s = sceneRef.current
      const a = animRef.current
      if (!s || !a) return

      let next
      const t = a.t + 1

      if (optimizer === 'sgd')      next = stepSGD(a, lr)
      else if (optimizer === 'momentum') next = stepMomentum(a, lr)
      else                          next = stepAdam(a, lr, t)

      // Clamp to surface bounds
      next.w1 = Math.max(-RANGE + 0.1, Math.min(RANGE - 0.1, next.w1))
      next.w2 = Math.max(-RANGE + 0.1, Math.min(RANGE - 0.1, next.w2))
      const l  = loss(next.w1, next.w2)
      const yy = l * HEIGHT_SCALE + 0.14

      // Move ball
      s.ball.position.set(next.w1, yy, next.w2)
      s.sprite.position.copy(s.ball.position)

      // Update trail
      const tc = Math.min(a.trailCount + 1, 300)
      const base = (tc - 1) * 3
      s.trailPositions[base]     = next.w1
      s.trailPositions[base + 1] = yy - 0.05
      s.trailPositions[base + 2] = next.w2
      s.trailGeo.attributes.position.needsUpdate = true
      s.trailGeo.setDrawRange(0, tc)

      // Update animRef
      animRef.current = { ...next, t, trailCount: tc }

      // Update React state (throttled)
      setEpoch(t)
      setCurrentLoss(parseFloat(l.toFixed(4)))
      setW1Display(parseFloat(next.w1.toFixed(3)))
      setW2Display(parseFloat(next.w2.toFixed(3)))
      setTrailLen(tc)

      // Convergence check
      const g = gradient(next.w1, next.w2)
      const gNorm = Math.sqrt(g.dw1 ** 2 + g.dw2 ** 2)
      if (gNorm < 0.005 || t > 800) {
        setIsRunning(false)
        setConverged(true)
        isRunningRef.current = false
        return
      }

      stepId = setTimeout(doStep, PAUSE_MS)
    }

    stepId = setTimeout(doStep, 0)
    return () => clearTimeout(stepId)
  }, [isRunning, optimizer, lr])

  /* ── Controls ── */
  const handleReset = useCallback(() => {
    setIsRunning(false)
    setConverged(false)
    setEpoch(0)
    setCurrentLoss(null)
    setW1Display(null)
    setW2Display(null)
    setTrailLen(0)
    isRunningRef.current = false

    const s = sceneRef.current
    if (!s) return

    const startW1 = -2.1 + (Math.random() - 0.5) * 0.4
    const startW2 =  1.8 + (Math.random() - 0.5) * 0.4
    const startL  = loss(startW1, startW2)
    s.ball.position.set(startW1, startL * HEIGHT_SCALE + 0.14, startW2)
    s.sprite.position.copy(s.ball.position)
    s.trailGeo.setDrawRange(0, 0)
    animRef.current = { w1: startW1, w2: startW2, t: 1, trailCount: 0 }
  }, [])

  const handlePlay = useCallback(() => {
    if (converged) handleReset()
    setIsRunning(v => !v)
    setConverged(false)
  }, [converged, handleReset])

  /* ── Render ── */
  return (
    <div className="relative w-full rounded-2xl overflow-hidden"
      style={{ background:'rgba(4,6,14,0.95)', border:'1px solid rgba(0,212,255,0.18)' }}>

      {/* 3D canvas */}
      <div ref={mountRef} className="w-full" style={{ height: 420 }} />

      {/* Drag hint */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 font-mono text-[9px] tracking-widest text-slate-600 uppercase pointer-events-none select-none">
        drag to rotate · scroll to zoom
      </div>

      {/* Live stats bar */}
      <div className="absolute top-3 right-4 flex flex-col gap-1 items-end">
        <div className="font-mono text-[10px] tracking-wider"
          style={{ color: '#00d4ff' }}>
          EPOCH <span className="text-white">{epoch || '—'}</span>
        </div>
        <div className="font-mono text-[10px] tracking-wider"
          style={{ color: '#7b2fff' }}>
          LOSS <span className="text-white">{currentLoss !== null ? currentLoss : '—'}</span>
        </div>
        <div className="font-mono text-[10px] tracking-wider text-slate-500">
          w₁ <span className="text-slate-300">{w1Display !== null ? w1Display : '—'}</span>
        </div>
        <div className="font-mono text-[10px] tracking-wider text-slate-500">
          w₂ <span className="text-slate-300">{w2Display !== null ? w2Display : '—'}</span>
        </div>
      </div>

      {/* Converged badge */}
      {converged && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <div className="font-mono text-xs tracking-widest px-4 py-2 rounded-lg"
            style={{ background:'rgba(0,212,255,0.12)', border:'1px solid rgba(0,212,255,0.4)', color:'#00d4ff' }}>
            ✓ CONVERGED
          </div>
        </div>
      )}

      {/* Controls panel */}
      <div className="p-4 border-t flex flex-wrap gap-4 items-center"
        style={{ borderColor:'rgba(0,212,255,0.1)', background:'rgba(2,4,10,0.8)' }}>

        {/* Play / Reset */}
        <div className="flex gap-2">
          <button
            onClick={handlePlay}
            className="font-mono text-[11px] tracking-widest px-4 py-1.5 rounded transition-all duration-200"
            style={{
              background: isRunning ? 'rgba(255,45,120,0.12)' : 'rgba(0,212,255,0.10)',
              border:     isRunning ? '1px solid rgba(255,45,120,0.5)' : '1px solid rgba(0,212,255,0.45)',
              color:      isRunning ? '#ff2d78' : '#00d4ff',
            }}
          >
            {isRunning ? '⏸ PAUSE' : converged ? '↺ RESTART' : '▶ RUN'}
          </button>
          <button
            onClick={handleReset}
            className="font-mono text-[11px] tracking-widest px-3 py-1.5 rounded transition-all duration-200"
            style={{ background:'rgba(123,47,255,0.08)', border:'1px solid rgba(123,47,255,0.35)', color:'#7b2fff' }}
          >
            ↺ RESET
          </button>
        </div>

        {/* Optimizer selector */}
        <div className="flex flex-col gap-0.5">
          <span className="font-mono text-[9px] text-slate-600 tracking-widest uppercase">Optimizer</span>
          <div className="flex gap-1">
            {['sgd','momentum','adam'].map(opt => (
              <button
                key={opt}
                onClick={() => { setOptimizer(opt); handleReset() }}
                className="font-mono text-[10px] tracking-wider px-2.5 py-1 rounded transition-all duration-200 uppercase"
                style={{
                  background: optimizer === opt ? 'rgba(123,47,255,0.2)'   : 'transparent',
                  border:     optimizer === opt ? '1px solid rgba(123,47,255,0.6)' : '1px solid rgba(255,255,255,0.08)',
                  color:      optimizer === opt ? '#c040ff' : '#4a6580',
                }}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* Learning rate slider */}
        <div className="flex flex-col gap-1 flex-1 min-w-[160px]">
          <div className="flex justify-between items-center">
            <span className="font-mono text-[9px] text-slate-600 tracking-widest uppercase">Learning Rate</span>
            <span className="font-mono text-[11px]" style={{ color:'#00d4ff' }}>{lr.toFixed(3)}</span>
          </div>
          <input
            type="range"
            min="0.001"
            max="0.5"
            step="0.001"
            value={lr}
            onChange={e => { setLr(parseFloat(e.target.value)); if (!isRunning) return }}
            className="w-full h-1 rounded appearance-none"
            style={{ accentColor:'#00d4ff', background:'rgba(255,255,255,0.08)' }}
          />
          <div className="flex justify-between font-mono text-[8px] text-slate-700">
            <span>0.001 slow</span>
            <span>0.5 fast →overshoot</span>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="px-4 pb-3 flex flex-wrap gap-4">
        {[
          { color:'#00d4ff', label:'Low loss (minimum)' },
          { color:'#7b2fff', label:'Mid loss' },
          { color:'#ff2d78', label:'High loss' },
          { color:'#ffffff', label:'Ball = current weights' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: color }} />
            <span className="font-mono text-[9px] text-slate-500">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
