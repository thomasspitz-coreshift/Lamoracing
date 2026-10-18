import '@fontsource/geist/latin-400.css'
import '@fontsource/geist/latin-500.css'
import '@fontsource/geist/latin-600.css'
import '@fontsource/geist-mono/latin-400.css'
import '@fontsource/geist-mono/latin-500.css'
import '@fontsource/bebas-neue/latin-400.css'
import './style.css'
import Lenis from 'lenis'

const root = document.documentElement
root.classList.remove('no-js')

const $ = (s, el = document) => el.querySelector(s)
const $$ = (s, el = document) => [...el.querySelectorAll(s)]
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v))
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
const mobileMq = matchMedia('(max-width: 760px)')

/* ---------- Smooth scroll ---------- */
let lenis = null
if (!reduced) {
  lenis = new Lenis({ lerp: 0.11, wheelMultiplier: 0.95, anchors: { offset: -90 } })
  const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf) }
  requestAnimationFrame(raf)
}

/* ---------- Scroll-driven loop (single rAF) ---------- */
const scrollJobs = []
let ticking = false
const runJobs = () => { ticking = false; const vh = innerHeight; scrollJobs.forEach((fn) => fn(vh)) }
const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(runJobs) } }
addEventListener('scroll', onScroll, { passive: true })
addEventListener('resize', onScroll)

/* ---------- Navigation ---------- */
const nav = $('[data-nav]')
if (nav) {
  let lastY = scrollY
  scrollJobs.push(() => {
    const y = scrollY
    nav.classList.toggle('is-scrolled', y > 30)
    const menuOpen = document.body.classList.contains('menu-open') || $('.nav__item.is-open', nav)
    if (!menuOpen && y > 420 && y > lastY + 4) nav.classList.add('is-hidden')
    else if (y < lastY - 4 || y < 420) nav.classList.remove('is-hidden')
    lastY = y
  })

  // current page
  const path = location.pathname.replace(/index\.html$/, '')
  const norm = (p) => (p.endsWith('/') ? p : p + '/')
  $$('a[href]', document).forEach((a) => {
    const href = a.getAttribute('href')
    if (!href.startsWith('/') || href.includes('#')) return
    if (norm(href) === norm(path) && href !== '/' ) a.setAttribute('aria-current', 'page')
  })
  $$('[data-section]', nav).forEach((el) => {
    if (path.startsWith(`/${el.dataset.section}`)) el.classList.add('is-active')
  })

  // dropdowns
  const items = $$('.nav__item.has-menu', nav)
  const close = (except) => items.forEach((it) => {
    if (it === except) return
    it.classList.remove('is-open')
    $('button', it).setAttribute('aria-expanded', 'false')
  })
  const fine = matchMedia('(hover: hover) and (pointer: fine)')
  items.forEach((it) => {
    const btn = $('button', it)
    const open = () => { close(it); it.classList.add('is-open'); btn.setAttribute('aria-expanded', 'true') }
    btn.addEventListener('click', () => (it.classList.contains('is-open') ? close() : open()))
    let t
    it.addEventListener('mouseenter', () => { if (fine.matches) { clearTimeout(t); open() } })
    it.addEventListener('mouseleave', () => { if (fine.matches) t = setTimeout(() => close(), 140) })
    it.addEventListener('focusout', (e) => { if (!it.contains(e.relatedTarget)) close() })
  })
  addEventListener('keydown', (e) => { if (e.key === 'Escape') { close(); toggleMenu(false) } })
  document.addEventListener('click', (e) => { if (!nav.contains(e.target)) close() })

  // mobile menu
  const burger = $('.nav__burger', nav)
  const mmenu = $('#mobile-menu')
  const toggleMenu = (force) => {
    if (!mmenu) return
    const open = force ?? !document.body.classList.contains('menu-open')
    document.body.classList.toggle('menu-open', open)
    burger.setAttribute('aria-expanded', String(open))
    burger.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu')
    mmenu.toggleAttribute('inert', !open)
    mmenu.setAttribute('aria-hidden', String(!open))
    open ? lenis?.stop() : lenis?.start()
  }
  burger?.addEventListener('click', () => toggleMenu())
  if (mmenu) $$('a', mmenu).forEach((a) => a.addEventListener('click', () => toggleMenu(false)))
}

