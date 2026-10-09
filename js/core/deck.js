/* Deck — slides, click-steps, navigation and the presentation chrome.
 *
 * A slide is declared with Deck.add({
 *   id, act, title: {en, tr}, steps, html,
 *   init(ctx),          // build the scene in its step-0 state
 *   async step(n, ctx), // animate from step n-1 to step n
 *   enter(ctx), leave(ctx)   // start/stop ambient loops (ctx.loop)
 * }).
 * Elements with data-step="n" are revealed at step n, data-hide="n" hides
 * them at step n, and data-in="up|zoom|left|right|pop|fade" animates them in
 * when the slide is entered.
 *
 * Jumping to "slide i, step k" (and every backward click) rebuilds the slide
 * from scratch and replays steps 1..k in Anim.instant mode, so the state at
 * each step is always the same no matter how it was reached.
 */
(function (root) {
  'use strict';

  const ACTS = {
    opening: { en: 'Transform & Conquer', tr: 'Dönüştür ve Fethet', color: 'var(--line)' },
    simplify: { en: 'Instance simplification', tr: 'Örneği basitleştirme', color: 'var(--simplify)' },
    represent: { en: 'Representation change', tr: 'Gösterimi değiştirme', color: 'var(--represent)' },
    heap: { en: 'Heaps & Heapsort', tr: 'Heap ve Heapsort', color: 'var(--star)', star: true },
    reduce: { en: 'Problem reduction', tr: 'Probleme indirgeme', color: 'var(--reduce)' },
    closing: { en: 'Wrap-up', tr: 'Kapanış', color: 'var(--line)' },
    appendix: { en: 'Appendix', tr: 'Ek', color: 'var(--muted)' },
  };

  const slides = [];
  const listeners = { change: [] };
  let idx = 0;
  let cur = null;            // current slide context
  let pending = null;        // running navigation promise
  let stepRunning = false;
  let presenterWin = null;
  let dom = {};

  const reducedMotion = root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function add(def) {
    def.steps = def.steps || 0;
    def.act = def.act || 'opening';
    slides.push(def);
  }

  function on(evt, fn) { (listeners[evt] = listeners[evt] || []).push(fn); }
  function emit(evt, data) { (listeners[evt] || []).forEach((fn) => fn(data)); }

  /* ---------- slide label: "7 / 20", appendix "A2" ---------- */
  function mainCount() { return slides.filter((s) => s.act !== 'appendix').length; }
  function label(i) {
    const s = slides[i];
    if (s.act === 'appendix') return 'A' + (i - mainCount() + 1);
    return String(i + 1);
  }

  /* ---------- context ---------- */
  function makeCtx(def, el, i) {
    const ctx = {
      def, el, index: i, step: 0, alive: true, data: {},
      $: (sel) => el.querySelector(sel),
      $$: (sel) => Array.from(el.querySelectorAll(sel)),
      /* Ambient loop: fn(A) runs repeatedly while the slide is shown. A.to /
       * A.wait / A.run are ambient tweens owned by this slide. */
      loop(fn) {
        const A = {
          to: (e, p, o) => Anim.to(e, p, Object.assign({}, o, { ambient: true, owner: ctx })),
          wait: (ms) => Anim.wait(ms, { ambient: true, owner: ctx }),
          run: (f, o) => Anim.run(f, Object.assign({}, o, { ambient: true, owner: ctx })),
          get alive() { return ctx.alive; },
        };
        (async () => {
          while (ctx.alive) {
            const t0 = performance.now();
            try { await fn(A); } catch (err) { console.error(err); return; }
            // Never spin: every iteration lasts at least one frame.
            if (performance.now() - t0 < 16) await A.wait(16);
          }
        })();
      },
    };
    return ctx;
  }

  /* ---------- fragments ---------- */
  function setFragments(ctx, n) {
    ctx.$$('[data-step]').forEach((e) => {
      const s = Number(e.dataset.step);
      e.classList.toggle('on', s <= n);
      e.classList.toggle('now', s === n);
    });
    ctx.$$('[data-hide]').forEach((e) => e.classList.toggle('off', Number(e.dataset.hide) <= n));
    ctx.el.dataset.at = n;
  }

  function header(def) {
    if (def.bare) return '';
    const act = ACTS[def.act] || ACTS.opening;
    const t = def.title || { en: '', tr: '' };
    return '<header class="slide-head">'
      + '<div class="eyebrow" data-in="left">' + (act.star ? '<span class="star-mark" aria-hidden="true">★</span>' : '')
      + L(act.en, act.tr) + '</div>'
      + '<h1 class="slide-title" data-in="up">' + L(t.en, t.tr) + '</h1>'
      + '</header>';
  }

  /* Build slide i at step k (instantly). Returns its context. */
  async function mount(i, k) {
    const def = slides[i];
    const el = U.h('section', {
      class: 'slide instant',
      'data-id': def.id,
      'data-act': def.act,
      'aria-roledescription': 'slide',
    });
    el.innerHTML = header(def) + '<div class="slide-body">' + (typeof def.html === 'function' ? def.html() : (def.html || '')) + '</div>';
    dom.slides.appendChild(el);
    const ctx = makeCtx(def, el, i);
    await Anim.instant(async () => {
      if (def.init) await def.init(ctx);
      setFragments(ctx, 0);
      for (let n = 1; n <= k; n++) {
        ctx.step = n;
        setFragments(ctx, n);
        if (def.step) await def.step(n, ctx);
      }
    });
    ctx.step = k;
    return ctx;
  }

  function release(ctx) {
    if (!ctx) return;
    ctx.alive = false;
    Anim.kill(ctx);
    try { if (ctx.def.leave) ctx.def.leave(ctx); } catch (err) { console.error(err); }
  }

  function activate(ctx, entrance) {
    const el = ctx.el;
    el.classList.add('active');
    if (entrance && !Anim.isInstant()) {
      void el.offsetWidth;            // commit the pre-entrance styles
      el.classList.remove('instant');
      el.classList.add('entered');
    } else {
      el.classList.add('entered');
      void el.offsetWidth;
      requestAnimationFrame(() => el.classList.remove('instant'));
    }
    try { if (ctx.def.enter) ctx.def.enter(ctx); } catch (err) { console.error(err); }
  }

  /* ---------- transitions ---------- */
  function transition(oldEl, newEl, dir, kind) {
    if (reducedMotion) kind = 'fade';
    const scan = dom.scan;
    const W = 1920;
    if (kind === 'zoom') {
      return Anim.run((p) => {
        newEl.style.opacity = String(Math.min(1, p * 1.4));
        newEl.style.transform = 'scale(' + (1.08 - 0.08 * p) + ')';
        oldEl.style.opacity = String(1 - p);
        oldEl.style.transform = 'scale(' + (1 - 0.06 * p) + ')';
      }, { dur: 750, ease: 'inOut' });
    }
    if (kind === 'fade') {
      return Anim.run((p) => {
        newEl.style.opacity = String(p);
        oldEl.style.opacity = String(1 - p);
      }, { dur: 400, ease: 'inOut' });
    }
    // Blueprint scan-line wipe.
    scan.classList.add('on');
    return Anim.run((p) => {
      const q = Math.min(1, Math.max(0, p));
      if (dir >= 0) {
        newEl.style.clipPath = 'inset(0 0 0 ' + ((1 - q) * 100).toFixed(2) + '%)';
        Anim.set(scan, { x: (1 - q) * W });
        oldEl.style.transform = 'translateX(' + (-60 * q).toFixed(1) + 'px)';
      } else {
        newEl.style.clipPath = 'inset(0 ' + ((1 - q) * 100).toFixed(2) + '% 0 0)';
        Anim.set(scan, { x: q * W });
        oldEl.style.transform = 'translateX(' + (60 * q).toFixed(1) + 'px)';
      }
      oldEl.style.opacity = String(1 - 0.75 * q);
    }, { dur: 720, ease: 'inOut' }).then(() => scan.classList.remove('on'));
  }

  /* ---------- navigation ---------- */
  async function show(i, k, dir, opts) {
    const old = cur;
    const ctx = await mount(i, k);
    cur = ctx;
    idx = i;
    release(old);
    updateChrome();
    emitChange();
    activate(ctx, dir >= 0 && !(opts && opts.noEntrance));
    if (!old) return;
    old.el.classList.add('leaving');
    const kind = dir < 0 ? 'wipe' : (slides[i].transition || 'wipe');
    try {
      await transition(old.el, ctx.el, dir, kind);
    } finally {
      old.el.remove();
      ctx.el.style.clipPath = '';
      ctx.el.style.opacity = '';
      ctx.el.style.transform = '';
    }
  }

  async function rebuild(k) {
    const old = cur;
    const ctx = await mount(idx, k);
    release(old);
    old.el.remove();
    cur = ctx;
    activate(ctx, false);
    updateChrome();
    emitChange();
  }

  async function runStep(n) {
    cur.step = n;
    stepRunning = true;
    updateChrome();
    emitChange();
    try {
      setFragments(cur, n);
      if (cur.def.step) await cur.def.step(n, cur);
    } catch (err) {
      console.error(err);
    } finally {
      stepRunning = false;
    }
  }

  async function perform(kind, arg) {
    if (!cur) return;
    if (kind === 'next') {
      if (cur.step < cur.def.steps) await runStep(cur.step + 1);
      else if (idx < slides.length - 1) await show(idx + 1, 0, 1);
    } else if (kind === 'prev') {
      if (cur.step > 0) await rebuild(cur.step - 1);
      else if (idx > 0) await show(idx - 1, slides[idx - 1].steps, -1, { noEntrance: true });
    } else if (kind === 'goto') {
      const i = U.clamp(arg.i, 0, slides.length - 1);
      const k = U.clamp(arg.step || 0, 0, slides[i].steps);
      if (i === idx) await rebuild(k);
      else await show(i, k, i > idx ? 1 : -1);
    }
  }

  /* Serialize navigation. A click while something animates completes it
   * (PowerPoint behaviour); "back" completes it and then goes back. */
  async function command(kind, arg) {
    if (pending) {
      Anim.hurry();
      if (kind === 'next') return;
      try { await pending; } catch (e) { /* already logged */ }
    }
    const p = perform(kind, arg);
    pending = p;
    try { await p; } finally {
      if (pending === p) pending = null;
      Anim.endHurry();
    }
  }

  const next = () => command('next');
  const prev = () => command('prev');
  const goto = (i, step) => command('goto', { i, step });
  const gotoId = (id, step) => {
    const i = slides.findIndex((s) => s.id === id);
    if (i >= 0) return goto(i, step);
    return Promise.resolve();
  };

  function emitChange() {
    const state = snapshot();
    emit('change', state);
    try {
      const st = cur ? cur.step : 0;
      if (history.replaceState) history.replaceState(null, '', '#' + slides[idx].id + (st ? '.' + st : ''));
    } catch (e) { /* sandboxed frames may refuse */ }
    if (presenterWin && !presenterWin.closed) {
      try { presenterWin.postMessage({ type: 'tc-state', state }, '*'); } catch (e) { /* ignore */ }
    }
    renderNotes();
  }

  function snapshot() {
    return {
      index: idx, step: cur ? cur.step : 0, steps: slides[idx].steps,
      id: slides[idx].id, label: label(idx), total: mainCount(), count: slides.length,
      lang: I18n.lang, running: stepRunning,
      slides: slides.map((s, i) => ({ id: s.id, act: s.act, title: s.title || null, steps: s.steps, label: label(i) })),
    };
  }

  /* ---------- chrome ---------- */
  function buildDom(rootEl) {
    const viewport = U.h('div', { id: 'viewport' });
    const ambient = U.h('canvas', { id: 'ambient', 'aria-hidden': 'true' });
    const stage = U.h('div', { id: 'stage', role: 'region', 'aria-label': 'Presentation' });
    const slidesHost = U.h('div', { id: 'slides' });
    const scan = U.h('div', { class: 'scanline', 'aria-hidden': 'true' });
    const fxCanvas = U.h('canvas', { id: 'fx', width: 1920, height: 1080, 'aria-hidden': 'true' });

    const chip = U.h('div', { class: 'act-chip' }, U.h('span', { class: 'act-dot' }), U.h('span', { class: 'act-name' }));
    const progress = U.h('div', { class: 'progress', 'aria-hidden': 'true' });
    const counter = U.h('div', { class: 'counter' });
    const hint = U.h('div', { class: 'key-hint', html: L('<kbd>→</kbd> next &nbsp; <kbd>←</kbd> back &nbsp; <kbd>?</kbd> help', '<kbd>→</kbd> ileri &nbsp; <kbd>←</kbd> geri &nbsp; <kbd>?</kbd> yardım') });
    const tools = U.h('div', { class: 'tools' },
      U.h('button', { class: 'tool', type: 'button', 'data-cmd': 'lang', title: 'EN / TR (L)', html: '<span lang="en">TR</span><span lang="tr">EN</span>' }),
      U.h('button', { class: 'tool', type: 'button', 'data-cmd': 'theme', title: 'Theme (T)', html: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M12 3a9 9 0 1 0 9 9 7 7 0 0 1-9-9z" fill="currentColor"/></svg>' }),
      U.h('button', { class: 'tool', type: 'button', 'data-cmd': 'overview', title: 'Overview (O)', html: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" fill="currentColor"/></svg>' }),
      U.h('button', { class: 'tool', type: 'button', 'data-cmd': 'fullscreen', title: 'Fullscreen (F)', html: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" stroke="currentColor" stroke-width="2.2" fill="none"/></svg>' })
    );
    const toast = U.h('div', { class: 'toast', 'aria-live': 'polite' });
    stage.append(sharedDefs(), slidesHost, fxCanvas, scan, chip, tools, progress, counter, hint, toast);
    viewport.append(ambient, stage);

    const overview = U.h('div', { class: 'overlay overview', hidden: true, role: 'dialog', 'aria-label': 'Overview' });
    const help = U.h('div', { class: 'overlay help', hidden: true, role: 'dialog', 'aria-label': 'Help' });
    const notes = U.h('aside', { class: 'notes-drawer', hidden: true, 'aria-label': 'Speaker notes' });
    const blackout = U.h('div', { class: 'blackout', hidden: true });
    rootEl.append(viewport, overview, help, notes, blackout);

    dom = { viewport, stage, slides: slidesHost, scan, chip, progress, counter, hint, tools, toast, overview, help, notes, blackout, ambient, fx: fxCanvas };
    root.addEventListener('resize', fit);
    fit();
  }

  /* Arrowhead markers shared by every slide (one copy, so ids never clash
   * while two slides overlap during a transition). */
  function sharedDefs() {
    const colors = ['line', 'ink', 'muted', 'ok', 'bad', 'cmp', 'swap', 'star', 'simplify', 'represent', 'reduce'];
    const svg = U.s('svg', { class: 'shared-defs', width: 0, height: 0, 'aria-hidden': 'true' });
    const defs = U.s('defs');
    colors.forEach((c) => {
      const m = U.s('marker', { id: 'arrow-' + c, viewBox: '0 0 12 12', refX: 9, refY: 6, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse', markerUnits: 'strokeWidth' });
      m.appendChild(U.s('path', { d: 'M1,1 L11,6 L1,11 L4,6 Z', style: 'fill: var(--' + c + ')' }));
      defs.appendChild(m);
    });
    svg.appendChild(defs);
    return svg;
  }

  let toastTimer = 0;
  function toast(html) {
    if (!dom.toast) return;
    dom.toast.innerHTML = html;
    dom.toast.classList.add('on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => dom.toast.classList.remove('on'), 1300);
  }

  function fit() {
    const w = root.innerWidth, h = root.innerHeight;
    const s = Math.min(w / 1920, h / 1080);
    dom.stage.style.setProperty('--scale', s.toFixed(5));
    dom.stage.style.transform = 'translate(-50%, -50%) scale(' + s.toFixed(5) + ')';
  }

  function buildProgress() {
    dom.progress.innerHTML = '';
    slides.forEach((s, i) => {
      if (s.act === 'appendix') return;
      const seg = U.h('span', { class: 'seg', 'data-act': s.act, style: { '--c': (ACTS[s.act] || ACTS.opening).color } },
        U.h('i'));
      seg.dataset.i = i;
      dom.progress.appendChild(seg);
    });
  }

  function updateChrome() {
    const def = slides[idx];
    const act = ACTS[def.act] || ACTS.opening;
    dom.stage.dataset.act = def.act;
    dom.chip.style.setProperty('--c', act.color);
    dom.chip.querySelector('.act-name').innerHTML = (act.star ? '★ ' : '') + L(act.en, act.tr);
    dom.chip.classList.toggle('hidden', !!def.bare && def.act === 'opening' && idx === 0);
    const isApp = def.act === 'appendix';
    dom.counter.innerHTML = isApp ? label(idx) : '<b>' + (idx + 1) + '</b><span>/' + mainCount() + '</span>';
    U.$$('.seg', dom.progress).forEach((seg) => {
      const i = Number(seg.dataset.i);
      seg.classList.toggle('done', i < idx);
      seg.classList.toggle('cur', i === idx);
      const fill = seg.querySelector('i');
      const frac = i < idx ? 1 : i === idx ? (def.steps ? (cur ? cur.step : 0) / def.steps : 1) : 0;
      fill.style.transform = 'scaleX(' + frac + ')';
    });
    dom.hint.classList.toggle('gone', idx > 0);
  }

  /* ---------- overlays ---------- */
  function toggleOverview(force) {
    const ov = dom.overview;
    const open = force == null ? ov.hidden : force;
    if (!open) { ov.hidden = true; return; }
    closeOverlays();
    ov.innerHTML = '<div class="ov-grid">' + slides.map((s, i) => {
      const act = ACTS[s.act] || ACTS.opening;
      const t = s.title || { en: s.id, tr: s.id };
      return '<button type="button" class="ov-card' + (i === idx ? ' cur' : '') + '" data-i="' + i + '" style="--c:' + act.color + '">'
        + '<span class="ov-num">' + label(i) + '</span>'
        + '<span class="ov-act">' + L(act.en, act.tr) + '</span>'
        + '<span class="ov-title">' + L(t.en, t.tr) + '</span></button>';
    }).join('') + '</div>';
    ov.hidden = false;
    const curCard = ov.querySelector('.ov-card.cur');
    if (curCard) curCard.focus();
  }

  function toggleHelp(force) {
    const hp = dom.help;
    const open = force == null ? hp.hidden : force;
    if (!open) { hp.hidden = true; return; }
    closeOverlays();
    const rows = [
      ['→ &nbsp;Space &nbsp;PgDn &nbsp;click', 'Next animation / slide', 'Sonraki animasyon / slayt'],
      ['← &nbsp;PgUp', 'Back one step', 'Bir adım geri'],
      ['Home / End', 'First / last slide', 'İlk / son slayt'],
      ['O', 'Overview of all slides', 'Tüm slaytlara genel bakış'],
      ['L', 'English ⇄ Türkçe', 'English ⇄ Türkçe'],
      ['T', 'Dark ⇄ light theme', 'Koyu ⇄ açık tema'],
      ['F', 'Fullscreen', 'Tam ekran'],
      ['N', 'Speaker notes (rehearsal)', 'Konuşma notları (prova)'],
      ['S', 'Presenter window (notes + timer)', 'Sunucu penceresi (not + süre)'],
      ['B', 'Black screen', 'Ekranı karart'],
      ['1–9 + Enter', 'Jump to slide number', 'Slayt numarasına git'],
    ];
    hp.innerHTML = '<div class="help-card"><h2>' + L('Keyboard', 'Klavye') + '</h2><dl>'
      + rows.map((r) => '<dt><kbd>' + r[0] + '</kbd></dt><dd>' + L(r[1], r[2]) + '</dd>').join('')
      + '</dl><p class="help-foot">' + L('Press any key to close', 'Kapatmak için bir tuşa basın') + '</p></div>';
    hp.hidden = false;
  }

  function closeOverlays() {
    dom.overview.hidden = true;
    dom.help.hidden = true;
  }

  function toggleNotes(force) {
    const n = dom.notes;
    n.hidden = force == null ? !n.hidden : !force;
    renderNotes();
  }

  function renderNotes() {
    const n = dom.notes;
    if (!n || n.hidden || !cur) return;
    const notes = (root.NOTES || {})[slides[idx].id];
    if (!notes) { n.innerHTML = '<p class="nd-empty">—</p>'; return; }
    const cues = notes.cues || [];
    n.innerHTML = '<div class="nd-head"><b>' + label(idx) + '</b> ' + I18n.pick(slides[idx].title || {})
      + (notes.time ? ' <span class="nd-time">' + notes.time + '</span>' : '') + '</div>'
      + '<div class="nd-cols"><div class="nd-en" lang="en">' + notes.en + '</div><div class="nd-tr" lang="tr">' + notes.tr + '</div></div>'
      + (cues.length ? '<ol class="nd-cues">' + cues.map((c, i) => '<li class="' + (i + 1 === cur.step ? 'cur' : i + 1 < cur.step ? 'done' : '') + '">' + c + '</li>').join('') + '</ol>' : '');
  }

  function toggleTheme() {
    const html = document.documentElement;
    const next = html.dataset.theme === 'light' ? 'dark' : 'light';
    html.dataset.theme = next;
    U.store.set('theme', next);
    root.dispatchEvent(new CustomEvent('themechange', { detail: next }));
  }

  function toggleFullscreen() {
    try {
      if (document.fullscreenElement) document.exitFullscreen();
      else document.documentElement.requestFullscreen().catch(() => {});
    } catch (e) { /* not allowed here */ }
  }

  function openPresenter() {
    try {
      const url = location.href.split('#')[0] + '#presenter';
      presenterWin = root.open(url, 'tc-presenter', 'width=1100,height=760');
      if (presenterWin) setTimeout(emitChange, 600);
      else toggleNotes(true);
    } catch (e) { toggleNotes(true); }
  }

  /* ---------- input ---------- */
  let digits = '';
  function onKey(e) {
    if (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const k = e.key;
    if (!dom.help.hidden) { toggleHelp(false); e.preventDefault(); return; }
    if (!dom.blackout.hidden && k !== 'b' && k !== 'B' && k !== '.') { dom.blackout.hidden = true; }
    if (!dom.overview.hidden) {
      if (k === 'Escape' || k === 'o' || k === 'O') { toggleOverview(false); e.preventDefault(); }
      return;
    }
    switch (k) {
      case 'ArrowRight': case 'ArrowDown': case 'PageDown': case ' ': case 'Spacebar':
        e.preventDefault(); next(); break;
      case 'Enter':
        e.preventDefault();
        if (digits) { goto(Number(digits) - 1, 0); digits = ''; } else next();
        break;
      case 'ArrowLeft': case 'ArrowUp': case 'PageUp': case 'Backspace':
        e.preventDefault(); prev(); break;
      case 'Home': e.preventDefault(); goto(0, 0); break;
      case 'End': e.preventDefault(); goto(mainCount() - 1, 0); break;
      case 'o': case 'O': toggleOverview(); break;
      case 'f': case 'F': toggleFullscreen(); break;
      case 't': case 'T': toggleTheme(); break;
      case 'l': case 'L': I18n.toggle(); toast(L('English', 'Türkçe')); break;
      case '-': case '_': Anim.timeScale = Math.max(0.25, Anim.timeScale / 1.25); toast(L('Speed', 'Hız') + ' ×' + Anim.timeScale.toFixed(2)); break;
      case '=': case '+': Anim.timeScale = Math.min(4, Anim.timeScale * 1.25); toast(L('Speed', 'Hız') + ' ×' + Anim.timeScale.toFixed(2)); break;
      case 'n': case 'N': toggleNotes(); break;
      case 's': case 'S': openPresenter(); break;
      case 'b': case 'B': case '.': dom.blackout.hidden = !dom.blackout.hidden; break;
      case '?': case 'h': case 'H': toggleHelp(); break;
      case 'Escape': closeOverlays(); dom.blackout.hidden = true; break;
      default:
        if (/^[0-9]$/.test(k)) { digits = (digits + k).slice(-2); clearTimeout(onKey.t); onKey.t = setTimeout(() => { digits = ''; }, 1500); }
    }
  }

  function isInteractive(t) {
    return !!(t && t.closest && t.closest('button, a, input, select, textarea, label, [data-interactive], .overlay, .notes-drawer'));
  }

  function bindInput() {
    root.addEventListener('keydown', onKey);
    dom.viewport.addEventListener('click', (e) => { if (!isInteractive(e.target)) next(); });
    dom.tools.addEventListener('click', (e) => {
      const b = e.target.closest('[data-cmd]');
      if (!b) return;
      e.stopPropagation();
      ({ lang: () => I18n.toggle(), theme: toggleTheme, overview: () => toggleOverview(), fullscreen: toggleFullscreen })[b.dataset.cmd]();
      b.blur();
    });
    dom.overview.addEventListener('click', (e) => {
      const c = e.target.closest('.ov-card');
      if (c) { toggleOverview(false); goto(Number(c.dataset.i), 0); }
      else toggleOverview(false);
    });
    dom.help.addEventListener('click', () => toggleHelp(false));
    dom.blackout.addEventListener('click', () => { dom.blackout.hidden = true; });
    let tx = null;
    dom.viewport.addEventListener('touchstart', (e) => { tx = e.touches[0].clientX; }, { passive: true });
    dom.viewport.addEventListener('touchend', (e) => {
      if (tx == null) return;
      const dx = e.changedTouches[0].clientX - tx;
      tx = null;
      if (Math.abs(dx) > 50) { if (dx < 0) next(); else prev(); }
    }, { passive: true });
    root.addEventListener('message', (e) => {
      const m = e.data;
      if (!m || m.type !== 'tc-cmd') return;
      if (m.cmd === 'next') next();
      else if (m.cmd === 'prev') prev();
      else if (m.cmd === 'goto') goto(Number(m.i) || 0, Number(m.step) || 0);
      else if (m.cmd === 'hello') emitChange();
    });
    root.addEventListener('langchange', () => { updateChrome(); renderNotes(); emitChange(); });
  }

  /* Wait (at most 2.5 s) for the faces the first slide needs, so layouts
   * are measured with the real fonts. */
  function loadFonts() {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    const faces = ['750 66px "Bricolage Grotesque"', '400 30px "IBM Plex Sans"', '600 30px "IBM Plex Sans"',
      '500 24px "IBM Plex Mono"', '600 24px "IBM Plex Mono"', '600 36px "Caveat"', '400 30px "TC Math"'];
    const all = Promise.all(faces.map((f) => document.fonts.load(f, 'AaĞğİıŞş0123⌊Θ').catch(() => null)));
    return Promise.race([all, new Promise((r) => setTimeout(r, 2500))]);
  }

  /* ---------- start ---------- */
  async function start(opts) {
    const o = opts || {};
    const html = document.documentElement;
    html.dataset.theme = U.store.get('theme', html.dataset.theme || 'dark');
    I18n.init();
    const params = new URLSearchParams(location.search);
    if (params.get('speed')) Anim.timeScale = Number(params.get('speed'));
    if (location.hash === '#presenter' && root.Presenter) { root.Presenter.start(slides); return; }

    const host = o.root || document.getElementById('app') || document.body;
    buildDom(host);
    buildProgress();
    if (root.FX) root.FX.init(dom);
    bindInput();
    await loadFonts();

    const hash = decodeURIComponent((location.hash || '').slice(1)).split('.');
    let first = slides.findIndex((s) => s.id === hash[0]);
    if (first < 0) first = 0;
    const firstStep = U.clamp(Number(hash[1]) || 0, 0, slides[first].steps);
    idx = first;
    cur = await mount(first, firstStep);
    activate(cur, true);
    updateChrome();
    emitChange();
    root.dispatchEvent(new CustomEvent('deckready'));
  }

  root.Deck = {
    ACTS, add, start, next, prev, goto, gotoId, on, snapshot,
    toggleNotes, toggleOverview, toggleTheme,
    get slides() { return slides; },
    get index() { return idx; },
    get current() { return cur; },
    get busy() { return !!pending; },
    get dom() { return dom; },
    label, toast,
  };
})(window);
