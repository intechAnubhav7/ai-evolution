/**
 * scrollAnimations.js
 * ─────────────────────────────────────────────────────────────
 * Centralised GSAP + ScrollTrigger animation library.
 *
 * Design principles
 *   • Every function returns the GSAP context it creates so the
 *     caller can call ctx.revert() for clean React unmount.
 *   • All animations use will-change: transform/opacity via
 *     gsap-animated class, keeping the GPU happy.
 *   • Defaults are tuned for a dark, cinematic storytelling site:
 *     long durations, expo/power eases, generous overlap.
 *   • ScrollTrigger markers are NEVER enabled in production.
 * ─────────────────────────────────────────────────────────────
 */

import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/* ─── Shared defaults ─────────────────────────────────────── */

export const EASE = {
  enter:   'expo.out',       // large, dramatic entrances
  soft:    'power3.out',     // body copy, subtler elements
  spring:  'back.out(1.4)',  // cards, badges, nodes
  snap:    'power4.inOut',   // scrub-linked animations
  linear:  'none',           // scroll-scrub spine draws
}

export const DUR = {
  xs:   0.45,
  sm:   0.65,
  md:   0.85,
  lg:   1.10,
  xl:   1.40,
}

/** Default ScrollTrigger viewport entry point */
const ST_START = 'top 82%'

/* ─── Utility helpers ─────────────────────────────────────── */

/**
 * Ensure `target` is treated as an array even if it's a single
 * element, a ref, or already an array/NodeList.
 */
function toArray(target) {
  if (!target) return []
  if (Array.isArray(target)) return target.filter(Boolean)
  if (target instanceof NodeList) return [...target].filter(Boolean)
  if (target.current !== undefined) return [target.current].filter(Boolean)
  return [target]
}

/**
 * Build a ScrollTrigger config object from shorthand options.
 * @param {Element}  trigger   - DOM element to watch
 * @param {object}   opts      - { start, end, scrub, pin, once, onEnter, onLeave }
 */
function makeST(trigger, opts = {}) {
  return {
    trigger,
    start:   opts.start   ?? ST_START,
    end:     opts.end     ?? undefined,
    scrub:   opts.scrub   ?? false,
    pin:     opts.pin     ?? false,
    once:    opts.once    ?? false,
    onEnter: opts.onEnter ?? undefined,
    onLeave: opts.onLeave ?? undefined,
    toggleActions: opts.toggleActions ?? 'play none none reverse',
  }
}

/* ═══════════════════════════════════════════════════════════
   1. FADE-IN ANIMATIONS
   Opacity 0 → 1, optionally with a small Y lift.
═══════════════════════════════════════════════════════════ */

/**
 * Simple opacity fade-in on scroll.
 * @param {Element|Element[]} targets
 * @param {object} opts  { yOffset, duration, delay, stagger, ease, st }
 * @returns gsap.Context
 */
export function fadeIn(targets, opts = {}) {
  const els       = toArray(targets)
  const yOffset   = opts.yOffset   ?? 0
  const duration  = opts.duration  ?? DUR.md
  const delay     = opts.delay     ?? 0
  const stagger   = opts.stagger   ?? 0
  const ease      = opts.ease      ?? EASE.soft
  const stConfig  = opts.st        ?? {}

  if (!els.length) return gsap.context(() => {})

  const ctx = gsap.context(() => {
    els.forEach((el, i) => {
      gsap.fromTo(
        el,
        { opacity: 0, y: yOffset },
        {
          opacity:  1,
          y:        0,
          duration,
          delay:    delay + i * stagger,
          ease,
          scrollTrigger: makeST(el, stConfig),
        }
      )
    })
  })

  return ctx
}

/**
 * Fade in a set of elements with a shared stagger (one ST for all).
 * Useful for lists, icon grids, stat rows, etc.
 * @param {Element} parent    - ScrollTrigger anchor
 * @param {string}  selector  - child selector, e.g. '.card'
 * @param {object}  opts
 */
