/**
 * GradientDescent.jsx — "The Mathematics of Learning"
 *
 * Full-screen section showcasing the interactive 3D gradient
 * descent visualizer. Positioned between MachineLearning and
 * DeepLearning for natural narrative flow.
 */

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { fadeIn, slideUp, staggerCards } from '../utils/scrollAnimations'
import GradientDescentScene from '../components/GradientDescentScene'

gsap.registerPlugin(ScrollTrigger)

const CONCEPTS = [
  {
    icon: '∇',
    title: 'Loss Surface',
    desc: 'Every point on the surface is a possible set of model weights. The height is the error — lower is better. The goal of training is to find the lowest valley.',
    color: '#00d4ff',
  },
  {
    icon: '∂',
    title: 'Gradient',
    desc: 'The gradient is the slope at any point — it tells the model which direction is "uphill." We step in the opposite direction to descend.',
    color: '#7b2fff',
  },
  {
    icon: 'η',
    title: 'Learning Rate',
    desc: 'How big each step is. Too small → slow convergence. Too large → the ball overshoots and bounces around. Finding the right rate is critical.',
    color: '#c040ff',
  },
  {
    icon: '⚡',
    title: 'Adam Optimizer',
    desc: 'Adapts the learning rate per parameter using momentum. Escapes local minima that trap basic SGD — the most widely used optimizer in modern deep learning.',
    color: '#ff2d78',
  },
]

