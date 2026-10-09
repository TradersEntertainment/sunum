/* FX — ambient drafting-table background, bursts, ripples, count-ups.
 * The ambient canvas fills the window behind the stage; the fx canvas lives
 * inside the stage (1920×1080 coordinates) for bursts and ripples. */
(function (root) {
  'use strict';

  const reduced = root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let amb = null, actx = null, fx = null, fctx = null;
  let parts = [], sparks = [], rings = [];
  let tint = null, tintTarget = null;
  let lastAmb = 0, fxRaf = 0;
  const GLYPHS = ['2j', '2j+1', '⌊n/2⌋', 'log n', 'Θ(n)', 'n²', '≤', '≥', 'A[i]', 'x³', 'h', 'O(1)'];

  function cssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#7fb4ff';
  }

  function parseColor(c) {
    const ctx = document.createElement('canvas').getContext('2d');
    ctx.fillStyle = '#000';
    ctx.fillStyle = c;
    const v = ctx.fillStyle;
    if (v[0] === '#') {
      return [parseInt(v.slice(1, 3), 16), parseInt(v.slice(3, 5), 16), parseInt(v.slice(5, 7), 16)];
    }
    const m = v.match(/\d+(\.\d+)?/g) || [127, 180, 255];
    return [Number(m[0]), Number(m[1]), Number(m[2])];
  }

  function seedParticles() {
    parts = [];
    const W = amb.width, H = amb.height;
    const n = Math.round(Math.min(46, (W * H) / 52000));
    for (let i = 0; i < n; i++) {
      const kind = i % 7 === 0 ? 'glyph' : i % 11 === 0 ? 'arc' : 'node';
      parts.push({
        kind, x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.12, vy: -0.05 - Math.random() * 0.12,
        r: kind === 'arc' ? 40 + Math.random() * 90 : 2 + Math.random() * 3.5,
        a: Math.random() * Math.PI * 2, va: (Math.random() - 0.5) * 0.002,
        g: GLYPHS[(Math.random() * GLYPHS.length) | 0],
      });
    }
  }

  function resize() {
    if (!amb) return;
    const dpr = Math.min(2, root.devicePixelRatio || 1);
    amb.width = Math.round(root.innerWidth * dpr);
    amb.height = Math.round(root.innerHeight * dpr);
    amb.style.width = root.innerWidth + 'px';
    amb.style.height = root.innerHeight + 'px';
    seedParticles();
    drawAmbient(performance.now(), true);
  }

  function drawAmbient(now, force) {
    if (!actx) return;
    if (!force && now - lastAmb < 33) return;   // ~30 fps is plenty
    lastAmb = now;
    const W = amb.width, H = amb.height, dpr = W / root.innerWidth;
    if (tintTarget) {
      tint = tint || tintTarget.slice();
      for (let i = 0; i < 3; i++) tint[i] += (tintTarget[i] - tint[i]) * 0.04;
    }
    const [r, g, b] = tint || [127, 180, 255];
    const light = document.documentElement.dataset.theme === 'light';
    const k = light ? 0.55 : 1;
    actx.clearRect(0, 0, W, H);
    actx.lineWidth = 1 * dpr;
    // links between nearby nodes
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i];
      if (p.kind !== 'node') continue;
      for (let j = i + 1; j < parts.length; j++) {
        const q = parts[j];
        if (q.kind !== 'node') continue;
        const d = Math.hypot(p.x - q.x, p.y - q.y);
        const lim = 190 * dpr;
        if (d < lim) {
          actx.strokeStyle = 'rgba(' + r + ',' + g + ',' + b + ',' + ((1 - d / lim) * 0.13 * k).toFixed(3) + ')';
          actx.beginPath(); actx.moveTo(p.x, p.y); actx.lineTo(q.x, q.y); actx.stroke();
        }
      }
    }
    for (const p of parts) {
      if (!reduced && !force) {
        p.x += p.vx * dpr; p.y += p.vy * dpr; p.a += p.va;
        if (p.y < -150) { p.y = H + 100; p.x = Math.random() * W; }
        if (p.x < -150) p.x = W + 100; else if (p.x > W + 150) p.x = -100;
      }
      if (p.kind === 'node') {
        actx.fillStyle = 'rgba(' + r + ',' + g + ',' + b + ',' + (0.22 * k).toFixed(3) + ')';
        actx.beginPath(); actx.arc(p.x, p.y, p.r * dpr, 0, Math.PI * 2); actx.fill();
      } else if (p.kind === 'arc') {
        actx.strokeStyle = 'rgba(' + r + ',' + g + ',' + b + ',' + (0.09 * k).toFixed(3) + ')';
        actx.setLineDash([6 * dpr, 8 * dpr]);
        actx.beginPath(); actx.arc(p.x, p.y, p.r * dpr, p.a, p.a + Math.PI * 1.2); actx.stroke();
        actx.setLineDash([]);
      } else {
        actx.fillStyle = 'rgba(' + r + ',' + g + ',' + b + ',' + (0.075 * k).toFixed(3) + ')';
        actx.font = (18 * dpr) + 'px "IBM Plex Mono", monospace';
        actx.fillText(p.g, p.x, p.y);
      }
    }
  }

  function ambientLoop(now) {
    if (!document.hidden) drawAmbient(now, false);
    if (!reduced) requestAnimationFrame(ambientLoop);
  }

  /* ---------- bursts & ripples on the stage canvas ---------- */
  function fxLoop() {
    fxRaf = 0;
    if (!fctx) return;
    fctx.clearRect(0, 0, 1920, 1080);
    const now = performance.now();
    sparks = sparks.filter((s) => now - s.t0 < s.life);
    rings = rings.filter((r) => now - r.t0 < r.life);
    for (const s of sparks) {
      const t = (now - s.t0) / 1000;
      const x = s.x + s.vx * t;
      const y = s.y + s.vy * t + 520 * t * t;
      const life = 1 - (now - s.t0) / s.life;
      fctx.save();
      fctx.globalAlpha = Math.max(0, life);
      fctx.translate(x, y);
      fctx.rotate(s.rot + s.vr * t);
      fctx.fillStyle = s.color;
      if (s.shape === 0) fctx.fillRect(-s.size / 2, -s.size / 4, s.size, s.size / 2);
      else if (s.shape === 1) { fctx.beginPath(); fctx.arc(0, 0, s.size / 2.6, 0, Math.PI * 2); fctx.fill(); }
      else { fctx.font = '600 ' + (s.size * 2) + 'px "IBM Plex Mono", monospace'; fctx.fillText(s.glyph, -s.size / 2, s.size / 2); }
      fctx.restore();
    }
    for (const r of rings) {
      const p = (now - r.t0) / r.life;
      fctx.strokeStyle = r.color;
      fctx.globalAlpha = Math.max(0, 1 - p);
      fctx.lineWidth = 4 * (1 - p) + 1;
      fctx.beginPath(); fctx.arc(r.x, r.y, r.r0 + (r.r1 - r.r0) * Anim.ease.out(p), 0, Math.PI * 2); fctx.stroke();
      fctx.globalAlpha = 1;
    }
    if (sparks.length || rings.length) fxRaf = requestAnimationFrame(fxLoop);
  }

  function kick() { if (!fxRaf) fxRaf = requestAnimationFrame(fxLoop); }

  const FX = {
    init(dom) {
      amb = dom.ambient; actx = amb.getContext('2d');
      fx = dom.fx; fctx = fx.getContext('2d');
      tintTarget = parseColor(cssVar('--line'));
      resize();
      root.addEventListener('resize', resize);
      root.addEventListener('themechange', () => { FX.tintTo(FX.actColor); drawAmbient(performance.now(), true); });
      if (!reduced) requestAnimationFrame(ambientLoop);
      Deck.on('change', (st) => {
        const act = Deck.ACTS[Deck.slides[st.index].act];
        FX.tintTo(act ? act.color : 'var(--line)');
      });
    },

    actColor: 'var(--line)',

    /* Shift the ambient tint toward a CSS colour (var() allowed). */
    tintTo(color) {
      FX.actColor = color;
      const m = /var\((--[\w-]+)\)/.exec(color);
      tintTarget = parseColor(m ? cssVar(m[1]) : color);
    },

    /* Confetti-like burst at stage coordinates. */
    burst(x, y, opts) {
      if (Anim.isInstant() || reduced || !fctx) return;
      const o = opts || {};
      const colors = (o.colors || ['--star', '--ok', '--represent', '--simplify', '--reduce']).map((c) => (c.startsWith('--') ? cssVar(c) : c));
      const n = o.count || 90;
      const now = performance.now();
      for (let i = 0; i < n; i++) {
        const ang = (o.angle == null ? -Math.PI / 2 : o.angle) + (Math.random() - 0.5) * (o.spread || Math.PI * 1.3);
        const sp = 380 + Math.random() * 620;
        sparks.push({
          x, y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, t0: now, life: 1300 + Math.random() * 900,
          rot: Math.random() * 6, vr: (Math.random() - 0.5) * 12, size: 10 + Math.random() * 12,
          color: colors[i % colors.length], shape: i % 3, glyph: (o.glyphs || '0123456789')[i % (o.glyphs || '0123456789').length],
        });
      }
      kick();
    },

    /* Expanding ring for emphasis. */
    ripple(x, y, color, opts) {
      if (Anim.isInstant() || !fctx) return;
      const o = opts || {};
      const c = color && color.startsWith('--') ? cssVar(color) : (color || cssVar('--line'));
      rings.push({ x, y, color: c, r0: o.r0 || 30, r1: o.r1 || 140, life: o.life || 900, t0: performance.now() });
      kick();
    },

    /* Animated number in an element. */
    count(el, from, to, opts) {
      const o = opts || {};
      const fmt = o.format || ((v) => Math.round(v).toLocaleString('en-US'));
      return Anim.run((p) => { el.textContent = fmt(from + (to - from) * Math.min(1, p)); },
        Object.assign({ dur: 1200, ease: 'out' }, o));
    },

    /* Centre of an element in stage coordinates. */
    center(el) {
      const stage = Deck.dom.stage.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      const s = stage.width / 1920;
      return { x: (r.left + r.width / 2 - stage.left) / s, y: (r.top + r.height / 2 - stage.top) / s };
    },
  };

  root.FX = FX;
})(window);
