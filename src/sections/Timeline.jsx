/**
 * Timeline.jsx — "Early AI: The Pioneer Years"
 *
 * Mobile: stacks cards vertically, spine moves to left edge
 * Desktop: alternating left/right cards on centre spine
 * Performance: ScrollTrigger scrub for spine draw
 */

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { fadeIn, slideUp, scrubSpine, exitFade } from '../utils/scrollAnimations'

gsap.registerPlugin(ScrollTrigger)

const EVENTS = [
  { year:'1950', tag:'FOUNDATION',       title:'The Turing Test',         accent:'#00d4ff', icon:'◈',
    body:'Alan Turing publishes "Computing Machinery and Intelligence," posing the deceptively simple question: "Can machines think?" His imitation game becomes the first formal benchmark for machine cognition — a philosophical gauntlet that still echoes today.' },
  { year:'1956', tag:'BIRTH OF A FIELD', title:'Dartmouth Conference',    accent:'#00d4ff', icon:'⊞',
    body:'John McCarthy, Marvin Minsky, Claude Shannon, and Nathaniel Rochester gather at Dartmouth for ten weeks. McCarthy coins the term "Artificial Intelligence." A discipline is born — ambitious, underfunded, and absolutely convinced it will solve intelligence within a generation.' },
  { year:'1958', tag:'FIRST LANGUAGE',   title:'LISP & Symbolic AI',      accent:'#4ab8ff', icon:'≋',
    body:'McCarthy invents LISP — the lingua franca of early AI. Symbolic systems dominate: logic, rules, and hand-crafted knowledge. The dream is to encode human expertise into machine-readable form. It works, until it doesn\'t.' },
  { year:'1966', tag:'FIRST CHATBOT',    title:'ELIZA Speaks',            accent:'#4ab8ff', icon:'◉',
    body:'Joseph Weizenbaum at MIT creates ELIZA — a pattern-matching program mimicking a Rogerian therapist. Users confide in it. The world gets its first glimpse of how eagerly humans anthropomorphize machines.' },
  { year:'1969', tag:'FIRST CRISIS',     title:'The Lighthill Report',    accent:'#7b2fff', icon:'△',
    body:'James Lighthill\'s scathing UK government report declares AI research vastly overhyped. Funding collapses. The first "AI Winter" descends — a pattern of boom, bust, and renewed optimism that will define the field for decades.' },
  { year:'1980', tag:'INDUSTRY ARRIVES', title:'Expert Systems',          accent:'#7b2fff', icon:'⬡',
    body:'Rule-based expert systems reach commercial scale. XCON at Digital Equipment Corporation saves $40M annually. AI enters the enterprise — brittle, expensive to maintain, but undeniably useful.' },
  { year:'1986', tag:'BREAKTHROUGH',     title:'Backpropagation',         accent:'#c040ff', icon:'⟳',
    body:'Rumelhart, Hinton, and Williams popularize backpropagation — the algorithm that makes training multi-layer neural networks practical. A quiet revolution begins. Most of the field ignores it. A handful of researchers do not.' },
  { year:'1989', tag:'FIRST APPLICATION',title:'Neural Nets in the Wild', accent:'#c040ff', icon:'◬',
    body:'Yann LeCun applies convolutional neural networks to handwritten digit recognition at Bell Labs. The US Postal Service adopts it to sort mail. The first neural network solving a real-world problem at industrial scale.' },
]

/* ── Card component ── */
function TimelineCard({ event, index, cardRef }) {
  const innerRef = useRef(null)
  const isLeft   = index % 2 === 0

  const onEnter = () => {
    gsap.to(innerRef.current, { y: -5, scale: 1.015, duration: 0.35, ease: 'power2.out' })
    gsap.to(innerRef.current, { boxShadow: `0 20px 50px ${event.accent}18, 0 0 0 1px ${event.accent}40`, duration: 0.3 })
  }
  const onLeave = () => {
    gsap.to(innerRef.current, { y: 0, scale: 1, boxShadow: 'none', duration: 0.45, ease: 'power2.inOut' })
  }

  return (
    /* Mobile: full-width stacked. Desktop: half-width alternating */
    <div
      ref={cardRef}
      className={`
        relative flex items-center
        /* mobile: left-spine layout */
        flex-row gap-4 pl-10
        /* desktop: alternating */
        md:pl-0 md:gap-10 lg:gap-12
        ${isLeft ? 'md:flex-row' : 'md:flex-row-reverse'}
      `}
    >
      {/* Card */}
      <div
        ref={innerRef}
        className="flex-1 md:w-[calc(50%-3rem)] md:flex-none rounded-xl p-4 sm:p-5 md:p-6 shimmer-sweep"
        style={{ background:'rgba(10,15,30,0.75)', border:`1px solid ${event.accent}22`, backdropFilter:'blur(16px)' }}
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
      >
        <div className="flex items-center justify-between mb-2 sm:mb-3 gap-2 flex-wrap">
          <span className="font-mono text-[9px] sm:text-[10px] tracking-[0.25em] sm:tracking-[0.3em] px-2 py-0.5 rounded uppercase"
            style={{ color:event.accent, background:`${event.accent}14`, border:`1px solid ${event.accent}30` }}>
            {event.tag}
          </span>
          <span className="font-black leading-none"
            style={{ fontFamily:'"Bebas Neue",cursive', fontSize:'clamp(1.4rem,3vw,2.2rem)',
              color:event.accent, textShadow:`0 0 20px ${event.accent}50` }}>
            {event.year}
          </span>
        </div>
        <h3 className="text-slate-100 mb-2 leading-tight"
          style={{ fontFamily:'"Bebas Neue",cursive', fontSize:'clamp(1rem,2.5vw,1.55rem)', letterSpacing:'0.04em' }}>
          {event.title}
        </h3>
        <p className="text-slate-500 text-xs sm:text-sm leading-relaxed font-light" style={{ fontFamily:'"DM Sans",sans-serif' }}>
          {event.body}
        </p>
      </div>

      {/* Centre/left node */}
      <div className="absolute left-0 md:left-1/2 md:-translate-x-1/2 z-10">
        <div
          className="node-pulse ring-expand relative w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-mono"
          style={{ background:`${event.accent}18`, border:`1.5px solid ${event.accent}60`, color:event.accent }}
        >
          {event.icon}
        </div>
      </div>

      {/* Desktop spacer */}
      <div className="hidden md:block md:w-[calc(50%-3rem)] md:flex-none" />
    </div>
  )
}