export function fadeInChildren(parent, selector = '*', opts = {}) {
  if (!parent) return gsap.context(() => {})

  const yOffset  = opts.yOffset  ?? 20
  const duration = opts.duration ?? DUR.sm
  const stagger  = opts.stagger  ?? 0.10
  const ease     = opts.ease     ?? EASE.soft
  const delay    = opts.delay    ?? 0
  const stConfig = opts.st       ?? {}

  const ctx = gsap.context(() => {
    const children = parent.querySelectorAll(selector)
    if (!children.length) return

    gsap.fromTo(
      children,
      { opacity: 0, y: yOffset },
      {
        opacity:  1,
        y:        0,
        duration,
        delay,
        ease,
        stagger,
        scrollTrigger: makeST(parent, stConfig),
      }
    )
  })

  return ctx
}

/* ═══════════════════════════════════════════════════════════
   2. SLIDE-UP / SLIDE-IN ANIMATIONS
   Translate Y (or X) + opacity, with optional skew for titles.
═══════════════════════════════════════════════════════════ */

/**
 * Slide an element up from below into position.
 * @param {Element|Element[]} targets
 * @param {object} opts  { distance, skewY, duration, delay, stagger, ease, st }
 */
export function slideUp(targets, opts = {}) {
  const els      = toArray(targets)
  const distance = opts.distance ?? 60
  const skewY    = opts.skewY    ?? 0
  const duration = opts.duration ?? DUR.lg
  const delay    = opts.delay    ?? 0
  const stagger  = opts.stagger  ?? 0
  const ease     = opts.ease     ?? EASE.enter
  const stConfig = opts.st       ?? {}

  if (!els.length) return gsap.context(() => {})

  const ctx = gsap.context(() => {
    gsap.fromTo(
      els,
      { opacity: 0, y: distance, skewY },
      {
        opacity:  1,
        y:        0,
        skewY:    0,
        duration,
        delay,
        ease,
        stagger,
        scrollTrigger: makeST(els[0], stConfig),
      }
    )
  })

  return ctx
}

/**
 * Slide an element in from the left or right.
 * @param {Element|Element[]} targets
 * @param {object} opts  { direction: 'left'|'right', distance, duration, delay, stagger, ease, st }
 */
export function slideIn(targets, opts = {}) {
  const els       = toArray(targets)
  const direction = opts.direction ?? 'left'
  const distance  = opts.distance  ?? 80
  const duration  = opts.duration  ?? DUR.lg
  const delay     = opts.delay     ?? 0
  const stagger   = opts.stagger   ?? 0
  const ease      = opts.ease      ?? EASE.enter
  const stConfig  = opts.st        ?? {}

  if (!els.length) return gsap.context(() => {})

  const x = direction === 'left' ? -distance : distance

  const ctx = gsap.context(() => {
    gsap.fromTo(
      els,
      { opacity: 0, x },
      {
        opacity:  1,
        x:        0,
        duration,
        delay,
        ease,
        stagger,
        scrollTrigger: makeST(els[0], stConfig),
      }
    )
  })

  return ctx
}

/**
 * Dramatic hero title reveal — clipped slide-up per line.
 * Wraps each target in an overflow:hidden container automatically.
 * @param {Element[]} lines   - array of h1 / span elements (one per line)
 * @param {object}    opts    { distance, skewY, duration, stagger, delay, ease }
 */
export function heroTitleReveal(lines, opts = {}) {
  const els      = lines.filter(Boolean)
  const distance = opts.distance ?? 110
  const skewY    = opts.skewY    ?? 5
  const duration = opts.duration ?? DUR.xl
  const stagger  = opts.stagger  ?? 0.15
  const delay    = opts.delay    ?? 0.3
  const ease     = opts.ease     ?? EASE.enter

  if (!els.length) return gsap.context(() => {})

  const ctx = gsap.context(() => {
    gsap.fromTo(
      els,
      { opacity: 0, y: distance, skewY },
      { opacity: 1, y: 0, skewY: 0, duration, stagger, delay, ease }
    )
  })

  return ctx
}

/* ═══════════════════════════════════════════════════════════
   3. STAGGERED CARD ANIMATIONS
   Scale + opacity, spring ease, for grids of equal elements.
═══════════════════════════════════════════════════════════ */

/**
 * Staggered card pop-in — scale from slightly smaller + fade.
 * @param {Element[]} cards
 * @param {object}    opts  { scaleFrom, yOffset, stagger, duration, delay, ease, st }
 */