export default function GradientDescent() {
  const sectionRef  = useRef(null)
  const eyebrowRef  = useRef(null)
  const titleRef    = useRef(null)
  const subtitleRef = useRef(null)
  const sceneRef    = useRef(null)
  const cardRefs    = useRef([])
  const equationRef = useRef(null)

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    const ctxs = [
      fadeIn(eyebrowRef.current,  { yOffset: 14, duration: 0.8, st: { start: 'top 84%' } }),
      slideUp(titleRef.current,   { distance: 60, duration: 1.1, st: { start: 'top 82%' } }),
      fadeIn(subtitleRef.current, { yOffset: 25, duration: 0.9, st: { start: 'top 84%' } }),
      fadeIn(sceneRef.current,    { yOffset: 30, duration: 1.0, st: { start: 'top 80%' } }),
      staggerCards(cardRefs.current, { scaleFrom: 0.93, yOffset: 40, stagger: 0.12, duration: 0.75 }),
      fadeIn(equationRef.current, { yOffset: 20, duration: 0.9, st: { start: 'top 88%' } }),
    ]

    return () => ctxs.forEach(c => c.revert())
  }, [])

  return (
    <section
      id="gradient-descent"
      ref={sectionRef}
      className="relative min-h-screen w-full overflow-hidden py-20 sm:py-28"
      style={{ background: 'linear-gradient(175deg, #020408 0%, #04080f 40%, #070314 75%, #020408 100%)' }}
    >
      {/* Background grid */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(0,212,255,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(0,212,255,0.02) 1px,transparent 1px)',
          backgroundSize: '60px 60px',
        }} aria-hidden="true" />

      {/* Glow */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 70% 50% at 50% 30%, rgba(123,47,255,0.07) 0%, transparent 70%)' }}
        aria-hidden="true" />

      <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-8 md:px-10">

        {/* ── Header ── */}
        <div className="text-center mb-10 sm:mb-14">
          <div ref={eyebrowRef} className="inline-flex items-center gap-3 mb-4 sm:mb-5 opacity-0">
            <span className="w-8 sm:w-10 h-px bg-violet-400/40" />
            <span className="font-mono text-[10px] tracking-[0.4em] text-violet-400/60 uppercase">
              Interactive · Chapter 03.5
            </span>
            <span className="w-8 sm:w-10 h-px bg-violet-400/40" />
          </div>

          <div ref={titleRef} className="opacity-0">
            <h2 className="leading-none mb-3 sm:mb-4"
              style={{ fontFamily: '"Bebas Neue", cursive', fontSize: 'clamp(2.6rem, 8vw, 9rem)' }}>
              <span className="text-slate-100">GRADIENT </span>
              <span style={{
                background: 'linear-gradient(135deg, #7b2fff, #ff2d78)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>DESCENT</span>
            </h2>
          </div>

          <p ref={subtitleRef}
            className="text-slate-400 max-w-2xl mx-auto leading-relaxed text-sm sm:text-base font-light opacity-0"
            style={{ fontFamily: '"DM Sans", sans-serif' }}>
            Every neural network learns by rolling downhill. The 3D surface below is the{' '}
            <em className="text-violet-300/80 not-italic">loss landscape</em> — a map of how wrong the model is
            for every possible combination of weights. Watch different optimizers find the minimum.
          </p>
        </div>

        {/* ── 3D Scene ── */}
        <div ref={sceneRef} className="mb-10 sm:mb-14 opacity-0">
          <GradientDescentScene />
        </div>

        {/* ── Update equation ── */}
        <div ref={equationRef}
          className="mb-10 sm:mb-14 rounded-xl p-5 sm:p-6 text-center opacity-0"
          style={{ background: 'rgba(123,47,255,0.06)', border: '1px solid rgba(123,47,255,0.18)' }}>
          <div className="font-mono text-[10px] tracking-widest text-violet-400/50 uppercase mb-3">
            Weight Update Rule
          </div>
          {/* SGD update rule — displayed as styled text, not MathML */}
          <div className="font-mono text-sm sm:text-base text-slate-200 tracking-wide">
            <span style={{ color: '#7b2fff' }}>w</span>
            <sub className="text-[10px] text-slate-500">t+1</sub>
            {' = '}
            <span style={{ color: '#7b2fff' }}>w</span>
            <sub className="text-[10px] text-slate-500">t</sub>
            {' − '}
            <span style={{ color: '#00d4ff' }}>η</span>
            {' · '}
            <span style={{ color: '#ff2d78' }}>∇</span>
            <sub className="text-[10px] text-slate-500">w</sub>
            <span style={{ color: '#c040ff' }}>L</span>
            <span className="text-slate-500">(</span>
            <span style={{ color: '#7b2fff' }}>w</span>
            <sub className="text-[10px] text-slate-500">t</sub>
            <span className="text-slate-500">)</span>
          </div>
          <div className="flex justify-center gap-6 mt-4 flex-wrap">
            {[
              { sym: 'w', color: '#7b2fff',  label: 'weights' },
              { sym: 'η', color: '#00d4ff',  label: 'learning rate' },
              { sym: '∇L', color: '#ff2d78', label: 'gradient of loss' },
            ].map(({ sym, color, label }) => (
              <div key={label} className="flex items-center gap-1.5">
                <span className="font-mono text-sm" style={{ color }}>{sym}</span>
                <span className="font-mono text-[10px] text-slate-600">= {label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Concept cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {CONCEPTS.map((c, i) => (
            <div
              key={c.title}
              ref={el => (cardRefs.current[i] = el)}
              className="rounded-xl p-5 opacity-0"
              style={{ background: 'rgba(8,4,20,0.7)', border: `1px solid ${c.color}1e`, backdropFilter: 'blur(12px)' }}
              onMouseEnter={e => {
                gsap.to(e.currentTarget, {
                  y: -5, scale: 1.02,
                  boxShadow: `0 16px 50px ${c.color}18, 0 0 0 1px ${c.color}45`,
                  duration: 0.35, ease: 'power2.out',
                })
              }}
              onMouseLeave={e => {
                gsap.to(e.currentTarget, {
                  y: 0, scale: 1, boxShadow: 'none',
                  border: `1px solid ${c.color}1e`,
                  duration: 0.45, ease: 'power2.inOut',
                })
              }}
            >
              <div className="font-mono text-2xl mb-3" style={{ color: c.color, textShadow: `0 0 20px ${c.color}60` }}>
                {c.icon}
              </div>
              <div className="text-slate-100 mb-2 leading-tight"
                style={{ fontFamily: '"Bebas Neue", cursive', fontSize: '1.25rem', letterSpacing: '0.06em' }}>
                {c.title}
              </div>
              <p className="text-slate-500 text-xs leading-relaxed font-light"
                style={{ fontFamily: '"DM Sans", sans-serif' }}>
                {c.desc}
              </p>
            </div>
          ))}
        </div>

        {/* ── Try it prompt ── */}
        <div className="mt-10 sm:mt-12 text-center">
          <p className="font-mono text-[11px] tracking-widest text-slate-700 uppercase">
            Try switching optimizers above ↑ — watch how SGD gets stuck but Adam finds the minimum
          </p>
        </div>
      </div>
    </section>
  )
}
