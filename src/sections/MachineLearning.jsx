/**
 * MachineLearning.jsx — "Teaching by Example"
 *
 * Mobile: single-column, Three.js canvas below content
 * Desktop: two-column grid
 * Performance: Three.js canvas uses IntersectionObserver (in NeuralNetworkScene pattern)
 */

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { slideIn, fadeIn, staggerCards, animateBars, fadeInChildren } from '../utils/scrollAnimations'

gsap.registerPlugin(ScrollTrigger)

const PARADIGMS = [
  { name:'Supervised Learning',    desc:'Labeled examples teach the model. Classification, regression — the workhorse of applied ML.',                    pct:88, color:'#00d4ff' },
  { name:'Unsupervised Learning',  desc:'No labels. The algorithm discovers its own structure — clusters, embeddings, hidden anomalies.',                  pct:72, color:'#4ab8ff' },
  { name:'Reinforcement Learning', desc:'An agent acts, earns reward or penalty, refines its policy. Powers games, robotics, and real-world control.',    pct:78, color:'#7b2fff' },
  { name:'Semi-Supervised',        desc:'A small labeled set plus a vast unlabeled sea — the practical reality of most real-world datasets.',             pct:60, color:'#c040ff' },
]

const MILESTONES = [
  { year:'1992', event:'TD-Gammon beats world-class backgammon players via self-play' },
  { year:'1997', event:'Deep Blue defeats Garry Kasparov — a cultural watershed' },
  { year:'2001', event:'Random Forests & ensemble methods transform applied ML' },
  { year:'2009', event:'ImageNet launches — 14 million labeled images that change everything' },
]

/* ── Three.js canvas (inline, not a separate component) ── */
function IcosahedronCanvas({ containerRef }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas    = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const w = container.clientWidth  || 400
    const h = container.clientHeight || 480

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    renderer.setSize(w, h)

    const scene  = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(55, w / h, 0.1, 100)
    camera.position.z = 5

    const outerMesh = new THREE.Mesh(
      new THREE.IcosahedronGeometry(2, 2),
      new THREE.MeshBasicMaterial({ color:0x00d4ff, wireframe:true, transparent:true, opacity:0.12 })
    )
    const midMesh = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.4, 1),
      new THREE.MeshBasicMaterial({ color:0x7b2fff, wireframe:true, transparent:true, opacity:0.20 })
    )
    const innerMesh = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.7),
      new THREE.MeshBasicMaterial({ color:0xff2d78, wireframe:true, transparent:true, opacity:0.35 })
    )
    scene.add(outerMesh, midMesh, innerMesh)

    /* Particle halo */
    const pN = 400, pPos = new Float32Array(pN * 3)
    for (let i = 0; i < pN; i++) {
      const t=Math.random()*Math.PI*2, p=Math.acos(2*Math.random()-1), r=2.6+Math.random()*0.8
      pPos[i*3]=r*Math.sin(p)*Math.cos(t); pPos[i*3+1]=r*Math.sin(p)*Math.sin(t); pPos[i*3+2]=r*Math.cos(p)
    }
    const pGeo = new THREE.BufferGeometry()
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3))
    scene.add(new THREE.Points(pGeo, new THREE.PointsMaterial({ color:0x00d4ff, size:0.025, transparent:true, opacity:0.4 })))

    /* Scroll-driven rotation */
    const st = ScrollTrigger.create({
      trigger: container,
      start: 'top bottom', end: 'bottom top',
      onUpdate: (s) => {
        outerMesh.rotation.y = s.progress * Math.PI * 4
        outerMesh.rotation.x = s.progress * Math.PI * 2
        midMesh.rotation.y   = -s.progress * Math.PI * 3
        innerMesh.rotation.x = s.progress * Math.PI * 5
      },
    })

    let rafId
    const tick = () => {
      rafId = requestAnimationFrame(tick)
      outerMesh.rotation.z += 0.002
      midMesh.rotation.x   += 0.003
      innerMesh.rotation.y += 0.007
      renderer.render(scene, camera)
    }
    tick()

    const onResize = () => {
      const nw = container.clientWidth, nh = container.clientHeight
      camera.aspect = nw / nh
      camera.updateProjectionMatrix()
      renderer.setSize(nw, nh)
    }
    window.addEventListener('resize', onResize, { passive: true })

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', onResize)
      st.kill()
      pGeo.dispose()
      renderer.dispose()
    }
  }, [containerRef])

  return (
    <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true" />
  )
}

