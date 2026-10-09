/* Instance simplification (Levitin §6.1–6.2): presorting for element
 * uniqueness, and Gaussian elimination. */
(function () {
  'use strict';

  const K = Viz.K;
  const FR = (p, q) => MatrixView.inline({ p, q });   // inline stacked fraction
  const CHECK = '<svg viewBox="-20 -20 40 40" width="30" height="30" aria-hidden="true"><path d="' + Viz.ICONS.check + '"/></svg>';

  /* ======================================================================
   * Presorting: are all elements distinct?
   * ==================================================================== */
  const PS = Algo.presort;
  const LIST = [5, 2, 8, 1, 9, 3, 8, 6];                 // twin 8s at positions 2 and 6
  const BF = PS.bruteForcePairs(LIST);                   // finds them at pair 17 (of 28)
  const PC = PS.presortCheck(LIST);                      // sorted 1 2 3 5 6 8 8 9, twins at 5, 6
  const PG = { W: 940, H: 640, x0: 78, pitch: 112, bw: 84, base: 380, unit: 36, lblY: 418, arcY: 452 };
  const px = (p) => PG.x0 + p * PG.pitch;
  const arcD = (p, q, depth) => 'M' + px(p) + ',' + PG.arcY + ' C' + px(p) + ',' + (PG.arcY + depth) + ' ' + px(q) + ',' + (PG.arcY + depth) + ' ' + px(q) + ',' + PG.arcY;
  const bfDepth = (i, j) => 30 + 19 * (j - i);

  const SCALE = [
    { n: '8', b: PS.pairs(8), p: PS.nLog2n(8), bl: '28', pl: '24', ratio: ['≈ same', '≈ aynı'], same: true },
    { n: '1 000', b: PS.pairs(1e3), p: PS.nLog2n(1e3), bl: '≈ 500 000', pl: '≈ 10 000', ratio: ['50× fewer', '50 kat az'] },
    { n: '1 000 000', b: PS.pairs(1e6), p: PS.nLog2n(1e6), bl: '≈ 5·10¹¹', pl: '≈ 2·10⁷', ratio: ['25 000× fewer', '25 000 kat az'],
      bt: ['≈ 8 min', '≈ 8 dk'], pt: ['0.02 s', '0,02 sn'] },
  ];
  const TRACK = 560;

  function scaleHtml() {
    return SCALE.map((r, k) => {
      const wp = Math.max(4, Math.round(TRACK * r.p / r.b));
      const clock = Viz.ricon('clock', 24);
      return `<div class="ps-row" style="top:${66 + k * 150}px">
        <div class="ps-rn">n = ${r.n}</div>
        <span class="ps-ratio${r.same ? ' same' : ''}">${L(r.ratio[0], r.ratio[1])}</span>
        <div class="ps-track b"><i style="width:${TRACK}px"></i></div>
        <div class="ps-val b" style="left:${TRACK + 14}px">${r.bl}${r.bt ? `<span class="ps-time">${clock}${L(r.bt[0], r.bt[1])}</span>` : ''}</div>
        <div class="ps-track p"><i style="width:${wp}px"></i></div>
        <div class="ps-val p" style="left:${wp + 14}px">${r.pl}${r.pt ? `<span class="ps-time">${clock}${L(r.pt[0], r.pt[1])}</span>` : ''}</div>
      </div>`;
    }).join('');
  }

  const REAL_PRESORT = [
    { icon: 'terminal', who: 'Linux / Unix shell', en: '<code>sort names.txt | uniq</code>: uniq only removes <b>neighbouring</b> duplicates, so you presort first.', tr: '<code>sort names.txt | uniq</code>: uniq sadece <b>yan yana</b> duran tekrarları siler; bu yüzden önce sıralarsın.' },
    { icon: 'database', who: 'PostgreSQL · MySQL', en: '<code>SELECT DISTINCT</code> and <code>GROUP BY</code> can run as "sort, then compare neighbours".', tr: '<code>SELECT DISTINCT</code> ve <code>GROUP BY</code> "önce sırala, sonra komşuları karşılaştır" diye çalışabilir.' },
    { icon: 'search', who: 'Contacts · dictionaries · indexes', en: 'Sorted once, then every lookup is a binary search: log n.', tr: 'Bir kez sıralanır, sonra her arama ikili aramadır: log n.' },
  ];

  const ICO_PAIRS = '<svg class="ps-ico" viewBox="0 0 64 44" aria-hidden="true"><path d="M8,30 C8,44 56,44 56,30 M8,30 C8,40 32,40 32,30 M20,30 C20,40 44,40 44,30 M8,30 C8,37 20,37 20,30 M32,30 C32,37 44,37 44,30 M20,30 C20,42 56,42 56,30"/><rect x="4" y="12" width="8" height="16" rx="2"/><rect x="16" y="4" width="8" height="24" rx="2"/><rect x="28" y="16" width="8" height="12" rx="2"/><rect x="40" y="8" width="8" height="20" rx="2"/><rect x="52" y="14" width="8" height="14" rx="2"/></svg>';
  const ICO_SORTED = '<svg class="ps-ico ok" viewBox="0 0 64 44" aria-hidden="true"><path d="M8,30 C8,36 20,36 20,30 M20,30 C20,36 32,36 32,30 M32,30 C32,36 44,36 44,30 M44,30 C44,36 56,36 56,30"/><rect x="4" y="20" width="8" height="8" rx="2"/><rect x="16" y="16" width="8" height="12" rx="2"/><rect x="28" y="12" width="8" height="16" rx="2"/><rect x="40" y="8" width="8" height="20" rx="2"/><rect x="52" y="4" width="8" height="24" rx="2"/></svg>';
  const ICO_BSEARCH = '<svg class="ps-bico" viewBox="0 0 56 40" aria-hidden="true"><rect x="2" y="24" width="6" height="12" rx="1.5"/><rect x="11" y="20" width="6" height="16" rx="1.5"/><rect x="20" y="16" width="6" height="20" rx="1.5"/><rect class="hi" x="29" y="12" width="6" height="24" rx="1.5"/><rect x="38" y="8" width="6" height="28" rx="1.5"/><rect x="47" y="4" width="6" height="32" rx="1.5"/><path class="br" d="M2,4 V1 H53 V4 M29,8 V5 H53 V8"/></svg>';
  const ICO_MEDIAN = '<svg class="ps-bico" viewBox="0 0 56 40" aria-hidden="true"><rect x="2" y="24" width="6" height="12" rx="1.5"/><rect x="11" y="20" width="6" height="16" rx="1.5"/><rect x="20" y="16" width="6" height="20" rx="1.5"/><rect class="hi" x="29" y="12" width="6" height="24" rx="1.5"/><rect x="38" y="8" width="6" height="28" rx="1.5"/><rect x="47" y="4" width="6" height="32" rx="1.5"/><path class="br" d="M32,2 V8"/></svg>';

  Deck.add({
    id: 'presorting', act: 'simplify', steps: 4,
    title: { en: 'Presorting: are all elements distinct?', tr: 'Ön sıralama: tüm elemanlar farklı mı?' },
    html: `
      <div class="ps-scene" data-hide="3"></div>
      <div class="ps-scale" data-step="3" data-anim="fade">
        <div class="ps-sh">${L('…and when n grows?', '…peki n büyüyünce?')}</div>
        <div class="ps-key"><span class="b">${L('brute force', 'kaba kuvvet')}</span><span class="p">${L('presort', 'ön sıralama')}</span></div>
        ${scaleHtml()}
        <div class="ps-foot">${L('comparisons; times at 10⁹ comparisons per second', 'karşılaştırma sayısı; süreler saniyede 10⁹ karşılaştırma ile')}</div>
      </div>
      <div class="ps-side">
        <div class="panel ticks ps-card bf" data-step="1" data-anim="right">
          <div class="ps-ch">${ICO_PAIRS}<div class="ps-cht"><b>${L('Brute force', 'Kaba kuvvet')}</b><span>${L('compare <b>every pair</b>', '<b>her çifti</b> karşılaştır')}</span></div><span class="badge-o bad">O(n²)</span></div>
          <div class="ps-cnt"><b class="ps-n1">0</b><span class="ps-of">/ 28</span><span class="ps-what">${L('pairs checked', 'çift kontrol edildi')}<br><span class="muted">${L('all n(n−1)/2 = 28 if no duplicate', 'tekrar yoksa hepsi: n(n−1)/2 = 28')}</span></span></div>
        </div>
        <div class="panel ticks ps-card pre" data-step="2" data-anim="right">
          <div class="ps-ch">${ICO_SORTED}<div class="ps-cht"><b>${L('Presort', 'Ön sıralama')}</b><span>${L('sort, then compare <b>neighbours</b> only', 'sırala, sonra sadece <b>komşuları</b> karşılaştır')}</span></div><span class="badge-o">Θ(n log n)</span></div>
          <div class="ps-cnt"><span class="ps-sort">${L('sort', 'sıralama')} ≈ n log₂ n = 24</span><span class="ps-plus">+</span><b class="ps-n2">0</b><span class="ps-what">${L('neighbour<br>checks', 'komşu<br>kontrolü')}</span></div>
        </div>
        <div class="ps-bonus" data-step="3" style="--d:900ms">
          <div class="panel ps-bo">${ICO_BSEARCH}<div><b>${L('search', 'arama')}</b>${L('binary search', 'ikili arama')}</div><span class="badge-o ok">O(log n)</span></div>
          <div class="panel ps-bo">${ICO_MEDIAN}<div><b>${L('median', 'medyan')}</b>${L('the middle one', 'ortadaki eleman')}</div><span class="badge-o ok">O(1)</span></div>
        </div>
      </div>
      ${Viz.real(REAL_PRESORT, { layout: 'row', cls: 'ps-real', attrs: ' data-step="4" data-anim="up"' })}`,
    init(ctx) {
      const d = ctx.data;
      const svg = Viz.svg(ctx.$('.ps-scene'), PG.W, PG.H, 'ps-svg');
      const gArcs = U.s('g', {}), gBars = U.s('g', {}), gOver = U.s('g', {});
      svg.append(U.s('line', { class: 'ps-base', x1: 10, y1: PG.base + 2, x2: PG.W - 10, y2: PG.base + 2 }), gArcs, gBars, gOver);
      d.bars = LIST.map((v, i) => {
        const g = U.s('g', { class: 'ps-bar' });
        g.append(
          U.s('rect', { x: -PG.bw / 2, y: PG.base - v * PG.unit, width: PG.bw, height: v * PG.unit, rx: 9 }),
          U.s('text', { class: 'ps-v', x: 0, y: PG.lblY }, String(v)));
        gBars.appendChild(g);
        Anim.set(g, { x: px(i) });
        return { g, v };
      });
      d.bySorted = PC.order.map((id) => d.bars[id]);
      // brute force: one arc per compared pair (below the bars)
      d.arcs = BF.events.map((e) => {
        const a = Viz.hiddenPath({ class: 'ps-arc', d: arcD(e.i, e.j, bfDepth(e.i, e.j)) });
        gArcs.appendChild(a);
        return a;
      });
      const dupTag = (x, y) => {
        const g = U.s('g', { class: 'ps-dup' });
        g.appendChild(U.s('rect', { x: -132, y: -23, width: 264, height: 46, rx: 23 }));
        Viz.text(g, 0, 1, '8 = 8  duplicate!', '8 = 8  tekrar!', { 'text-anchor': 'middle', 'dominant-baseline': 'central' });
        Anim.set(g, { x, y, opacity: 0, scale: 0.6 });
        gOver.appendChild(g);
        return g;
      };
      const f = BF.found;
      d.dup1 = dupTag((px(f.i) + px(f.j)) / 2, PG.arcY + 0.75 * bfDepth(f.i, f.j) + 34);
      // presort: hops between neighbours, with a tick under each
      d.hops = PC.events.map((e) => {
        const h = Viz.hiddenPath({ class: 'ps-hop', d: arcD(e.p, e.q, 46) });
        gArcs.appendChild(h);
        return h;
      });
      d.ticks = PC.events.map((e) => {
        const t = U.s('path', { class: 'ps-tick', d: Viz.ICONS.check });
        Anim.set(t, { x: (px(e.p) + px(e.q)) / 2, y: PG.arcY + 58, opacity: 0, scale: 0.4 });
        gOver.appendChild(t);
        return t;
      });
      d.dup2 = dupTag((px(PC.found.p) + px(PC.found.q)) / 2, PG.arcY + 100);
      d.n1 = ctx.$('.ps-n1');
      d.n2 = ctx.$('.ps-n2');
      ctx.$$('.ps-track i').forEach((i) => { i.style.transform = 'scaleX(0)'; });
      ctx.$$('.ps-val, .ps-ratio').forEach((e) => Anim.set(e, { opacity: 0 }));
    },
    async step(n, ctx) {
      const d = ctx.data;
      const mark = (bar, cls, on) => bar.g.classList.toggle(cls, on !== false);
      if (n === 1) {
        // every pair, one after another (the first few slowly)
        for (const e of BF.events) {
          const k = e.count - 1;
          const slow = k < 2;
          mark(d.bars[e.i], 'cmp'); mark(d.bars[e.j], 'cmp');
          await Viz.draw(d.arcs[k], { dur: slow ? 260 : 64 });
          d.n1.textContent = String(e.count);
          if (e.eq) { d.arcs[k].classList.add('dup'); break; }
          if (slow) await Anim.wait(120);
          d.arcs[k].classList.add('trace');
          mark(d.bars[e.i], 'cmp', false); mark(d.bars[e.j], 'cmp', false);
        }
        const f = BF.found;
        [f.i, f.j].forEach((i) => { mark(d.bars[i], 'cmp', false); mark(d.bars[i], 'bad'); });
        await Anim.to(d.dup1, { opacity: 1, scale: 1 }, { dur: 380, ease: 'outBack' });
      } else if (n === 2) {
        // clear the brute-force web
        d.bars.forEach((b) => mark(b, 'bad', false));
        await Promise.all(d.arcs.map((a) => Anim.to(a, { opacity: 0 }, { dur: 240 })).concat([Anim.to(d.dup1, { opacity: 0, scale: 0.6 }, { dur: 240 })]));
        // sort: every bar slides to its place (equal keys keep their order)
        await Promise.all(d.bars.map((b, i) => {
          const to = PC.pos[i], dd = to - i;
          return Anim.wait(40 * i).then(() => {
            mark(b, 'sorted');
            return Anim.to(b.g, { x: px(to) }, { dur: 780, arc: dd ? Math.sign(dd) * (18 + 6 * Math.abs(dd)) : 0 });
          });
        }));
        // one scan over neighbours
        for (const e of PC.events) {
          const a = d.bySorted[e.p], b = d.bySorted[e.q];
          mark(a, 'cmp'); mark(b, 'cmp');
          await Viz.draw(d.hops[e.p], { dur: 120 });
          d.n2.textContent = String(e.count);
          if (e.eq) { d.hops[e.p].classList.add('dup'); break; }
          await Anim.to(d.ticks[e.p], { opacity: 1, scale: 1 }, { dur: 100, ease: 'outBack' });
          mark(a, 'cmp', false); mark(b, 'cmp', false);
        }
        const f = PC.found;
        [d.bySorted[f.p], d.bySorted[f.q]].forEach((b) => { mark(b, 'cmp', false); mark(b, 'bad'); });
        await Anim.to(d.dup2, { opacity: 1, scale: 1 }, { dur: 340, ease: 'outBack' });
      } else if (n === 3) {
        // the same two methods for big n: bars on a real (linear) scale
        const rows = ctx.$$('.ps-row');
        await Anim.wait(150);
        for (const row of rows) {
          const [tb, tp] = row.querySelectorAll('.ps-track i');
          await Promise.all([
            Anim.run((p) => { tb.style.transform = 'scaleX(' + Math.min(1, p).toFixed(4) + ')'; }, { dur: 450, ease: 'out' }),
            Anim.run((p) => { tp.style.transform = 'scaleX(' + Math.min(1, p).toFixed(4) + ')'; }, { dur: 450, ease: 'out' }),
            Anim.stagger(row.querySelectorAll('.ps-val'), (e, i, delay) => Anim.to(e, { opacity: 1 }, { dur: 250, delay: 200 + delay }), 60),
          ]);
          await Anim.to(row.querySelector('.ps-ratio'), { opacity: 1 }, { dur: 200 });
        }
      }
    },
  });

  /* ======================================================================
   * Gaussian elimination
   * ==================================================================== */
  const GA = Algo.gauss;
  const SYS = [[2, -4, 1, 6], [3, -1, 1, 11], [1, 1, -1, -3]];
  const ELIM = GA.eliminate(SYS);
  const OPS = ELIM.events.filter((e) => e.t === 'rowop');     // R2−3/2R1, R3−1/2R1, R3−3/5R2
  const BACK = GA.backSubstitute(ELIM.U);                       // x3 = 6, x2 = 1, x1 = 2
  const MXO = { x: 690, y: 132, cw: 156, ch: 106 };
  const SUB = ['₁', '₂', '₃'];
  const STAGE_Y = 474;                                         // ghost row parking spot (top)
  const GA_RES = { cx: 1251 + 46, cy: 486 + 38 };              // centre of .ga-res (see CSS)

  const fr = (f) => (f.q === 1 ? U.num(f.p) : FR(f.p, f.q));
  const opText = (o) => 'R' + SUB[o.target] + ' ← R' + SUB[o.target] + ' − ' + fr(o.factor) + '·R' + SUB[o.source];

  // the three equations, symbolic and with x = (2, 1, 6) plugged in
  const EQ = [
    ['2x₁ − 4x₂ + x₃ = 6', '2·<i>2</i> − 4·<i>1</i> + <i>6</i> = 6'],
    ['3x₁ − x₂ + x₃ = 11', '3·<i>2</i> − <i>1</i> + <i>6</i> = 11'],
    ['x₁ + x₂ − x₃ = −3', '<i>2</i> + <i>1</i> − <i>6</i> = −3'],
  ];
  // back substitution, written the way the slide reads it
  const CALC = {
    2: 'x₃ = (' + fr(GA.F(-36, 5)) + ') ÷ (' + fr(GA.F(-6, 5)) + ') =',
    1: 'x₂ = (2 + ' + FR(1, 2) + '·<i>6</i>) ÷ 5 =',
    0: 'x₁ = (6 − <i>6</i> + 4·<i>1</i>) ÷ 2 =',
  };
  const REAL_GAUSS = [
    { icon: 'chip', who: 'TOP500 supercomputers', en: 'Ranked by how fast they run Gaussian elimination: the HPL (LINPACK) benchmark, LU with partial pivoting.', tr: 'Gauss eliminasyonunu ne kadar hızlı yaptıklarına göre sıralanır: HPL (LINPACK) testi, kısmi pivotlamalı LU.' },
    { icon: 'code', who: 'NumPy · MATLAB', en: '<code>numpy.linalg.solve(A, b)</code> and MATLAB’s <code>A\\b</code> run LAPACK’s LU, i.e. Gaussian elimination.', tr: '<code>numpy.linalg.solve(A, b)</code> ve MATLAB’in <code>A\\b</code> komutu LAPACK’in LU’sunu, yani Gauss eliminasyonunu çalıştırır.' },
    { icon: 'bolt', who: 'Engineering software', en: 'Circuit simulators (SPICE) and finite-element analysis of bridges and buildings solve huge linear systems this way.', tr: 'Devre simülatörleri (SPICE) ve köprü/bina sonlu eleman analizleri dev doğrusal sistemleri böyle çözer.' },
  ];

  function gaussSay(n) {
    const o = OPS[n - 1];
    switch (n) {
      case 0: return L('Write the system as an <b>augmented matrix</b> [A | b].', 'Sistemi <b>genişletilmiş matris</b> [A | b] olarak yaz.');
      case 1: return L('Pivot ' + K(2, 'cmp') + ': row 2 − ' + fr(o.factor) + ' × row 1 puts a ' + K(0, 'ok') + ' under it',
        'Pivot ' + K(2, 'cmp') + ': satır 2 − ' + fr(o.factor) + ' × satır 1, altına ' + K(0, 'ok') + ' koyar');
      case 2: return L('Same pivot: row 3 − ' + fr(o.factor) + ' × row 1', 'Aynı pivot: satır 3 − ' + fr(o.factor) + ' × satır 1');
      case 3: return L('Pivot ' + K(5, 'cmp') + ': row 3 − ' + fr(o.factor) + ' × row 2 → <b>upper-triangular</b>',
        'Pivot ' + K(5, 'cmp') + ': satır 3 − ' + fr(o.factor) + ' × satır 2 → <b>üst üçgen</b>');
      case 4: return L('<b>Back substitution</b>: solve from the bottom row up', '<b>Geri yerine koyma</b> (back substitution): en alttan yukarı çöz');
      default: return L('Check: x = (2, 1, 6) satisfies all three equations', 'Kontrol: x = (2, 1, 6) üç denklemi de sağlıyor');
    }
  }

  Deck.add({
    id: 'gauss', act: 'simplify', steps: 6,
    title: { en: 'Gaussian elimination: make it triangular', tr: 'Gauss eliminasyonu: üçgen hâline getir' },
    html: `
      <div class="panel ticks ga-sys" data-in="left">
        <div class="ga-h">${L('3 equations · 3 unknowns', '3 denklem · 3 bilinmeyen')}</div>
        <div class="ga-eqs"></div>
      </div>
      <div class="panel ga-log" data-in="left" style="--d:150ms">
        <div class="ga-h">${L('row operations', 'satır işlemleri')}</div>
        ${OPS.map((o, k) => `<div class="ga-li" data-step="${k + 1}" data-anim="left"><span class="ga-ln">${k + 1}</span><span class="mono">${opText(o)}</span></div>`).join('')}
        <div class="ga-cost" data-step="3" style="--d:1600ms"><span class="badge-o">Θ(n³)</span>${L('elimination', 'eliminasyon')}</div>
        <div class="ga-cost" data-step="4" style="--d:300ms"><span class="badge-o">Θ(n²)</span>${L('back substitution', 'geri yerine koyma')}</div>
      </div>
      <div class="ga-mxhost"></div>
      <div class="ga-xeq" data-in="fade">x =</div>
      <div class="ga-calc"></div>
      <div class="ga-res"><span class="mx-v"></span></div>
      <div class="ga-cap caption"></div>
      ${Viz.real(REAL_GAUSS, { layout: 'row', cls: 'ga-real', attrs: ' data-step="6" data-anim="up"' })}`,
    init(ctx) {
      const d = ctx.data;
      const host = ctx.$('.ga-mxhost');
      d.mv = new MatrixView(host, Object.assign({
        rows: SYS.map((r) => r.map((v) => GA.F(v))),
        aug: 3, augGap: 36,
        rowLabels: ['R₁', 'R₂', 'R₃'],
        colLabels: ['x₁', 'x₂', 'x₃', 'b'],
      }, MXO));
      const mv = d.mv;
      // solution slots above the variable columns
      d.slots = [0, 1, 2].map((c) => {
        const s = U.h('div', { class: 'ga-slot', style: { left: (mv.cellX(c) + (MXO.cw - 104) / 2) + 'px', top: '0px' } },
          U.h('span', { class: 'mx-v', html: '?' }));
        host.appendChild(s);
        return s;
      });
      // operation labels to the right of the target row
      d.opl = OPS.map((o) => {
        const e = U.h('div', { class: 'ga-op', style: { left: (mv.cellX(3) + MXO.cw + 44) + 'px', top: mv.rowY(o.target) + 'px', height: MXO.ch + 'px' } });
        e.innerHTML = '<div class="ga-op1">− ' + fr(o.factor) + ' × R' + SUB[o.source] + '</div>'
          + '<div class="ga-op2">' + fr(o.factor) + ' = ' + U.num(o.before[o.col].p) + ' ÷ ' + U.num(mv.value(o.source, o.col).p) + '</div>';
        Anim.set(e, { opacity: 0 });
        host.appendChild(e);
        return e;
      });
      // the triangle that is left after elimination
      d.stairFill = U.s('path', { class: 'ga-stair-fill', d: mv.stairPath(3) });
      Anim.set(d.stairFill, { opacity: 0 });
      d.stair = Viz.hiddenPath({ class: 'ga-stair', d: mv.stairPath(3) });
      mv.svg.append(d.stairFill, d.stair);
      d.upper = U.h('div', { class: 'ga-upper', style: { left: (mv.cellX(3) + MXO.cw + 44) + 'px', top: (mv.rowY(1) + 18) + 'px' } });
      d.upper.innerHTML = L('upper-<br>triangular', 'üst<br>üçgen');
      Anim.set(d.upper, { opacity: 0 });
      host.appendChild(d.upper);
      // equations (symbolic now, plugged-in at the end)
      const eqs = ctx.$('.ga-eqs');
      d.eqs = EQ.map((q) => {
        const row = U.h('div', { class: 'ga-eq' });
        const txt = U.h('div', { class: 'ga-eqt' }, U.h('span', { class: 'mx-v', html: q[0] }));
        const tick = U.h('span', { class: 'ga-tick', html: CHECK });
        Anim.set(tick, { opacity: 0, scale: 0.4 });
        row.append(txt, tick);
        eqs.appendChild(row);
        return { txt, tick };
      });
      d.calc = new Viz.Caption(ctx.$('.ga-calc'));
      d.res = ctx.$('.ga-res');
      Anim.set(d.res, { opacity: 0 });
      d.cap = new Viz.Caption(ctx.$('.ga-cap'));
      d.cap.el.innerHTML = gaussSay(0);
      d.cap.html = d.cap.el.innerHTML;
    },
    async step(n, ctx) {
      const d = ctx.data, mv = d.mv;
      const say = d.cap.set(gaussSay(n));
      if (n >= 1 && n <= 3) {
        if (n > 1) await Anim.to(d.opl[n - 2], { opacity: 0 }, { dur: 200 });
        await rowOp(d, OPS[n - 1], d.opl[n - 1]);
        if (n === 3) {
          await Promise.all([
            Anim.to(d.opl[2], { opacity: 0 }, { dur: 250 }),
            Viz.draw(d.stair, { dur: 650 }),
            Anim.to(d.stairFill, { opacity: 1 }, { dur: 450, delay: 200 }),
            Anim.to(d.upper, { opacity: 1 }, { dur: 300, delay: 350 }),
          ]);
        }
      } else if (n === 4) {
        for (const e of BACK.events) await solveOne(d, e);
        mv.clear();
        d.slots.forEach((s) => s.classList.remove('used'));
      } else if (n === 5) {
        await Promise.all([d.calc.set(''), Anim.to(d.res, { opacity: 0 }, { dur: 250 })]);
        d.slots.forEach((s) => s.classList.add('ok'));
        await Promise.all(d.eqs.map((q, k) => Promise.all([
          Anim.wait(240 * k).then(() => MatrixView.flipEl(q.txt, EQ[k][1], { dur: 420 })),
          Anim.to(q.tick, { opacity: 1, scale: 1 }, { dur: 360, delay: 240 * k + 380, ease: 'outBack' }),
        ])));
      }
      await say;
    },
  });

  /* One row operation: target ← target − factor · source, shown with a
   * ghost copy of the source row that is scaled and slid onto the target. */
  async function rowOp(d, o, label) {
    const mv = d.mv;
    const c0 = o.col;
    mv.markRow(o.source, 'src');
    mv.mark(o.source, c0, 'pivot');
    mv.markRow(o.target, 'dst');
    await Anim.to(label, { opacity: 1 }, { dur: 250 });
    const g = mv.ghost(o.source, { tag: '' });
    Anim.set(g.el, { opacity: 0 });
    await Anim.to(g.el, { opacity: 1 }, { dur: 150 });
    await Anim.to(g.el, { y: STAGE_Y - mv.rowY(o.source) }, { dur: 460 });
    // scale the copy by the factor
    const scaled = mv.vals[o.source].map((v) => v.mul(o.factor));
    await Promise.all([g.setTag('×' + fr(o.factor), { dur: 280 })].concat(
      scaled.map((v, c) => g.flip(c, v, { dur: 340, delay: 50 * c }))));
    await Anim.wait(150);
    // slide it onto the target row and subtract
    Anim.to(g.tag, { opacity: 0 }, { dur: 200 });
    await Anim.to(g.el, { y: mv.rowY(o.target) - mv.rowY(o.source) }, { dur: 460 });
    const jobs = [Anim.to(g.el, { opacity: 0 }, { dur: 340, delay: 160 })];
    o.row.forEach((v, c) => {
      const was = mv.value(o.target, c);
      if (v.isZero() && !was.isZero()) {
        jobs.push(mv.poof(o.target, c, v, { dur: 600, delay: 50 * c }));
      } else if (!v.eq(was)) {
        jobs.push(mv.flip(o.target, c, v, { dur: 380, delay: 50 * c }));
      }
    });
    await Promise.all(jobs);
    g.remove();
    o.row.forEach((v, c) => { if (v.isZero()) mv.mark(o.target, c, 'zero'); });
    mv.clear();
  }

  /* Back substitution for one unknown: show the arithmetic, then the value
   * flies up into its slot above the column. */
  async function solveOne(d, e) {
    const mv = d.mv;
    mv.clear();
    d.slots.forEach((s) => s.classList.remove('used'));
    mv.markRow(e.row, 'hit');
    mv.mark(e.row, e.col, 'pivot');
    e.terms.forEach((t) => { mv.mark(e.row, t.col, 'src'); d.slots[t.col].classList.add('used'); });
    const v = U.num(e.value.p);
    d.res.firstChild.textContent = v;
    Anim.set(d.res, { x: 0, y: 0, opacity: 0, scale: 0.5 });
    await d.calc.set(CALC[e.row]);
    await Anim.to(d.res, { opacity: 1, scale: 1 }, { dur: 200, ease: 'outBack' });
    await Anim.wait(80);
    const slot = d.slots[e.col];
    if (!Anim.isInstant()) {
      const fly = d.res.cloneNode(true);
      fly.classList.add('ga-fly');
      d.res.parentNode.appendChild(fly);
      Anim.set(fly, { x: 0, y: 0 });
      // slot centre minus result-chip centre (both from the layout model)
      const sx = mv.cellX(e.col) + MXO.cw / 2, sy = 32;
      await Anim.to(fly, { x: sx - GA_RES.cx, y: sy - GA_RES.cy, scale: 0.92 }, { dur: 500, arc: 70 });
      fly.remove();
    }
    slot.firstChild.textContent = v;
    slot.classList.add('filled');
  }
})();