/* ---------- Split headings (word mask reveal) ---------- */
function splitWords(el, cls, inner = true) {
  let i = 0
  const walk = (node) => {
    ;[...node.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        const parts = n.textContent.split(/(\s+)/)
        const frag = document.createDocumentFragment()
        parts.forEach((p) => {
          if (!p) return
          if (/^\s+$/.test(p)) { frag.append(document.createTextNode(p)); return }
          const w = document.createElement('span')
          w.className = cls
          if (inner) {
            const s = document.createElement('span')
            s.textContent = p
            w.style.setProperty('--i', i)
            w.append(s)
          } else w.textContent = p
          i++
          frag.append(w)
        })
        n.replaceWith(frag)
      } else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n)
    })
  }
  walk(el)
  return i
}
$$('[data-split]').forEach((el) => {
  if (!el.getAttribute('aria-label')) el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim())
  splitWords(el, 'sw')
  $$('.sw', el).forEach((w) => w.setAttribute('aria-hidden', 'true'))
  if (!el.hasAttribute('data-reveal')) el.setAttribute('data-reveal', 'split')
})

/* ---------- Reveal on scroll ---------- */
$$('[data-stagger]').forEach((g) => [...g.children].forEach((c, i) => {
  c.style.setProperty('--i', i)
  if (!c.hasAttribute('data-reveal')) c.setAttribute('data-reveal', g.dataset.stagger || '')
}))
const io = new IntersectionObserver((entries) => entries.forEach((e) => {
  if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target) }
}), { rootMargin: '0px 0px -8% 0px', threshold: 0.12 })
$$('[data-reveal]').forEach((el) => (reduced ? el.classList.add('is-in') : io.observe(el)))

/* ---------- Word highlight on scroll ---------- */
$$('[data-highlight]').forEach((el) => {
  const n = splitWords(el, 'w', false)
  const words = $$('.w', el)
  scrollJobs.push((vh) => {
    const r = el.getBoundingClientRect()
    if (r.bottom < -vh || r.top > vh * 2) return
    const p = clamp((vh * 0.82 - r.top) / (r.height + vh * 0.3))
    const lit = Math.round(p * n)
    words.forEach((w, i) => w.classList.toggle('is-lit', reduced || i < lit))
  })
})

/* ---------- Parallax ---------- */
if (!reduced) {
  $$('[data-parallax]').forEach((el) => {
    const f = parseFloat(el.dataset.parallax) || 0.12
    const box = el.parentElement
    scrollJobs.push((vh) => {
      const r = box.getBoundingClientRect()
      if (r.bottom < 0 || r.top > vh) return
      const d = (r.top + r.height / 2 - vh / 2) * -f
      el.style.transform = `translate3d(0, ${d.toFixed(1)}px, 0)`
    })
  })
}

/* ---------- Counters ---------- */
const countIO = new IntersectionObserver((entries) => entries.forEach((e) => {
  if (!e.isIntersecting) return
  countIO.unobserve(e.target)
  const el = e.target
  const to = parseFloat(el.dataset.count)
  const start = performance.now()
  const dur = reduced ? 0 : 1600
  const tick = (now) => {
    const p = dur ? clamp((now - start) / dur) : 1
    el.textContent = Math.round(to * (1 - Math.pow(1 - p, 4)))
    if (p < 1) requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
}), { threshold: 0.5 })
$$('[data-count]').forEach((el) => countIO.observe(el))

/* ---------- Hero video ---------- */
$$('[data-video]').forEach((v) => {
  const conn = navigator.connection
  if (reduced || conn?.saveData) return
  const pick = () => (mobileMq.matches ? v.dataset.srcMobile : v.dataset.srcDesktop) || v.dataset.srcDesktop
  v.muted = true
  v.src = pick()
  v.load()
  const vio = new IntersectionObserver(([e]) => (e.isIntersecting ? v.play().catch(() => {}) : v.pause()), { threshold: 0.05 })
  vio.observe(v)
  mobileMq.addEventListener('change', () => { v.src = pick(); v.play().catch(() => {}) })
})

/* ---------- Telemetry HUD ---------- */
$$('[data-hud]').forEach((hud) => {
  const sp = $('[data-hud-speed]', hud)
  const gear = $('[data-hud-gear]', hud)
  const lap = $('[data-hud-lap]', hud)
  const bar = $('[data-hud-bar]', hud)
  const LAP = 102.387 // 1:42.387
  const fmt = (t) => `${Math.floor(t / 60)}:${(t % 60).toFixed(3).padStart(6, '0')}`
  let t0 = performance.now()
  let last = 0
  const step = (now) => {
    let t = (now - t0) / 1000
    if (t > LAP) { t0 = now; t = 0 }
    if (now - last > 80) {
      last = now
      const x = t / LAP
      const v = 196 + 91 * (0.55 + 0.45 * Math.sin(x * Math.PI * 14) * Math.cos(x * Math.PI * 5)) - 18 * Math.max(0, Math.sin(x * Math.PI * 9))
      const s = Math.round(clamp(v, 92, 287))
      sp.textContent = s
      gear.textContent = s > 262 ? 6 : s > 228 ? 5 : s > 186 ? 4 : s > 148 ? 3 : 2
      lap.textContent = fmt(t)
      bar.style.width = `${(s / 300) * 100}%`
    }
    if (!document.hidden) requestAnimationFrame(step)
  }
  if (reduced) { sp.textContent = 287; gear.textContent = 6; lap.textContent = fmt(LAP) }
  else {
    requestAnimationFrame(step)
    document.addEventListener('visibilitychange', () => { if (!document.hidden) requestAnimationFrame(step) })
  }
})

/* ---------- Tabs (generic) ---------- */
$$('[data-tabs]').forEach((group) => {
  const tabs = $$('[role="tab"]', group).filter((t) => t.closest('[data-tabs]') === group)
  const select = (tab, focus) => {
    tabs.forEach((t) => {
      const on = t === tab
      t.setAttribute('aria-selected', String(on))
      t.tabIndex = on ? 0 : -1
      const panel = document.getElementById(t.getAttribute('aria-controls'))
      if (panel) panel.hidden = !on
    })
    if (focus) tab.focus()
  }
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => select(t))
    t.addEventListener('keydown', (e) => {
      const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key]
      if (!d) return
      e.preventDefault()
      select(tabs[(i + d + tabs.length) % tabs.length], true)
    })
  })
})

