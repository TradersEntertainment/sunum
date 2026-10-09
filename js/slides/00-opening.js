/* Opening: the title slide and the big idea of the chapter
 * (problem → transform → easier problem → conquer → solution, and the three
 * flavours of transform-and-conquer). */
(function () {
  'use strict';

  const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const clamp01 = (v) => Math.max(0, Math.min(1, v));
  const lerp = (a, b, p) => a + (b - a) * p;

  /* ======================================================================
   * 1 · Title
   * ==================================================================== */
  // Seven keys, scrambled. Sorted they are 9 12 25 41 50 63 87; laid out
  // in-order, the sorted row *is* a balanced search tree (41 at the root).
  const T_KEYS = [41, 12, 87, 25, 63, 9, 50];
  const T_SORTED = T_KEYS.slice().sort((a, b) => a - b);
  const T_DEPTH = [2, 1, 2, 0, 2, 1, 2];            // depth of sorted position p
  const T_PARENT = [1, 3, 1, null, 5, 3, 5];        // parent of sorted position p
  const T_FIND = 50;                                // search path 41 → 63 → 50
  const TG = { x0: 74, pitch: 112, base: 716, bw: 80, r: 42, levels: [196, 336, 476] };

  const tX = (p) => TG.x0 + p * TG.pitch;
  const barH = (v) => 64 + v * 3.2;

  function titleScene(host) {
    const W = 820, H = 760;
    const svg = Viz.svg(host, W, H, 'op-svg');
    const gEdges = U.s('g', { class: 'op-edges' });
    const gItems = U.s('g', {});
    const gOver = U.s('g', {});
    svg.append(U.s('line', { class: 'op-base', x1: 20, y1: TG.base + 2, x2: W - 20, y2: TG.base + 2 }), gEdges, gItems, gOver);
    const items = T_KEYS.map((v, i) => {
      const g = U.s('g', { class: 'op-it' });
      const rect = U.s('rect', { class: 'op-shape' });
      const text = U.s('text', { class: 'op-key' }, String(v));
      g.append(rect, text);
      gItems.appendChild(g);
      const it = { v, g, rect, text, home: i, sp: T_SORTED.indexOf(v), m: 0 };
      Anim.set(g, { x: tX(i) });
      return it;
    });
    const bySorted = [];
    items.forEach((it) => { bySorted[it.sp] = it; });
    const edges = [];
    T_PARENT.forEach((par, p) => {
      if (par == null) return;
      const e = U.s('line', { class: 'op-edge', x1: tX(par), y1: TG.levels[T_DEPTH[par]], x2: tX(p), y2: TG.levels[T_DEPTH[p]] });
      e.dataset.p = p;
      Anim.set(e, { opacity: 0 });
      gEdges.appendChild(e);
      edges[p] = e;
    });
    // the search key: a magnifier chip
    const probe = U.s('g', { class: 'op-probe' });
    probe.innerHTML = '<rect x="-58" y="-28" width="116" height="56" rx="28"/>'
      + '<circle cx="-26" cy="-3" r="11"/><path d="M-18,5 L-9,14"/>'
      + '<text x="16" y="1">' + T_FIND + '</text>';
    Anim.set(probe, { opacity: 0 });
    gOver.appendChild(probe);
    const stamp = U.s('g', { class: 'op-stamp' });
    stamp.innerHTML = '<circle r="26"/><path d="' + Viz.ICONS.check + '" transform="scale(0.9)"/>';
    Anim.set(stamp, { opacity: 0, scale: 0.4 });
    gOver.appendChild(stamp);
    const S = { svg, items, bySorted, edges, probe, stamp };
    items.forEach((it) => morph(it, 0));
    return S;
  }

  /* m = 0: a bar standing on the base line; m = 1: a tree node at its level. */
  function morph(it, m) {
    it.m = m;
    const h = barH(it.v);
    const cy = TG.levels[T_DEPTH[it.sp]];
    const w = lerp(TG.bw, 2 * TG.r, m);
    const top = lerp(TG.base - h, cy - TG.r, m);
    const hh = lerp(h, 2 * TG.r, m);
    it.rect.setAttribute('x', (-w / 2).toFixed(1));
    it.rect.setAttribute('width', w.toFixed(1));
    it.rect.setAttribute('y', top.toFixed(1));
    it.rect.setAttribute('height', hh.toFixed(1));
    it.rect.setAttribute('rx', lerp(12, TG.r, m).toFixed(1));
    it.text.setAttribute('y', lerp(TG.base - h + 34, cy, m).toFixed(1));
  }

  function phase(ctx, k) {
    ctx.$$('.op-pill').forEach((p, i) => p.classList.toggle('on', i === k));
  }

  Deck.add({
    id: 'title', act: 'opening', bare: true, steps: 0,
    title: { en: 'Transform & Conquer', tr: 'Dönüştür ve Fethet' },
    html() {
      const C = window.CONFIG || {};
      const ch = C.chapter || {};
      const presenter = C.presenter ? String(C.presenter).trim() : '';
      return `
      <div class="op-wrap">
        <div class="op-kicker" data-in="left">${L(esc(ch.en || ''), esc(ch.tr || ch.en || ''))}<i></i><span class="op-course-tag">${esc(C.course ? String(C.course).split('·')[0].trim() : '')}</span></div>
        <h1 class="op-title" data-in="up" style="--d:120ms"><span>Transform&nbsp;&amp;</span><em>Conquer</em></h1>
        <div class="op-sub" data-in="up" style="--d:300ms">Dönüştür ve Fethet</div>
        <div class="op-course" data-in="up" style="--d:460ms">${esc(C.course || '')}${presenter ? '<span class="op-dot"></span><b>' + esc(presenter) + '</b>' : ''}</div>
        <div class="op-source" data-in="fade" style="--d:700ms">${esc(C.source || '')}</div>
        <div class="op-scene" data-ambient data-in="fade" style="--d:200ms"></div>
        <div class="op-phases" data-ambient data-in="up" style="--d:600ms">
          <span class="op-pill">${L('messy input', 'dağınık girdi')}</span>
          <svg class="op-chev" viewBox="0 0 40 24" width="40" height="24" aria-hidden="true"><path d="M2,12 H34 M26,4 L34,12 L26,20"/></svg>
          <span class="op-pill">${L('transform', 'dönüştür')}</span>
          <svg class="op-chev" viewBox="0 0 40 24" width="40" height="24" aria-hidden="true"><path d="M2,12 H34 M26,4 L34,12 L26,20"/></svg>
          <span class="op-pill">${L('conquer', 'fethet')}</span>
        </div>
      </div>`;
    },
    init(ctx) {
      ctx.data.S = titleScene(ctx.$('.op-scene'));
    },
    enter(ctx) {
      const S = ctx.data.S;
      let first = true;
      ctx.loop(async (A) => {
        const its = S.items;
        if (first) {
          first = false;
          its.forEach((it) => Anim.set(it.g, { x: tX(it.home), y: 40, opacity: 0 }));
          await Promise.all(its.map((it, i) => A.wait(260 + 90 * i).then(() => A.to(it.g, { y: 0, opacity: 1 }, { dur: 620, ease: 'outBack' }))));
        }
        // 1 · messy input
        phase(ctx, 0);
        await A.wait(1500);
        if (!A.alive) return;
        // 2 · transform: sort (bars slide into a staircase) …
        phase(ctx, 1);
        await Promise.all(its.map((it, i) => {
          const d = it.sp - it.home;
          return A.wait(70 * i).then(() => {
            it.g.classList.add('sorted');
            return A.to(it.g, { x: tX(it.sp) }, { dur: 900, arc: d ? (d > 0 ? 1 : -1) * (40 + 12 * Math.abs(d)) : 0 });
          });
        }));
        await A.wait(700);
        if (!A.alive) return;
        // … then lift the sorted row into a search tree (x never changes)
        its.forEach((it) => it.g.classList.add('tree'));
        await A.run((p) => {
          its.forEach((it) => {
            const lag = (2 - T_DEPTH[it.sp]) * 0.12;
            morph(it, Anim.ease.inOut(clamp01((p - lag) / (1 - 0.24))));
          });
        }, { dur: 1300, ease: 'linear' });
        await Promise.all(S.edges.filter(Boolean).map((e, i) => A.wait(60 * i).then(() => A.to(e, { opacity: 1 }, { dur: 380 }))));
        await A.wait(500);
        if (!A.alive) return;
        // 3 · conquer: search 50 → 41 → 63 → 50 in three steps
        phase(ctx, 2);
        const path = [3, 5, 4];
        const above = { x: tX(3), y: TG.levels[0] - 92 };
        Anim.set(S.probe, { x: above.x, y: above.y - 30, opacity: 0 });
        await A.to(S.probe, { x: above.x, y: above.y, opacity: 1 }, { dur: 380, ease: 'out' });
        for (let k = 0; k < path.length; k++) {
          const p = path[k];
          if (k > 0) S.edges[p].classList.add('hit');
          S.bySorted[p].g.classList.add(k === path.length - 1 ? 'found' : 'hit');
          await A.wait(560);
        }
        const f = { x: tX(4) + 44, y: TG.levels[2] + 42 };
        Anim.set(S.stamp, Object.assign({}, f, { scale: 0.4, opacity: 0 }));
        await A.to(S.stamp, { scale: 1, opacity: 1 }, { dur: 420, ease: 'outBack' });
        await A.wait(2300);
        if (!A.alive) return;
        // back to a messy row
        phase(ctx, -1);
        await Promise.all([A.to(S.probe, { opacity: 0 }, { dur: 300 }), A.to(S.stamp, { opacity: 0 }, { dur: 300 })]
          .concat(S.edges.filter(Boolean).map((e) => A.to(e, { opacity: 0 }, { dur: 300 }))));
        S.edges.forEach((e) => e && e.classList.remove('hit'));
        its.forEach((it) => it.g.classList.remove('tree', 'hit', 'found'));
        await A.run((p) => its.forEach((it) => morph(it, 1 - p)), { dur: 900, ease: 'inOut' });
        await Promise.all(its.map((it, i) => {
          const d = it.home - it.sp;
          return A.wait(50 * i).then(() => {
            it.g.classList.remove('sorted');
            return A.to(it.g, { x: tX(it.home) }, { dur: 800, arc: d ? (d > 0 ? 1 : -1) * (30 + 10 * Math.abs(d)) : 0 });
          });
        }));
        await A.wait(300);
      });
    },
  });

  /* ======================================================================
   * 2 · The big idea
   * ==================================================================== */
  const ST = [120, 485, 850, 1215, 1580];            // station centres (x)
  const SY = 74;                                      // icon centre (y)
  const KNOT_N = 140;

  function knotPoints() {
    const pts = [];
    for (let i = 0; i <= KNOT_N; i++) {
      const t = (i / KNOT_N) * Math.PI * 2;
      pts.push({
        x: 56 * Math.sin(2 * t + 0.6) + 19 * Math.sin(5 * t) + 8 * Math.cos(9 * t),
        y: 38 * Math.sin(3 * t) + 15 * Math.cos(4 * t + 0.3) + 6 * Math.sin(11 * t),
      });
    }
    return pts;
  }

  function linePoints() {
    const pts = [];
    for (let i = 0; i <= KNOT_N; i++) pts.push({ x: -74 + (148 * i) / KNOT_N, y: 0 });
    return pts;
  }

  const ptsD = (pts) => 'M' + pts.map((q) => q.x.toFixed(1) + ',' + q.y.toFixed(1)).join(' L');

  function gearPath(R, r, teeth) {
    let d = '';
    const step = (Math.PI * 2) / teeth;
    for (let k = 0; k < teeth; k++) {
      const a = k * step;
      const pts = [[r, a - step * 0.5], [r, a - step * 0.22], [R, a - step * 0.14], [R, a + step * 0.14], [r, a + step * 0.22]];
      pts.forEach(([rad, ang], j) => {
        d += (k === 0 && j === 0 ? 'M' : 'L') + (rad * Math.cos(ang)).toFixed(1) + ',' + (rad * Math.sin(ang)).toFixed(1) + ' ';
      });
    }
    return d + 'Z';
  }

  const CARDS = [
    {
      cls: 'bi-c1', color: '--simplify', num: 1,
      h: ['Instance simplification', 'Örneği basitleştirme'],
      p: ['the <b>same problem</b>, a simpler or handier instance', '<b>aynı problem</b>, daha basit ya da kullanışlı bir örnek'],
      ex: [['presorting', 'ön sıralama'], ['Gaussian elimination', 'Gauss eliminasyonu'], ['AVL trees', 'AVL ağaçları']],
    },
    {
      cls: 'bi-c2', color: '--represent', num: 2,
      h: ['Representation change', 'Gösterimi değiştirme'],
      p: ['the <b>same instance</b>, stored in a different form', '<b>aynı örnek</b>, başka bir biçimde saklanır'],
      ex: [['2-3 trees', '2-3 ağaçları'], ['heaps &amp; heapsort', 'heap ve heapsort', true], ['Horner’s rule', 'Horner kuralı'], ['binary exponentiation', 'ikili üs alma']],
    },
    {
      cls: 'bi-c3', color: '--reduce', num: 3,
      h: ['Problem reduction', 'Probleme indirgeme'],
      p: ['turn it into a <b>different problem</b> we can already solve', 'zaten çözebildiğimiz <b>başka bir probleme</b> çevir'],
      ex: [['lcm via gcd', 'gcd ile lcm'], ['counting paths', 'yol sayma'], ['max ↔ min', 'max ↔ min'], ['linear programming', 'doğrusal programlama']],
    },
  ];
  const STAR = '<svg class="bi-star" viewBox="-12 -12 24 24" width="18" height="18" aria-hidden="true"><path d="M0,-11 L3.2,-3.6 L11,-3.4 L4.9,1.6 L6.8,9.4 L0,5 L-6.8,9.4 L-4.9,1.6 L-11,-3.4 L-3.2,-3.6 Z"/></svg>';

  function cardHtml(c, i) {
    return `<div class="panel ticks bi-card ${c.cls}" data-step="${i + 2}" style="--act:var(${c.color})">
        <div class="bi-head"><span class="bi-num">${c.num}</span><h3>${L(c.h[0], c.h[1])}</h3></div>
        <p class="bi-p">${L(c.p[0], c.p[1])}</p>
        <div class="bi-demo" data-ambient></div>
        <div class="bi-ex">${c.ex.map((e) => `<span class="bi-chip${e[2] ? ' star' : ''}">${e[2] ? STAR : ''}${L(e[0], e[1])}</span>`).join('')}</div>
      </div>`;
  }

  /* ---- micro-demo 1: messy bars become sorted bars ---- */
  function demoSimplify(host) {
    const svg = Viz.svg(host, 488, 196, 'bi-svg');
    const vals = [4, 7, 2, 6, 1, 5, 3];
    const cx = (i) => 52 + 64 * i;
    svg.appendChild(U.s('line', { class: 'bi-base', x1: 16, y1: 184, x2: 472, y2: 184 }));
    const bars = vals.map((v, i) => {
      const r = U.s('rect', { class: 'bi-bar', x: -21, y: 184 - v * 23, width: 42, height: v * 23, rx: 6 });
      svg.appendChild(r);
      Anim.set(r, { x: cx(i) });
      return { r, v, home: i, to: v - 1 };
    });
    return {
      async play(A) {
        bars.forEach((b) => { b.r.classList.remove('ok'); Anim.set(b.r, { x: cx(b.home), opacity: 1 }); });
        await A.wait(900);
        await Promise.all(bars.map((b, i) => A.wait(60 * i).then(() => {
          const d = b.to - b.home;
          return A.to(b.r, { x: cx(b.to) }, { dur: 800, arc: d ? (d > 0 ? 1 : -1) * (18 + 6 * Math.abs(d)) : 0 });
        })));
        bars.forEach((b) => b.r.classList.add('ok'));
        await A.wait(1900);
        await Promise.all(bars.map((b) => A.to(b.r, { opacity: 0 }, { dur: 350 })));
      },
    };
  }

  /* ---- micro-demo 2: an array becomes a tree and back ---- */
  function demoRepresent(host) {
    const svg = Viz.svg(host, 488, 196, 'bi-svg');
    const vals = [9, 7, 8, 3, 5, 6, 4];
    const cell = (i) => ({ x: 52 + 64 * i, y: 166 });
    const node = (i) => {
      const lvl = Math.floor(Math.log2(i + 1));
      const q = i + 1 - Math.pow(2, lvl);
      return { x: 24 + (q + 0.5) * (440 / Math.pow(2, lvl)), y: 26 + lvl * 62 };
    };
    const gE = U.s('g', {});
    svg.appendChild(gE);
    const edges = [];
    for (let i = 1; i < 7; i++) {
      const a = node(Math.floor((i - 1) / 2)), b = node(i);
      const e = U.s('line', { class: 'bi-edge', x1: a.x, y1: a.y, x2: b.x, y2: b.y });
      Anim.set(e, { opacity: 0 });
      gE.appendChild(e);
      edges.push(e);
    }
    const chips = vals.map((v, i) => {
      const g = U.s('g', { class: 'bi-chipv' });
      g.innerHTML = '<rect x="-24" y="-24" width="48" height="48" rx="10"/><text>' + v + '</text>';
      svg.appendChild(g);
      Anim.set(g, cell(i));
      return g;
    });
    return {
      async play(A) {
        chips.forEach((g, i) => Anim.set(g, cell(i)));
        await A.wait(900);
        await Promise.all(chips.map((g, i) => A.wait(60 * i).then(() => A.to(g, node(i), { dur: 760, ease: 'inOut' }))));
        await Promise.all(edges.map((e) => A.to(e, { opacity: 1 }, { dur: 300 })));
        await A.wait(1500);
        await Promise.all(edges.map((e) => A.to(e, { opacity: 0 }, { dur: 250 })));
        await Promise.all(chips.map((g, i) => A.wait(50 * i).then(() => A.to(g, cell(i), { dur: 700, ease: 'inOut' }))));
        await A.wait(600);
      },
    };
  }

  /* ---- micro-demo 3: problem A → problem B (solved) → answer flows back ---- */
  function demoReduce(host) {
    const svg = Viz.svg(host, 488, 196, 'bi-svg');
    svg.innerHTML = `
      <rect class="bi-box a" x="6" y="18" width="190" height="122" rx="16"/>
      <rect class="bi-box b" x="292" y="18" width="190" height="122" rx="16"/>
      <path class="bi-flow" d="M202,52 H284" marker-end="url(#arrow-reduce)"/>
      <path class="bi-flow back" d="M286,108 H204" marker-end="url(#arrow-ok)"/>
      <text class="bi-t" x="101" y="66">lcm(24, 60)</text>
      <text class="bi-t" x="387" y="66">gcd(24, 60)</text>
      <text class="bi-q" x="101" y="112">= ?</text>
      <text class="bi-ans" x="101" y="112">= 120</text>
      <text class="bi-ans b" x="387" y="112">= 12</text>
      <g class="bi-known" transform="translate(462,26)"><circle r="16"/><path d="${Viz.ICONS.check}" transform="scale(0.6)"/></g>
      <text class="bi-f" x="244" y="182">lcm(m, n) = m·n / gcd(m, n)</text>`;
    const q = svg.querySelector('.bi-q');
    const ans = svg.querySelectorAll('.bi-ans');
    const tokA = U.s('circle', { class: 'bi-tok', r: 9 });
    const tokB = U.s('g', { class: 'bi-tok2' });
    tokB.innerHTML = '<rect x="-26" y="-17" width="52" height="34" rx="17"/><text>12</text>';
    svg.append(tokA, tokB);
    const boxB = svg.querySelector('.bi-box.b');
    return {
      async play(A) {
        Anim.set(q, { opacity: 1 });
        ans.forEach((a) => Anim.set(a, { opacity: 0 }));
        Anim.set(tokA, { x: 202, y: 52, opacity: 0 });
        Anim.set(tokB, { x: 286, y: 108, opacity: 0 });
        boxB.classList.remove('hot');
        await A.wait(800);
        await A.to(tokA, { opacity: 1 }, { dur: 200 });
        await A.to(tokA, { x: 282 }, { dur: 650, ease: 'inOut' });
        await A.to(tokA, { opacity: 0 }, { dur: 150 });
        boxB.classList.add('hot');
        await A.to(ans[1], { opacity: 1 }, { dur: 350 });
        await A.wait(350);
        await A.to(tokB, { opacity: 1 }, { dur: 200 });
        await A.to(tokB, { x: 200 }, { dur: 700, ease: 'inOut' });
        await Promise.all([A.to(tokB, { opacity: 0 }, { dur: 200 }), A.to(q, { opacity: 0 }, { dur: 200 })]);
        boxB.classList.remove('hot');
        await A.to(ans[0], { opacity: 1 }, { dur: 350 });
        await A.wait(2000);
        await Promise.all([A.to(ans[0], { opacity: 0 }, { dur: 300 }), A.to(ans[1], { opacity: 0 }, { dur: 300 })]);
      },
    };
  }

  Deck.add({
    id: 'big-idea', act: 'opening', steps: 4,
    title: { en: 'The idea: transform, then conquer', tr: 'Fikir: önce dönüştür, sonra fethet' },
    html: `
      <div class="bi-pipe"></div>
      <div class="bi-cards">${CARDS.map(cardHtml).join('')}</div>`,
    init(ctx) {
      const d = ctx.data;
      const svg = Viz.svg(ctx.$('.bi-pipe'), 1700, 250, 'bi-pipe-svg');
      d.svg = svg;
      // station 1: the tangled problem
      const knot = knotPoints();
      d.knotPts = knot;
      d.knot = U.s('path', { class: 'bi-knot', d: ptsD(knot.map((q) => ({ x: q.x + ST[0], y: q.y + SY }))), pathLength: 1, 'data-draw': '' });
      svg.appendChild(d.knot);
      // arrows between stations
      d.arrows = [0, 1, 2, 3].map((k) => {
        const a = Viz.hiddenPath({ class: 'bi-arrow', d: 'M' + (ST[k] + 92) + ',' + SY + ' H' + (ST[k + 1] - 92), 'marker-end': 'url(#arrow-line)' });
        svg.appendChild(a);
        return a;
      });
      // station 2: the gear (wrapper pops in; the inner gear spins forever)
      d.gearWrap = U.s('g', { class: 'bi-gearwrap' });
      d.gear = U.s('g', { class: 'bi-gear', 'data-ambient': '' });
      d.gear.innerHTML = '<path d="' + gearPath(54, 42, 9) + '"/><circle r="15"/>';
      d.gearWrap.appendChild(d.gear);
      Anim.set(d.gearWrap, { x: ST[1], y: SY, scale: 0.4, opacity: 0 });
      svg.appendChild(d.gearWrap);
      // the problem travelling through the gear (morphs knot → line)
      d.morph = U.s('path', { class: 'bi-morph', d: ptsD(knot.map((q) => ({ x: q.x + ST[0], y: q.y + SY }))) });
      Anim.set(d.morph, { opacity: 0 });
      svg.appendChild(d.morph);
      d.ends = [-74, 74].map((dx) => {
        const c = U.s('circle', { class: 'bi-end', cx: ST[2] + dx, cy: SY, r: 9 });
        Anim.set(c, { scale: 0.2, opacity: 0 });
        svg.appendChild(c);
        return c;
      });
      // station 4: the flag
      d.flag = U.s('g', { class: 'bi-flag' });
      d.flag.innerHTML = '<ellipse cx="0" cy="56" rx="30" ry="7"/><path class="pole" d="M-14,56 V-52"/>';
      d.cloth = U.s('path', { class: 'cloth', d: 'M-12,-50 C8,-60 24,-40 48,-50 L48,-14 C24,-4 8,-24 -12,-14 Z' });
      d.flag.appendChild(d.cloth);
      Anim.set(d.flag, { x: ST[3], y: SY, opacity: 0 });
      Anim.set(d.cloth, { y: 64, opacity: 0 });
      svg.appendChild(d.flag);
      // station 5: the solution
      d.sol = U.s('g', { class: 'bi-sol' });
      d.sol.innerHTML = '<circle r="48"/><path d="' + Viz.ICONS.check + '" transform="scale(1.7)"/>';
      Anim.set(d.sol, { x: ST[4], y: SY, scale: 0.3, opacity: 0 });
      svg.appendChild(d.sol);
      // labels
      const LBL = [['problem', 'problem', ''], ['TRANSFORM', 'DÖNÜŞTÜR', 'act'], ['easier problem', 'daha kolay problem', ''], ['CONQUER', 'FETHET', 'act'], ['solution', 'çözüm', '']];
      d.labels = LBL.map((l, k) => {
        const t = Viz.text(svg, ST[k], 172, l[0], l[1], { class: 'bi-lbl' + (l[2] ? ' ' + l[2] : ''), 'text-anchor': 'middle' });
        if (k > 0) Anim.set(t, { opacity: 0 });
        else t.setAttribute('data-in', 'fade');
        return t;
      });
      // "three ways to transform" bracket from the gear to the cards; the
      // label sits in a gap of the line, between cards 2 and 3
      const cx = [270, 850, 1430], BY = 222, gap = [1010, 1270];
      d.bracket = Viz.hiddenPath({ class: 'bi-bracket', d: 'M' + ST[1] + ',190 V' + BY + ' M' + cx[0] + ',' + (BY + 24) + ' V' + BY + ' H' + gap[0]
        + ' M' + gap[1] + ',' + BY + ' H' + cx[2] + ' V' + (BY + 24) + ' M' + cx[1] + ',' + BY + ' V' + (BY + 24) });
      svg.appendChild(d.bracket);
      d.bracketLbl = Viz.text(svg, (gap[0] + gap[1]) / 2, BY, '3 ways to transform', 'dönüştürmenin 3 yolu', { class: 'bi-blbl', 'text-anchor': 'middle', 'dominant-baseline': 'central' });
      Anim.set(d.bracketLbl, { opacity: 0 });
      // micro-demos
      const demos = [demoSimplify, demoRepresent, demoReduce];
      d.demos = ctx.$$('.bi-demo').map((host, i) => demos[i](host));
    },
    async step(n, ctx) {
      const d = ctx.data;
      if (n === 1) {
        const at = (k) => Anim.to(d.labels[k], { opacity: 1 }, { dur: 350 });
        await Viz.draw(d.arrows[0], { dur: 220 });
        at(1);
        await Anim.to(d.gearWrap, { scale: 1, opacity: 1 }, { dur: 280, ease: 'outBack' });
        // the knot is pulled through the gear and comes out as a straight line
        d.knot.classList.add('ghost');
        const K = d.knotPts, Ln = linePoints();
        Anim.set(d.morph, { opacity: 1 });
        await Anim.run((p) => {
          const e = Anim.ease.inOut(clamp01(p));
          const w = 0.88 * Math.pow(Math.sin(Math.PI * clamp01(p)), 1.4);
          const pts = K.map((q, i) => {
            const x = lerp(q.x + ST[0], Ln[i].x + ST[2], e);
            const y = lerp(q.y + SY, Ln[i].y + SY, e);
            return { x: lerp(x, ST[1] + q.x * 0.1, w), y: lerp(y, SY + q.y * 0.1, w) };
          });
          d.morph.setAttribute('d', ptsD(pts));
          d.morph.classList.toggle('clean', p >= 0.55);
        }, { dur: 800, ease: 'linear' });
        at(2);
        await Promise.all(d.ends.map((c) => Anim.to(c, { scale: 1, opacity: 1 }, { dur: 180, ease: 'outBack' })));
        await Viz.draw(d.arrows[1], { dur: 180 });
        at(3);
        Anim.set(d.flag, { opacity: 1 });
        await Anim.to(d.cloth, { y: 0, opacity: 1 }, { dur: 300, ease: 'out' });
        await Viz.draw(d.arrows[2], { dur: 180 });
        at(4);
        await Anim.to(d.sol, { scale: 1, opacity: 1 }, { dur: 340, ease: 'outBack' });
        if (!Anim.isInstant()) {
          const c = FX.center(d.sol);
          FX.ripple(c.x, c.y, '--ok', { r0: 40, r1: 120 });
        }
      } else if (n === 2) {
        await Viz.draw(d.bracket, { dur: 500 });
        await Anim.to(d.bracketLbl, { opacity: 1 }, { dur: 300 });
      }
    },
    enter(ctx) {
      const d = ctx.data;
      ctx.loop(async (A) => {
        await A.to(d.gear, { rot: 360 }, { dur: 7000, ease: 'linear' });
        Anim.set(d.gear, { rot: 0 });
      });
      d.demos.forEach((demo, i) => {
        ctx.loop(async (A) => {
          if (ctx.step < i + 2) { await A.wait(150); return; }
          await demo.play(A);
        });
      });
    },
  });
})();