/* ── Section ── */
export default function Timeline() {
  const sectionRef = useRef(null)
  const spineRef   = useRef(null)
  const eyebrowRef = useRef(null)
  const headerRef  = useRef(null)
  const cardRefs   = useRef([])

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    const ctxExit    = exitFade(section, { targetOpacity: 0.4 })
    const ctxEyebrow = fadeIn(eyebrowRef.current, { yOffset: 14, duration: 0.8, st: { start:'top 84%' } })
    const ctxHeader  = slideUp(headerRef.current, { distance: 55, duration: 1.0, st: { start:'top 82%' } })
    const ctxSpine   = scrubSpine(spineRef.current, section, { start:'top 68%', end:'bottom 28%', scrub: 0.9 })

    /* Cards animate on scroll individually */
    cardRefs.current.forEach((el, i) => {
      if (!el) return
      const isMobileLayout = window.innerWidth < 768
      const x = isMobileLayout ? 0 : (i % 2 === 0 ? -65 : 65)
      gsap.fromTo(el,
        { opacity: 0, x, y: isMobileLayout ? 20 : 0 },
        {
          opacity: 1, x: 0, y: 0, duration: 0.8, ease: 'power3.out',
          scrollTrigger: { trigger: el, start:'top 88%', toggleActions:'play none none reverse' },
        }
      )
    })

    return () => {
      ctxExit.revert()
      ctxEyebrow.revert()
      ctxHeader.revert()
      ctxSpine.revert()
    }
  }, [])

  return (
    <section
      id="timeline"
      ref={sectionRef}
      className="relative min-h-screen w-full overflow-hidden py-20 sm:py-28 px-5 sm:px-8"
      style={{ background:'linear-gradient(180deg,#020408 0%,#050b18 50%,#020408 100%)' }}
    >
      {/* Background grid */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage:'linear-gradient(rgba(0,212,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(0,212,255,0.03) 1px,transparent 1px)',
          backgroundSize:'60px 60px' }} aria-hidden="true" />
      <div className="absolute inset-0 pointer-events-none"
        style={{ background:'radial-gradient(ellipse 80% 50% at 50% 50%,rgba(0,212,255,0.03) 0%,transparent 70%)' }} aria-hidden="true" />

      <div className="relative z-10 max-w-5xl mx-auto">

        {/* Header */}
        <div className="text-center mb-16 sm:mb-24">
          <div ref={eyebrowRef} className="inline-flex items-center gap-3 mb-5 opacity-0">
            <span className="w-8 sm:w-10 h-px bg-cyan-400/40" />
            <span className="font-mono text-[10px] sm:text-[11px] tracking-[0.35em] sm:tracking-[0.4em] text-cyan-400/60 uppercase">
              Chapter 02
            </span>
            <span className="w-8 sm:w-10 h-px bg-cyan-400/40" />
          </div>
          <div ref={headerRef} className="opacity-0">
            <h2 className="text-slate-100 leading-none mb-3 sm:mb-4"
              style={{ fontFamily:'"Bebas Neue",cursive', fontSize:'clamp(2.8rem,8vw,9rem)', letterSpacing:'0.02em' }}>
              EARLY{' '}
              <span style={{ background:'linear-gradient(135deg,#00d4ff,#7b2fff)',
                WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
                PIONEERS
              </span>
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto leading-relaxed text-xs sm:text-sm font-light"
              style={{ fontFamily:'"DM Sans",sans-serif' }}>
              Four decades of big dreams, bitter winters, and the stubborn belief
              that intelligence could be bottled in silicon.
            </p>
            <div className="mt-4 font-mono text-[9px] sm:text-[10px] tracking-widest text-slate-700 uppercase">
              Early AI — 1950 to 1990
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="relative flex flex-col gap-10 sm:gap-14">
          {/* Spine: left edge on mobile, centre on desktop */}
          <div
            ref={spineRef}
            className="absolute left-3 md:left-1/2 top-0 bottom-0 md:-translate-x-1/2 w-px"
            style={{ background:'linear-gradient(180deg,transparent,#00d4ff,#7b2fff,#ff2d78,transparent)' }}
            aria-hidden="true"
          />

          {EVENTS.map((event, i) => (
            <TimelineCard
              key={event.year}
              event={event}
              index={i}
              cardRef={el => (cardRefs.current[i] = el)}
            />
          ))}
        </div>

        <div className="mt-16 sm:mt-20 text-center">
          <span className="font-mono text-[9px] sm:text-[10px] tracking-[0.4em] text-slate-700 uppercase">
            1990 → The Machine Learning Era Begins
          </span>
        </div>
      </div>
    </section>
  )
}
