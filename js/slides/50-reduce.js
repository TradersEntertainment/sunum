/* Problem reduction (Levitin §6.6): the idea, lcm through gcd, max ↔ min,
 * and counting paths with powers of the adjacency matrix. */
(function () {
  'use strict';

  const N = Algo.numeric;
  const { sText, pop, fadeTo, stageXY, drawPath } = window.RepKit;

  /* ======================================================================
   * The idea of a reduction
   * ==================================================================== */
  // the diagram, in its own 760 × 580 coordinates
  const BOX = {
    A: { x: 0, y: 20 }, Ans: { x: 480, y: 20 },
    B: { x: 0, y: 330 }, Sol: { x: 480, y: 330 },
  };
  const BW = 280, BH = 124;
  const cx = (k) => BOX[k].x + BW / 2;
  const cy = (k) => BOX[k].y + BH / 2;
  const SPOT = {                                   // where the diagram sits
    hero: { x: 470, y: 40, scale: 1 },
    side: { x: 0, y: 52, scale: 0.8 },
  };
  // box captions for: the idea · lcm via gcd · max via min
  const LABELS = {
    A: [
      [L('Problem A', 'Problem A'), L('to solve', 'çözülecek')],
      ['<span class="mono">lcm(24, 60)</span>', ''],
      ['<span class="mono">max f</span>', ''],
    ],
    B: [
      [L('Problem B', 'Problem B'), L('algorithm known', 'algoritması belli')],
      ['<span class="mono">gcd(60, 24)</span>', ''],
      ['<span class="mono">min (−f)</span>', ''],
    ],
    Sol: [
      [L('solution of B', 'B’nin çözümü'), ''],
      ['<span class="mono">gcd = <b class="c-ok">12</b></span>', ''],
      ['<span class="mono">min (−f) = <b class="c-ok">−4</b></span>', ''],
    ],
    Ans: [
      [L('answer to A', 'A’nın cevabı'), ''],
      ['<span class="mono">lcm = <b class="c-reduce">120</b></span>', '<span class="mono">24·60 / 12</span>'],
      ['<span class="mono">max f = <b class="c-reduce">4</b></span>', '<span class="mono">= −(−4)</span>'],
    ],
  };
  const SOLVE = [L('solve', 'çöz'), L('Euclid', 'Öklid'), L('min algorithm', 'min algoritması')];

  function boxLabels(key) {
    const b = BOX[key];
    return '<div class="re-lbl" style="left:' + b.x + 'px;top:' + b.y + 'px;width:' + BW + 'px;height:' + BH + 'px">'
      + LABELS[key].map((v, k) => '<div class="re-v" data-box="' + key + '" data-v="' + k + '"><div class="re-main">' + v[0] + '</div>'
        + (v[1] ? '<div class="re-sub">' + v[1] + '</div>' : '') + '</div>').join('') + '</div>';
  }

  /* Show caption set k (0 generic, 1 lcm, 2 max) on every box. */
  function setLabels(ctx, k, animate) {
    const jobs = [];
    ctx.$$('.re-v').forEach((el) => {
      const on = Number(el.dataset.v) === k;
      if (animate) jobs.push(Anim.to(el, { opacity: on ? 1 : 0, y: on ? 0 : -10 }, { dur: 360, delay: on ? 180 : 0 }));
      else Anim.set(el, { opacity: on ? 1 : 0, y: 0 });
    });
    return Promise.all(jobs);
  }

  /* The token runs the detour: A → B → solution of B → answer to A. */
  function runDot(d, from, to, delay) {
    const P = [{ x: cx('A'), y: cy('A') }, { x: cx('B'), y: cy('B') }, { x: cx('Sol'), y: cy('Sol') }, { x: cx('Ans'), y: cy('Ans') }];
    const a = P[from], b = P[to];
    return Anim.run((p) => {
      const q = Math.min(1, Math.max(0, p));
      Anim.set(d.dot, { x: Anim.lerp(a.x, b.x, q), y: Anim.lerp(a.y, b.y, q), opacity: 1 });
    }, { dur: 520, delay: delay || 0 });
  }

  // lcm(24, 60) through gcd
  const G = N.gcdSteps(60, 24);             // (60,24) → (24,12) → (12,0)
  const LCM = N.lcm(24, 60);                // 120
  const GF = 36, GCW = GF * 0.6;            // Euclid font
  const PITCH = 320;
  const NL = { x0: 40, k: 7.6, y: 540 };     // number line: x = x0 + k·v
  const nlx = (v) => NL.x0 + NL.k * v;

  // max ↔ min
  const PLOT = { x0: 40, x1: 960, axis: 205, unit: 41 };
  const f = (t) => 0.6 + 3.4 * Math.exp(-Math.pow((t - 0.4) / 0.18, 2)) + 0.9 * Math.exp(-Math.pow((t - 0.8) / 0.12, 2));
  const SAMPLES = Array.from({ length: 121 }, (_, i) => i / 120);
  const PEAK = SAMPLES.reduce((best, t) => (f(t) > f(best) ? t : best), 0);
  const px = (t) => PLOT.x0 + (PLOT.x1 - PLOT.x0) * t;
  function curve(s) {        // s = +1: f, s = −1: −f (mirror over the axis)
    return SAMPLES.map((t, i) => (i ? 'L' : 'M') + px(t).toFixed(1) + ',' + (PLOT.axis - s * f(t) * PLOT.unit).toFixed(1)).join(' ');
  }

  const REDUCE_REAL = [
    { icon: 'brain', who: { en: 'Machine learning', tr: 'Makine öğrenmesi' },
      en: 'Training maximizes likelihood by minimizing a loss: max ↔ min.',
      tr: 'Model eğitimi, bir kaybı (loss) en aza indirerek olabilirliği en büyütür: max ↔ min.' },
    { icon: 'plane', who: { en: 'Airlines · logistics', tr: 'Havayolları · lojistik' },
      en: 'Crew schedules and delivery routes are solved as linear (integer) programs.',
      tr: 'Mürettebat çizelgeleri ve teslimat rotaları doğrusal (tam sayılı) program olarak çözülür.' },
    { icon: 'code', who: 'Python <code>math.lcm</code>',
      en: 'lcm is computed through gcd, exactly as on this slide.',
      tr: 'lcm, tam bu slayttaki gibi gcd üzerinden hesaplanır.' },
  ];

  const ICON_LP = '<svg viewBox="0 0 80 80" width="80" height="80" aria-hidden="true">'
    + '<path d="M12,66 L12,30 L34,14 L66,26 L70,60 Z" style="fill:color-mix(in srgb, var(--reduce) 20%, transparent);stroke:var(--reduce);stroke-width:3;stroke-linejoin:round"/>'
    + '<path d="M6,74 L76,8" style="stroke:var(--ink-2);stroke-width:2.5;stroke-dasharray:5 5"/>'
    + '<circle cx="66" cy="26" r="6" style="fill:var(--star)"/></svg>';
  const ICON_SS = '<svg viewBox="0 0 80 80" width="80" height="80" aria-hidden="true">'
    + '<path d="M14,40 L40,16 M14,40 L40,64 M40,16 L66,40 M40,64 L66,40 M40,16 L40,64" style="stroke:var(--ink-2);stroke-width:2.5"/>'
    + '<path d="M14,40 L40,16 L66,40" style="fill:none;stroke:var(--reduce);stroke-width:4"/>'
    + '<rect x="6" y="32" width="16" height="16" rx="3" style="fill:var(--node-fill);stroke:var(--reduce);stroke-width:3"/>'
    + '<rect x="32" y="8" width="16" height="16" rx="3" style="fill:var(--node-fill);stroke:var(--reduce);stroke-width:3"/>'
    + '<rect x="32" y="56" width="16" height="16" rx="3" style="fill:var(--node-fill);stroke:var(--ink-2);stroke-width:3"/>'
    + '<rect x="58" y="32" width="16" height="16" rx="3" style="fill:color-mix(in srgb, var(--ok) 30%, var(--node-fill));stroke:var(--ok);stroke-width:3"/></svg>';

  Deck.add({
    id: 'reduction', act: 'reduce', steps: 4,
    title: { en: 'Reduce to a problem you can already solve', tr: 'Zaten çözebildiğin bir probleme indirge' },
    html: `
      <div class="re-diag">
        <svg class="re-dsvg" width="760" height="580" viewBox="0 0 760 580" aria-hidden="true"></svg>
        ${['A', 'Ans', 'B', 'Sol'].map(boxLabels).join('')}
        <div class="re-alab re-red" style="left:${cx('A') + 22}px;top:214px">${L('reduce', 'indirge')}</div>
        <div class="re-alab re-back" style="left:${cx('Ans') - 22 - 240}px;top:214px;width:240px">${L('translate back', 'geri çevir')}</div>
        <div class="re-alab re-solve" style="left:${BW}px;top:${BOX.B.y + 14}px;width:${BOX.Sol.x - BW}px">
          ${SOLVE.map((s, k) => '<div class="re-v" data-v="' + k + '">' + s + '</div>').join('')}</div>
        <div class="re-cost">
          <div class="re-ineq"><b class="c-reduce">↓</b> + <b class="c-ok">→</b> + <b class="c-reduce">↑</b>
            <span class="re-lt">&lt;</span>
            <svg width="76" height="22" viewBox="0 0 76 22" aria-hidden="true"><path d="M4,11 H62" style="stroke:var(--muted);stroke-width:4;stroke-dasharray:7 6" marker-end="url(#arrow-muted)"/></svg>
            <b class="c-bad">?</b></div>
          <div class="re-cost-t">${L('worth it only if the detour is cheaper', 'ancak dolambaçlı yol daha ucuzsa değer')}</div>
        </div>
      </div>
      <div class="re-lcm">
        <div class="re-tr-hint">${L('', 'lcm = EKOK · gcd = EBOB')}</div>
        <svg class="re-lsvg" width="1020" height="750" viewBox="0 0 1020 750" aria-hidden="true"></svg>
      </div>
      <div class="re-max">
        <svg class="re-msvg" width="1020" height="530" viewBox="0 0 1020 530" aria-hidden="true"></svg>
      </div>
      <div class="re-tags" data-hide="4">
        <div class="panel ticks re-tag" data-step="3" data-anim="up" style="--d:1700ms">${ICON_LP}
          <div><h3>${L('Linear programming', 'Doğrusal programlama')}</h3><p>${L('many optimization problems → one LP solver', 'birçok optimizasyon problemi → tek LP çözücü')}</p></div></div>
        <div class="panel ticks re-tag" data-step="3" data-anim="up" style="--d:1950ms">${ICON_SS}
          <div><h3>${L('State-space graphs', 'Durum uzayı grafları')}</h3><p>${L('puzzles → graph search (BFS, DFS)', 'bulmacalar → graf araması (BFS, DFS)')}</p></div></div>
      </div>
      ${Viz.real(REDUCE_REAL, { layout: 'row', cls: 're-real', attrs: ' data-step="4" data-anim="up"' })}`,
    init(ctx) {
      const d = ctx.data;
      /* ----- the diagram ----- */
      d.diag = ctx.$('.re-diag');
      Anim.set(d.diag, SPOT.hero);
      const svg = ctx.$('.re-dsvg');
      const gArrows = U.s('g'), gDot = U.s('g'), gBoxes = U.s('g');
      svg.append(gArrows, gDot, gBoxes);
      d.boxes = {};
      Object.keys(BOX).forEach((k) => {
        const b = BOX[k];
        const r = U.s('rect', { class: 're-box ' + k.toLowerCase(), x: b.x, y: b.y, width: BW, height: BH, rx: 18 });
        gBoxes.appendChild(r);
        d.boxes[k] = r;
      });
      // "algorithm known" badge on B
      d.known = U.s('g', { class: 're-known' });
      d.known.innerHTML = '<circle cx="' + (BW - 4) + '" cy="' + (BOX.B.y + 4) + '" r="20"/><path transform="translate(' + (BW - 4) + ',' + (BOX.B.y + 5) + ') scale(0.8)" d="' + Viz.ICONS.check + '"/>';
      gBoxes.appendChild(d.known);
      // arrows: the direct way (unknown) and the detour
      const yA = cy('A'), yB = cy('B');
      d.direct = U.s('path', { class: 're-direct', d: 'M' + (BW + 8) + ',' + yA + ' L' + (BOX.Ans.x - 12) + ',' + yA, 'marker-end': 'url(#arrow-muted)' });
      d.q = sText(gArrows, (BW + BOX.Ans.x) / 2, yA - 16, '?', { class: 're-q' });
      d.red = Viz.hiddenPath({ class: 're-arr', d: 'M' + cx('A') + ',' + (BOX.A.y + BH + 8) + ' L' + cx('B') + ',' + (BOX.B.y - 12), 'marker-end': 'url(#arrow-reduce)' });
      d.solve = Viz.hiddenPath({ class: 're-arr ok', d: 'M' + (BW + 8) + ',' + yB + ' L' + (BOX.Sol.x - 12) + ',' + yB, 'marker-end': 'url(#arrow-ok)' });
      d.back = Viz.hiddenPath({ class: 're-arr', d: 'M' + cx('Sol') + ',' + (BOX.Sol.y - 8) + ' L' + cx('Ans') + ',' + (BOX.Ans.y + BH + 12), 'marker-end': 'url(#arrow-reduce)' });
      gArrows.append(d.direct, d.red, d.solve, d.back);
      d.dot = U.s('circle', { class: 're-dot', r: 14 });
      Anim.set(d.dot, { x: cx('A'), y: cy('A'), opacity: 0 });
      gDot.appendChild(d.dot);
      // B, its solution and the detour are not there yet
      d.lblB = ctx.$('[data-box="B"]').parentNode;
      d.lblSol = ctx.$('[data-box="Sol"]').parentNode;
      d.redLbl = ctx.$('.re-red');
      d.backLbl = ctx.$('.re-back');
      d.solveLbl = ctx.$('.re-solve');
      d.cost = ctx.$('.re-cost');
      [d.boxes.B, d.boxes.Sol, d.known, d.lblB, d.lblSol, d.redLbl, d.backLbl, d.solveLbl, d.cost].forEach((el) => Anim.set(el, { opacity: 0 }));
      setLabels(ctx, 0, false);

      /* ----- lcm via gcd ----- */
      d.lcm = ctx.$('.re-lcm');
      Anim.set(d.lcm, { opacity: 0 });
      const ls = ctx.$('.re-lsvg');
      const id = U.s('g', { class: 're-ident' });
      id.innerHTML = '<rect x="0" y="0" width="620" height="62" rx="14"/>';
      sText(id, 310, 42, 'lcm(m, n) · gcd(m, n) = m · n', {});
      ls.appendChild(id);
      d.ident = id;
      // Euclid: gcd(60, 24) → gcd(24, 12) → gcd(12, 0) = 12
      const EY = 158;
      d.eu = G.pairs.map((pr, k) => {
        const x0 = k * PITCH;
        const g = U.s('g', { class: 're-pair' });
        g.appendChild(U.s('rect', { x: x0 - 12, y: EY - 46, width: 11 * GCW + 24, height: 66, rx: 14 }));
        sText(g, x0, EY, 'gcd(', { class: 're-eu', 'text-anchor': 'start' });
        sText(g, x0 + 6.5 * GCW, EY, ',', { class: 're-eu', 'text-anchor': 'middle' });
        sText(g, x0 + 10.5 * GCW, EY, ')', { class: 're-eu', 'text-anchor': 'middle' });
        ls.appendChild(g);
        const a = sText(ls, x0 + 5 * GCW, EY, String(pr[0]), { class: 're-eun a' });
        const b = sText(ls, x0 + 9 * GCW, EY, String(pr[1]), { class: 're-eun' + (pr[1] === 0 ? ' zero' : '') });
        [g, a, b].forEach((e) => Anim.set(e, { opacity: 0 }));
        return { g, a, b, x0 };
      });
      d.euArr = []; d.euMod = [];
      G.steps.forEach((st, k) => {
        const x0 = k * PITCH + 11 * GCW + 18, x1 = (k + 1) * PITCH - 20;
        const p = Viz.hiddenPath({ class: 're-earr', d: 'M' + x0 + ',' + (EY - 13) + ' L' + x1 + ',' + (EY - 13), 'marker-end': 'url(#arrow-reduce)' });
        ls.appendChild(p);
        d.euArr.push(p);
        const t = sText(ls, (x0 + x1) / 2, EY + 62, st.m + ' mod ' + st.n + ' = ' + st.r, { class: 're-mod' });
        Anim.set(t, { opacity: 0 });
        d.euMod.push(t);
      });
      d.euRes = sText(ls, 2 * PITCH + 11 * GCW + 26, EY, '= <tspan class="re-ok">' + G.gcd + '</tspan>', { class: 're-eu', 'text-anchor': 'start' });
      Anim.set(d.euRes, { opacity: 0 });
      // lcm = 24·60 / 12 = 1440 / 12 = 120
      d.lcmLine = sText(ls, 0, 300, 'lcm(24, 60) = 24·60 / <tspan class="re-ok">12</tspan> = 1440 / <tspan class="re-ok">12</tspan> = <tspan class="re-amb">' + LCM + '</tspan>', { class: 're-lcmline' });
      Anim.set(d.lcmLine, { opacity: 0 });
      // number line: multiples of 24 (above) and of 60 (below) meet at 120
      const gl = U.s('g', { class: 're-nl' });
      ls.appendChild(gl);
      gl.appendChild(U.s('path', { class: 're-axis', d: 'M' + (NL.x0 - 16) + ',' + NL.y + ' L' + (nlx(LCM) + 54) + ',' + NL.y, 'marker-end': 'url(#arrow-muted)' }));
      sText(gl, NL.x0, NL.y + 34, '0', { class: 're-tick' });
      d.hops = { a: [], b: [] };
      const hop = (v0, v1, up, cls) => {
        const x0 = nlx(v0), x1 = nlx(v1), h = up ? -62 : 70;
        const p = Viz.hiddenPath({ class: 're-hop ' + cls, d: 'M' + x0 + ',' + NL.y + ' Q' + ((x0 + x1) / 2) + ',' + (NL.y + 2 * h) + ' ' + (x1 - (up ? 3 : 3)) + ',' + (NL.y + (up ? -4 : 4)), 'marker-end': 'url(#arrow-' + (up ? 'cmp' : 'swap') + ')' });
        gl.appendChild(p);
        const t = sText(gl, x1, up ? NL.y - 30 : NL.y + 50, String(v1), { class: 're-tick ' + cls });
        Anim.set(t, { opacity: 0 });
        return { p, t };
      };
      for (let v = 24; v <= LCM; v += 24) d.hops.a.push(hop(v - 24, v, true, 'a'));
      for (let v = 60; v <= LCM; v += 60) d.hops.b.push(hop(v - 60, v, false, 'b'));
      d.meet = U.s('g', { class: 're-meet' });
      d.meet.innerHTML = '<circle cx="' + nlx(LCM) + '" cy="' + NL.y + '" r="20"/>';
      gl.appendChild(d.meet);
      Anim.set(d.meet, { opacity: 0 });
      d.nl = gl;
      Anim.set(gl, { opacity: 0 });

      /* ----- max ↔ min ----- */
      d.max = ctx.$('.re-max');
      const ms = ctx.$('.re-msvg');
      ms.appendChild(U.s('path', { class: 're-axis', d: 'M' + (PLOT.x0 - 20) + ',' + PLOT.axis + ' L' + (PLOT.x1 + 40) + ',' + PLOT.axis, 'marker-end': 'url(#arrow-muted)' }));
      d.f = Viz.hiddenPath({ class: 're-f', d: curve(1) });
      d.g = U.s('path', { class: 're-g', d: curve(1) });
      Anim.set(d.g, { opacity: 0 });
      ms.append(d.g, d.f);
      const xp = px(PEAK), yp = PLOT.axis - f(PEAK) * PLOT.unit, yv = PLOT.axis + f(PEAK) * PLOT.unit;
      d.link = Viz.hiddenPath({ class: 're-link', d: 'M' + xp + ',' + (yp + 14) + ' L' + xp + ',' + (yv - 14) });
      ms.appendChild(d.link);
      d.peak = U.s('circle', { class: 're-peak', cx: xp, cy: yp, r: 11 });
      d.valley = U.s('circle', { class: 're-valley', cx: xp, cy: yv, r: 11 });
      d.peakT = sText(ms, xp + 24, yp + 4, 'max f = 4', { class: 're-pl' });
      d.valleyT = sText(ms, xp + 24, yv + 16, 'min (−f) = −4', { class: 're-pl v' });
      d.fT = sText(ms, PLOT.x1 + 10, PLOT.axis - f(1) * PLOT.unit - 12, 'f', { class: 're-cl f' });
      d.gT = sText(ms, PLOT.x1 + 10, PLOT.axis + f(1) * PLOT.unit + 30, '−f', { class: 're-cl g' });
      ms.append(d.peak, d.valley);
      [d.peak, d.valley, d.peakT, d.valleyT, d.fT, d.gT].forEach((e) => Anim.set(e, { opacity: 0 }));
      d.formula = sText(ms, 500, 508, '<tspan class="re-cmp">max f</tspan> = −<tspan class="re-amb">min (−f)</tspan>', { class: 're-formula' });
      Anim.set(d.formula, { opacity: 0 });
      Anim.set(d.max, { opacity: 0 });
    },
    async step(n, ctx) {
      const d = ctx.data;
      if (n === 1) {
        // the detour: reduce to B, solve B with the known algorithm, translate back
        await Promise.all([
          fadeTo(d.boxes.B, 1, 0, 300), fadeTo(d.lblB, 1, 0, 300), pop(d.known, 380, 320),
          drawPath(d.red, { dur: 480 }), fadeTo(d.redLbl, 1, 120, 300), runDot(d, 0, 1, 0),
        ]);
        await Promise.all([
          fadeTo(d.boxes.Sol, 1, 0, 300), fadeTo(d.lblSol, 1, 0, 300),
          drawPath(d.solve, { dur: 480 }), fadeTo(d.solveLbl, 1, 120, 300), runDot(d, 1, 2, 0),
        ]);
        await Promise.all([drawPath(d.back, { dur: 480 }), fadeTo(d.backLbl, 1, 120, 300), runDot(d, 2, 3, 0)]);
        d.direct.classList.add('blocked');
        await Promise.all([fadeTo(d.dot, 0, 60, 200), fadeTo(d.q, 0.45, 0, 300), Anim.to(d.cost, { opacity: 1 }, { dur: 420 })]);
      } else if (n === 2) {
        // lcm(24, 60) via gcd: the token runs the detour while Euclid works
        const jobs = [
          Anim.to(d.diag, SPOT.side, { dur: 600 }),
          setLabels(ctx, 1, true),
          fadeTo(d.lcm, 1, 150, 300),
          pop(d.ident, 250, 340),
          runDot(d, 0, 1, 300),
        ];
        // Euclid: gcd(m, n) = gcd(n, m mod n) until n = 0
        const e = d.eu;
        const E0 = 350, ES = 480;
        jobs.push(fadeTo(e[0].g, 1, E0, 240), pop(e[0].a, E0 + 40, 240), pop(e[0].b, E0 + 80, 240));
        for (let k = 1; k < e.length; k++) {
          const t0 = E0 + 260 + (k - 1) * ES;
          jobs.push(drawPath(d.euArr[k - 1], { dur: 220, delay: t0 }));
          jobs.push(fadeTo(d.euMod[k - 1], 1, t0 + 100, 220));
          jobs.push(fadeTo(e[k].g, 1, t0 + 120, 220));
          // the second number moves into first place, the remainder comes in
          Anim.set(e[k].a, { x: e[k - 1].x0 + 9 * GCW - (e[k].x0 + 5 * GCW), opacity: 0 });
          jobs.push(Anim.to(e[k].a, { x: 0, opacity: 1 }, { dur: 420, delay: t0 + 80, arc: 34 }));
          jobs.push(pop(e[k].b, t0 + 330, 260));
        }
        const tG = E0 + 260 + (e.length - 2) * ES + 560;
        jobs.push(pop(d.euRes, tG, 300));
        jobs.push(runDot(d, 1, 2, tG - 120));
        // lcm = m·n / gcd, then back to the answer of A
        jobs.push(pop(d.lcmLine, tG + 220, 320));
        jobs.push(runDot(d, 2, 3, tG + 460));
        // check on the number line: the multiples of 24 and of 60 meet at 120
        const tN = tG + 320;
        jobs.push(fadeTo(d.nl, 1, tN, 220));
        d.hops.a.forEach((h, i) => {
          jobs.push(drawPath(h.p, { dur: 200, delay: tN + 80 + i * 110 }));
          jobs.push(fadeTo(h.t, 1, tN + 240 + i * 110, 140));
        });
        d.hops.b.forEach((h, i) => {
          jobs.push(drawPath(h.p, { dur: 300, delay: tN + 100 + i * 290 }));
          jobs.push(fadeTo(h.t, 1, tN + 380 + i * 290, 140));
        });
        jobs.push(pop(d.meet, tN + 700, 300));
        jobs.push(fadeTo(d.dot, 0, tG + 1000, 180));
        await Promise.all(jobs);
        if (!Anim.isInstant()) {
          const p = stageXY(ctx, 680 + nlx(LCM), NL.y);
          FX.ripple(p.x, p.y, '--reduce', { r0: 30, r1: 110 });
        }
      } else if (n === 3) {
        // max f = −min(−f): mirror the curve, find the min, flip the sign back
        const jobs = [fadeTo(d.lcm, 0, 0, 250), setLabels(ctx, 2, true), fadeTo(d.max, 1, 100, 280)];
        jobs.push(drawPath(d.f, { dur: 600, delay: 200 }), fadeTo(d.fT, 1, 620, 220), runDot(d, 0, 1, 300));
        jobs.push(pop(d.peak, 760, 280), fadeTo(d.peakT, 1, 820, 220));
        jobs.push(Anim.run((p) => {
          Anim.set(d.g, { opacity: 1 });
          d.g.setAttribute('d', curve(1 - 2 * Math.min(1, Math.max(0, p))));
        }, { dur: 700, delay: 950, ease: 'inOut' }));
        jobs.push(pop(d.valley, 1640, 280), fadeTo(d.valleyT, 1, 1700, 220), fadeTo(d.gT, 1, 1640, 220));
        jobs.push(drawPath(d.link, { dur: 300, delay: 1700 }), runDot(d, 1, 2, 1500));
        jobs.push(pop(d.formula, 1980, 340), runDot(d, 2, 3, 2040));
        jobs.push(fadeTo(d.dot, 0, 2580, 180));
        await Promise.all(jobs);
      }
    },
  });

  /* ======================================================================
   * Counting paths with the adjacency matrix
   * ==================================================================== */
  const EDGES = [[1, 3], [1, 4], [2, 1], [2, 3], [3, 4]];
  const NV = 4;
  const A = N.adjacency(NV, EDGES);
  const A2 = N.matMul(A, A);                 // [[0,0,0,1],[0,0,1,2],[0,0,0,0],[0,0,0,0]]
  const FOCUS = N.cellTerms(A, A, 1, 3);     // entry (2, 4) = Σ A[2][k]·A[k][4] = 2
  const NODES = { 1: { x: 300, y: 112 }, 2: { x: 92, y: 312 }, 3: { x: 300, y: 512 }, 4: { x: 508, y: 312 } };
  const MC = 84;                             // matrix cell size
  const MA = { x: 720, y: 136 };             // A
  const MB = { x: 1250, y: 136 };            // A²
  const KX = [920, 1004, 1088, 1172];        // product strip columns (k = 1..4)
  const KY = { k: 540, row: 584, col: 662, prod: 724 };
  const PATHS = [{ via: 1, cls: 'ok', node: 'ok' }, { via: 3, cls: 'star', node: 'max' }];

  const PATHS_REAL = [
    { icon: 'people', who: { en: 'Social networks', tr: 'Sosyal ağlar' },
      en: '"Friends of friends" are paths of length 2: the idea behind LinkedIn’s 2nd-degree connections.',
      tr: '"Arkadaşın arkadaşı" 2 uzunluklu yollardır: LinkedIn’deki 2. derece bağlantıların fikri.' },
    { icon: 'search', who: 'Google PageRank',
      en: 'Ranks web pages by multiplying by the web’s link matrix again and again.',
      tr: 'Web sayfalarını, web’in bağlantı matrisiyle tekrar tekrar çarparak sıralar.' },
  ];

  const cellC = (M, i, j) => ({ x: M.x + (j + 0.5) * MC, y: M.y + (i + 0.5) * MC });

  /* A 4 × 4 matrix with vertex headers and brackets; values start hidden. */
  function matrix(parent, M) {
    const g = U.s('g', { class: 'pa-mx' });
    parent.appendChild(g);
    const W = NV * MC;
    g.innerHTML = '<path class="pa-br" d="M' + (M.x - 6) + ',' + (M.y - 6) + ' h-12 v' + (W + 12) + ' h12"/>'
      + '<path class="pa-br" d="M' + (M.x + W + 6) + ',' + (M.y - 6) + ' h12 v' + (W + 12) + ' h-12"/>';
    const out = { g, cells: [], vals: [], rowH: [], colH: [] };
    for (let i = 0; i < NV; i++) {
      out.cells.push([]);
      out.vals.push([]);
      out.rowH.push(sText(g, M.x - 36, M.y + (i + 0.5) * MC + 9, String(i + 1), { class: 'pa-hd' }));
      out.colH.push(sText(g, M.x + (i + 0.5) * MC, M.y - 16, String(i + 1), { class: 'pa-hd' }));
      for (let j = 0; j < NV; j++) {
        const r = U.s('rect', { class: 'pa-cell', x: M.x + j * MC + 3, y: M.y + i * MC + 3, width: MC - 6, height: MC - 6, rx: 10 });
        g.appendChild(r);
        out.cells[i].push(r);
      }
    }
    for (let i = 0; i < NV; i++) {
      for (let j = 0; j < NV; j++) {
        const c = cellC(M, i, j);
        const t = sText(g, c.x, c.y + 13, '', { class: 'pa-v' });
        Anim.set(t, { opacity: 0 });
        out.vals[i].push(t);
      }
    }
    return out;
  }

  Deck.add({
    id: 'paths', act: 'reduce', steps: 4,
    title: { en: 'Counting paths = multiplying matrices', tr: 'Yol saymak = matris çarpmak' },
    html: `
      <div class="pa-name" style="left:${MA.x - 60}px;width:${NV * MC + 120}px"><b>A</b><span>${L('adjacency matrix · row → column', 'komşuluk matrisi · satır → sütun')}</span></div>
      <div class="pa-name" data-step="2" data-anim="fade" style="left:${MB.x - 60}px;width:${NV * MC + 120}px"><b>A<sup>2</sup> = A · A</b><span>${L('paths with 2 edges', '2 kenarlı yollar')}</span></div>
      <div class="pa-msg">
        <div class="pa-msg-big">${L('counting paths = matrix power', 'yol sayısı = matris kuvveti')}</div>
        <div class="pa-msg-small">A<sup>k</sup>[i][j] = ${L('number of paths i → j with k edges', 'i → j, k kenarlı yol sayısı')}</div>
      </div>
      ${Viz.real(PATHS_REAL, { layout: 'row', cls: 'pa-real', attrs: ' data-step="4" data-anim="up"' })}
      <div class="pa-scene"></div>`,
    init(ctx) {
      const d = ctx.data;
      const svg = Viz.svg(ctx.$('.pa-scene'), 1700, 760);
      d.svg = svg;
      d.graph = new GraphView(svg, { nodes: NODES, edges: EDGES, r: 46 });
      d.A = matrix(svg, MA);
      d.B = matrix(svg, MB);
      Anim.set(d.B.g, { opacity: 0 });
      // values of A² (filled at click 2)
      for (let i = 0; i < NV; i++) for (let j = 0; j < NV; j++) {
        d.A.vals[i][j].textContent = String(A[i][j]);
        d.B.vals[i][j].textContent = String(A2[i][j]);
        if (A[i][j]) d.A.vals[i][j].classList.add('one');
        if (A2[i][j]) d.B.vals[i][j].classList.add('one');
      }
      // row 2 and column 4 of A, for the worked entry
      const W = NV * MC;
      d.rowBand = U.s('rect', { class: 'pa-band row', x: MA.x - 4, y: MA.y + MC - 4, width: W + 8, height: MC + 8, rx: 14 });
      d.colBand = U.s('rect', { class: 'pa-band col', x: MA.x + 3 * MC - 4, y: MA.y - 4, width: MC + 8, height: W + 8, rx: 14 });
      [d.rowBand, d.colBand].forEach((b) => { Anim.set(b, { opacity: 0 }); d.A.g.appendChild(b); });
      // product strip: A²[2][4] = Σ A[2][k] · A[k][4]
      const S = d.S = { g: U.s('g', { class: 'pa-strip' }), row: [], col: [], prod: [], plus: [], hl: [] };
      svg.appendChild(S.g);
      sText(S.g, KX[0] - 72, KY.k, 'k', { class: 'pa-sl' });
      sText(S.g, KX[0] - 72, KY.row + 9, 'A[2][k]', { class: 'pa-sl' });
      sText(S.g, KX[0] - 72, KY.col + 9, 'A[k][4]', { class: 'pa-sl' });
      FOCUS.terms.forEach((t, k) => {
        const hl = U.s('rect', { class: 'pa-khl', x: KX[k] - 38, y: KY.k - 30, width: 76, height: KY.prod - KY.k + 48, rx: 14 });
        Anim.set(hl, { opacity: 0 });
        S.g.appendChild(hl);
        S.hl.push(hl);
        sText(S.g, KX[k], KY.k, String(k + 1), { class: 'pa-k' });
        S.row.push(sText(S.g, KX[k], KY.row + 13, String(t.a), { class: 'pa-sv row' }));
        S.col.push(sText(S.g, KX[k], KY.col + 13, String(t.b), { class: 'pa-sv col' }));
        S.prod.push(sText(S.g, KX[k], KY.prod + 12, String(t.p), { class: 'pa-sv prod' + (t.p ? ' one' : '') }));
        if (k) S.plus.push(sText(S.g, (KX[k - 1] + KX[k]) / 2, KY.prod + 10, '+', { class: 'pa-plus' }));
      });
      S.times = [];
      FOCUS.terms.forEach((t, k) => S.times.push(sText(S.g, KX[k], (KY.row + KY.col) / 2 + 12, '×', { class: 'pa-times' })));
      S.eq = sText(S.g, KX[3] + 64, KY.prod + 12, '= ' + FOCUS.sum, { class: 'pa-sum', 'text-anchor': 'start' });
      S.rule = U.s('path', { class: 'pa-rule', d: 'M' + (KX[0] - 36) + ',' + (KY.prod - 30) + ' H' + (KX[3] + 36) });
      S.g.appendChild(S.rule);
      [].concat(S.row, S.col, S.prod, S.plus, S.times, [S.eq, S.rule]).forEach((e) => Anim.set(e, { opacity: 0 }));
      Anim.set(S.g, { opacity: 0 });
      // the two paths, as tally dots under A²[2][4]
      const c24 = cellC(MB, 1, 3);
      d.tally = PATHS.map((p, k) => {
        const t = U.s('circle', { class: 'pa-tally ' + p.cls, cx: c24.x - 12 + 24 * k, cy: c24.y + 30, r: 7 });
        Anim.set(t, { opacity: 0 });
        d.B.g.appendChild(t);
        return t;
      });
      d.ring = U.s('rect', { class: 'pa-ring', x: c24.x - MC / 2 - 4, y: c24.y - MC / 2 - 4, width: MC + 8, height: MC + 8, rx: 14 });
      Anim.set(d.ring, { opacity: 0 });
      d.B.g.appendChild(d.ring);
      d.msg = ctx.$('.pa-msg');
      Anim.set(d.msg, { opacity: 0, y: 20 });
    },
    async step(n, ctx) {
      const d = ctx.data, g = d.graph;
      if (n === 1) {
        // every edge u → v puts a 1 in row u, column v
        for (const [u, v] of EDGES) {
          const tok = d.A.vals[u - 1][v - 1];
          const c = cellC(MA, u - 1, v - 1);
          const m = g.mid(u, v);
          g.edge(u, v, 'hot');
          d.A.rowH[u - 1].classList.add('hot');
          d.A.colH[v - 1].classList.add('hot');
          Anim.set(tok, { x: m.x - c.x, y: m.y - c.y, scale: 1.3, opacity: 1 });
          await Anim.to(tok, { x: 0, y: 0, scale: 1 }, { dur: 380, arc: -50 });
          d.A.cells[u - 1][v - 1].classList.add('one');
          g.edge(u, v, 'hot', false);
          d.A.rowH[u - 1].classList.remove('hot');
          d.A.colH[v - 1].classList.remove('hot');
          await Anim.wait(40);
        }
        // everything else is 0
        const zeros = [];
        for (let i = 0; i < NV; i++) for (let j = 0; j < NV; j++) if (!A[i][j]) zeros.push(d.A.vals[i][j]);
        await Anim.stagger(zeros, (t, i, delay) => fadeTo(t, 1, delay, 200), 18);
      } else if (n === 2) {
        // A² = A · A: entry (2, 4) worked out as row 2 × column 4
        const S = d.S;
        const jobs = [fadeTo(d.B.g, 1, 0, 280), fadeTo(S.g, 1, 0, 280), fadeTo(d.rowBand, 1, 60, 250), fadeTo(d.colBand, 1, 160, 250)];
        FOCUS.terms.forEach((t, k) => {
          const a = cellC(MA, 1, k), b = cellC(MA, k, 3);
          Anim.set(S.row[k], { x: a.x - KX[k], y: a.y - KY.row, opacity: 0 });
          Anim.set(S.col[k], { x: b.x - KX[k], y: b.y - KY.col, opacity: 0 });
          jobs.push(Anim.to(S.row[k], { x: 0, y: 0, opacity: 1 }, { dur: 520, delay: 150 + k * 70 }));
          jobs.push(Anim.to(S.col[k], { x: 0, y: 0, opacity: 1 }, { dur: 520, delay: 300 + k * 70 }));
          jobs.push(fadeTo(S.times[k], 1, 700 + k * 40, 180));
          jobs.push(pop(S.prod[k], 850 + k * 90, 240));
          if (k) jobs.push(fadeTo(S.plus[k - 1], 1, 850 + k * 90, 180));
        });
        jobs.push(fadeTo(S.rule, 1, 800, 180));
        jobs.push(pop(S.eq, 1250, 280));
        // the sum lands in A²[2][4]
        const c24 = cellC(MB, 1, 3);
        const v24 = d.B.vals[1][3];
        Anim.set(v24, { x: KX[3] + 100 - c24.x, y: KY.prod - c24.y, opacity: 0, scale: 0.9 });
        jobs.push(Anim.to(v24, { x: 0, y: 0, scale: 1, opacity: 1 }, { dur: 480, delay: 1500, arc: 60 }).then(() => d.B.cells[1][3].classList.add('one')));
        // the other 15 entries the same way
        const T2 = 1950;
        jobs.push(fadeTo(d.rowBand, 0, T2, 250), fadeTo(d.colBand, 0, T2, 250));
        let q = 0;
        for (let i = 0; i < NV; i++) {
          for (let j = 0; j < NV; j++) {
            if (i === 1 && j === 3) continue;
            jobs.push(pop(d.B.vals[i][j], T2 + q++ * 24, 220).then(() => { if (A2[i][j]) d.B.cells[i][j].classList.add('one'); }));
          }
        }
        await Promise.all(jobs);
      } else if (n === 3) {
        // the 2 in A²[2][4] is two paths: 2 → 1 → 4 and 2 → 3 → 4
        await fadeTo(d.ring, 1, 0, 200);
        const tail = [];
        for (let k = 0; k < PATHS.length; k++) {
          const p = PATHS[k];
          const hl = d.S.hl[p.via - 1];
          hl.classList.add(p.cls);
          await Promise.all([fadeTo(hl, 1, 0, 220), g.travel([2, p.via, 4], { cls: p.cls, node: p.node, dur: 400, pause: 60 })]);
          tail.push(pop(d.tally[k], 0, 260));
        }
        await Promise.all(tail.concat([Anim.to(d.msg, { opacity: 1, y: 0 }, { dur: 400 })]));
      } else if (n === 4) {
        await fadeTo(d.S.g, 0, 0, 300);
      }
    },
  });
})();