export function staggerCards(cards, opts = {}) {
  const els        = toArray(cards)
  const scaleFrom  = opts.scaleFrom ?? 0.92
  const yOffset    = opts.yOffset   ?? 45
  const stagger    = opts.stagger   ?? 0.12
  const duration   = opts.duration  ?? DUR.md
  const delay      = opts.delay     ?? 0
  const ease       = opts.ease      ?? EASE.spring
  const stConfig   = opts.st        ?? {}

  if (!els.length) return gsap.context(() => {})

  const ctx = gsap.context(() => {
    gsap.fromTo(
      els,
      { opacity: 0, y: yOffset, scale: scaleFrom },
      {
        opacity:  1,
        y:        0,
        scale:    1,
        duration,
        delay,
        ease,
        stagger,
        scrollTrigger: makeST(els[0], { start: 'top 90%', ...stConfig }),
      }
    )
  })

  return ctx
}

/**
 * Alternating slide-in for timeline cards (left side → right, right side → left).
 * @param {Element[]} cards     - all card elements in DOM order
 * @param {object}    opts      { distance, duration, stagger, ease, st }
 */
export function staggerTimelineCards(cards, opts = {}) {
  const els      = cards.filter(Boolean)
  const distance = opts.distance ?? 70
  const duration = opts.duration ?? DUR.md
  const ease     = opts.ease     ?? EASE.soft

  if (!els.length) return gsap.context(() => {})

  const ctx = gsap.context(() => {
    els.forEach((el, i) => {
      const x = i % 2 === 0 ? -distance : distance
      gsap.fromTo(
        el,
        { opacity: 0, x },
        {
          opacity: 1,
          x:       0,
          duration,
          ease,
          scrollTrigger: makeST(el, {
            start:         'top 88%',
            toggleActions: 'play none none reverse',
            ...(opts.st ?? {}),
          }),
        }
      )
    })
  })

  return ctx
}

/* ═══════════════════════════════════════════════════════════
   4. PROGRESS BAR ANIMATIONS
   Width 0 → target%, triggered on scroll.
═══════════════════════════════════════════════════════════ */

/**
 * Animate an array of bar-fill elements to their target widths.
 * @param {Element[]} fills      - the inner fill divs
 * @param {number[]}  percents   - target widths in percent (parallel array)
 * @param {object}    opts       { duration, stagger, delay, ease, st }
 */
export function animateBars(fills, percents, opts = {}) {
  const els      = fills.filter(Boolean)
  const duration = opts.duration ?? DUR.xl
  const stagger  = opts.stagger  ?? 0.14
  const delay    = opts.delay    ?? 0
  const ease     = opts.ease     ?? EASE.soft
  const stConfig = opts.st       ?? {}

  if (!els.length) return gsap.context(() => {})

  const ctx = gsap.context(() => {
    els.forEach((el, i) => {
      gsap.fromTo(
        el,
        { width: '0%' },
        {
          width:    `${percents[i] ?? 0}%`,
          duration,
          delay:    delay + i * stagger,
          ease,
          scrollTrigger: makeST(el, { start: 'top 92%', ...stConfig }),
        }
      )
    })
  })

  return ctx
}

/* ═══════════════════════════════════════════════════════════
   5. SCROLL-SCRUB ANIMATIONS
   Tied directly to scroll position via scrub.
═══════════════════════════════════════════════════════════ */

/**
 * Draw a vertical timeline spine (scaleY 0 → 1) as the user scrolls.
 * @param {Element} spineEl   - the spine line element
 * @param {Element} section   - the parent section (defines scroll range)
 * @param {object}  opts      { scrub, start, end }
 */
export function scrubSpine(spineEl, section, opts = {}) {
  if (!spineEl || !section) return gsap.context(() => {})

  const ctx = gsap.context(() => {
    gsap.fromTo(
      spineEl,
      { scaleY: 0, transformOrigin: 'top center' },
      {
        scaleY:   1,
        ease:     EASE.linear,
        scrollTrigger: {
          trigger:      section,
          start:        opts.start ?? 'top 70%',
          end:          opts.end   ?? 'bottom 25%',
          scrub:        opts.scrub ?? 0.9,
        },
      }
    )
  })

  return ctx
}

/**
 * Parallax a background or decorative element at a fractional scroll speed.
 * @param {Element} el
 * @param {object}  opts  { speed, axis, start, end }
 *   speed: 0 = locked, 0.5 = half speed, 1 = normal, >1 = faster
 */
