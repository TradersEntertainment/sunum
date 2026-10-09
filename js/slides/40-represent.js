/* Representation change II: Horner's rule and binary exponentiation
 * (Levitin §6.5). Each scene is one SVG laid out from a model: IBM Plex Mono
 * glyphs are exactly 0.6 em wide, so every token position is computed, never
 * measured. */
(function () {
  'use strict';

  const N = Algo.numeric;
  const SUP = 0.62;            // superscript size (em)
  const RAISE = 0.42;          // superscript raise (em)

  /* ---------- small helpers ---------- */

  function sText(parent, x, y, markup, attrs) {
    const t = U.s('text', Object.assign({ x, y }, attrs || {}));
    t.innerHTML = markup;
    parent.appendChild(t);
    return t;
  }

  /* "(a^{6})^{2}·a" → SVG tspans with raised, smaller exponents. */
  function supMarkup(s, size) {
    const r = (size * RAISE).toFixed(1);
    const f = (size * SUP).toFixed(1);
    let out = '';
    let raised = false;
    String(s).split(/(\^\{[^}]*\})/).forEach((part) => {
      if (!part) return;
      const m = /^\^\{([^}]*)\}$/.exec(part);
      if (m) {
        out += '<tspan dy="' + (raised ? 0 : -r) + '" style="font-size:' + f + 'px">' + m[1] + '</tspan>';
        raised = true;
      } else {
        out += raised ? '<tspan dy="' + r + '">' + part + '</tspan>' : part;
        raised = false;
      }
    });
    return out;
  }

  /* Width of supMarkup text in a monospace font of the given size. */
  function supWidth(s, size) {
    let w = 0;
    String(s).split(/(\^\{[^}]*\})/).forEach((part) => {
      const m = /^\^\{([^}]*)\}$/.exec(part);
      w += m ? m[1].length * 0.6 * size * SUP : part.length * 0.6 * size;
    });
    return w;
  }

  function pop(el, delay, dur) {
    Anim.set(el, { opacity: 0, scale: 0.4 });
    return Anim.to(el, { opacity: 1, scale: 1 }, { dur: dur || 320, delay: delay || 0, ease: 'outBack' });
  }

  /* Draw a hidden path (Viz.hiddenPath) — like Viz.draw, but nothing shows
   * before its delay is over, and the arrowhead only appears once the
   * stroke has nearly reached it. */
  function drawPath(path, opts) {
    const o = Object.assign({ dur: 600, ease: 'inOut' }, opts);
    const marker = path.getAttribute('marker-end') || path.dataset.marker || '';
    if (marker) path.dataset.marker = marker;
    path.setAttribute('pathLength', '1');
    return Anim.run((p) => {
      const q = Math.min(1, Math.max(0, p));
      path.style.strokeDasharray = '1 1';
      path.style.strokeDashoffset = String(1 - q);
      path.style.opacity = '1';
      if (marker) {
        if (q > 0.82) path.setAttribute('marker-end', marker);
        else path.removeAttribute('marker-end');
      }
    }, o);
  }

  function fadeTo(el, o, delay, dur) {
    return Anim.to(el, { opacity: o }, { dur: dur || 300, delay: delay || 0 });
  }

  /* Swap the text of an SVG element: the old text rises and fades, the new
   * one comes up from below. */
  async function flipText(el, markup, opts) {
    const o = opts || {};
    const ghost = el.cloneNode(true);
    el.parentNode.insertBefore(ghost, el);
    const st = Anim.get(el);
    Anim.set(ghost, { x: st.x, y: st.y, opacity: 1 });
    el.innerHTML = markup;
    Anim.set(el, { x: o.x != null ? o.x : st.x, y: (o.y || 0) + 16, opacity: 0 });
    await Promise.all([
      Anim.to(ghost, { y: st.y - 20, opacity: 0 }, { dur: o.dur || 220, delay: o.delay || 0 }),
      Anim.to(el, { y: o.y || 0, opacity: 1 }, { dur: o.dur || 240, delay: (o.delay || 0) + 60 }),
    ]);
    ghost.remove();
  }

  /* Stage coordinates of a body point (decoration only: FX bursts). */
  function stageXY(ctx, x, y) {
    const body = ctx.$('.slide-body');
    const stage = Deck.dom.stage;
    if (!body || !stage) return { x, y };
    const b = body.getBoundingClientRect();
    const s = stage.getBoundingClientRect();
    const k = s.width / 1920 || 1;
    return { x: (b.left - s.left) / k + x, y: (b.top - s.top) / k + y };
  }

  /* Polynomial tokens (Algo.numeric.factorStage) laid out in character
   * cells: id → {t, left, w, cx}. */
  function cells(t) {
    if (t.kind === 'exp') return t.text.length * SUP + 0.12;
    if (t.kind === 'sign') return 2.6;
    return t.text.length;                 // "x(" = 2, coefficients, x, ")"
  }

  function layoutTokens(tokens, x0, size) {
    const cw = size * 0.6;
    const out = {};
    let x = x0;
    tokens.forEach((t) => {
      const w = cells(t) * cw;
      out[t.id] = { t, left: x, w, cx: x + w / 2 };
      x += w;
    });
    out.$end = x;
    return out;
  }

  function tokenEl(t, size, cls) {
    const exp = t.kind === 'exp';
    return U.s('text', {
      class: 'ho-tok k-' + t.kind + (cls ? ' ' + cls : ''),
      x: 0, y: exp ? -(size * RAISE).toFixed(1) : 0,
      style: 'font-size:' + (exp ? size * SUP : size).toFixed(1) + 'px',
    }, t.text);
  }

  // shared with 50-reduce.js and 60-closing.js (loaded after this file)
  window.RepKit = { sText, supMarkup, supWidth, pop, fadeTo, flipText, stageXY, drawPath };

  /* ======================================================================
   * Horner's rule
   * ==================================================================== */
  const HP = [2, -1, 3, 1, -5];               // 2x⁴ − x³ + 3x² + x − 5
  const HX = 3;
  const HR = N.horner(HP, HX);                // 2, 5, 18, 55, 160
  const HDEG = HP.length - 1;
  const HST = N.factorStages(HP);             // plain → x(x(x(2x − 1) + 3) + 1) − 5
  const HF = 60;                              // expression font size
  const HCW = HF * 0.6;
  const HBASE = 84;                           // expression baseline
  const HX0 = 7 * HCW;                        // after "p(x) = "
  const HLAY = HST.map((s) => layoutTokens(s, HX0, HF));
  const NEST = HLAY[HLAY.length - 1];
  // the table
  const COLX = [330, 520, 710, 900, 1090];
  const R1 = 275, R2 = 425;                   // row centres
  const CELL_W = 132, CELL_H = 80;
  const NUM_DY = 14;                          // baseline offset of a 40 px number
  // evaluation from the inside out: level j covers the j-th bracket pair
  const LEVELS = HR.values.map((v, j) => {
    if (j === 0) return [NEST.k0.left - 8, NEST.k0.left + NEST.k0.w + 8];
    if (j === HDEG) return [HX0 - 10, NEST.$end + 10];
    const o = NEST['o' + (HDEG - j)], c = NEST['c' + (HDEG - j)];
    return [o.left + HCW - 7, c.left + c.w + 7];
  });
  const BUBX = HR.values.map((v, j) => (j === 0 ? NEST.k0.cx : j === HDEG ? NEST['k' + HDEG].cx : NEST['c' + (HDEG - j)].cx));
  // quotient line in the bonus panel
  const QF = 40;
  const QX0 = 1100, QBASE = 648, RBASE = 716;
  const QTOK = N.factorStage(HR.quotient, 0);
  const QLAY = layoutTokens(QTOK, QX0, QF);
  const ASK_X = 1340;                         // "p(3) = ?"
  const ASK_V = 1646;

  const HORNER_REAL = [
    { icon: 'hash', who: 'Java <code>String.hashCode()</code>',
      en: '<code>h = 31·h + c</code> for every character: Horner’s rule for a polynomial in 31.',
      tr: 'Her karakter için <code>h = 31·h + c</code>: 31’e göre bir polinomun Horner kuralıyla hesabı.' },
    { icon: 'calc', who: { en: 'Reading any number', tr: 'Her sayıyı okurken' },
      en: '"4096" = ((4·10 + 0)·10 + 9)·10 + 6. Every <code>parseInt</code> does Horner.',
      tr: '"4096" = ((4·10 + 0)·10 + 9)·10 + 6. Her <code>parseInt</code> Horner yapar.' },
    { icon: 'chart', who: { en: 'Math libraries', tr: 'Matematik kütüphaneleri' },
      en: 'sin, exp and log are computed from polynomials, usually evaluated with Horner’s rule.',
      tr: 'sin, exp ve log polinomlardan hesaplanır; bu polinomlar genelde Horner kuralıyla hesaplanır.' },
  ];

  /* operation tiles for the cost panel (CSS fragments, staggered) */
  function opTiles(groups, cls, sym, d0) {
    let k = 0;
    return groups.map((n) => '<span class="ho-tg">' + Array.from({ length: n }, () =>
      '<i class="ho-t ' + cls + '" data-step="3" data-anim="pop" style="--d:' + (d0 + 55 * k++) + 'ms">' + sym + '</i>').join('') + '</span>').join('');
  }

  /* Put every expression token where stage k has it (instantly). */
  function setStage(d, k) {
    const lay = HLAY[k];
    Object.keys(d.tok).forEach((id) => {
      const el = d.tok[id];
      const p = lay[id];
      if (p) {
        el.textContent = p.t.text;
        Anim.set(el, { x: p.cx, y: 0, opacity: 1, scale: 1 });
      } else Anim.set(el, { opacity: 0 });
    });
  }

  /* Factor x out of every term that still has one: stage k−1 → k. */
  async function factorOut(d, k) {
    const A = HLAY[k - 1], B = HLAY[k];
    const hit = [];
    for (let i = 0; i <= HDEG; i++) if (HDEG - i >= k) hit.push(i);
    const last = hit[hit.length - 1];
    // dashed outline around the terms that give up an x
    const ids = HST[k - 1].filter((t) => t.term != null && t.term <= last).map((t) => t.id);
    const left = Math.min.apply(null, ids.map((id) => A[id].left));
    const right = Math.max.apply(null, ids.map((id) => A[id].left + A[id].w));
    d.group.setAttribute('x', (left - 12).toFixed(1));
    d.group.setAttribute('width', (right - left + 24).toFixed(1));
    const MOVE = 120, DUR = 520, GAP = 40;
    const jobs = [fadeTo(d.group, 1, 0, 150)];

    // one x leaves every one of those terms and flies to the front
    const target = B['o' + k].left + HCW / 2;
    const clones = hit.map((i, n) => {
      const c = U.s('text', { class: 'ho-tok ho-fly', x: 0, y: 0, style: 'font-size:' + HF + 'px' }, 'x');
      d.gExpr.appendChild(c);
      Anim.set(c, { x: A['x' + i].cx, y: 0 });
      jobs.push(Anim.to(c, { x: target, y: 0 }, { dur: DUR, delay: MOVE + n * GAP, arc: -64 }));
      return c;
    });
    // everything else slides to its new place; exponents drop by one
    Object.keys(d.tok).forEach((id) => {
      const el = d.tok[id];
      const a = A[id], b = B[id];
      if (a && b) {
        if (a.t.text !== b.t.text) {
          jobs.push(Anim.to(el, { x: b.cx }, { dur: 300, delay: MOVE }).then(() => flipText(el, b.t.text, { x: b.cx, dur: 180 })));
        } else jobs.push(Anim.to(el, { x: b.cx }, { dur: DUR, delay: MOVE }));
      } else if (a && !b) {
        jobs.push(Anim.to(el, { opacity: 0 }, { dur: 150, delay: MOVE }));
      } else if (!a && b && id[0] !== 'o' && id[0] !== 'c') {
        el.textContent = b.t.text;
        Anim.set(el, { x: b.cx, y: 0, opacity: 0, scale: 0.5 });
        jobs.push(Anim.to(el, { opacity: 1, scale: 1 }, { dur: 260, delay: MOVE + 300, ease: 'outBack' }));
      }
    });
    // where the x's land, the new bracket pair "x( … )" appears
    const land = MOVE + GAP * (clones.length - 1) + DUR;
    const o = d.tok['o' + k], c = d.tok['c' + k];
    o.textContent = 'x(';
    c.textContent = ')';
    Anim.set(o, { x: B['o' + k].cx, y: 0, opacity: 0, scale: 0.7 });
    Anim.set(c, { x: B['c' + k].cx, y: 0, opacity: 0, scale: 0.3 });
    jobs.push(Anim.to(o, { opacity: 1, scale: 1 }, { dur: 220, delay: land - 40, ease: 'outBack' }));
    jobs.push(Anim.to(c, { opacity: 1, scale: 1 }, { dur: 260, delay: land - 40, ease: 'outBack' }));
    clones.forEach((cl) => jobs.push(Anim.to(cl, { opacity: 0 }, { dur: 140, delay: land })));
    jobs.push(fadeTo(d.group, 0, land, 180));
    await Promise.all(jobs);
    clones.forEach((cl) => cl.remove());
  }

  function setLevel(d, a, b, p) {
    const x0 = Anim.lerp(LEVELS[a][0], LEVELS[b][0], p);
    const x1 = Anim.lerp(LEVELS[a][1], LEVELS[b][1], p);
    d.hl.setAttribute('x', x0.toFixed(1));
    d.hl.setAttribute('width', (x1 - x0).toFixed(1));
  }

  /* The table at x = 3 fills column by column; the nested form lights up
   * from the inside out in step. */
  async function hornerTable(ctx) {
    const d = ctx.data, T = d.T;
    const jobs = [];
    T.frame.forEach((el, i) => jobs.push(fadeTo(el, 1, (i % 5) * 35, 240)));
    // the coefficients come down out of the nested form
    HP.forEach((a, i) => {
      const k = NEST['k' + i], s = NEST['s' + i];
      const sx = a < 0 && s ? (s.cx + k.cx) / 2 : k.cx;
      const el = T.coef[i];
      Anim.set(el, { x: sx - COLX[i], y: HBASE - (R1 + NUM_DY), scale: HF / 40, opacity: 0 });
      jobs.push(Anim.to(el, { x: 0, y: 0, scale: 1, opacity: 1 }, { dur: 520, delay: 80 + i * 55 }));
    });
    // column 0: the leading coefficient drops straight down
    const C0 = 620;
    jobs.push(drawPath(T.down[0], { dur: 220, delay: C0 }));
    jobs.push(pop(T.val[0], C0 + 120, 280));
    setLevel(d, 0, 0, 1);
    jobs.push(fadeTo(d.hl, 1, C0 + 100, 220));
    jobs.push(pop(d.bub[0], C0 + 160, 280));
    // columns 1..n: × 3 from the left, + a from above; the nested form lights up inside out
    const STEP = 280;
    for (let i = 1; i <= HDEG; i++) {
      const t0 = C0 + 260 + (i - 1) * STEP;
      jobs.push(drawPath(T.arc[i], { dur: 220, delay: t0 }));
      jobs.push(fadeTo(T.mul[i], 1, t0 + 40, 180));
      jobs.push(drawPath(T.down[i], { dur: 220, delay: t0 + 30 }));
      jobs.push(fadeTo(T.add[i], 1, t0 + 70, 180));
      jobs.push(pop(T.val[i], t0 + 190, 280));
      jobs.push(fadeTo(T.calc[i], 1, t0 + 200, 220));
      jobs.push(Anim.run((p) => setLevel(d, i - 1, i, Math.min(1, p)), { dur: 260, delay: t0 + 40 }));
      jobs.push(pop(d.bub[i], t0 + 210, 280));
    }
    // p(3) = 160
    const tF = C0 + 260 + (HDEG - 1) * STEP + 420;
    Anim.set(d.askV, { x: COLX[HDEG] - ASK_V, y: (R2 + NUM_DY) - HBASE, scale: 40 / HF, opacity: 0 });
    jobs.push(Anim.wait(tF).then(() => {
      T.cellV[HDEG].classList.add('final');
      T.val[HDEG].classList.add('final');
      d.bub[HDEG].classList.add('final');
    }));
    jobs.push(Anim.to(d.askQ, { opacity: 0, scale: 0.4 }, { dur: 220, delay: tF }));
    jobs.push(Anim.to(d.askV, { x: 0, y: 0, scale: 1, opacity: 1 }, { dur: 600, delay: tF + 60, arc: 90 }));
    await Promise.all(jobs);
    if (!Anim.isInstant()) {
      const p = stageXY(ctx, ASK_V, HBASE - 22);
      FX.burst(p.x, p.y, { count: 46, spread: Math.PI * 0.8, colors: ['--ok', '--represent', '--star'] });
    }
  }

  /* Bonus: the middle numbers are the quotient, the last one the remainder. */
  async function hornerQuotient(d) {
    const Q = d.Q;
    const jobs = [];
    HR.quotient.forEach((v, i) => {
      const el = Q.tok['k' + i];
      const b = QLAY['k' + i];
      Anim.set(el, { x: COLX[i], y: (R2 + NUM_DY) - QBASE, opacity: 1, scale: 1 });
      jobs.push(Anim.to(el, { x: b.cx, y: 0 }, { dur: 760, delay: 520 + i * 110, arc: -50 }));
    });
    Anim.set(Q.rem, { x: COLX[HDEG], y: (R2 + NUM_DY) - RBASE, opacity: 1 });
    jobs.push(Anim.to(Q.rem, { x: Q.remX, y: 0 }, { dur: 760, delay: 960, arc: -40 }));
    Q.rest.forEach((el, i) => jobs.push(fadeTo(el, 1, 1240 + i * 35, 260)));
    jobs.push(fadeTo(Q.eq, 1, 1500, 300));
    await Promise.all(jobs);
  }

  Deck.add({
    id: 'horner', act: 'represent', steps: 4,
    title: { en: 'Horner’s rule: fewer multiplications', tr: 'Horner kuralı: daha az çarpma' },
    html: `
      <div class="ho-lbl" style="top:${R1 - 24}px" data-step="2" data-anim="fade">${L('coefficients', 'katsayılar')}</div>
      <div class="ho-lbl mono" style="top:${R2 - 24}px" data-step="2" data-anim="fade">x = 3</div>
      <div class="panel ticks ho-cost" data-step="3" data-hide="4">
        <div class="ho-head"><span class="nt">n = 4</span> · ${L('multiplications × and additions +', 'çarpma × ve toplama +')}</div>
        <div class="ho-cost-row" style="top:50px">
          <div class="ho-cost-name">${L('brute force', 'kaba kuvvet')}<small>≈ n²/2 ×</small></div>
          <div class="ho-tiles">${opTiles([4, 3, 2, 1], 'bad', '×', 350)}</div>
          <span class="badge-o bad" data-step="3" data-anim="pop" style="--d:950ms">Θ(n²)</span>
        </div>
        <div class="ho-cost-row" style="top:126px">
          <div class="ho-cost-name">Horner<small>${L('n ×, n +', 'n ×, n +')}</small></div>
          <div class="ho-tiles">${opTiles([4], 'ok', '×', 1050)}${opTiles([4], 'add', '+', 1290)}</div>
          <span class="badge-o ok" data-step="3" data-anim="pop" style="--d:1550ms">Θ(n)</span>
        </div>
      </div>
      <div class="panel ticks ho-bonus" data-step="3" data-hide="4" style="--d:120ms">
        <div class="ho-head act">bonus · p(x) ÷ (x − 3)</div>
        <div class="ho-bonus-lbl" style="top:84px">${L('quotient', 'bölüm')}</div>
        <div class="ho-bonus-lbl" style="top:152px">${L('remainder', 'kalan')}</div>
      </div>
      ${Viz.real(HORNER_REAL, { layout: 'row', cls: 'ho-real', attrs: ' data-step="4" data-anim="up"' })}
      <div class="ho-scene"></div>`,
    init(ctx) {
      const d = ctx.data;
      const svg = Viz.svg(ctx.$('.ho-scene'), 1700, 760);
      d.gHL = U.s('g');
      d.gExpr = U.s('g', { transform: 'translate(0,' + HBASE + ')' });
      d.gTable = U.s('g');
      d.gQ = U.s('g');
      d.gTop = U.s('g');
      svg.append(d.gHL, d.gExpr, d.gTable, d.gQ, d.gTop);

      // p(x) = 2x⁴ − x³ + 3x² + x − 5
      sText(d.gExpr, 0, 0, 'p(x) =', { class: 'ho-px' });
      d.tok = {};
      HST.forEach((stage) => stage.forEach((t) => {
        if (!d.tok[t.id]) d.tok[t.id] = d.gExpr.appendChild(tokenEl(t, HF));
      }));
      setStage(d, 0);
      d.group = U.s('rect', { class: 'ho-group', rx: 14, y: HBASE - 64, height: 88, x: 0, width: 10 });
      Anim.set(d.group, { opacity: 0 });
      d.hl = U.s('rect', { class: 'ho-hl', rx: 12, y: HBASE - 56, height: 76, x: 0, width: 10 });
      Anim.set(d.hl, { opacity: 0 });
      d.gHL.append(d.group, d.hl);

      // inside-out values under the brackets
      d.bub = HR.values.map((v, j) => {
        const g = U.s('g', { class: 'ho-bub' + (j === 0 ? ' first' : '') });
        const w = String(v).length * 17 + 26;
        g.innerHTML = '<rect x="' + (BUBX[j] - w / 2) + '" y="' + (HBASE + 34) + '" width="' + w + '" height="40" rx="20"/>'
          + '<text x="' + BUBX[j] + '" y="' + (HBASE + 64) + '">' + U.num(v) + '</text>';
        Anim.set(g, { opacity: 0 });
        d.gHL.appendChild(g);
        return g;
      });

      // p(3) = ?
      sText(d.gTop, ASK_X, HBASE, 'p(3) =', { class: 'ho-ask' });
      d.askQ = sText(d.gTop, ASK_V, HBASE, '?', { class: 'ho-ask-q' });
      d.askV = sText(d.gTop, ASK_V, HBASE, String(HR.value), { class: 'ho-ask-v' });
      Anim.set(d.askV, { opacity: 0 });

      // the table
      const T = d.T = { frame: [], coef: [], val: [], cellV: [], down: [], arc: [], mul: [], add: [], calc: [] };
      HP.forEach((a, i) => {
        const x = COLX[i];
        const c1 = U.s('rect', { class: 'ho-cell', x: x - CELL_W / 2, y: R1 - CELL_H / 2, width: CELL_W, height: CELL_H, rx: 12 });
        const c2 = U.s('rect', { class: 'ho-cell val', x: x - CELL_W / 2, y: R2 - CELL_H / 2, width: CELL_W, height: CELL_H, rx: 12 });
        d.gTable.append(c1, c2);
        T.frame.push(c1, c2);
        T.cellV.push(c2);
        const down = Viz.hiddenPath({ class: 'ho-down', d: 'M' + x + ',' + (R1 + CELL_H / 2 + 6) + ' L' + x + ',' + (R2 - CELL_H / 2 - 8), 'marker-end': 'url(#arrow-cmp)' });
        d.gTable.appendChild(down);
        T.down.push(down);
        if (i > 0) {
          const x0 = COLX[i - 1] + CELL_W / 2 - 18, x1 = x - CELL_W / 2 + 14, y = R2 - CELL_H / 2 - 2;
          const arc = Viz.hiddenPath({ class: 'ho-arc', d: 'M' + x0 + ',' + y + ' Q' + ((x0 + x1) / 2) + ',' + (y - 62) + ' ' + x1 + ',' + (y - 6), 'marker-end': 'url(#arrow-represent)' });
          d.gTable.appendChild(arc);
          T.arc[i] = arc;
          T.mul[i] = sText(d.gTable, (x0 + x1) / 2, y - 40, '×3', { class: 'ho-op mul' });
          T.add[i] = sText(d.gTable, x + 24, R1 + CELL_H / 2 + 44, '+', { class: 'ho-op add' });
          T.calc[i] = sText(d.gTable, x, R2 + CELL_H / 2 + 34, '3·' + U.num(HR.values[i - 1]) + ' + ' + (a < 0 ? '(' + U.num(a) + ')' : a), { class: 'ho-calc' });
          [T.mul[i], T.add[i], T.calc[i]].forEach((e) => Anim.set(e, { opacity: 0 }));
        }
        T.coef.push(sText(d.gTable, x, R1 + NUM_DY, U.num(a), { class: 'ho-num' }));
        T.val.push(sText(d.gTable, x, R2 + NUM_DY, U.num(HR.values[i]), { class: 'ho-num val' }));
      });
      T.frame.concat(T.coef, T.val).forEach((e) => Anim.set(e, { opacity: 0 }));

      // bonus: quotient and remainder (filled at click 3)
      const gq = U.s('g', { transform: 'translate(0,' + QBASE + ')' });
      const gr = U.s('g', { transform: 'translate(0,' + RBASE + ')' });
      d.gQ.append(gq, gr);
      const Q = d.Q = { tok: {}, rest: [] };
      QTOK.forEach((t) => {
        const el = gq.appendChild(tokenEl(t, QF, t.kind === 'coef' ? 'ho-q' : 'ho-qx'));
        Q.tok[t.id] = el;
        Anim.set(el, { x: QLAY[t.id].cx, y: 0, opacity: 0 });
        if (t.kind !== 'coef') Q.rest.push(el);
      });
      Q.remX = QX0 + 1.5 * QF * 0.6;
      Q.rem = sText(gr, 0, 0, String(HR.remainder), { class: 'ho-tok ho-qr', style: 'font-size:' + QF + 'px' });
      Anim.set(Q.rem, { x: Q.remX, opacity: 0 });
      Q.eq = sText(gr, QX0 + 3 * QF * 0.6 + 22, 0, '= p(3)', { class: 'ho-qeq' });
      Anim.set(Q.eq, { opacity: 0 });
    },
    async step(n, ctx) {
      const d = ctx.data;
      if (n === 1) {
        for (let k = 1; k < HST.length; k++) await factorOut(d, k);
      } else if (n === 2) {
        await hornerTable(ctx);
      } else if (n === 3) {
        await hornerQuotient(d);
      } else if (n === 4) {
        await fadeTo(d.gQ, 0, 0, 300);
      }
    },
  });

  /* ======================================================================
   * Binary exponentiation
   * ==================================================================== */
  const BN = 13;
  const LR = N.binExpLR(BN);                  // SM SM S SM · 1 → 3 → 6 → 13
  const RL = N.binExpRL(BN);                  // a, a², a⁴, a⁸ · use a⁸·a⁴·a
  const NB = LR.bits.length;
  const TX = [520, 720, 920, 1120];           // bit columns
  const TILE_Y = 70;
  const LR_Y = 262, RL_Y = 446;               // lane centres
  const BW = 150, BH = 100;                   // lane cells
  const RX = 1480;                            // right column centre
  const PF = 40;                              // product font

  const pw = (e) => (e === 1 ? 'a' : 'a^{' + e + '}');
  const LR_FORM = LR.exps.map((e, i) => {
    const prev = i === 0 ? '1' : pw(LR.exps[i - 1]);
    const sq = prev.length === 1 ? prev + '^{2}' : '(' + prev + ')^{2}';
    return sq + (LR.bits[i] ? '·a' : '');
  });

  const BINEXP_REAL = [
    { icon: 'lock', who: 'HTTPS · RSA',
      en: 'RSA computes m<sup>e</sup> mod n with 2048-bit numbers: square-and-multiply needs only a few thousand multiplications.',
      tr: 'RSA, 2048 bitlik sayılarla m<sup>e</sup> mod n hesaplar: kare al ve çarp sadece birkaç bin çarpma ister.' },
    { icon: 'code', who: 'Python <code>pow(a, b, m)</code>',
      en: 'Built-in fast modular exponentiation by repeated squaring.',
      tr: 'Tekrarlı kare almayla yerleşik hızlı modüler üs alma.' },
    { icon: 'bolt', who: { en: 'Bitcoin · elliptic curves', tr: 'Bitcoin · eliptik eğriler' },
      en: 'Signatures use "double-and-add": the same idea with addition instead of multiplication.',
      tr: 'İmzalar "ikiye katla ve ekle" kullanır: aynı fikir, çarpma yerine toplama ile.' },
  ];

  function stampSVG(parent, x, y) {
    const g = U.s('g', { class: 'be-stamp' });
    g.innerHTML = '<circle r="26"/><path d="' + Viz.ICONS.check + '" transform="scale(0.9)"/>';
    Anim.set(g, { x, y, opacity: 0 });
    parent.appendChild(g);
    return g;
  }

  /* a lane cell: frame + up to two lines of text */
  function laneCell(parent, x, y, h) {
    const g = U.s('g', { class: 'be-cell ghost' });
    g.appendChild(U.s('rect', { x: x - BW / 2, y: y - h / 2, width: BW, height: h, rx: 14 }));
    parent.appendChild(g);
    return g;
  }

  /* The counter's exponent changes (×2 for S, +1 for M) with a flash of the
   * operation; the flash fades while the next thing already happens. */
  async function setExp(d, v, op, tail) {
    d.flashT.textContent = op;
    d.flash.classList.toggle('m', op === '+1');
    Anim.set(d.flash, { opacity: 0, scale: 0.5 });
    await Promise.all([
      Anim.to(d.flash, { opacity: 1, scale: 1 }, { dur: 140, ease: 'outBack' }),
      flipText(d.exp, String(v), { dur: 150 }),
    ]);
    tail.push(Anim.to(d.flash, { opacity: 0 }, { dur: 140, delay: 60 }));
  }

  async function playLR(ctx) {
    const d = ctx.data;
    const tail = [];
    await Promise.all([fadeTo(d.cursor, 1, 0, 160), fadeTo(d.counter, 1, 0, 200), fadeTo(d.startChip, 1, 0, 180), drawPath(d.startArrow, { dur: 200 })]);
    for (let i = 0; i < NB; i++) {
      const before = i ? LR.exps[i - 1] : 0;
      await Anim.to(d.cursor, { x: TX[i] }, { dur: i ? 170 : 60 });
      d.tiles.forEach((t, j) => t.classList.toggle('cmp', j === i));
      // S: square, the exponent doubles
      await Promise.all([pop(d.pills[i].S, 0, 200), setExp(d, 2 * before, '×2', tail)]);
      // M (if the bit is 1): multiply by a, the exponent grows by one; the cell shows a^e
      d.lr[i].classList.remove('ghost');
      const fill = [pop(d.lrForm[i], 0, 200), pop(d.lrRes[i], 40, 240), i > 0 ? drawPath(d.lrChain[i], { dur: 160 }) : null];
      if (LR.bits[i]) fill.push(pop(d.pills[i].M, 0, 200), setExp(d, 2 * before + 1, '+1', tail));
      await Promise.all(fill);
    }
    d.tiles.forEach((t) => t.classList.remove('cmp'));
    await Promise.all(tail.concat([fadeTo(d.cursor, 0, 0, 160), pop(d.stampLR, 40, 300)]));
  }

  async function playRL(ctx) {
    const d = ctx.data;
    // a, a², a⁴, a⁸ under the bits, from the right: each is the square of the one before
    for (let r = 0; r < NB; r++) {
      const i = NB - 1 - r;
      d.tiles.forEach((t, j) => t.classList.toggle('cmp', j === i));
      const jobs = [];
      if (r > 0) jobs.push(drawPath(d.sq[i], { dur: 160 }), fadeTo(d.sqLbl[i], 1, 40, 160));
      d.rl[i].classList.remove('ghost');
      jobs.push(pop(d.rlRes[i], r > 0 ? 80 : 0, 220));
      await Promise.all(jobs);
    }
    d.tiles.forEach((t) => t.classList.remove('cmp'));
    // keep the terms under the 1-bits
    LR.bits.forEach((b, i) => {
      d.rl[i].classList.add(b ? 'ok' : 'dim');
      d.tiles[i].classList.add(b ? 'one' : 'dim');
    });
    const jobs = LR.bits.map((b, i) => (b ? Anim.to(d.rlRes[i], { scale: 1.12 }, { dur: 150, ease: 'out' }).then(() => Anim.to(d.rlRes[i], { scale: 1 }, { dur: 150 })) : pop(d.rlX[i], 0, 220)));
    // multiply them: a⁸ · a⁴ · a = a¹³
    d.prodTerms.forEach((el, k) => {
      const i = d.prodFrom[k];
      Anim.set(el, { x: TX[i] - d.prodX[k], y: RL_Y + 16 - d.prodY, scale: 44 / PF, opacity: 0 });
      jobs.push(Anim.to(el, { x: 0, y: 0, scale: 1, opacity: 1 }, { dur: 520, delay: 300 + k * 90, arc: 40 }));
    });
    d.prodDots.forEach((el, k) => jobs.push(fadeTo(el, 1, 760 + k * 50, 180)));
    jobs.push(pop(d.prodEq, 860, 300));
    jobs.push(pop(d.stampRL, 1060, 300));
    // footer: how many multiplications for n = 1 000 000
    jobs.push(Anim.to(d.foot, { opacity: 1, y: 0 }, { dur: 360, delay: 1000 }));
    jobs.push(Anim.run((p) => { d.barBad.style.transform = 'scaleX(' + Math.min(1, Math.max(0, p)).toFixed(3) + ')'; }, { dur: 560, delay: 1200, ease: 'out' }));
    jobs.push(Anim.run((p) => { d.barOk.style.transform = 'scaleX(' + Math.min(1, Math.max(0, p)).toFixed(3) + ')'; }, { dur: 320, delay: 1420, ease: 'out' }));
    await Promise.all(jobs);
  }

  Deck.add({
    id: 'binexp', act: 'represent', steps: 3,
    title: { en: 'Binary exponentiation: aⁿ by squaring', tr: 'İkili üs alma: kare alarak aⁿ' },
    html: `
      <div class="be-lane" style="top:${LR_Y - 52}px">
        <div class="be-lane-name">${L('left → right', 'soldan sağa')}</div>
        <div class="be-legend" data-step="1" data-anim="fade"><span class="be-op">S</span>( )² <span class="be-op m">M</span>·a</div>
      </div>
      <div class="be-lane" style="top:${RL_Y - 52}px">
        <div class="be-lane-name">${L('right → left', 'sağdan sola')}</div>
        <div class="be-legend" data-step="2" data-anim="fade">a → a² → a⁴ → a⁸</div>
      </div>
      <div class="panel ticks be-foot" data-hide="3">
        <div class="be-foot-l">
          <div class="be-foot-h">${L('multiplications for a<sup>n</sup>', 'a<sup>n</sup> için çarpma sayısı')}</div>
          <div class="be-foot-f"><span class="be-was">n − 1</span> <span class="be-arrow">→</span> <b>≤ 2⌊log<sub>2</sub> n⌋</b></div>
        </div>
        <div class="be-foot-r">
          <div class="be-foot-h">n = 1&nbsp;000&nbsp;000</div>
          <div class="be-bar-row"><span class="be-bar-lbl">a·a·a·…·a</span><span class="be-bar-track"><i class="be-bar bad"></i></span><b class="c-bad">999&nbsp;999</b></div>
          <div class="be-bar-row"><span class="be-bar-lbl">( )², ·a</span><span class="be-bar-track"><i class="be-bar ok"></i></span><b class="c-ok">≤ 38</b></div>
        </div>
      </div>
      ${Viz.real(BINEXP_REAL, { layout: 'row', cls: 'be-real', attrs: ' data-step="3" data-anim="up"' })}
      <div class="be-scene"></div>`,
    init(ctx) {
      const d = ctx.data;
      const svg = Viz.svg(ctx.$('.be-scene'), 1700, 760);
      const g = U.s('g');
      const gOver = U.s('g');
      svg.append(g, gOver);

      // 13 = 1101₂ as bit tiles
      sText(g, TX[0] - 98, TILE_Y + 24, '13 =', { class: 'be-big', 'text-anchor': 'end' });
      d.tiles = LR.bits.map((b, i) => {
        const t = U.s('g', { class: 'be-tile' });
        t.innerHTML = '<rect x="' + (TX[i] - 60) + '" y="' + (TILE_Y - 60) + '" width="120" height="120" rx="18"/>'
          + '<text x="' + TX[i] + '" y="' + (TILE_Y + 24) + '">' + b + '</text>';
        g.appendChild(t);
        sText(g, TX[i], TILE_Y + 92, String(2 ** (NB - 1 - i)), { class: 'be-place' });
        return t;
      });
      sText(g, TX[NB - 1] + 72, TILE_Y + 58, '2', { class: 'be-base' });
      d.cursor = U.s('rect', { class: 'be-cursor', x: -72, y: TILE_Y - 72, width: 144, height: 144, rx: 24 });
      Anim.set(d.cursor, { x: TX[0], opacity: 0 });
      g.appendChild(d.cursor);

      // goal (right column): a¹³, and the naive way
      sText(g, RX, 80, supMarkup('a^{13}', 76), { class: 'be-goal' });
      sText(g, RX, 124, Array(BN).fill('a').join('·'), { class: 'be-naive' });
      const nb = U.s('g', { class: 'be-naive-b' });
      nb.innerHTML = '<rect x="' + (RX - 50) + '" y="138" width="100" height="34" rx="17"/><text x="' + RX + '" y="163">' + (BN - 1) + ' ×</text>';
      g.appendChild(nb);

      // left-to-right lane
      d.startChip = U.s('g', { class: 'be-start' });
      d.startChip.innerHTML = '<circle cx="372" cy="' + LR_Y + '" r="30"/><text x="372" y="' + (LR_Y + 11) + '">1</text>';
      Anim.set(d.startChip, { opacity: 0 });
      g.appendChild(d.startChip);
      d.startArrow = Viz.hiddenPath({ class: 'be-chain', d: 'M408,' + LR_Y + ' L' + (TX[0] - BW / 2 - 10) + ',' + LR_Y, 'marker-end': 'url(#arrow-represent)' });
      g.appendChild(d.startArrow);
      d.lr = []; d.lrForm = []; d.lrRes = []; d.lrChain = []; d.pills = [];
      LR.bits.forEach((b, i) => {
        d.lr.push(laneCell(g, TX[i], LR_Y, BH + 8));
        d.lrForm.push(sText(g, TX[i], LR_Y - 20, supMarkup(LR_FORM[i], 24), { class: 'be-form' }));
        d.lrRes.push(sText(g, TX[i], LR_Y + 36, supMarkup(pw(LR.exps[i]), 44), { class: 'be-res' }));
        if (i > 0) {
          const ch = Viz.hiddenPath({ class: 'be-chain', d: 'M' + (TX[i - 1] + BW / 2 + 6) + ',' + LR_Y + ' L' + (TX[i] - BW / 2 - 10) + ',' + LR_Y, 'marker-end': 'url(#arrow-represent)' });
          g.appendChild(ch);
          d.lrChain[i] = ch;
        }
        const pill = (letter, x) => {
          const p = U.s('g', { class: 'be-pill ' + letter.toLowerCase() + (i === 0 ? ' free' : '') });
          p.innerHTML = '<rect x="' + (x - 20) + '" y="' + (LR_Y + 64) + '" width="40" height="32" rx="9"/><text x="' + x + '" y="' + (LR_Y + 88) + '">' + letter + '</text>';
          g.appendChild(p);
          return p;
        };
        const two = LR.ops[i] === 'SM';
        d.pills.push({ S: pill('S', two ? TX[i] - 24 : TX[i]), M: two ? pill('M', TX[i] + 24) : null });
      });
      d.lrForm.concat(d.lrRes).forEach((e) => Anim.set(e, { opacity: 0 }));
      d.pills.forEach((p) => { Anim.set(p.S, { opacity: 0 }); if (p.M) Anim.set(p.M, { opacity: 0 }); });

      // the exponent counter: a^e
      d.counter = U.s('g', { class: 'be-counter' });
      sText(d.counter, RX - 6, LR_Y + 40, 'a', { class: 'be-ca', 'text-anchor': 'end' });
      d.exp = sText(d.counter, RX - 2, LR_Y - 6, '0', { class: 'be-ce' });
      Anim.set(d.exp, { x: 0, y: 0 });
      d.flash = U.s('g', { class: 'be-flash' });
      d.flash.innerHTML = '<rect x="' + (RX + 118) + '" y="' + (LR_Y - 54) + '" width="76" height="40" rx="12"/>';
      d.flashT = sText(d.flash, RX + 156, LR_Y - 25, '×2', {});
      Anim.set(d.flash, { opacity: 0 });
      d.counter.appendChild(d.flash);
      Anim.set(d.counter, { opacity: 0 });
      g.appendChild(d.counter);
      d.stampLR = stampSVG(gOver, RX + 160, LR_Y + 22);

      // right-to-left lane
      d.rl = []; d.rlRes = []; d.sq = []; d.sqLbl = []; d.rlX = [];
      LR.bits.forEach((b, i) => {
        d.rl.push(laneCell(g, TX[i], RL_Y, BH - 8));
        const e = 2 ** (NB - 1 - i);
        d.rlRes.push(sText(g, TX[i], RL_Y + 16, supMarkup(pw(e), 44), { class: 'be-res' }));
        Anim.set(d.rlRes[i], { opacity: 0 });
        if (i < NB - 1) {
          const x0 = TX[i + 1] - BW / 2 - 6, x1 = TX[i] + BW / 2 + 10;
          const p = Viz.hiddenPath({ class: 'be-sq', d: 'M' + x0 + ',' + RL_Y + ' L' + x1 + ',' + RL_Y, 'marker-end': 'url(#arrow-cmp)' });
          g.appendChild(p);
          d.sq[i] = p;
          d.sqLbl[i] = sText(g, (x0 + x1) / 2, RL_Y - 16, '²', { class: 'be-sql' });
          Anim.set(d.sqLbl[i], { opacity: 0 });
        }
        const x = U.s('g', { class: 'be-x' });
        x.innerHTML = '<path d="M' + (TX[i] + BW / 2 - 30) + ',' + (RL_Y - BH / 2 + 10) + ' l16,16 m0,-16 l-16,16"/>';
        Anim.set(x, { opacity: 0 });
        g.appendChild(x);
        d.rlX.push(x);
      });

      // a⁸ · a⁴ · a = a¹³
      const used = [];
      LR.bits.forEach((b, i) => { if (b) used.push(i); });
      const items = [];
      used.forEach((i, k) => {
        if (k) items.push({ dot: true, w: 1.6 * PF * 0.6 });
        items.push({ i, m: pw(2 ** (NB - 1 - i)), w: supWidth(pw(2 ** (NB - 1 - i)), PF) });
      });
      const total = items.reduce((s, it) => s + it.w, 0);
      let x = RX - total / 2;
      d.prodY = RL_Y - 4;
      d.prodTerms = []; d.prodFrom = []; d.prodX = []; d.prodDots = [];
      items.forEach((it) => {
        const cx = x + it.w / 2;
        x += it.w;
        if (it.dot) {
          const t = sText(g, cx, d.prodY, '·', { class: 'be-prod' });
          Anim.set(t, { opacity: 0 });
          d.prodDots.push(t);
        } else {
          const t = sText(g, 0, 0, supMarkup(it.m, PF), { class: 'be-prod' });
          Anim.set(t, { opacity: 0 });
          d.prodTerms.push(t);
          d.prodFrom.push(it.i);
          d.prodX.push(cx);
        }
      });
      d.prodTerms.forEach((t, k) => { t.setAttribute('x', d.prodX[k]); t.setAttribute('y', d.prodY); });
      d.prodEq = sText(g, RX, RL_Y + 56, supMarkup('= a^{13}', 50), { class: 'be-prod eq' });
      Anim.set(d.prodEq, { opacity: 0 });
      d.stampRL = stampSVG(gOver, RX + 160, RL_Y + 22);

      // footer
      d.foot = ctx.$('.be-foot');
      Anim.set(d.foot, { opacity: 0, y: 24 });
      d.barBad = ctx.$('.be-bar.bad');
      d.barOk = ctx.$('.be-bar.ok');
      d.barBad.style.transform = 'scaleX(0)';
      d.barOk.style.transform = 'scaleX(0)';
    },
    async step(n, ctx) {
      if (n === 1) await playLR(ctx);
      else if (n === 2) await playRL(ctx);
    },
  });
})();
