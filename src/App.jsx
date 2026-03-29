/**
 * App.jsx — Root component
 *
 * Responsibilities:
 *   • GSAP global init
 *   • Custom cursor (desktop only)
 *   • Scroll progress bar
 *   • Nav backdrop on scroll
 *   • Section dot indicators
 *   • Global parallax via data-parallax attribute
 *   • Section wipe transition on anchor clicks
 *   • Mobile nav (hamburger)
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { initGSAP } from './utils/scrollAnimations'

import Hero            from './sections/Hero'
import Timeline        from './sections/Timeline'
import MachineLearning from './sections/MachineLearning'
import GradientDescent from './sections/GradientDescent'
import DeepLearning    from './sections/DeepLearning'
import Future          from './sections/Future'

gsap.registerPlugin(ScrollTrigger)

/* ─── Constants ──────────────────────────────── */
const NAV_LINKS = [
  ['Timeline',      '#timeline'],
  ['ML',            '#ml'],
  ['Grad Descent',  '#gradient-descent'],
  ['Deep Learning', '#deep-learning'],
  ['Future',        '#future'],
]

const SECTION_IDS = ['hero', 'timeline', 'ml', 'gradient-descent', 'deep-learning', 'future']

/* ─── Detect touch/mobile ───────────────────── */
const isTouchDevice = () =>
  typeof window !== 'undefined' &&
  ('ontouchstart' in window || navigator.maxTouchPoints > 0)