/* ---------- Sticky steps ↔ app panels ---------- */
$$('[data-steps]').forEach((wrap) => {
  const steps = $$('.step', wrap)
  const tabs = $$('.app__tab', wrap)
  const panels = $$('.app__panel', wrap)
  const show = (i) => {
    steps.forEach((s, k) => s.classList.toggle('is-active', k === i))
    tabs.forEach((t, k) => t.setAttribute('aria-selected', String(k === i)))
    panels.forEach((p, k) => p.classList.toggle('is-active', k === i))
  }
  tabs.forEach((t, i) => t.addEventListener('click', () => show(i)))
  const sio = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (e.isIntersecting) show(steps.indexOf(e.target))
  }), { rootMargin: '-45% 0px -45% 0px' })
  steps.forEach((s) => sio.observe(s))
  show(0)
})

/* ---------- Carousel ---------- */
$$('[data-carousel]').forEach((c) => {
  const track = $('.track', c)
  const slides = $$('.slide', track)
  const chips = $$('[data-go]', c)
  const prev = $('[data-prev]', c)
  const next = $('[data-next]', c)
  const pos = (i) => slides[i].offsetLeft - slides[0].offsetLeft
  const go = (i) => track.scrollTo({ left: pos(clamp(i, 0, slides.length - 1)), behavior: reduced ? 'auto' : 'smooth' })
  const current = () => {
    const x = track.scrollLeft
    let best = 0
    slides.forEach((s, i) => { if (Math.abs(pos(i) - x) < Math.abs(pos(best) - x)) best = i })
    return best
  }
  const sync = () => {
    const i = current()
    chips.forEach((ch, k) => ch.setAttribute('aria-selected', String(k === i)))
    if (prev) prev.disabled = track.scrollLeft < 8
    if (next) next.disabled = track.scrollLeft > track.scrollWidth - track.clientWidth - 8
  }
  chips.forEach((ch) => ch.addEventListener('click', () => go(+ch.dataset.go)))
  prev?.addEventListener('click', () => go(current() - 1))
  next?.addEventListener('click', () => go(current() + 1))
  track.addEventListener('scroll', () => requestAnimationFrame(sync), { passive: true })
  sync()
})

