/**
 * Hero.jsx — "The Spark of Thought"
 *
 * Performance:
 *   • Particle count reduced on mobile (600 vs 1800)
 *   • pixel ratio capped at 1.5
 *   • RAF cancelled on unmount
 *   • All GSAP contexts reverted on unmount
 */

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { gsap } from 'gsap'
import { heroTitleReveal, fadeIn, fadeInChildren } from '../utils/scrollAnimations'

const STAT_ITEMS = [
  { value: '1950', label: 'Year AI was named' },
  { value: '70+',  label: 'Years of research'  },
  { value: '∞',    label: 'Potential ahead'    },
]

const isMobile = () => typeof window !== 'undefined' && window.innerWidth < 768

export default function Hero() {
  const canvasRef  = useRef(null)
  const eyebrowRef = useRef(null)
  const line1Ref   = useRef(null)
  const line2Ref   = useRef(null)
  const line3Ref   = useRef(null)
  const bodyRef    = useRef(null)
  const statsRef   = useRef(null)
  const scrollRef  = useRef(null)

  /* ── Three.js particle cloud ── */
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const mobile   = isMobile()
    const N        = mobile ? 600 : 1800
    const pixelRatio = Math.min(window.devicePixelRatio, mobile ? 1 : 1.5)

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: !mobile })
    renderer.setPixelRatio(pixelRatio)
    renderer.setSize(window.innerWidth, window.innerHeight)

    const scene  = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 100)
    camera.position.z = 6

    /* Build particle geometry */
    const pos = new Float32Array(N * 3)
    const col = new Float32Array(N * 3)
    const pal = [
      new THREE.Color('#00d4ff'),
      new THREE.Color('#7b2fff'),
      new THREE.Color('#ff2d78'),
    ]

    for (let i = 0; i < N; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi   = Math.acos(2 * Math.random() - 1)
      const r     = 2.5 + Math.random() * 1.5
      pos[i*3]   = r * Math.sin(phi) * Math.cos(theta)
      pos[i*3+1] = r * Math.sin(phi) * Math.sin(theta)
      pos[i*3+2] = r * Math.cos(phi)
      const c = pal[i % pal.length]
      col[i*3] = c.r; col[i*3+1] = c.g; col[i*3+2] = c.b
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    geo.setAttribute('color',    new THREE.BufferAttribute(col, 3))
    const pts = new THREE.Points(geo,
      new THREE.PointsMaterial({ size: 0.045, vertexColors: true, transparent: true, opacity: 0.65 })
    )
    scene.add(pts)

    /* Connection lines — skip on mobile to save GPU */
    if (!mobile) {
      const linePts = []
      for (let i = 0; i < 120; i++) {
        const ai = Math.floor(Math.random() * N) * 3
        const bi = Math.floor(Math.random() * N) * 3
        linePts.push(pos[ai],pos[ai+1],pos[ai+2], pos[bi],pos[bi+1],pos[bi+2])
      }
      const lGeo = new THREE.BufferGeometry()
      lGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(linePts), 3))
      scene.add(new THREE.LineSegments(lGeo,
        new THREE.LineBasicMaterial({ color: 0x00d4ff, transparent: true, opacity: 0.06 })
      ))
    }

    let mx = 0, my = 0
    const onMouse = (e) => {
      mx = (e.clientX / window.innerWidth  - 0.5) * 2
      my = -(e.clientY / window.innerHeight - 0.5) * 2
    }
    window.addEventListener('mousemove', onMouse, { passive: true })

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', onResize, { passive: true })

    let rafId
    const tick = () => {
      rafId = requestAnimationFrame(tick)
      pts.rotation.y += 0.0015 + mx * 0.0003
      pts.rotation.x += 0.0005 + my * 0.0002
      renderer.render(scene, camera)
    }
    tick()

    return () => {
      window.removeEventListener('mousemove', onMouse)
      window.removeEventListener('resize', onResize)
      cancelAnimationFrame(rafId)
      geo.dispose()
      renderer.dispose()
    }
  }, [])

  /* ── GSAP entrance ── */
  useEffect(() => {
    const ctxs = [
      fadeIn(eyebrowRef.current, { yOffset: 16, duration: 0.9, delay: 0.3 }),
      heroTitleReveal(
        [line1Ref.current, line2Ref.current, line3Ref.current],
        { distance: 110, skewY: 5, stagger: 0.15, delay: 0.55 }
      ),
      fadeIn(bodyRef.current,   { yOffset: 28, duration: 0.9, delay: 1.0 }),
      fadeInChildren(statsRef.current, '*', { yOffset: 24, duration: 0.7, stagger: 0.12, delay: 1.15 }),
      fadeIn(scrollRef.current, { duration: 0.8, delay: 1.5 }),
    ]

    /* Stat card hover — GSAP (graceful on touch: no-op) */
    const cards = statsRef.current?.querySelectorAll('.stat-card') ?? []
    cards.forEach(card => {
      card.addEventListener('mouseenter', () => gsap.to(card, { y: -4, duration: 0.3, ease: 'power2.out' }))
      card.addEventListener('mouseleave', () => gsap.to(card, { y:  0, duration: 0.4, ease: 'power2.inOut' }))
    })

    return () => ctxs.forEach(c => c.revert())
  }, [])

  return (
    <section
      id="hero"
      className="relative min-h-screen w-full overflow-hidden flex flex-col items-center justify-center"
      style={{ background: 'radial-gradient(ellipse 100% 80% at 50% 0%, #070d1a 0%, #020408 70%)' }}
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true" />

      {/* Vignette */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 55% 55% at 50% 50%, transparent 40%, #020408 100%)' }}
        aria-hidden="true" />

      {/* Top rule */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" />

      {/* Parallax orbs — hidden on mobile via pointer-events-none, no layout impact */}
      <div data-parallax="0.15" className="parallax-slow absolute top-[15%] left-[8%] w-40 sm:w-64 h-40 sm:h-64 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle,rgba(0,212,255,0.06) 0%,transparent 70%)', filter:'blur(40px)' }} aria-hidden="true" />
      <div data-parallax="0.25" className="parallax-medium absolute top-[20%] right-[10%] w-48 sm:w-96 h-48 sm:h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle,rgba(123,47,255,0.07) 0%,transparent 70%)', filter:'blur(60px)' }} aria-hidden="true" />
      <div data-parallax="0.35" className="parallax-fast absolute bottom-[20%] left-[20%] w-40 sm:w-72 h-40 sm:h-72 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle,rgba(255,45,120,0.05) 0%,transparent 70%)', filter:'blur(50px)' }} aria-hidden="true" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-5 sm:px-8 max-w-6xl mx-auto w-full">

        {/* Eyebrow */}
        <div ref={eyebrowRef} className="flex items-center gap-3 mb-6 sm:mb-8 opacity-0" aria-hidden="true">
          <span className="w-6 sm:w-8 h-px bg-cyan-400/60" />
          <span className="font-mono text-[10px] sm:text-[11px] tracking-[0.35em] sm:tracking-[0.45em] text-cyan-400/70 uppercase">
            Chapter 01 — Genesis
          </span>
          <span className="w-6 sm:w-8 h-px bg-cyan-400/60" />
        </div>

        {/* Title — three lines, each clipped */}
        <div className="overflow-hidden mb-1 sm:mb-2">
          <h1 ref={line1Ref}
            className="block font-black uppercase leading-[0.9] tracking-tight opacity-0"
            style={{ fontFamily:'"Bebas Neue",cursive', fontSize:'clamp(3.5rem,12vw,15rem)', color:'#e8f4f8' }}>
            THE
          </h1>
        </div>
        <div className="overflow-hidden mb-1 sm:mb-2">
          <h1 ref={line2Ref}
            className="block font-black uppercase leading-[0.9] tracking-tight opacity-0"
            style={{ fontFamily:'"Bebas Neue",cursive', fontSize:'clamp(3.5rem,12vw,15rem)',
              background:'linear-gradient(135deg,#00d4ff 0%,#7b2fff 60%)',
              WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
            EVOLUTION
          </h1>
        </div>
        <div className="overflow-hidden mb-6 sm:mb-10">
          <h1 ref={line3Ref}
            className="block font-black uppercase leading-[0.9] tracking-tight opacity-0"
            style={{ fontFamily:'"Bebas Neue",cursive', fontSize:'clamp(3.5rem,12vw,15rem)',
              background:'linear-gradient(135deg,#7b2fff 0%,#ff2d78 100%)',
              WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
            OF AI
          </h1>
        </div>

        {/* Body copy */}
        <p ref={bodyRef}
          className="max-w-2xl text-slate-400 leading-relaxed font-light mb-10 sm:mb-14 opacity-0 text-sm sm:text-base"
          style={{ fontFamily:'"DM Sans",sans-serif' }}>
          From a single question —{' '}
          <em className="text-cyan-300/80 not-italic">"Can machines think?"</em>{' '}
          — humanity embarked on the most consequential technological journey in history.
          Seventy years of breakthroughs, failures, and the relentless pursuit of artificial minds.
        </p>

        {/* Stats */}
        <div ref={statsRef} className="grid grid-cols-3 gap-px w-full max-w-xs sm:max-w-lg">
          {STAT_ITEMS.map(({ value, label }) => (
            <div
              key={label}
              className="stat-card flex flex-col items-center py-4 sm:py-5 px-2 sm:px-4"
              data-cursor
              data-accent="rgba(0,212,255,0.8)"
              style={{ background:'rgba(0,212,255,0.04)', border:'1px solid rgba(0,212,255,0.12)' }}
            >
              <span className="font-black leading-none mb-1"
                style={{ fontFamily:'"Bebas Neue",cursive', fontSize:'clamp(1.5rem,4vw,3rem)',
                  background:'linear-gradient(135deg,#00d4ff,#7b2fff)',
                  WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
                {value}
              </span>
              <span className="font-mono text-[8px] sm:text-[10px] tracking-widest text-slate-500 uppercase text-center leading-tight">
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll cue */}
      <div ref={scrollRef} className="absolute bottom-8 sm:bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-0">
        <span className="font-mono text-[9px] sm:text-[10px] tracking-[0.4em] text-slate-600 uppercase">Scroll</span>
        <div className="w-px h-10 sm:h-14" style={{ background:'linear-gradient(to bottom,#00d4ff80,transparent)' }} />
      </div>

      {/* Corner marker — desktop only */}
      <div className="hidden sm:block absolute bottom-8 right-6 font-mono text-[10px] text-slate-700 tracking-widest text-right leading-5">
        SYS.ONLINE<br />INIT → 1950
      </div>

      {/* Bottom rule */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/20 to-transparent" />
    </section>
  )
}