/* ── Section ── */
export default function MachineLearning() {
  const sectionRef    = useRef(null)
  const threeWrapRef  = useRef(null)
  const eyebrowRef    = useRef(null)
  const titleRef      = useRef(null)
  const bodyRef       = useRef([])
  const barRowRefs    = useRef([])
  const barFillRefs   = useRef([])
  const milestonesRef = useRef(null)
  const threeColRef   = useRef(null)

  useEffect(() => {
    const ctxs = [
      fadeIn(eyebrowRef.current, { yOffset:14, duration:0.8, st:{ start:'top 84%' } }),
      slideIn(titleRef.current,  { direction:'left', distance:70, duration:1.1, st:{ start:'top 82%' } }),
      fadeIn(bodyRef.current,    { yOffset:30, duration:0.85, stagger:0.14, st:{ start:'top 86%' } }),
      staggerCards(barRowRefs.current, { yOffset:20, scaleFrom:1, stagger:0.10, duration:0.6, st:{ start:'top 88%' } }),
      animateBars(barFillRefs.current, PARADIGMS.map(p => p.pct), { duration:1.4, stagger:0.14 }),
      fadeInChildren(milestonesRef.current, '[data-milestone]', { duration:0.65, stagger:0.10, st:{ start:'top 86%' } }),
      slideIn(threeColRef.current, { direction:'right', distance:60, duration:1.1, st:{ start:'top 80%' } }),
    ]

    return () => ctxs.forEach(c => c.revert())
  }, [])

  return (
    <section
      id="ml"
      ref={sectionRef}
      className="relative min-h-screen w-full overflow-hidden"
      style={{ background:'linear-gradient(160deg,#020408 0%,#06101f 50%,#020408 100%)' }}
    >
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage:'linear-gradient(rgba(0,212,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(0,212,255,0.025) 1px,transparent 1px)',
          backgroundSize:'60px 60px' }} aria-hidden="true" />
      <div className="absolute inset-0 pointer-events-none"
        style={{ background:'radial-gradient(ellipse 60% 70% at 15% 50%,rgba(0,212,255,0.05) 0%,transparent 70%)' }} aria-hidden="true" />

      <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 md:px-10 py-20 sm:py-28">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* ── Left: copy ── */}
          <div className="flex flex-col order-2 lg:order-1">

            <div ref={eyebrowRef} className="flex items-center gap-3 mb-5 opacity-0">
              <span className="w-7 sm:w-8 h-px bg-cyan-400/40" />
              <span className="font-mono text-[10px] tracking-[0.4em] text-cyan-400/60 uppercase">Chapter 03</span>
            </div>

            <div ref={titleRef} className="mb-6 sm:mb-8 opacity-0">
              <h2 className="leading-none" style={{ fontFamily:'"Bebas Neue",cursive', fontSize:'clamp(2.8rem,7vw,8rem)' }}>
                <span className="text-slate-100">MACHINE</span><br />
                <span style={{ background:'linear-gradient(135deg,#00d4ff,#7b2fff)',
                  WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
                  LEARNING
                </span>
              </h2>
            </div>

            <p ref={el => (bodyRef.current[0] = el)}
              className="text-slate-400 leading-relaxed text-sm mb-3 opacity-0"
              style={{ fontFamily:'"DM Sans",sans-serif' }}>
              The insight that changed AI forever: instead of programming rules explicitly,
              let the machine{' '}
              <em className="text-cyan-300/80 not-italic">learn</em> them from data.
              Statistical methods replaced logic trees — and the gap between what computers
              could and couldn't do began to close.
            </p>
            <p ref={el => (bodyRef.current[1] = el)}
              className="text-slate-500 leading-relaxed text-sm mb-8 sm:mb-10 opacity-0"
              style={{ fontFamily:'"DM Sans",sans-serif' }}>
              SVMs, random forests, gradient boosting — elegant mathematics identifying spam,
              predicting prices, diagnosing cancer. All without a human writing a single rule.
            </p>

            {/* Paradigm bars */}
            <div className="flex flex-col gap-4 sm:gap-5 mb-10 sm:mb-12">
              {PARADIGMS.map((p, i) => (
                <div
                  key={p.name}
                  ref={el => (barRowRefs.current[i] = el)}
                  className="opacity-0 rounded-lg p-2.5 sm:p-3 -mx-2.5 sm:-mx-3 hover-border-glow transition-all duration-300"
                  onMouseEnter={e => gsap.to(e.currentTarget, { x:4, duration:0.3, ease:'power2.out' })}
                  onMouseLeave={e => gsap.to(e.currentTarget, { x:0, duration:0.4, ease:'power2.inOut' })}
                >
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="font-mono text-[10px] sm:text-[11px] tracking-wider text-slate-300">{p.name}</span>
                    <span className="font-mono text-[10px]" style={{ color:p.color }}>{p.pct}%</span>
                  </div>
                  <p className="text-slate-600 text-[11px] sm:text-xs mb-2 font-light leading-snug"
                    style={{ fontFamily:'"DM Sans",sans-serif' }}>{p.desc}</p>
                  <div className="h-px bg-white/5 rounded overflow-hidden">
                    <div ref={el => (barFillRefs.current[i] = el)} className="h-full rounded"
                      style={{ background:`linear-gradient(90deg,${p.color}60,${p.color})`, width:'0%', boxShadow:`0 0 8px ${p.color}50` }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Milestones */}
            <div ref={milestonesRef} className="flex flex-col gap-2">
              {MILESTONES.map(({ year, event }) => (
                <div
                  key={year}
                  data-milestone
                  className="flex gap-3 sm:gap-4 items-start p-2 -mx-2 rounded transition-all duration-300"
                  style={{ borderLeft:'1px solid rgba(0,212,255,0.15)', paddingLeft:'0.75rem' }}
                  onMouseEnter={e => {
                    gsap.to(e.currentTarget, { x:5, duration:0.3, ease:'power2.out' })
                    e.currentTarget.style.borderLeftColor = 'rgba(0,212,255,0.5)'
                    e.currentTarget.style.background      = 'rgba(0,212,255,0.025)'
                  }}
                  onMouseLeave={e => {
                    gsap.to(e.currentTarget, { x:0, duration:0.4, ease:'power2.inOut' })
                    e.currentTarget.style.borderLeftColor = 'rgba(0,212,255,0.15)'
                    e.currentTarget.style.background      = 'transparent'
                  }}
                >
                  <span className="font-mono text-[10px] sm:text-[11px] text-cyan-400/70 shrink-0 pt-0.5">{year}</span>
                  <span className="text-slate-500 text-[11px] sm:text-xs leading-relaxed font-light"
                    style={{ fontFamily:'"DM Sans",sans-serif' }}>{event}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right: Three.js ── */}
          <div ref={threeColRef} className="order-1 lg:order-2 opacity-0">
            <div ref={threeWrapRef} className="relative w-full h-64 sm:h-80 md:h-96 lg:h-[480px]">
              <IcosahedronCanvas containerRef={threeWrapRef} />

              {/* Floating labels */}
              <div className="absolute inset-0 pointer-events-none">
                {[
                  { text:'REGRESSION',     top:'8%',   left:'6%',  color:'#00d4ff' },
                  { text:'CLUSTERING',     top:'8%',   right:'6%', color:'#7b2fff' },
                  { text:'CLASSIFICATION', bottom:'8%',left:'6%',  color:'#7b2fff' },
                  { text:'ENSEMBLES',      bottom:'8%',right:'6%', color:'#c040ff' },
                ].map(({ text, color, ...pos }) => (
                  <span key={text} className="absolute font-mono text-[9px] tracking-widest uppercase hidden sm:block"
                    style={{ color:`${color}55`, ...pos }}>{text}</span>
                ))}
              </div>

              {/* Centre badge */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center pointer-events-none"
                style={{ background:'rgba(0,212,255,0.06)', border:'1px solid rgba(0,212,255,0.2)', backdropFilter:'blur(8px)' }}>
                <span className="font-mono text-[8px] sm:text-[9px] tracking-widest text-cyan-400/60 text-center leading-tight">ML<br/>CORE</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