export function parallax(el, opts = {}) {
  if (!el) return gsap.context(() => {})

  const speed  = opts.speed ?? 0.4
  const axis   = opts.axis  ?? 'y'
  const amount = 100 * (1 - speed)

  const ctx = gsap.context(() => {
    gsap.fromTo(
      el,
      { [axis]: 0 },
      {
        [axis]: -amount,
        ease:   EASE.linear,
        scrollTrigger: {
          trigger:  el,
          start:    opts.start ?? 'top bottom',
          end:      opts.end   ?? 'bottom top',
          scrub:    true,
        },
      }
    )
  })

  return ctx
}

/* ═══════════════════════════════════════════════════════════
   6. SECTION REVEAL — composite animation for a whole section
   Combines a slide-up header, body fade, and card stagger.
═══════════════════════════════════════════════════════════ */

/**
 * One-call composite reveal for standard content sections.
 *
 * @param {object} refs
 *   {
 *     section:  Element,            // the <section> el (scope)
 *     eyebrow:  Element|null,       // small label above title
 *     title:    Element|null,       // section heading
 *     body:     Element|Element[],  // paragraphs / copy blocks
 *     cards:    Element[],          // grid cards
 *     bars:     { fills, pcts },    // progress bars
 *   }
 * @param {object} opts  { titleDirection, cardStagger, ... }
 * @returns gsap.Context  (call .revert() on unmount)
 */
export function revealSection(refs, opts = {}) {
  const { section, eyebrow, title, body, cards, bars } = refs
  if (!section) return gsap.context(() => {})

  const titleDir = opts.titleDirection ?? 'up'   // 'up' | 'left' | 'right'

  const ctx = gsap.context(() => {

    /* Eyebrow */
    if (eyebrow) {
      gsap.fromTo(eyebrow,
        { opacity: 0, y: 16 },
        {
          opacity: 1, y: 0,
          duration: DUR.sm, ease: EASE.soft,
          scrollTrigger: makeST(eyebrow),
        }
      )
    }

    /* Title */
    if (title) {
      const from = titleDir === 'left'  ? { opacity: 0, x: -80, y: 0 }
                 : titleDir === 'right' ? { opacity: 0, x:  80, y: 0 }
                 :                        { opacity: 0, x:   0, y: 60 }

      gsap.fromTo(title,
        from,
        {
          opacity: 1, x: 0, y: 0,
          duration: DUR.lg, ease: EASE.enter,
          scrollTrigger: makeST(title, { start: 'top 84%' }),
        }
      )
    }

    /* Body copy */
    if (body) {
      const bodyEls = toArray(body)
      gsap.fromTo(bodyEls,
        { opacity: 0, y: 30 },
        {
          opacity: 1, y: 0,
          duration: DUR.md, ease: EASE.soft,
          stagger: 0.14,
          scrollTrigger: makeST(bodyEls[0], { start: 'top 87%' }),
        }
      )
    }

    /* Cards */
    if (cards?.length) {
      staggerCards(cards, { stagger: opts.cardStagger ?? 0.12 })
    }

    /* Bars */
    if (bars?.fills?.length && bars?.pcts?.length) {
      animateBars(bars.fills, bars.pcts)
    }

  }, section)  // scoped to section — auto-cleans child ScrollTriggers

  return ctx
}

/* ═══════════════════════════════════════════════════════════
   7. MARQUEE / INFINITE SCROLL
═══════════════════════════════════════════════════════════ */

/**
 * Infinite horizontal marquee using GSAP (no CSS animation).
 * The inner element should have its content duplicated (×2) so
 * the loop is seamless.
 * @param {Element} innerEl   - the element containing duplicated text
 * @param {object}  opts      { duration, direction: 'left'|'right' }
 */
export function marquee(innerEl, opts = {}) {
  if (!innerEl) return gsap.context(() => {})

  const duration  = opts.duration  ?? 22
  const direction = opts.direction ?? 'left'
  const xTarget   = direction === 'left' ? '-50%' : '0%'
  const xStart    = direction === 'left' ?  '0%'  : '-50%'

  const ctx = gsap.context(() => {
    gsap.fromTo(
      innerEl,
      { x: xStart },
      { x: xTarget, duration, ease: 'none', repeat: -1 }
    )
  })

  return ctx
}

