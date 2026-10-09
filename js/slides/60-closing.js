/* Closing: the three transform-and-conquer strategies, then thanks. */
(function () {
  'use strict';

  const { fadeTo, stageXY } = window.RepKit;
  const STAR = '<svg class="su-star" viewBox="-12 -12 24 24" width="24" height="24" aria-hidden="true"><path d="M0,-11 L3.2,-3.6 L11,-3.4 L4.9,1.6 L6.8,9.4 L0,5 L-6.8,9.4 L-4.9,1.6 L-11,-3.4 L-3.2,-3.6 Z" style="fill:var(--star)"/></svg>';

  /* ======================================================================
   * Summary: three buckets
   * ==================================================================== */
  const BUCKETS = [
    { c: 'var(--simplify)', en: 'Instance simplification', tr: 'Örneği basitleştirme',
      icon: '<svg viewBox="0 0 40 40" width="42" height="42" aria-hidden="true"><path d="M6,34 V26 M14,34 V20 M22,34 V14 M30,34 V8" style="stroke:var(--simplify);stroke-width:5;stroke-linecap:round"/></svg>' },
    { c: 'var(--represent)', en: 'Representation change', tr: 'Gösterimi değiştirme',
      icon: '<svg viewBox="0 0 40 40" width="42" height="42" aria-hidden="true"><path d="M10,10 L5,20 M10,10 L15,20" style="stroke:var(--represent);stroke-width:2.5"/><circle cx="10" cy="9" r="4" style="fill:var(--represent)"/><circle cx="5" cy="21" r="3.5" style="fill:var(--represent)"/><circle cx="15" cy="21" r="3.5" style="fill:var(--represent)"/><path d="M19,15 H25 M23,12 L26,15 L23,18" style="fill:none;stroke:var(--ink-2);stroke-width:2"/><rect x="27" y="6" width="9" height="9" rx="2" style="fill:none;stroke:var(--represent);stroke-width:2.5"/><rect x="27" y="17" width="9" height="9" rx="2" style="fill:none;stroke:var(--represent);stroke-width:2.5"/><rect x="27" y="28" width="9" height="9" rx="2" style="fill:none;stroke:var(--represent);stroke-width:2.5"/></svg>' },
    { c: 'var(--reduce)', en: 'Problem reduction', tr: 'Probleme indirgeme',
      icon: '<svg viewBox="0 0 40 40" width="42" height="42" aria-hidden="true"><rect x="4" y="4" width="14" height="12" rx="3" style="fill:none;stroke:var(--reduce);stroke-width:3"/><path d="M11,17 V27 H22" style="fill:none;stroke:var(--reduce);stroke-width:3"/><path d="M20,23 L25,27 L20,31" style="fill:none;stroke:var(--reduce);stroke-width:3"/><rect x="25" y="21" width="12" height="12" rx="3" style="fill:color-mix(in srgb, var(--ok) 25%, transparent);stroke:var(--ok);stroke-width:3"/></svg>' },
  ];
  const CHIPS = [
    { b: 0, en: 'Presorting', tr: 'Ön sıralama', o: 'Θ(n log n)', use: ['sort | uniq, databases', 'sort | uniq, veritabanları'] },
    { b: 0, en: 'Gaussian elimination', tr: 'Gauss eliminasyonu', o: 'Θ(n³)', use: ['TOP500, NumPy', 'TOP500, NumPy'] },
    { b: 0, en: 'AVL trees', tr: 'AVL ağaçları', o: 'Θ(log n)', use: ['Linux scheduler (red-black)', 'Linux zamanlayıcısı (red-black)'] },
    { b: 1, en: '2-3 trees', tr: '2-3 ağaçları', o: 'Θ(log n)', use: ['database indexes (B-trees)', 'veritabanı indeksleri (B-ağaçları)'] },
    { b: 1, en: 'Heaps &amp; heapsort', tr: 'Heap ve heapsort', o: 'Θ(n log n)', star: true, use: ['Linux sort(), Node.js timers', 'Linux sort(), Node.js zamanlayıcıları'] },
    { b: 1, en: 'Horner’s rule', tr: 'Horner kuralı', o: ['n mult.', 'n çarpma'], use: ['hashCode, parseInt', 'hashCode, parseInt'] },
    { b: 1, en: 'Binary exponentiation', tr: 'İkili üs alma', o: 'Θ(log n)', use: ['HTTPS (RSA)', 'HTTPS (RSA)'] },
    { b: 2, en: 'lcm via gcd', tr: 'gcd üzerinden lcm', o: 'm·n / gcd', use: ['math.lcm', 'math.lcm'] },
    { b: 2, en: 'Counting paths', tr: 'Yol sayma', o: 'A<sup>k</sup>', use: ['social networks, PageRank', 'sosyal ağlar, PageRank'] },
    { b: 2, en: 'max ↔ min', tr: 'max ↔ min', o: '−min(−f)', use: ['machine learning', 'makine öğrenmesi'] },
    { b: 2, en: 'Linear programming', tr: 'Doğrusal programlama', o: 'LP', use: ['airlines', 'havayolları'] },
  ];
  const BX = (b) => b * 580;
  const BTOP = 252;
  const CW = 470, CH = 86, CGAP = 9;
  const PILE_S = 0.8;
  // slot of every chip inside its bucket
  const SLOTS = (() => {
    const seen = [0, 0, 0];
    return CHIPS.map((c) => { const s = seen[c.b]++; return { left: BX(c.b) + 35, top: BTOP + 84 + s * (CH + CGAP) }; });
  })();
  // the jumbled pile (fixed shuffle)
  const PILE = (() => {
    const order = U.shuffle(CHIPS.map((_, i) => i), 7);
    const rows = [4, 4, 3];
    const w = CW * PILE_S, h = CH * PILE_S;
    const out = [];
    let q = 0;
    rows.forEach((n, r) => {
      const gap = (1700 - 4 * w) / 3;
      const x0 = (1700 - (n * w + (n - 1) * gap)) / 2;
      for (let c = 0; c < n; c++, q++) {
        const i = order[q];
        out[i] = { cx: x0 + c * (w + gap) + w / 2, cy: 2 + r * (h + 12) + h / 2, rot: [-2.5, 1.8, -1.2, 2.6, -1.8, 1.2][(q * 5) % 6] };
      }
    });
    return out;
  })();

  function chipHTML(c, i) {
    const o = Array.isArray(c.o) ? L(c.o[0], c.o[1]) : c.o;
    return '<div class="su-chip' + (c.star ? ' star' : '') + '" data-i="' + i + '" style="--c:' + BUCKETS[c.b].c + ';left:' + SLOTS[i].left + 'px;top:' + SLOTS[i].top + 'px">'
      + '<div class="su-c1"><span class="su-name">' + (c.star ? STAR : '') + L(c.en, c.tr) + '</span><span class="su-o">' + o + '</span></div>'
      + '<div class="su-use">' + Viz.ricon('globe', 17) + '<i>' + L('used in', 'kullanım') + '</i><span>' + L(c.use[0], c.use[1]) + '</span></div></div>';
  }

  Deck.add({
    id: 'summary', act: 'closing', steps: 2,
    title: { en: 'Three ways to transform, then conquer', tr: 'Dönüştürmenin üç yolu, sonra fethet' },
    html: `
      ${BUCKETS.map((b, k) => `<div class="su-bucket" style="--c:${b.c};left:${BX(k)}px;top:${BTOP}px;--d:${k * 120}ms" data-in="up">
        <div class="su-bhead">${b.icon}<span>${L(b.en, b.tr)}</span></div></div>`).join('')}
      ${CHIPS.map(chipHTML).join('')}
      <div class="su-tag" data-step="2" data-anim="zoom">
        <div class="su-tag-t">${L('Change the problem, then conquer it.', 'Problemi değiştir, sonra fethet.')}</div>
        <div class="su-rule"><i style="--c:var(--simplify)"></i><i style="--c:var(--represent)"></i><i style="--c:var(--reduce)"></i></div>
      </div>`,
    init(ctx) {
      const d = ctx.data;
      d.chips = ctx.$$('.su-chip');
      d.chips.forEach((el, i) => {
        const s = SLOTS[i], p = PILE[i];
        Anim.set(el, { x: p.cx - (s.left + CW / 2), y: p.cy - (s.top + CH / 2), scale: PILE_S, rot: p.rot });
      });
      d.buckets = ctx.$$('.su-bucket');
    },
    async step(n, ctx) {
      const d = ctx.data;
      if (n === 1) {
        // every chip flies into its bucket, bucket by bucket
        const order = CHIPS.map((c, i) => i).sort((a, b) => CHIPS[a].b - CHIPS[b].b || a - b);
        await Promise.all(order.map((i, k) => Anim.to(d.chips[i], { x: 0, y: 0, scale: 1, rot: 0 },
          { dur: 720, delay: k * 150 + CHIPS[i].b * 90, arc: (k % 2 ? 1 : -1) * 50 }).then(() => {
          if (!Anim.isInstant()) {
            const s = SLOTS[i];
            const p = stageXY(ctx, s.left + CW / 2, s.top + CH / 2);
            FX.ripple(p.x, p.y, CHIPS[i].star ? '--star' : '--line', { r0: 30, r1: 120, life: 600 });
          }
        })));
      } else if (n === 2) {
        // the main topic gets one last bow
        const i = CHIPS.findIndex((c) => c.star);
        const el = d.chips[i];
        await Anim.wait(500);
        await Anim.to(el, { scale: 1.07 }, { dur: 300, ease: 'out' });
        if (!Anim.isInstant()) {
          const s = SLOTS[i];
          const p = stageXY(ctx, s.left + CW / 2, s.top + CH / 2);
          FX.burst(p.x, p.y, { count: 50, spread: Math.PI * 0.9, colors: ['--star', '--represent', '--ok'] });
        }
        await Anim.to(el, { scale: 1 }, { dur: 420, ease: 'outBack' });
      }
    },
  });

  /* ======================================================================
   * Thank you
   * ==================================================================== */
  const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const FINALE = [9, 6, 8, 2, 5, 7];            // the deck's list 2 9 7 6 5 8, heapified

  Deck.add({
    id: 'thanks', act: 'closing', bare: true, steps: 0, transition: 'zoom',
    title: { en: 'Thank you! Questions?', tr: 'Teşekkürler! Sorular?' },
    html: () => {
      const C = window.CONFIG || {};
      return `
      <div class="ty-kicker" data-in="left">${esc(C.course || '')}${C.course ? ' · ' : ''}${L('Transform &amp; Conquer', 'Dönüştür ve Fethet')}</div>
      <h1 class="ty-title" data-in="up" style="--d:120ms">${L('Thank you!', 'Teşekkürler!')}</h1>
      <div class="ty-q" data-in="up" style="--d:340ms">${L('Questions?', 'Sorular?')}</div>
      ${C.presenter ? `<div class="ty-who" data-in="fade" style="--d:600ms">${esc(C.presenter)}</div>` : ''}
      <div class="ty-next" data-in="up" style="--d:900ms"><b>${L('Appendix', 'Ek')} →</b> ${L('interactive heapsort playground · extra slides', 'etkileşimli heapsort oyun alanı · ek slaytlar')}</div>
      <div class="ty-src" data-in="fade" style="--d:1100ms">${esc(C.source || '')}</div>
      <div class="ty-scene"></div>`;
    },
    init(ctx) {
      const d = ctx.data;
      d.scene = new HeapScene(ctx.$('.ty-scene'), {
        width: 760, height: 560, values: FINALE,
        tree: { x: 20, y: 110, w: 720, gap: 160, r: 50 },
      });
      const sc = d.scene;
      const root = sc.slotXY(1);
      d.crown = U.s('path', { class: 'crown', d: Viz.ICONS.crown });
      d.crownY = root.y - sc.R - 26;
      Anim.set(d.crown, { x: root.x, y: d.crownY, scale: 1.1 });
      sc.gOver.appendChild(d.crown);
      sc.mark(1, 'max');
      [d.crown].concat(Object.values(sc.items).map((it) => it.node), Object.values(sc.edges)).forEach((el) => el.setAttribute('data-ambient', ''));
    },
    enter(ctx) {
      const d = ctx.data, sc = d.scene;
      const ids = sc.pos.slice(1);
      const edges = Object.keys(sc.edges).map(Number);
      let first = true;
      ctx.loop(async (A) => {
        if (first) {
          first = false;
          // the keys fall into place, level by level, and the heap draws itself
          ids.forEach((id, i) => {
            const p = sc.slotXY(i + 1);
            Anim.set(sc.items[id].node, { x: p.x, y: p.y - 460, opacity: 0 });
          });
          edges.forEach((p) => Anim.set(sc.edges[p], { opacity: 0 }));
          Anim.set(d.crown, { opacity: 0, scale: 0.3 });
          await A.wait(450);
          await Promise.all(ids.map((id, i) => A.wait(190 * i).then(async () => {
            const p = sc.slotXY(i + 1);
            await A.to(sc.items[id].node, { y: p.y, opacity: 1 }, { dur: 700, ease: 'outBack' });
            if (i > 0) await A.to(sc.edges[i + 1], { opacity: 0.55 }, { dur: 320 });
          })));
          await A.to(d.crown, { opacity: 1, scale: 1.1 }, { dur: 520, ease: 'outBack' });
          if (A.alive && !Anim.isInstant()) {
            const r = sc.slotXY(1);
            const p = sc.toStage(r.x, r.y - 80);
            FX.burst(p.x, p.y, { count: 70, spread: Math.PI * 0.9 });
          }
          await A.wait(600);
        }
        // idle: the crown floats gently
        await A.to(d.crown, { y: d.crownY - 9 }, { dur: 1700, ease: 'inOutSine' });
        await A.to(d.crown, { y: d.crownY }, { dur: 1700, ease: 'inOutSine' });
      });
    },
  });
})();
