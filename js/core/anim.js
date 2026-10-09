/* Anim — a small promise-based animation engine.
 *
 * Every animation is a tween driven by requestAnimationFrame that resolves a
 * promise when it ends. Two global switches make slide steps replayable:
 *   - instant mode (Anim.instant(fn)): tweens and waits complete immediately,
 *     so the deck can rebuild "slide k, step n" without visible motion;
 *   - hurry (Anim.hurry()): finishes everything in flight and keeps the rest of
 *     the current step instant (PowerPoint-style "click to complete").
 * Ambient tweens ({ambient: true}) ignore both switches; they belong to
 * looping decorations that must never spin in a zero-time loop.
 */
(function (root) {
  'use strict';

  const ease = {
    linear: (t) => t,
    in: (t) => t * t * t,
    out: (t) => 1 - Math.pow(1 - t, 3),
    inOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    outQuart: (t) => 1 - Math.pow(1 - t, 4),
    inOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
    outBack: (t) => {
      const c1 = 1.70158, c3 = c1 + 1;
      return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    },
    outElastic: (t) => (t === 0 || t === 1 ? t
      : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1),
  };

  const active = new Set();
  let instantDepth = 0;
  let hurrying = false;
  let timeScale = 1;
  let rafId = 0;

  function isInstant() { return instantDepth > 0 || hurrying; }

  function schedule() {
    if (!rafId && active.size) rafId = requestAnimationFrame(frame);
  }

  function frame(now) {
    rafId = 0;
    for (const tw of Array.from(active)) {
      if (tw.start == null) tw.start = now + tw.delay;
      if (now < tw.start) continue;
      const t = tw.dur <= 0 ? 1 : Math.min(1, (now - tw.start) / tw.dur);
      try { tw.apply(tw.ease(t)); } catch (err) { console.error(err); finish(tw); continue; }
      if (t >= 1) finish(tw);
    }
    schedule();
  }

  /* Stop a running to() tween where it stands and resolve its promise. */
  function drop(handle) {
    const tw = handle.tw;
    if (tw && active.has(tw)) { active.delete(tw); tw.resolve(); }
  }

  function finish(tw) {
    if (!active.has(tw)) return;
    active.delete(tw);
    try { tw.apply(1); } catch (err) { console.error(err); }
    tw.resolve();
  }

  /* run(apply, opts): calls apply(p) every frame with eased progress p (0..1,
   * may overshoot for back/elastic easings) and resolves when done. */
  function run(apply, opts) {
    const o = opts || {};
    const dur = o.dur == null ? 600 : o.dur;
    const delay = o.delay || 0;
    const fn = typeof o.ease === 'function' ? o.ease : (ease[o.ease] || ease.inOut);
    if (!o.ambient && (isInstant() || dur + delay <= 0)) {
      apply(1);
      return Promise.resolve();
    }
    const scale = o.ambient ? 1 : timeScale;
    // Paint the start state right away so nothing flashes before frame 1.
    if (!delay) apply(fn(0));
    return new Promise((resolve) => {
      const tw = {
        apply, ease: fn, resolve, start: null,
        dur: dur / scale, delay: delay / scale,
        owner: o.owner || null, ambient: !!o.ambient,
      };
      if (o.handle) o.handle.tw = tw;
      active.add(tw);
      schedule();
    });
  }

  function wait(ms, opts) {
    return run(() => {}, Object.assign({ dur: ms, ease: 'linear' }, opts));
  }

  const lerp = (a, b, p) => (p === 1 ? b : a + (b - a) * p);

  /* tween(obj, to, opts): numeric properties of a plain object. */
  function tween(obj, to, opts) {
    const from = {};
    for (const k in to) from[k] = obj[k];
    const onUpdate = opts && opts.onUpdate;
    return run((p) => {
      for (const k in to) obj[k] = lerp(from[k], to[k], p);
      if (onUpdate) onUpdate(obj, p);
    }, opts);
  }

  /* Element transform state. Works for HTML and SVG elements (SVG elements
   * get transform-box: fill-box from the stylesheet so scale/rotate pivot on
   * their own centre). */
  function state(el) {
    if (!el.__t) el.__t = { x: 0, y: 0, s: 1, r: 0, o: 1 };
    return el.__t;
  }

  function render(el) {
    const t = el.__t;
    el.style.transform = 'translate(' + t.x.toFixed(2) + 'px,' + t.y.toFixed(2) + 'px)'
      + (t.r ? ' rotate(' + t.r.toFixed(2) + 'deg)' : '')
      + (t.s !== 1 ? ' scale(' + t.s.toFixed(4) + ')' : '');
    el.style.opacity = t.o >= 0.999 ? '' : String(Math.max(0, Math.round(t.o * 1000) / 1000));
  }

  const KEYS = { x: 'x', y: 'y', scale: 's', s: 's', rot: 'r', r: 'r', opacity: 'o', o: 'o' };

  function normalize(props) {
    const out = {};
    for (const k in props) if (KEYS[k]) out[KEYS[k]] = props[k];
    return out;
  }

  /* set(el, {x, y, scale, rot, opacity}) — jump without animating. */
  function set(el, props) {
    Object.assign(state(el), normalize(props));
    render(el);
    return el;
  }

  function get(el) { return Object.assign({}, state(el)); }

  /* to(el, props, opts) — animate transform/opacity. opts.arc = lift in px
   * moves x/y along a quadratic curve bowed perpendicular to the path
   * (positive lifts "up/left" of the travel direction). */
  function to(el, props, opts) {
    const o = opts || {};
    const t = state(el);
    const from = Object.assign({}, t);
    const target = normalize(props);
    const arc = o.arc || 0;
    let cx = 0, cy = 0;
    if (arc && ('x' in target || 'y' in target)) {
      const tx = 'x' in target ? target.x : from.x;
      const ty = 'y' in target ? target.y : from.y;
      const dx = tx - from.x, dy = ty - from.y;
      const len = Math.hypot(dx, dy) || 1;
      cx = (from.x + tx) / 2 + (dy / len) * arc;
      cy = (from.y + ty) / 2 - (dx / len) * arc;
    }
    // A new tween on the same element and property replaces the running one
    // (its promise resolves where it stands; this tween continues from there).
    if (el.__tws) {
      for (const tw of Array.from(el.__tws)) {
        if (tw.ambient === !!o.ambient && tw.keys.some((k) => k in target)) drop(tw);
      }
    }
    const handle = { keys: Object.keys(target), ambient: !!o.ambient };
    (el.__tws || (el.__tws = new Set())).add(handle);
    const promise = run((p) => {
      for (const k in target) {
        if (arc && (k === 'x' || k === 'y')) continue;
        t[k] = lerp(from[k], target[k], p);
      }
      if (arc) {
        const tx = 'x' in target ? target.x : from.x;
        const ty = 'y' in target ? target.y : from.y;
        const q = Math.min(1, Math.max(0, p));
        t.x = (1 - q) * (1 - q) * from.x + 2 * (1 - q) * q * cx + q * q * tx;
        t.y = (1 - q) * (1 - q) * from.y + 2 * (1 - q) * q * cy + q * q * ty;
      }
      render(el);
      if (o.onUpdate) o.onUpdate(p);
    }, Object.assign({}, o, { handle }));
    return promise.then(() => { el.__tws.delete(handle); });
  }

  /* Run fn with every tween collapsed to zero time. fn may be async; the
   * returned promise settles once fn's promise does. */
  async function instant(fn) {
    instantDepth++;
    try { return await fn(); } finally { instantDepth--; }
  }

  function hurry() {
    hurrying = true;
    for (const tw of Array.from(active)) if (!tw.ambient) finish(tw);
  }

  function endHurry() { hurrying = false; }

  /* Finish (resolve) every tween owned by `owner`, e.g. a slide's ambient
   * loops when the slide is left. */
  function kill(owner) {
    for (const tw of Array.from(active)) if (tw.owner === owner) finish(tw);
  }

  function stagger(items, fn, gap) {
    return Promise.all(Array.from(items).map((item, i) => fn(item, i, (gap == null ? 80 : gap) * i)));
  }

  root.Anim = {
    ease, run, wait, tween, to, set, get, lerp, stagger,
    instant, hurry, endHurry, kill, isInstant,
    get timeScale() { return timeScale; },
    set timeScale(v) { timeScale = Math.max(0.05, Number(v) || 1); },
    get busy() { for (const tw of active) if (!tw.ambient) return true; return false; },
  };
})(typeof window !== 'undefined' ? window : globalThis);
