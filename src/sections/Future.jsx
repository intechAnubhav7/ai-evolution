/**
 * Future.jsx — "Beyond the Horizon"
 *
 * Mobile: single-column, Three.js canvas compact
 * Desktop: full cinematic layout
 * Performance: Three.js RAF paused off-screen via IntersectionObserver
 */

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { slideUp, fadeIn, staggerCards, animateBars, fadeInChildren, countUp } from '../utils/scrollAnimations'

gsap.registerPlugin(ScrollTrigger)

const HORIZONS = [
  { tag:'NEAR — 2025→2030', title:'Multimodal Mastery',             pct:97, color:'#00d4ff', icon:'◈',
    desc:'AI sees, hears, reads, and speaks as a unified system. Agents act autonomously in digital environments — booking, coding, researching on your behalf.' },
  { tag:'MID — 2030→2040',  title:'Artificial General Intelligence', pct:71, color:'#7b2fff', icon:'⊗',
    desc:'A system matching human cognitive ability across all domains. It writes research, conducts experiments, builds companies. The boundary between tool and collaborator dissolves.' },
  { tag:'FAR — 2040→2060',  title:'Neural Interface Fusion',         pct:53, color:'#c040ff', icon:'◎',
    desc:'BCIs merge biological and silicon cognition. Memory becomes searchable. The question "where does the human end and the AI begin?" becomes unanswerable.' },
  { tag:'HORIZON — 2060+',  title:'Artificial Superintelligence',    pct:41, color:'#ff2d78', icon:'∞',
    desc:'Recursive self-improvement produces intelligence so vast it becomes incomprehensible to unaugmented humans. Every axis of civilisation transforms simultaneously.' },
]

const QUESTIONS = [
  'Will superintelligent AI be aligned with human values?',
  'Who governs systems smarter than their governors?',
  'What does "work" mean when AI can do nearly everything?',
  'Can consciousness emerge from silicon?',
  'Is accelerating AI the greatest risk or opportunity in history?',
]

/* ── Three.js torus knot ── */
function TorusCanvas({ containerRef }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas    = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const isMobile = window.innerWidth < 768
    const w = container.clientWidth  || 400
    const h = container.clientHeight || 380

    const renderer = new THREE.WebGLRenderer({ canvas, alpha:true, antialias:!isMobile })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1 : 1.5))
    renderer.setSize(w, h)

    const scene  = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(55, w / h, 0.1, 100)
    camera.position.z = 5.5

    const knot = new THREE.Mesh(
      new THREE.TorusKnotGeometry(1.6, 0.38, isMobile ? 100 : 220, 16, 2, 3),
      new THREE.MeshBasicMaterial({ color:0xff2d78, wireframe:true, transparent:true, opacity:0.18 })
    )
    const torus = new THREE.Mesh(
      new THREE.TorusGeometry(1.0, 0.18, 12, 60),
      new THREE.MeshBasicMaterial({ color:0x7b2fff, wireframe:true, transparent:true, opacity:0.22 })
    )
    scene.add(knot, torus)

    if (!isMobile) {
      const pN = 600, pPos = new Float32Array(pN * 3)
      for (let i = 0; i < pN; i++) {
        const t=Math.random()*Math.PI*2, p=Math.acos(2*Math.random()-1), r=2.8+Math.random()*1.2
        pPos[i*3]=r*Math.sin(p)*Math.cos(t); pPos[i*3+1]=r*Math.sin(p)*Math.sin(t); pPos[i*3+2]=r*Math.cos(p)
      }
      const pGeo = new THREE.BufferGeometry()
      pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3))
      scene.add(new THREE.Points(pGeo, new THREE.PointsMaterial({ color:0xff2d78, size:0.03, transparent:true, opacity:0.35 })))
    }

    const st = ScrollTrigger.create({
      trigger: container, start:'top bottom', end:'bottom top',
      onUpdate: (s) => {
        knot.rotation.x  = s.progress * Math.PI * 3
        knot.rotation.y  = s.progress * Math.PI * 2
        torus.rotation.z = s.progress * Math.PI * 4
      },
    })

    let visible = true
    const observer = new IntersectionObserver(
      ([entry]) => { visible = entry.isIntersecting },
      { threshold: 0.05 }
    )
    observer.observe(container)

    let rafId
    const tick = () => {
      rafId = requestAnimationFrame(tick)
      if (!visible) return
      knot.rotation.z  += 0.004
      torus.rotation.x += 0.005
      torus.rotation.y += 0.003
      renderer.render(scene, camera)
    }
    tick()

    const onResize = () => {
      const nw = container.clientWidth, nh = container.clientHeight
      camera.aspect = nw / nh; camera.updateProjectionMatrix(); renderer.setSize(nw, nh)
    }
    window.addEventListener('resize', onResize, { passive:true })

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', onResize)
      observer.disconnect()
      st.kill()
      renderer.dispose()
    }
  }, [containerRef])

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true" />
}

