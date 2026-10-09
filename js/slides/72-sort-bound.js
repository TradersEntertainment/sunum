/* Appendix (Q&A backup): how fast can we sort, and when is presorting
 * worth it for searching? Charts are drawn to real (linear) scale. */
(function () {
  'use strict';

  const log2fact = (n) => { let s = 0; for (let k = 2; k <= n; k++) s += Math.log2(k); return s; };

  /* A small linear chart: data → px inside a plot box. */
  function plot(svg, o) {
    const X = (v) => o.x0 + ((v - o.xmin) / (o.xmax - o.xmin)) * (o.x1 - o.x0);
    const Y = (v) => o.y0 - ((v - o.ymin) / (o.ymax - o.ymin)) * (o.y0 - o.y1);
    const g = U.s('g', { class: 'sb-axes' });
    g.appendChild(U.s('path', { class: 'sb-axis', d: 'M' + o.x0 + ',' + o.y1 + ' V' + o.y0 + ' H' + o.x1 }));
    o.xt.forEach((t) => {
      g.appendChild(U.s('line', { class: 'sb-grid', x1: X(t.v), y1: o.y0, x2: X(t.v), y2: o.y1 }));
      g.appendChild(U.s('text', { class: 'sb-tick', x: X(t.v), y: o.y0 + 28, 'text-anchor': 'middle' }, t.s));
    });
    o.yt.forEach((t) => {
      g.appendChild(U.s('line', { class: 'sb-grid', x1: o.x0, y1: Y(t.v), x2: o.x1, y2: Y(t.v) }));
      g.appendChild(U.s('text', { class: 'sb-tick', x: o.x0 - 10, y: Y(t.v) + 7, 'text-anchor': 'end' }, t.s));
    });
    svg.appendChild(g);
    return { X, Y };
  }

  const pathOf = (pts) => 'M' + pts.map((p) => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' L');

  Deck.add({
    id: 'sort-bound', act: 'appendix', steps: 2,
    title: { en: 'How fast can we sort?', tr: 'Ne kadar hızlı sıralayabiliriz?' },
    html: `
      <div class="panel ticks sb-claim" data-in="left">
        <div class="sb-h">${L('lower bound for comparison sorts', 'karşılaştırmalı sıralama için alt sınır')}</div>
        <p class="sb-p">${L('Any sort that only <b>compares</b> keys needs, in the worst case, at least',
          'Anahtarları sadece <b>karşılaştıran</b> her sıralama, en kötü durumda en az')}</p>
        <div class="sb-f"><span>⌈log₂ n!⌉</span><span class="sb-op">≈</span><span class="sb-nl">n log₂ n</span><span class="sb-unit">${L('comparisons', 'karşılaştırma')}</span></div>
        <p class="sb-p2"><span class="badge-o ok">${L('mergesort ≈ n log₂ n', 'mergesort ≈ n log₂ n')}</span>${L('reaches it: <b>optimal</b>', 'buna ulaşır: <b>en iyisi</b>')}</p>
      </div>
      <div class="panel sb-tree" data-in="right" style="--d:150ms">
        <div class="sb-h">${L('why? a yes/no tree must have n! leaves', 'neden? evet/hayır ağacında n! yaprak olmalı')}</div>
        <div class="sb-tsvg"></div>
        <p class="sb-tn">${L('3 keys → 3! = 6 orders → ≥ ⌈log₂ 6⌉ = 3 questions', '3 anahtar → 3! = 6 sıra → en az ⌈log₂ 6⌉ = 3 soru')}</p>
      </div>
      <div class="panel ticks sb-chart sb-c1" data-step="1" data-anim="fade">
        <div class="sb-ct">${L('comparisons for n keys', 'n anahtar için karşılaştırma')} <span class="muted">${L('(real scale)', '(gerçek ölçek)')}</span></div>
        <div class="sb-svg"></div>
      </div>
      <div class="panel ticks sb-chart sb-c2" data-step="2" data-anim="fade">
        <div class="sb-ct">${L('search k times in n = 10⁶ keys', 'n = 10⁶ anahtarda k kez arama')}</div>
        <div class="sb-svg"></div>
      </div>`,
    init(ctx) {
      const d = ctx.data;
      // ---- decision tree for 3 keys a, b, c ----
      const tsvg = Viz.svg(ctx.$('.sb-tsvg'), 610, 170, 'sb-dt');
      const N = {
        r: [305, 18, 'a<b?'], L: [150, 62, 'b<c?'], R: [460, 62, 'a<c?'],
        LL: [70, 106, 'abc', 1], LR: [230, 106, 'a<c?'], RL: [380, 106, 'bac', 1], RR: [540, 106, 'b<c?'],
        LRL: [185, 150, 'acb', 1], LRR: [275, 150, 'cab', 1], RRL: [495, 150, 'bca', 1], RRR: [585, 150, 'cba', 1],
      };
      const E = [['r', 'L', 1], ['r', 'R', 0], ['L', 'LL', 1], ['L', 'LR', 0], ['R', 'RL', 1], ['R', 'RR', 0],
        ['LR', 'LRL', 1], ['LR', 'LRR', 0], ['RR', 'RRL', 1], ['RR', 'RRR', 0]];
      E.forEach(([a, b, yes]) => tsvg.appendChild(U.s('line', { class: 'sb-te' + (yes ? ' yes' : ' no'), x1: N[a][0], y1: N[a][1], x2: N[b][0], y2: N[b][1] })));
      Object.values(N).forEach(([x, y, t, leaf]) => {
        const g = U.s('g', { class: leaf ? 'sb-leaf' : 'sb-q', transform: 'translate(' + x + ',' + y + ')' });
        const w = leaf ? 60 : 78;
        g.append(U.s('rect', { x: -w / 2, y: -16, width: w, height: 32, rx: leaf ? 8 : 16 }), U.s('text', { y: 1 }, t));
        tsvg.appendChild(g);
      });
      // ---- chart 1: n, lower bound, n log n, n² ----
      const s1 = Viz.svg(ctx.$('.sb-c1 .sb-svg'), 772, 404, 'sb-plot');
      const P1 = plot(s1, {
        x0: 76, x1: 560, y0: 346, y1: 18, xmin: 0, xmax: 100, ymin: 0, ymax: 800,
        xt: [0, 25, 50, 75, 100].map((v) => ({ v, s: String(v) })),
        yt: [0, 200, 400, 600, 800].map((v) => ({ v, s: String(v) })),
      });
      s1.appendChild(U.s('text', { class: 'sb-axl', x: 594, y: 374 }, 'n →'));
      const ns = U.range(100, 1);
      const pts = (f) => [[P1.X(0), P1.Y(0)]].concat(ns.map((n) => [P1.X(n), P1.Y(f(n))]));
      const lb = (n) => Math.ceil(log2fact(n));
      d.zone = U.s('path', { class: 'sb-zone', d: pathOf(pts(lb)) + ' L' + P1.X(100) + ',' + P1.Y(0) + ' Z' });
      Anim.set(d.zone, { opacity: 0 });
      s1.appendChild(d.zone);
      const sq = [[P1.X(0), P1.Y(0)]];
      for (let n = 1; n * n <= 800; n += 0.5) sq.push([P1.X(n), P1.Y(n * n)]);
      sq.push([P1.X(Math.sqrt(800)), P1.Y(800)]);
      d.c1 = [
        { p: Viz.hiddenPath({ class: 'sb-cv n', d: pathOf(pts((n) => n)) }), en: ['n', 'impossible'], tr: ['n', 'imkânsız'], at: [P1.X(100), P1.Y(100)], cls: 'n' },
        { p: Viz.hiddenPath({ class: 'sb-cv sq', d: pathOf(sq), 'marker-end': 'url(#arrow-bad)' }), en: ['n²', 'insertion sort'], tr: ['n²', 'eklemeli sıralama'], at: [P1.X(Math.sqrt(800)) + 6, P1.Y(800) + 22], cls: 'sq' },
        { p: Viz.hiddenPath({ class: 'sb-cv nl', d: pathOf(pts((n) => n * Math.log2(n))) }), en: ['n log₂ n', 'mergesort'], tr: ['n log₂ n', 'mergesort'], at: [P1.X(100), P1.Y(100 * Math.log2(100))], cls: 'nl' },
        { p: Viz.hiddenPath({ class: 'sb-cv lb', d: pathOf(pts(lb)) }), en: ['⌈log₂ n!⌉', 'lower bound'], tr: ['⌈log₂ n!⌉', 'alt sınır'], at: [P1.X(100), P1.Y(lb(100))], cls: 'lb' },
      ];
      d.c1.forEach((c) => {
        s1.appendChild(c.p);
        const g = U.s('g', { class: 'sb-lbl ' + c.cls });
        Viz.text(g, c.at[0] + 12, c.at[1] - 2, c.en[0], c.tr[0], { class: 'sb-l1' });
        Viz.text(g, c.at[0] + 12, c.at[1] + 22, c.en[1], c.tr[1], { class: 'sb-l2' });
        Anim.set(g, { opacity: 0 });
        s1.appendChild(g);
        c.g = g;
      });
      // ---- chart 2: k searches, with and without presorting ----
      const s2 = Viz.svg(ctx.$('.sb-c2 .sb-svg'), 772, 404, 'sb-plot');
      const n = 1e6, lg = Math.log2(n);
      const P2 = plot(s2, {
        x0: 96, x1: 580, y0: 346, y1: 18, xmin: 0, xmax: 40, ymin: 0, ymax: 4e7,
        xt: [0, 10, 20, 30, 40].map((v) => ({ v, s: String(v) })),
        yt: [{ v: 0, s: '0' }, { v: 1e7, s: '10⁷' }, { v: 2e7, s: '2·10⁷' }, { v: 3e7, s: '3·10⁷' }, { v: 4e7, s: '4·10⁷' }],
      });
      Viz.text(s2, (96 + 580) / 2, 402, 'k = number of searches →', 'k = arama sayısı →', { class: 'sb-axl', 'text-anchor': 'middle' });
      const kx = (n * lg) / (n - lg);                       // break-even ≈ 19.9
      d.win = U.s('path', { class: 'sb-win', d: 'M' + P2.X(kx) + ',' + P2.Y(0) + ' V' + P2.Y(4e7) + ' H' + P2.X(40) + ' V' + P2.Y(0) + ' Z' });
      Anim.set(d.win, { opacity: 0 });
      s2.appendChild(d.win);
      d.lineA = Viz.hiddenPath({ class: 'sb-cv sq', d: 'M' + P2.X(0) + ',' + P2.Y(0) + ' L' + P2.X(40) + ',' + P2.Y(40 * n) });
      d.lineB = Viz.hiddenPath({ class: 'sb-cv nl', d: 'M' + P2.X(0) + ',' + P2.Y(n * lg) + ' L' + P2.X(40) + ',' + P2.Y(n * lg + 40 * lg) });
      s2.append(d.lineA, d.lineB);
      const la = U.s('g', { class: 'sb-lbl sq' });
      Viz.text(la, P2.X(40) + 10, P2.Y(4e7) + 14, 'search each time', 'her seferinde ara', { class: 'sb-l2' });
      Viz.text(la, P2.X(40) + 10, P2.Y(4e7) + 40, 'k · n', 'k · n', { class: 'sb-l1' });
      const lb2 = U.s('g', { class: 'sb-lbl nl' });
      Viz.text(lb2, P2.X(40) + 10, P2.Y(2e7) - 4, 'sort once', 'bir kez sırala', { class: 'sb-l2' });
      Viz.text(lb2, P2.X(40) + 10, P2.Y(2e7) + 22, 'n log n', 'n log n', { class: 'sb-l1' });
      Viz.text(lb2, P2.X(40) + 10, P2.Y(2e7) + 46, '+ k log n', '+ k log n', { class: 'sb-l1' });
      d.dot = U.s('g', { class: 'sb-dot' });
      d.dot.appendChild(U.s('circle', { cx: P2.X(kx), cy: P2.Y(n * kx), r: 9 }));
      Viz.text(d.dot, P2.X(kx) + 20, P2.Y(n * kx) + 40, 'k ≈ log₂ n ≈ 20', 'k ≈ log₂ n ≈ 20', { class: 'sb-dl' });
      Viz.text(d.dot, P2.X(kx) + 20, P2.Y(n * kx) + 64, 'break-even', 'başa baş noktası', { class: 'sb-dl2' });
      Viz.text(d.dot, (P2.X(kx) + P2.X(40)) / 2 + 30, P2.Y(0) - 18, 'presort wins ✓', 'ön sıralama kazanır ✓', { class: 'sb-wl', 'text-anchor': 'middle' });
      d.book = U.s('g', { class: 'sb-book' });
      d.book.innerHTML = '<path d="M0,6 C10,0 22,0 30,6 C38,0 50,0 60,6 V44 C50,38 38,38 30,44 C22,38 10,38 0,44 Z M30,6 V44"/>';
      Viz.text(d.book, 74, 20, 'phonebook / dictionary:', 'telefon rehberi / sözlük:', { class: 'sb-bt' });
      Viz.text(d.book, 74, 46, 'sort once, search many times', 'bir kez sırala, çok kez ara', { class: 'sb-bt b' });
      d.l2 = [la, lb2, d.dot, d.book];
      d.l2.forEach((e) => { Anim.set(e, { opacity: 0 }); s2.appendChild(e); });
      Anim.set(d.book, { x: P2.X(0) + 24, y: P2.Y(4e7) + 16 });   // (an inline transform beats the SVG attribute)
    },
    async step(n, ctx) {
      const d = ctx.data;
      if (n === 1) {
        for (const c of d.c1) {
          await Viz.draw(c.p, { dur: c.cls === 'lb' ? 520 : 440 });
          await Promise.all([Anim.to(c.g, { opacity: 1 }, { dur: 200 })].concat(c.cls === 'lb' ? [Anim.to(d.zone, { opacity: 1 }, { dur: 450 })] : []));
        }
      } else if (n === 2) {
        await Viz.draw(d.lineA, { dur: 700 });
        await Anim.to(d.l2[0], { opacity: 1 }, { dur: 220 });
        await Viz.draw(d.lineB, { dur: 600 });
        await Anim.to(d.l2[1], { opacity: 1 }, { dur: 220 });
        await Promise.all([Anim.to(d.l2[2], { opacity: 1 }, { dur: 300 }), Anim.to(d.win, { opacity: 1 }, { dur: 500 })]);
        await Anim.to(d.l2[3], { opacity: 1 }, { dur: 300 });
      }
    },
  });
})();