/* ═══════════════════════════════════════════ */
export default function App() {
  const cursorRef     = useRef(null)
  const followerRef   = useRef(null)
  const navRef        = useRef(null)
  const progressRef   = useRef(null)
  const dotsRef       = useRef([])
  const transitionRef = useRef(null)

  const [mobileOpen, setMobileOpen] = useState(false)
  const [isTouch,    setIsTouch]    = useState(false)

  /* ── Detect touch once on mount ── */
  useEffect(() => {
    setIsTouch(isTouchDevice())
    initGSAP()
  }, [])

  /* ── Custom cursor (desktop only) ── */
  useEffect(() => {
    if (isTouch) return
    const cursor   = cursorRef.current
    const follower = followerRef.current
    if (!cursor || !follower) return

    let mouseX = 0, mouseY = 0, fx = 0, fy = 0
    let rafId

    const onMove = (e) => {
      mouseX = e.clientX
      mouseY = e.clientY
      gsap.to(cursor, { x: mouseX, y: mouseY, duration: 0.08, ease: 'power2.out' })
    }

    const tick = () => {
      rafId = requestAnimationFrame(tick)
      fx += (mouseX - fx) * 0.10
      fy += (mouseY - fy) * 0.10
      gsap.set(follower, { x: fx, y: fy })
    }
    tick()

    const onEnter = (e) => {
      const accent = e.currentTarget.dataset.accent || 'rgba(123,47,255,0.9)'
      gsap.to(cursor,   { scale: 2.5, background: accent, duration: 0.25, ease: 'back.out(2)' })
      gsap.to(follower, { width: 56, height: 56, borderColor: accent, duration: 0.3 })
    }
    const onLeave = () => {
      gsap.to(cursor,   { scale: 1, background: 'var(--color-pulse)', duration: 0.25 })
      gsap.to(follower, { width: 36, height: 36, borderColor: 'rgba(0,212,255,0.4)', duration: 0.3 })
    }

    document.addEventListener('mousemove', onMove)
    const interactables = document.querySelectorAll('a,button,[data-cursor]')
    interactables.forEach(el => {
      el.addEventListener('mouseenter', onEnter)
      el.addEventListener('mouseleave', onLeave)
    })

    return () => {
      document.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(rafId)
    }
  }, [isTouch])

  /* ── Scroll: progress bar + nav backdrop ── */
  useEffect(() => {
    const nav      = navRef.current
    const progress = progressRef.current
    if (!nav || !progress) return

    const onScroll = () => {
      const scrolled = window.scrollY
      const total    = document.documentElement.scrollHeight - window.innerHeight
      progress.style.width = total > 0 ? `${(scrolled / total) * 100}%` : '0%'
      nav.classList.toggle('nav-scrolled', scrolled > 60)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  /* ── Section dot indicators ── */
  useEffect(() => {
    const dots = dotsRef.current.filter(Boolean)
    if (!dots.length) return

    const observers = SECTION_IDS.map((id, i) => {
      const el = document.getElementById(id)
      if (!el) return null
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting)
            dots.forEach((d, j) => d.classList.toggle('active', j === i))
        },
        { threshold: 0.35, rootMargin: '-10% 0px -10% 0px' }
      )
      obs.observe(el)
      return obs
    })

    return () => observers.forEach(o => o?.disconnect())
  }, [])

  /* ── Global parallax (data-parallax attribute) ── */
  useEffect(() => {
    // Skip on touch — parallax is a scroll-jank risk on mobile
    if (isTouch) return

    const elements = document.querySelectorAll('[data-parallax]')
    const ctxs = []

    elements.forEach(el => {
      const speed  = parseFloat(el.dataset.parallax) || 0.3
      const amount = 100 * speed
      const ctx = gsap.context(() => {
        gsap.fromTo(el,
          { y: 0 },
          {
            y: -amount,
            ease: 'none',
            scrollTrigger: {
              trigger: el.closest('section') || el,
              start:   'top bottom',
              end:     'bottom top',
              scrub:   true,
            },
          }
        )
      })
      ctxs.push(ctx)
    })

    return () => ctxs.forEach(c => c.revert())
  }, [isTouch])

  /* ── Section wipe transition on anchor clicks ── */
  useEffect(() => {
    const overlay = transitionRef.current
    if (!overlay) return

    const handleClick = (e) => {
      const href   = e.currentTarget.getAttribute('href')
      const target = href ? document.querySelector(href) : null
      if (!target) return
      e.preventDefault()
      setMobileOpen(false)

      const tl = gsap.timeline()
      tl.to(overlay, { scaleY: 1, transformOrigin: 'bottom', duration: 0.4, ease: 'power3.inOut' })
        .call(() => target.scrollIntoView({ behavior: 'instant' }))
        .to(overlay, { scaleY: 0, transformOrigin: 'top', duration: 0.4, ease: 'power3.inOut', delay: 0.05 })
    }

    const links = document.querySelectorAll('a[href^="#"]')
    links.forEach(l => l.addEventListener('click', handleClick))
    return () => links.forEach(l => l.removeEventListener('click', handleClick))
  }, [])

  /* ── Close mobile menu on outside click / escape ── */
  useEffect(() => {
    if (!mobileOpen) return
    const onKey = (e) => { if (e.key === 'Escape') setMobileOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [mobileOpen])

  const scrollTo = useCallback((id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  return (
    <>
      {/* ── Ambient overlays ── */}
      <div className="noise-overlay" aria-hidden="true" />
      <div className="scan-line"     aria-hidden="true" />

      {/* Reading progress */}
      <div ref={progressRef} className="scroll-progress" aria-hidden="true" />

      {/* Page wipe transition */}
      <div ref={transitionRef} className="section-transition" aria-hidden="true" />

      {/* Custom cursor — hidden on touch */}
      {!isTouch && (
        <>
          <div ref={cursorRef}   className="custom-cursor"   aria-hidden="true" />
          <div ref={followerRef} className="cursor-follower" aria-hidden="true" />
        </>
      )}

      {/* ══════════════════════════════════════
          NAV
      ══════════════════════════════════════ */}
      <nav
        ref={navRef}
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 sm:px-8 py-4 transition-all duration-500"
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Logo */}
        <a
          href="#hero"
          className="font-mono text-[10px] sm:text-xs tracking-[0.3em] sm:tracking-[0.4em] text-cyan-400/70 uppercase text-flicker"
          aria-label="AI Evolution — back to top"
        >
          AI // Evolution
        </a>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-6 lg:gap-8">
          {NAV_LINKS.map(([label, href]) => (
            <a
              key={label}
              href={href}
              data-cursor
              data-accent="rgba(0,212,255,0.9)"
              className="relative font-mono text-[10px] lg:text-xs tracking-widest text-slate-500 uppercase group"
            >
              <span className="relative z-10 transition-colors duration-300 group-hover:text-cyan-300">
                {label}
              </span>
              <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-gradient-to-r from-cyan-400 to-violet-500 transition-all duration-300 group-hover:w-full" />
            </a>
          ))}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden flex flex-col gap-[5px] p-2"
          onClick={() => setMobileOpen(v => !v)}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
        >
          <span className={`block w-5 h-px bg-cyan-400/70 transition-all duration-300 ${mobileOpen ? 'rotate-45 translate-y-[6px]' : ''}`} />
          <span className={`block w-5 h-px bg-cyan-400/70 transition-all duration-300 ${mobileOpen ? 'opacity-0' : ''}`} />
          <span className={`block w-5 h-px bg-cyan-400/70 transition-all duration-300 ${mobileOpen ? '-rotate-45 -translate-y-[6px]' : ''}`} />
        </button>
      </nav>

      {/* Mobile menu drawer */}
      <div
        className={`fixed inset-0 z-40 flex flex-col items-center justify-center gap-8 transition-all duration-400 md:hidden ${
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        style={{ background: 'rgba(2,4,8,0.97)', backdropFilter: 'blur(24px)' }}
        aria-hidden={!mobileOpen}
      >
        {NAV_LINKS.map(([label, href]) => (
          <a
            key={label}
            href={href}
            className="font-mono text-2xl tracking-[0.3em] text-slate-400 uppercase hover:text-cyan-300 transition-colors duration-200"
            onClick={() => setMobileOpen(false)}
          >
            {label}
          </a>
        ))}
      </div>

      {/* ══════════════════════════════════════
          Section dot nav — hidden on mobile
      ══════════════════════════════════════ */}
      <div
        className="hidden lg:flex fixed right-5 top-1/2 -translate-y-1/2 z-40 flex-col gap-3"
        aria-label="Section indicators"
        role="navigation"
      >
        {SECTION_IDS.map((id, i) => (
          <button
            key={id}
            ref={el => (dotsRef.current[i] = el)}
            className="section-dot"
            onClick={() => scrollTo(id)}
            aria-label={`Jump to ${id}`}
          />
        ))}
      </div>

      {/* ══════════════════════════════════════
          Main content
      ══════════════════════════════════════ */}
      <main id="main-content">
        <Hero />
        <Timeline />
        <MachineLearning />
        <GradientDescent />
        <DeepLearning />
        <Future />
      </main>

      {/* ══════════════════════════════════════
          Footer
      ══════════════════════════════════════ */}
      <footer className="relative z-10 border-t border-white/5 px-5 sm:px-8 py-8 sm:py-10 flex flex-col sm:flex-row items-center gap-3 sm:justify-between">
        <span className="font-mono text-[10px] text-slate-700 tracking-widest text-center">
          © 2024 — The Evolution of AI
        </span>
        <span className="font-mono text-[10px] text-slate-700 tracking-widest text-center">
          Built with React · Three.js · GSAP
        </span>
      </footer>
    </>
  )
}