/* ---------- Lightbox ---------- */
const gallery = $('[data-gallery]')
if (gallery) {
  const items = $$('button', gallery)
  const lb = document.createElement('div')
  lb.className = 'lightbox'
  lb.setAttribute('role', 'dialog')
  lb.setAttribute('aria-modal', 'true')
  lb.setAttribute('aria-label', 'Galerie photo')
  lb.innerHTML = `
    <div class="lightbox__top"><span data-lb-count></span><button type="button" data-lb-close aria-label="Fermer"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 3l10 10M13 3L3 13"/></svg></button></div>
    <div class="lightbox__stage"><img alt=""></div>
    <div class="lightbox__bottom"><span>Crédits photos : @vl_production_motorsport</span><div class="lightbox__nav"><button type="button" data-lb-prev aria-label="Photo précédente"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M10 3L5 8l5 5"/></svg></button><button type="button" data-lb-next aria-label="Photo suivante"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 3l5 5-5 5"/></svg></button></div></div>`
  document.body.append(lb)
  const img = $('img', lb)
  let idx = 0
  let opener = null
  const show = (i) => {
    idx = (i + items.length) % items.length
    const b = items[idx]
    img.src = b.dataset.full
    img.alt = $('img', b).alt
    $('[data-lb-count]', lb).textContent = `${String(idx + 1).padStart(2, '0')} / ${String(items.length).padStart(2, '0')}`
  }
  const open = (i, from) => { opener = from; show(i); lb.classList.add('is-open'); lenis?.stop(); $('[data-lb-close]', lb).focus() }
  const close = () => { lb.classList.remove('is-open'); lenis?.start(); opener?.focus() }
  items.forEach((b, i) => b.addEventListener('click', () => open(i, b)))
  $('[data-lb-close]', lb).addEventListener('click', close)
  $('[data-lb-prev]', lb).addEventListener('click', () => show(idx - 1))
  $('[data-lb-next]', lb).addEventListener('click', () => show(idx + 1))
  lb.addEventListener('click', (e) => { if (e.target === lb || e.target.classList.contains('lightbox__stage')) close() })
  addEventListener('keydown', (e) => {
    if (!lb.classList.contains('is-open')) return
    if (e.key === 'Escape') close()
    if (e.key === 'ArrowLeft') show(idx - 1)
    if (e.key === 'ArrowRight') show(idx + 1)
  })
}

/* ---------- Reels ---------- */
const reels = $$('[data-reel]')
reels.forEach((r) => {
  const v = $('video', r)
  const toggle = () => {
    if (v.paused) {
      reels.forEach((o) => { if (o !== r) { $('video', o).pause(); o.classList.remove('is-playing') } })
      v.play().then(() => r.classList.add('is-playing')).catch(() => {})
    } else { v.pause(); r.classList.remove('is-playing') }
  }
  $('.reel__player', r).addEventListener('click', toggle)
  v.addEventListener('ended', () => r.classList.remove('is-playing'))
})

/* ---------- Click-to-load map (no third-party cookie before consent) ---------- */
$$('[data-map]').forEach((m) => {
  $('button', m)?.addEventListener('click', () => {
    const f = document.createElement('iframe')
    f.src = m.dataset.map
    f.title = 'Plan d’accès LAMO Racing Car, 549 Avenue d’Italie, Montauban'
    f.loading = 'lazy'
    f.referrerPolicy = 'no-referrer-when-downgrade'
    m.append(f)
    $('.map__cover', m).remove()
  })
})

/* ---------- Contact form (Netlify Forms, mailto fallback) ---------- */
$$('[data-form]').forEach((form) => {
  const msg = $('.form__msg', form)
  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    if (!form.reportValidity()) return
    const data = new FormData(form)
    const btn = $('button[type="submit"]', form)
    btn.disabled = true
    msg.className = 'form__msg'
    try {
      const res = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(data).toString(),
      })
      if (!res.ok) throw new Error(res.status)
      form.reset()
      msg.textContent = 'Merci ! Votre message est bien parti. L’équipe LAMO Racing Car revient vers vous très vite.'
      msg.classList.add('is-ok')
    } catch {
      const body = [
        `Nom : ${data.get('nom')}`,
        `Téléphone : ${data.get('telephone') || '—'}`,
        `E-mail : ${data.get('email')}`,
        `Projet : ${data.get('projet')}`,
        '',
        data.get('message') || '',
      ].join('\n')
      location.href = `mailto:laurent@lamoracingcar.com?subject=${encodeURIComponent(`Demande site — ${data.get('projet')}`)}&body=${encodeURIComponent(body)}`
      msg.textContent = 'Votre messagerie s’ouvre avec la demande pré-remplie. Sinon : laurent@lamoracingcar.com · 06 41 77 15 23.'
      msg.classList.add('is-ok')
    } finally { btn.disabled = false }
  })
})

/* ---------- Misc ---------- */
$$('[data-year]').forEach((el) => (el.textContent = new Date().getFullYear()))
runJobs()