/* ═══════════════════════════════════════════════════════════
   8. SVG NEURAL NET ENTRANCE
   Fades in connection lines (staggered random) then scales nodes.
═══════════════════════════════════════════════════════════ */

/**
 * Animate an inline SVG neural network diagram.
 * Expects `.nn-line` and `.nn-node` elements inside `svgEl`.
 * @param {Element} svgEl
 * @param {object}  opts  { lineOpacity, lineDuration, nodeStagger }
 */
export function animateNeuralNet(svgEl, opts = {}) {
  if (!svgEl) return gsap.context(() => {})

  const lineOpacity   = opts.lineOpacity   ?? 0.18
  const lineDuration  = opts.lineDuration  ?? 0.4
  const nodeStagger   = opts.nodeStagger   ?? 0.04

  const ctx = gsap.context(() => {
    const lines = svgEl.querySelectorAll('.nn-line')
    const nodes = svgEl.querySelectorAll('.nn-node')

    ScrollTrigger.create({
      trigger: svgEl,
      start:   'top 82%',
      once:    true,
      onEnter: () => {
        gsap.to(lines, {
          strokeOpacity: lineOpacity,
          duration:      lineDuration,
          stagger:       { each: 0.003, from: 'random' },
          ease:          EASE.soft,
        })
        gsap.to(nodes, {
          scale:           1,
          duration:        0.5,
          stagger:         nodeStagger,
          ease:            EASE.spring,
          transformOrigin: 'center',
        })
      },
    })
  })

  return ctx
}

/* ═══════════════════════════════════════════════════════════
   9. COUNTER / NUMBER TICK-UP
   Animates a number from 0 to target using GSAP's snap.
═══════════════════════════════════════════════════════════ */

/**
 * Tick a numeric display from 0 up to `target`.
 * @param {Element}  el        - DOM element whose textContent is updated
 * @param {number}   target    - end value
 * @param {object}   opts      { duration, suffix, prefix }
 */
export function countUp(el, target, opts = {}) {
  if (!el) return gsap.context(() => {})

  const duration = opts.duration ?? DUR.xl
  const suffix   = opts.suffix   ?? ''
  const prefix   = opts.prefix   ?? ''
  const obj      = { val: 0 }

  const ctx = gsap.context(() => {
    gsap.to(obj, {
      val:      target,
      duration,
      ease:     EASE.soft,
      snap:     { val: 1 },
      onUpdate: () => { el.textContent = prefix + Math.round(obj.val) + suffix },
      scrollTrigger: makeST(el, { start: 'top 85%', once: true }),
    })
  })

  return ctx
}

/* ═══════════════════════════════════════════════════════════
   10. SCROLL-LINKED SECTION OPACITY DIMMING
   Dims a section as the user scrolls past it (cinematic depth).
═══════════════════════════════════════════════════════════ */

/**
 * Fade a section out as the user scrolls past it.
 * Creates a "depth layer" effect between sections.
 * @param {Element} el
 * @param {object}  opts  { targetOpacity, start, end, scrub }
 */
export function exitFade(el, opts = {}) {
  if (!el) return gsap.context(() => {})

  const ctx = gsap.context(() => {
    gsap.fromTo(
      el,
      { opacity: 1 },
      {
        opacity:  opts.targetOpacity ?? 0.3,
        ease:     EASE.linear,
        scrollTrigger: {
          trigger:  el,
          start:    opts.start ?? 'bottom 60%',
          end:      opts.end   ?? 'bottom top',
          scrub:    opts.scrub ?? true,
        },
      }
    )
  })

  return ctx
}

/* ═══════════════════════════════════════════════════════════
   GLOBAL SETUP — call once at app level (e.g. in App.jsx)
═══════════════════════════════════════════════════════════ */

/**
 * Configure GSAP defaults and ScrollTrigger global settings.
 * Call this once in your root component.
 */
export function initGSAP() {
  gsap.config({
    nullTargetWarn: false,   // silence missing-ref warnings in dev
    force3D: true,           // always use GPU-composited layers
  })

  ScrollTrigger.config({
    ignoreMobileResize: true,  // prevent janky reflow resets on mobile
  })

  ScrollTrigger.defaults({
    toggleActions: 'play none none reverse',
  })
}