/* ── Section ── */
export default function Future() {
  const sectionRef    = useRef(null)
  const threeRef      = useRef(null)
  const eyebrowRef    = useRef(null)
  const headerRef     = useRef(null)
  const introWrapRef  = useRef(null)
  const cardRefs      = useRef([])
  const barFillRefs   = useRef([])
  const pctSpanRefs   = useRef([])
  const questionsRef  = useRef(null)
  const closingRef    = useRef(null)

  const isTouch = () => typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0)

  useEffect(() => {
    const ctxs = [
      fadeIn(eyebrowRef.current,  { yOffset:14, duration:0.8, st:{ start:'top 84%' } }),
      slideUp(headerRef.current,  { distance:65, duration:1.1, st:{ start:'top 82%' } }),
      fadeIn(introWrapRef.current,{ duration:0.9, st:{ start:'top 80%' } }),
      staggerCards(cardRefs.current, { scaleFrom:0.94, yOffset:55, stagger:0.14, duration:0.8 }),
      animateBars(barFillRefs.current, HORIZONS.map(h => h.pct), { duration:1.6, stagger:0.14 }),
      fadeInChildren(questionsRef.current, '[data-question]', { duration:0.65, stagger:0.12, st:{ start:'top 86%' } }),
      fadeIn(closingRef.current, { yOffset:40, duration:1.2, st:{ start:'top 88%' } }),
    ]

    pctSpanRefs.current.forEach((el, i) => {
      if (!el) return
      countUp(el, HORIZONS[i].pct, { suffix:'%', duration:1.5 })
    })

    return () => ctxs.forEach(c => c.revert())
  }, [])

  const onCardMove = (e, color) => {
    if (isTouch()) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x    = (e.clientX - rect.left) / rect.width  - 0.5
    const y    = (e.clientY - rect.top)  / rect.height - 0.5
    gsap.to(e.currentTarget, {
      rotateY: x * 8, rotateX: -y * 8, scale: 1.02,
      border:    `1px solid ${color}50`,
      boxShadow: `0 24px 60px ${color}18, 0 0 0 1px ${color}25`,
      duration: 0.3, ease:'power2.out', transformPerspective:900,
    })
  }
  const onCardLeave = (e, color) => {
    gsap.to(e.currentTarget, {
      rotateY:0, rotateX:0, scale:1,
      border:`1px solid ${color}1a`, boxShadow:'none',
      duration:0.5, ease:'power2.inOut',
    })
  }

  return (
    <section
      id="future"
      ref={sectionRef}
      className="relative min-h-screen w-full overflow-hidden"
      style={{ background:'linear-gradient(180deg,#020408 0%,#100515 50%,#020408 100%)' }}
    >
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage:'linear-gradient(rgba(255,45,120,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,45,120,0.02) 1px,transparent 1px)',
          backgroundSize:'60px 60px' }} aria-hidden="true" />
      <div className="absolute inset-0 pointer-events-none"
        style={{ background:'radial-gradient(ellipse 60% 50% at 50% 40%,rgba(255,45,120,0.05) 0%,rgba(123,47,255,0.04) 40%,transparent 70%)' }} aria-hidden="true" />

      <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-8 md:px-10 py-20 sm:py-28">

        {/* Header */}
        <div className="text-center mb-10 sm:mb-14">
          <div ref={eyebrowRef} className="inline-flex items-center justify-center gap-3 mb-4 sm:mb-5 opacity-0">
            <span className="w-8 sm:w-10 h-px bg-pink-500/30" />
            <span className="font-mono text-[9px] sm:text-[10px] tracking-[0.35em] sm:tracking-[0.4em] text-pink-400/50 uppercase">
              Chapter 05 — Final
            </span>
            <span className="w-8 sm:w-10 h-px bg-pink-500/30" />
          </div>
          <div ref={headerRef} className="opacity-0">
            <h2 className="leading-none mb-3 sm:mb-4"
              style={{ fontFamily:'"Bebas Neue",cursive', fontSize:'clamp(2.8rem,9vw,10rem)' }}>
              <span className="text-slate-100">WHAT </span>
              <span style={{ background:'linear-gradient(135deg,#7b2fff,#ff2d78)',
                WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
                COMES
              </span>{' '}
              <span className="text-slate-100">NEXT</span>
            </h2>
            <p className="font-mono text-[9px] sm:text-[10px] tracking-[0.4em] text-slate-700 uppercase">
              Projections — Not Predictions
            </p>
          </div>
        </div>

        {/* Three.js centrepiece */}
        <div className="relative h-52 sm:h-64 md:h-80 lg:h-[380px] mb-10 sm:mb-14">
          <div ref={threeRef} className="relative w-full h-full">
            <TorusCanvas containerRef={threeRef} />
          </div>
          {/* Intro overlay */}
          <div ref={introWrapRef} className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-0">
            <div className="max-w-sm sm:max-w-xl text-center rounded-xl sm:rounded-2xl px-5 sm:px-8 py-4 sm:py-6 mx-4"
              style={{ background:'rgba(2,4,8,0.65)', backdropFilter:'blur(20px)', border:'1px solid rgba(255,45,120,0.1)' }}>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed font-light"
                style={{ fontFamily:'"DM Sans",sans-serif' }}>
                We stand at an inflection point. The AI that exists today is barely a prototype of what
                the next decade will bring. Every assumption about work, creativity, and what it means
                to be human is up for renegotiation.
              </p>
            </div>
          </div>
        </div>

        {/* Horizon cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 mb-12 sm:mb-20">
          {HORIZONS.map((h, i) => (
            <div
              key={h.tag}
              ref={el => (cardRefs.current[i] = el)}
              className="rounded-xl p-5 sm:p-6 opacity-0"
              style={{ background:'rgba(6,2,16,0.7)', border:`1px solid ${h.color}1a`, backdropFilter:'blur(12px)' }}
              data-cursor data-accent={h.color}
              onMouseMove={e => onCardMove(e, h.color)}
              onMouseLeave={e => onCardLeave(e, h.color)}
            >
              <div className="flex items-start justify-between mb-3 sm:mb-4">
                <span className="font-mono text-xl sm:text-2xl leading-none"
                  style={{ color:h.color, textShadow:`0 0 20px ${h.color}50` }}>
                  {h.icon}
                </span>
                <span className="font-mono text-[8px] sm:text-[9px] px-2 py-1 rounded tracking-widest text-right"
                  style={{ color:h.color, background:`${h.color}12`, border:`1px solid ${h.color}25` }}>
                  {h.tag}
                </span>
              </div>
              <div className="text-slate-100 mb-2 sm:mb-3 leading-tight"
                style={{ fontFamily:'"Bebas Neue",cursive', fontSize:'clamp(1.2rem,3vw,1.7rem)', letterSpacing:'0.04em' }}>
                {h.title}
              </div>
              <p className="text-slate-500 text-xs leading-relaxed font-light mb-4 sm:mb-5"
                style={{ fontFamily:'"DM Sans",sans-serif' }}>
                {h.desc}
              </p>
              <div>
                <div className="flex justify-between mb-1.5">
                  <span className="font-mono text-[8px] sm:text-[9px] text-slate-700 tracking-widest uppercase">Expert consensus</span>
                  <span ref={el => (pctSpanRefs.current[i] = el)} className="font-mono text-[10px]" style={{ color:h.color }}>0%</span>
                </div>
                <div className="h-px bg-white/5 rounded overflow-hidden">
                  <div ref={el => (barFillRefs.current[i] = el)} className="h-full rounded"
                    style={{ background:`linear-gradient(90deg,${h.color}50,${h.color})`, width:'0%', boxShadow:`0 0 8px ${h.color}50` }} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Open questions */}
        <div className="mb-12 sm:mb-20">
          <div className="mb-4 sm:mb-6">
            <span className="font-mono text-[9px] sm:text-[10px] tracking-[0.4em] text-slate-700 uppercase">
              Open Questions
            </span>
          </div>
          <div ref={questionsRef} className="flex flex-col gap-2 sm:gap-3">
            {QUESTIONS.map((q, i) => (
              <div key={i} data-question className="flex items-start gap-3 sm:gap-4 py-2 sm:py-3"
                style={{ borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                <span className="font-mono text-[9px] sm:text-[10px] text-pink-500/40 shrink-0 pt-0.5">
                  {String(i+1).padStart(2,'0')}
                </span>
                <span className="text-slate-500 text-xs sm:text-sm font-light leading-relaxed"
                  style={{ fontFamily:'"DM Sans",sans-serif' }}>{q}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Grand closing */}
        <div ref={closingRef} className="text-center opacity-0">
          <div className="h-px w-20 sm:w-24 bg-gradient-to-r from-transparent via-pink-500/30 to-transparent mx-auto mb-8 sm:mb-12" />
          <p className="text-slate-200 font-light leading-relaxed mb-4 sm:mb-6 mx-auto"
            style={{ fontFamily:'"DM Sans",sans-serif', fontSize:'clamp(1rem,2vw,1.4rem)', fontStyle:'italic', maxWidth:'42rem' }}>
            "The question is not whether intelligent machines will surpass us.
            The question is whether we will be wise enough to build them well."
          </p>
          <div className="font-mono text-[9px] sm:text-[10px] tracking-widest text-slate-700 mb-12 sm:mb-16">
            — The Challenge of Our Century
          </div>
          <div className="text-flicker font-black uppercase leading-none tracking-tight select-none"
            style={{ fontFamily:'"Bebas Neue",cursive', fontSize:'clamp(2rem,8vw,8rem)',
              background:'linear-gradient(135deg,#020408 0%,#1a1a2e 50%,#020408 100%)',
              WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text',
              WebkitTextStroke:'1px rgba(255,45,120,0.15)' }}>
            THE STORY CONTINUES
          </div>
          <div className="mt-8 sm:mt-10 flex items-center justify-center gap-4">
            <span className="w-12 sm:w-16 h-px bg-gradient-to-r from-transparent to-cyan-500/30" />
            <span className="font-mono text-[8px] sm:text-[9px] tracking-[0.4em] sm:tracking-[0.5em] text-slate-800 uppercase">
              End of Chapter 05
            </span>
            <span className="w-12 sm:w-16 h-px bg-gradient-to-l from-transparent to-pink-500/30" />
          </div>
        </div>
      </div>

      {/* Parallax orb */}
      <div data-parallax="0.2"
        className="parallax-slow absolute bottom-[10%] right-[5%] w-64 sm:w-[500px] h-64 sm:h-[500px] rounded-full pointer-events-none"
        style={{ background:'radial-gradient(circle,rgba(255,45,120,0.04) 0%,transparent 70%)', filter:'blur(80px)' }}
        aria-hidden="true" />
    </section>
  )
}
