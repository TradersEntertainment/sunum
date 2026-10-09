/* ★ Heaps & Heapsort — the main topic (Levitin §6.4). */
(function () {
  'use strict';

  const H = Algo.heap;
  const K = Viz.K;
  const LIST = [2, 9, 7, 6, 5, 8];               // the deck's example list
  const STAR = '<svg viewBox="-12 -12 24 24" width="26" height="26" aria-hidden="true"><path d="M0,-11 L3.2,-3.6 L11,-3.4 L4.9,1.6 L6.8,9.4 L0,5 L-6.8,9.4 L-4.9,1.6 L-11,-3.4 L-3.2,-3.6 Z" style="fill:var(--star)"/></svg>';

  /* ---------- shared helpers ---------- */

  /* Group events into clicks: a new click starts at every `sift`, at a
   * second `compare` inside the same sift (the key keeps sinking), and at
   * `swapRoot` / `done`. */
  function clickGroups(events) {
    const out = [[]];
    let compares = 0;
    for (const e of events) {
      const cur = out[out.length - 1];
      const starts = e.t === 'sift' || e.t === 'swapRoot' || e.t === 'done' || (e.t === 'compare' && compares > 0);
      if (starts && cur.length) { out.push([]); compares = 0; }
      if (e.t === 'compare') compares++;
      if (e.t === 'sift' || e.t === 'swapRoot') compares = 0;
      out[out.length - 1].push(e);
    }
    return out;
  }

  /* Play one group of events on a scene, keeping code, table, counters and
   * caption in sync. */
  async function playGroup(ctx, group) {
    const d = ctx.data;
    const jobs = [];
    if (d.caption && d.say) jobs.push(d.caption.set(d.say(group, d)));
    for (const e of group) {
      if (d.code && d.lines && d.lines[e.t] != null) {
        const ln = typeof d.lines[e.t] === 'function' ? d.lines[e.t](e) : d.lines[e.t];
        if (ln != null) d.code.line(ln);
      }
      if (e.t === 'row') { if (d.table) d.table.add(e.vals, e.m < e.vals.length ? e.m : null); continue; }
      if (e.t === 'init') continue;
      await d.scene.apply(e);
      if (d.counters && e.cmp != null) {
        d.counters.querySelector('.c-cmp').textContent = e.cmp;
        d.counters.querySelector('.c-swp').textContent = e.swaps;
      }
    }
    await Promise.all(jobs);
  }

  function counters() {
    return '<div class="counters hb-counters" data-in="fade">'
      + '<span>' + L('comparisons', 'karşılaştırma') + '<b class="c-cmp">0</b></span>'
      + '<span>' + L('swaps', 'takas') + '<b class="c-swp">0</b></span></div>';
  }

  /* ======================================================================
   * 8 · Section intro
   * ==================================================================== */
  Deck.add({
    id: 'heap-intro', act: 'heap', bare: true, steps: 0, transition: 'zoom',
    title: { en: 'Heaps & Heapsort', tr: 'Heap ve Heapsort' },
    html: `
      <div class="hi-wrap">
        <div class="hi-kicker" data-in="left">${STAR} ${L('The star topic of Chapter 6', 'Bölüm 6’nın yıldız konusu')}</div>
        <h1 class="hi-title" data-in="up" style="--d:140ms">Heaps &amp;<br><em>Heapsort</em></h1>
        <div class="hi-sub" data-in="up" style="--d:320ms">
          <p class="lead">${L('Representation change: the same keys, <b>thought of as a tree</b>, <b>stored as an array</b>.',
            'Gösterimi değiştirme: aynı anahtarlar <b>ağaç gibi düşünülür</b>, <b>dizi olarak saklanır</b>.')}</p>
        </div>
        <div class="hi-scene" data-ambient></div>
      </div>`,
    init(ctx) {
      const host = ctx.$('.hi-scene');
      ctx.data.scene = new HeapScene(host, {
        width: 860, height: 760, values: [9, 7, 8, 3, 5, 6, 4],
        tree: { x: 20, y: 80, w: 820, gap: 150, r: 42 },
        array: { x: 31, y: 560, cell: 100, gap: 14 },
      });
      Viz.text(ctx.data.scene.gOver, 430, 500, '⇅  same keys, two views', '⇅  aynı anahtarlar, iki görünüm', { class: 'callout', 'text-anchor': 'middle' });
      Object.values(ctx.data.scene.items).forEach((it) => it.chip.setAttribute('data-ambient', ''));
    },
    enter(ctx) {
      const sc = ctx.data.scene;
      const ids = sc.pos.slice(1);
      let first = true;
      ctx.loop(async (A) => {
        if (first) {
          first = false;
          ids.forEach((id) => Anim.set(sc.items[id].node, { scale: 0.2, opacity: 0 }));
          await Promise.all(ids.map((id, i) => A.wait(90 * i).then(() => A.to(sc.items[id].node, { scale: 1, opacity: 1 }, { dur: 600, ease: 'outBack' }))));
          await A.wait(900);
        }
        // array -> tree -> array, like breathing
        await Promise.all(ids.map((id, i) => A.wait(70 * i).then(() => A.to(sc.items[id].chip, Object.assign(sc.slotXY(i + 1), { opacity: 0.0, scale: 0.7 }), { dur: 900, ease: 'inOut' }))));
        await A.wait(700);
        await Promise.all(ids.map((id, i) => A.wait(70 * i).then(() => A.to(sc.items[id].chip, Object.assign(sc.cellXY(i + 1), { opacity: 1, scale: 1 }), { dur: 900, ease: 'inOut' }))));
        await A.wait(2200);
      });
    },
  });

  /* ======================================================================
   * 9 · What is a heap?
   * ==================================================================== */
  const DEF_VALUES = [10, 9, 4, 8, 5, 3];
  Deck.add({
    id: 'heap-def', act: 'heap', steps: 4,
    title: { en: 'What is a heap? Two rules', tr: 'Heap nedir? İki kural' },
    html: `
      <div class="hd-main" data-hide="4">
        <div class="hd-rules">
          <div class="panel ticks rule" data-step="1" data-anim="left">
            <div class="num"><svg viewBox="-30 -30 60 60" width="56" height="56" aria-hidden="true">
              <circle cx="0" cy="-17" r="8" style="fill:var(--star)"/><circle cx="-14" cy="8" r="8" style="fill:var(--star)"/>
              <circle cx="14" cy="8" r="8" style="fill:var(--star)"/><circle cx="-22" cy="26" r="6" style="fill:none;stroke:var(--star);stroke-width:3"/></svg></div>
            <h3>${L('1 · Shape', '1 · Şekil')}</h3>
            <p>${L('<b>Essentially complete</b>: every level is full, only the last one may miss keys, and only on the right.',
              '<b>Neredeyse tam</b>: her seviye dolu; yalnızca son seviyede, sadece sağdan eksik olabilir.')}</p>
          </div>
          <div class="panel ticks rule" data-step="2" data-anim="left">
            <div class="num"><svg viewBox="-30 -30 60 60" width="56" height="56" aria-hidden="true">
              <text x="0" y="12" text-anchor="middle" style="fill:var(--star);font:800 40px var(--font-display)">≥</text></svg></div>
            <h3>${L('2 · Parental dominance', '2 · Ebeveyn baskınlığı')}</h3>
            <p>${L('Every key is <b>≥ its children</b>. This is a <b>max-heap</b>.',
              'Her anahtar <b>çocuklarından ≥</b>. Buna <b>max-heap</b> denir.')}</p>
          </div>
        </div>
        <div class="hd-scene"></div>
        <p class="hd-note" data-step="3">${L(
          '<span class="c-ok">↓ Keys decrease along every path</span> from the root, but there is <b>no left-to-right order</b>: 8 sits lower, yet 8 &gt; 4.',
          '<span class="c-ok">↓ Kökten inen her yolda anahtarlar azalır</span>, ama <b>soldan sağa sıra yoktur</b>: 8 daha aşağıda, yine de 8 &gt; 4.')}</p>
      </div>
      <div class="hd-quiz" data-step="4" data-anim="fade">
        <div class="quiz-tree" style="left:0">${Viz.stamp(true, ' data-step="4" data-anim="pop" style="--d:500ms"')}
          <div class="qt-label">${L('a heap', 'heap')}</div></div>
        <div class="quiz-tree" style="left:580px">${Viz.stamp(false, ' data-step="4" data-anim="pop" style="--d:900ms"')}
          <div class="qt-label">${L('not a heap: a hole in the shape', 'heap değil: şekilde boşluk var')}</div></div>
        <div class="quiz-tree" style="left:1160px">${Viz.stamp(false, ' data-step="4" data-anim="pop" style="--d:1300ms"')}
          <div class="qt-label">${L('not a heap: 6 &gt; 5', 'heap değil: 6 &gt; 5')}</div></div>
        <p class="hd-quiz-foot">${L('A heap needs <b>both</b>: the right <b>shape</b> and <b>parent ≥ children</b>.', 'Heap için <b>ikisi de</b> gerekir: doğru <b>şekil</b> ve <b>ebeveyn ≥ çocuklar</b>.')}</p>
      </div>`,
    init(ctx) {
      const d = ctx.data;
      d.scene = new HeapScene(ctx.$('.hd-scene'), {
        width: 940, height: 600, values: DEF_VALUES, slots: 7, ghosts: true,
        tree: { x: 40, y: 70, w: 860, gap: 175, r: 48 },
      });
      const sc = d.scene;
      // order numbers shown while explaining the shape rule
      d.order = [];
      for (let p = 1; p <= 6; p++) {
        const c = sc.slotXY(p);
        const t = U.s('text', { class: 'key', x: c.x, y: c.y, style: 'fill:var(--star);font:700 40px var(--font-mono);text-anchor:middle;dominant-baseline:central' }, String(p));
        Anim.set(t, { opacity: 0, scale: 0.4 });
        sc.gOver.appendChild(t);
        d.order.push(t);
      }
      d.empty = Viz.text(sc.gOver, sc.slotXY(7).x, sc.slotXY(7).y + 88, 'may be empty', 'boş olabilir', { class: 'callout', 'text-anchor': 'middle', style: 'font-size:32px' });
      Anim.set(d.empty, { opacity: 0 });
      // ≥ marks on edges
      d.ge = {};
      for (let p = 2; p <= 6; p++) {
        const a = sc.slotXY(Math.floor(p / 2)), b = sc.slotXY(p);
        const t = U.s('text', { x: (a.x + b.x) / 2 + (p % 2 ? 26 : -26), y: (a.y + b.y) / 2, style: 'fill:var(--ok);font:700 34px var(--font-mono);text-anchor:middle;dominant-baseline:central' }, '≥');
        Anim.set(t, { opacity: 0, scale: 0.4 });
        sc.gOver.appendChild(t);
        d.ge[p] = t;
      }
      Object.values(sc.items).forEach((it) => Anim.set(it.node, { opacity: 0, scale: 0.3 }));
      Object.values(sc.edges).forEach((e) => e.classList.add('gone'));
      // "8 > 4" across subtrees
      const s3 = sc.slotXY(3), s4 = sc.slotXY(4);
      const low = s4.y + 130;
      d.cross = Viz.hiddenPath({ class: 'arc kid', d: 'M' + s4.x + ',' + (s4.y + 52) + ' C' + s4.x + ',' + low + ' ' + (s3.x + 120) + ',' + low + ' ' + (s3.x + 40) + ',' + (s3.y + 50), 'marker-end': 'url(#arrow-cmp)' });
      sc.gOver.appendChild(d.cross);
      d.crossLbl = U.s('text', { class: 'arc-label kid', x: (s3.x + s4.x) / 2 + 60, y: low + 4 }, '8 > 4');
      Anim.set(d.crossLbl, { opacity: 0 });
      sc.gOver.appendChild(d.crossLbl);
      // quiz trees
      const quiz = ctx.$$('.quiz-tree');
      const mk = (host, values, ids) => new HeapScene(host, {
        width: 540, height: 400, values, ids, slots: 7, ghosts: true,
        tree: { x: 30, y: 60, w: 480, gap: 130, r: 36 },
      });
      d.q1 = mk(quiz[0], [10, 5, 7, 4, 2, 1]);
      d.q2 = mk(quiz[1], [10, 5, 7, 4, 2], [0, 1, 2, 3, null, 4]);
      d.q2.edges[5].classList.add('gone');
      d.q2.edges[7].classList.add('gone');
      d.q2.gGhost.children[4].style.stroke = 'var(--bad)';
      d.q2.gGhost.children[4].style.strokeWidth = '5';
      d.q3 = mk(quiz[2], [10, 5, 7, 6, 2, 1]);
      d.q3.mark(4, 'bad'); d.q3.mark(2, 'bad'); d.q3.edge(4, 'bad');
    },
    async step(n, ctx) {
      const d = ctx.data, sc = d.scene;
      if (n === 1) {
        await Anim.stagger(d.order, (t, i, delay) => Anim.to(t, { opacity: 1, scale: 1 }, { dur: 420, delay, ease: 'outBack' }), 170);
        await Anim.to(d.empty, { opacity: 1 }, { dur: 400 });
      } else if (n === 2) {
        await Promise.all(d.order.map((t) => Anim.to(t, { opacity: 0, scale: 0.4 }, { dur: 300 })).concat([Anim.to(d.empty, { opacity: 0 }, { dur: 300 })]));
        Object.values(sc.edges).forEach((e, i) => { if (i < 5) e.classList.remove('gone'); });
        await Anim.stagger(sc.pos.slice(1, 7), (id, i, delay) => Anim.to(sc.items[id].node, { opacity: 1, scale: 1 }, { dur: 480, delay, ease: 'outBack' }), 110);
        for (let p = 2; p <= 6; p++) {
          sc.edge(p, 'ok');
          await Anim.to(d.ge[p], { opacity: 1, scale: 1 }, { dur: 260, ease: 'outBack' });
        }
      } else if (n === 3) {
        for (let p = 2; p <= 6; p++) { sc.edge(p, 'ok', false); Anim.set(d.ge[p], { opacity: 0 }); }
        [1, 2, 4].forEach((p) => sc.mark(p, 'ok'));
        sc.edge(2, 'ok'); sc.edge(4, 'ok');
        await Anim.wait(500);
        sc.mark(3, 'cmp');
        await Viz.draw(d.cross, { dur: 600 });
        await Anim.to(d.crossLbl, { opacity: 1 }, { dur: 300 });
      }
    },
  });

  /* ======================================================================
   * 10 · Tree ⇄ array
   * ==================================================================== */
  Deck.add({
    id: 'heap-array', act: 'heap', steps: 4,
    title: { en: 'A heap is secretly an array', tr: 'Heap aslında bir dizidir' },
    html: `
      <div class="ha-scene"></div>
      <div class="ha-side">
        <div class="panel fcard" data-step="1" data-anim="right">
          <div class="f-head">${L('store', 'saklama')}</div>
          <div class="txt">${L('Top-down, left-to-right into <b>H[1..n]</b>. No pointers needed.', 'Yukarıdan aşağı, soldan sağa <b>H[1..n]</b> içine. İşaretçi gerekmez.')}</div>
        </div>
        <div class="panel fcard" data-step="2" data-anim="right">
          <div class="f-head">${L('children of j', 'j’nin çocukları')}</div>
          <div class="formula"><span class="kid">2j</span> ${L('and', 've')} <span class="kid">2j + 1</span></div>
          <div class="f-ex">j = 2 → 4, 5</div>
        </div>
        <div class="panel fcard" data-step="3" data-anim="right">
          <div class="f-head">${L('parent of j', 'j’nin ebeveyni')}</div>
          <div class="formula"><span class="par">⌊j / 2⌋</span></div>
          <div class="f-ex">j = 5 → ⌊5/2⌋ = 2</div>
        </div>
        <div class="panel fcard" data-step="4" data-anim="right">
          <div class="f-head">${L('parents first', 'önce ebeveynler')}</div>
          <div class="txt">${L('Parents fill <b>H[1..⌊n/2⌋]</b>; leaves come after. The max is <b>H[1]</b>; height h = ⌊log₂ n⌋.',
            'Ebeveynler <b>H[1..⌊n/2⌋]</b>; yapraklar sonra. En büyük <b>H[1]</b>; yükseklik h = ⌊log₂ n⌋.')}</div>
        </div>
      </div>`,
    init(ctx) {
      const d = ctx.data;
      d.scene = new HeapScene(ctx.$('.ha-scene'), {
        width: 1000, height: 750, values: [9, 5, 3, 1, 4, 2], treeIdx: true,
        tree: { x: 60, y: 70, w: 860, gap: 112, r: 44 },
        array: { x: 128, y: 520, cell: 110, gap: 14 },
      });
      const sc = d.scene;
      for (let p = 1; p <= 6; p++) {
        Anim.set(sc.treeIdx[p], { opacity: 0 });
        Anim.set(sc.at(p).chip, Object.assign(sc.slotXY(p), { opacity: 0, scale: 0.8 }));
        Anim.set(sc.idx[p], { opacity: 0 });
      }
      // arcs
      const a = sc.o.array;
      const top = a.y - 6, bottom = a.y + a.cell + 46;
      const mkArc = (p, q, below, cls) => {
        const P = sc.cellXY(p), Q = sc.cellXY(q);
        const y = below ? bottom : top;
        const h = below ? 40 + Math.abs(q - p) * 12 : -(60 + Math.abs(q - p) * 18);
        const path = Viz.hiddenPath({
          class: 'arc ' + cls, d: 'M' + P.x + ',' + y + ' C' + P.x + ',' + (y + h) + ' ' + Q.x + ',' + (y + h) + ' ' + Q.x + ',' + y,
          'marker-end': 'url(#arrow-' + (cls === 'kid' ? 'cmp' : 'swap') + ')',
        });
        sc.gOver.appendChild(path);
        return path;
      };
      d.kidArcs = [mkArc(2, 4, false, 'kid'), mkArc(2, 5, false, 'kid')];
      d.parArc = mkArc(5, 2, true, 'par');
      const c4 = sc.cellXY(4), c5 = sc.cellXY(5), c2 = sc.cellXY(2);
      d.kidLbl = [
        U.s('text', { class: 'arc-label kid', x: c4.x - 10, y: top - 128 }, '2j = 4'),
        U.s('text', { class: 'arc-label kid', x: c5.x + 50, y: top - 128 }, '2j+1 = 5'),
      ];
      d.parLbl = U.s('text', { class: 'arc-label par', x: (c2.x + c5.x) / 2, y: bottom + 36 }, '⌊5/2⌋ = 2');
      d.kidLbl.concat([d.parLbl]).forEach((t) => { Anim.set(t, { opacity: 0 }); sc.gOver.appendChild(t); });
      // bracket over parents / leaves
      const c1 = sc.cellXY(1), c3 = sc.cellXY(3), c6 = sc.cellXY(6);
      d.brackets = U.s('g', {});
      const by = a.y - 30;
      d.brackets.innerHTML = '<path d="M' + (c1.x - 54) + ',' + (by + 14) + ' v-14 H' + (c3.x + 54) + ' v14" style="fill:none;stroke:var(--star);stroke-width:4"/>'
        + '<path d="M' + (c4.x - 54) + ',' + (by + 14) + ' v-14 H' + (c6.x + 54) + ' v14" style="fill:none;stroke:var(--muted);stroke-width:4"/>';
      Viz.text(d.brackets, (c1.x + c3.x) / 2, by - 20, 'parents', 'ebeveynler', { class: 'svg-mono', 'text-anchor': 'middle', style: 'fill:var(--star);font-size:26px' });
      Viz.text(d.brackets, (c4.x + c6.x) / 2, by - 20, 'leaves', 'yapraklar', { class: 'svg-mono', 'text-anchor': 'middle', style: 'font-size:26px' });
      Anim.set(d.brackets, { opacity: 0 });
      sc.gOver.appendChild(d.brackets);
    },
    async step(n, ctx) {
      const d = ctx.data, sc = d.scene;
      if (n === 1) {
        await Anim.stagger([1, 2, 3, 4, 5, 6], (p, i, delay) => Anim.to(sc.treeIdx[p], { opacity: 1 }, { dur: 300, delay }), 130);
        await Anim.stagger([1, 2, 3, 4, 5, 6], (p, i, delay) => Promise.all([
          Anim.to(sc.at(p).chip, Object.assign(sc.cellXY(p), { opacity: 1, scale: 1 }), { dur: 800, delay, arc: -60 }),
          Anim.to(sc.idx[p], { opacity: 1 }, { dur: 400, delay: delay + 500 }),
        ]), 160);
      } else if (n === 2) {
        sc.mark(2, 'focus'); sc.mark(4, 'cmp'); sc.mark(5, 'cmp'); sc.edge(4, 'hot'); sc.edge(5, 'hot');
        await Promise.all(d.kidArcs.map((p, i) => Viz.draw(p, { dur: 700, delay: i * 250 })));
        await Promise.all(d.kidLbl.map((t) => Anim.to(t, { opacity: 1 }, { dur: 300 })));
      } else if (n === 3) {
        sc.clear();
        d.kidArcs.forEach((p) => { p.style.opacity = '0.2'; });
        d.kidLbl.forEach((t) => Anim.set(t, { opacity: 0.25 }));
        sc.mark(5, 'swap'); sc.mark(2, 'focus'); sc.edge(5, 'hot');
        await Viz.draw(d.parArc, { dur: 700 });
        await Anim.to(d.parLbl, { opacity: 1 }, { dur: 300 });
      } else if (n === 4) {
        sc.clear();
        [d.parArc].concat(d.kidArcs).forEach((p) => { p.style.opacity = '0'; });
        d.kidLbl.concat([d.parLbl]).forEach((t) => Anim.set(t, { opacity: 0 }));
        [1, 2, 3].forEach((p) => sc.cells[p].classList.add('parent'));
        await Anim.to(d.brackets, { opacity: 1 }, { dur: 400 });
        sc.mark(1, 'max');
        await sc.crown(true);
      }
    },
  });

  /* ======================================================================
   * 11 · Bottom-up heap construction (live)
   * ==================================================================== */
  const BUILD = H.buildBottomUp(LIST);
  const BUILD_GROUPS = clickGroups(BUILD.events);   // [setup, i=3, i=2, i=1, i=1 cont., done]
  const BUILD_CODE = [
    'Algorithm HeapBottomUp(H[1..n])',
    'for i ← ⌊n/2⌋ downto 1 do',
    '    k ← i',
    '    while 2k ≤ n do            // k has a child',
    '        j ← 2k',
    '        if j < n and H[j+1] > H[j] then j ← j+1',
    '        if H[k] ≥ H[j] then break   // heap here',
    '        swap H[k], H[j];  k ← j',
  ];

  function buildSay(group, d) {
    const s = d.scene;
    const v = (p) => s.values[s.pos[p]];
    const sift = group.find((e) => e.t === 'sift');
    const cmp = group.find((e) => e.t === 'compare');
    const swp = group.find((e) => e.t === 'swap');
    const ok = group.find((e) => e.t === 'ok');
    const done = group.find((e) => e.t === 'done');
    if (done) return L('Done: it is a heap. The largest key, ' + K(v(1), 'star') + ', is at the root.',
      'Bitti: artık bir heap. En büyük anahtar ' + K(v(1), 'star') + ' kökte.');
    const key = cmp ? s.values[d.before[cmp.k]] : 0;
    const big = cmp ? s.values[d.before[cmp.j]] : 0;
    const where = sift ? (sift.i === 1 ? L('Root', 'Kök') : L('Parent at position ' + sift.i, sift.i + '. konumdaki ebeveyn'))
      : L('Keep sinking', 'Batmaya devam');
    if (swp) return where + ' ' + K(key, 'cmp') + ': ' + L('larger child is ', 'büyük çocuk ') + K(big, 'cmp') + ' → ' + L('swap', 'yer değiştir') + ' ⇅';
    if (ok) return where + ' ' + K(key, 'ok') + ': ' + K(key, 'ok') + ' ≥ ' + K(big, 'ok') + ' → ' + L('already a heap ✓', 'zaten heap ✓');
    return '';
  }

  function setupBuildLike(ctx, o) {
    const d = ctx.data;
    d.scene = new HeapScene(ctx.$('.hb-scene'), Object.assign({
      width: 900, height: 600, slots: 6,
      tree: { x: 30, y: 60, w: 840, gap: 140, r: 42 },
      array: { x: 102, y: 432, cell: 104, gap: 12 },
    }, o.scene));
    d.code = new CodeView(ctx.$('.hb-code'), o.code, L('pseudocode', 'sözde kod'));
    d.table = new Viz.TraceTable(ctx.$('.hb-trace'), L('trace (as on the slides)', 'iz (slayttaki gibi)'));
    d.caption = new Viz.Caption(ctx.$('.hb-caption'));
    d.counters = ctx.$('.counters');
  }

  Deck.add({
    id: 'heap-build', act: 'heap', steps: BUILD_GROUPS.length - 1,
    title: { en: 'Building a heap bottom-up', tr: 'Heap’i aşağıdan yukarı kurmak' },
    html: `
      ${counters()}
      <div class="hb-scene"></div>
      <div class="hb-caption caption"></div>
      <div class="hb-legend">${Viz.legend(['focus', 'cmp', 'swap', 'ok'])}</div>
      <div class="hb-code panel" data-in="right"></div>
      <div class="hb-trace panel" data-in="right" style="--d:150ms; top:355px; height:395px"></div>`,
    init(ctx) {
      const d = ctx.data;
      setupBuildLike(ctx, { scene: { values: LIST }, code: BUILD_CODE });
      d.lines = { sift: 2, compare: 6, ok: 7, swap: 8, leaf: 4, settled: 2, done: 0 };
      d.say = buildSay;
      d.before = [null].concat(BUILD.events[0].a);
      d.caption.el.innerHTML = L('List ' + LIST.join(', ') + ' — put the keys in the tree in the given order.',
        'Liste ' + LIST.join(', ') + ' — anahtarları verilen sırayla ağaca yerleştir.');
      d.caption.html = d.caption.el.innerHTML;
      for (const e of BUILD_GROUPS[0]) if (e.t === 'row') d.table.add(e.vals, null);
    },
    async step(n, ctx) {
      const d = ctx.data;
      d.before = [null].concat(d.scene.pos.slice(1));
      await playGroup(ctx, BUILD_GROUPS[n]);
      if (n === BUILD_GROUPS.length - 1) {
        for (let p = 1; p <= 6; p++) d.scene.mark(p, 'ok');
        d.scene.mark(1, 'max');
        await d.scene.crown(true);
        if (!Anim.isInstant()) {
          const c = d.scene.slotXY(1), st = d.scene.toStage(c.x, c.y);
          FX.burst(st.x, st.y - 40, { count: 60, spread: Math.PI * 0.9 });
        }
      }
    },
  });

  /* ======================================================================
   * 12 · Heapsort (stage 2)
   * ==================================================================== */
  const SORT = H.sortStage(BUILD.ids, LIST);
  const SORT_GROUPS = clickGroups(SORT.events);   // [setup, swapRoot(6), sift…, swapRoot(5), …]
  const SORT_CODE = [
    'Algorithm HeapSort(H[1..n])',
    'HeapBottomUp(H)              // stage 1: build',
    'for m ← n downto 2 do        // stage 2',
    '    swap H[1], H[m]          // max to the end',
    '    sift H[1] down in H[1..m−1]',
  ];

  function sortSay(group, d) {
    const s = d.scene;
    const sr = group.find((e) => e.t === 'swapRoot');
    const sift = group.find((e) => e.t === 'sift');
    const done = group.find((e) => e.t === 'done');
    if (done) return L('Sorted! ' + K('2, 5, 6, 7, 8, 9', 'ok'), 'Sıralandı! ' + K('2, 5, 6, 7, 8, 9', 'ok'));
    if (sr) {
      const max = s.values[d.before[1]], last = s.values[d.before[sr.j]];
      return L('Swap the max ' + K(max, 'star') + ' with the last key ' + K(last, 'swap') + ': ' + K(max, 'ok') + ' is now in its final place 🔒',
        'En büyük ' + K(max, 'star') + ' ile son anahtar ' + K(last, 'swap') + ' yer değiştirir: ' + K(max, 'ok') + ' artık son yerinde 🔒');
    }
    if (sift) {
      const swp = group.filter((e) => e.t === 'swap');
      const k = s.values[d.before[1]];
      return swp.length
        ? L('Sift ' + K(k, 'cmp') + ' down: swap with the larger child until the heap holds', K(k, 'cmp') + ' aşağı iner: heap sağlanana kadar büyük çocukla yer değiştir')
        : L(K(k, 'ok') + ' is already ≥ its child: nothing to do', K(k, 'ok') + ' zaten çocuğundan ≥: bir şey yapma');
    }
    return '';
  }

  Deck.add({
    id: 'heapsort', act: 'heap', steps: 4,
    title: { en: 'Heapsort: remove the max, again and again', tr: 'Heapsort: en büyüğü tekrar tekrar çıkar' },
    html: `
      ${counters()}
      <div class="hb-scene"></div>
      <div class="hb-caption caption"></div>
      <div class="hb-legend">${Viz.legend(['cmp', 'swap', 'sorted'])}</div>
      <div class="hb-code panel" data-in="right"></div>
      <div class="hb-trace panel" data-in="right" style="--d:150ms; top:255px; height:495px"></div>`,
    init(ctx) {
      const d = ctx.data;
      setupBuildLike(ctx, { scene: { values: LIST, ids: BUILD.ids, divider: true }, code: SORT_CODE });
      d.lines = { swapRoot: 4, lock: 4, sift: 5, compare: 5, swap: 5, ok: 5, done: 0 };
      d.say = sortSay;
      d.before = [null].concat(BUILD.ids);
      d.code.line(2);
      d.caption.el.innerHTML = L('Stage 1 gave us the heap ' + K('9 6 8 2 5 7', 'star') + '. Now stage 2.',
        'Aşama 1 bize ' + K('9 6 8 2 5 7', 'star') + ' heap’ini verdi. Şimdi aşama 2.');
      d.caption.html = d.caption.el.innerHTML;
      d.table.add(BUILD.ids.map((id) => LIST[id]), null, { noDiff: true });
      d.scene.mark(1, 'max');
    },
    async step(n, ctx) {
      const d = ctx.data;
      const sc = d.scene;
      sc.mark(1, 'max', false);
      if (n === 1 || n === 2) {
        d.before = [null].concat(sc.pos.slice(1));
        await playGroup(ctx, SORT_GROUPS[n]);
      } else if (n === 3) {
        // autoplay every remaining group, a little faster
        const speed = Anim.timeScale;
        Anim.timeScale = speed * 1.7;
        try {
          for (let g = 3; g < SORT_GROUPS.length - 1; g++) {
            d.before = [null].concat(sc.pos.slice(1));
            await playGroup(ctx, SORT_GROUPS[g]);
            await Anim.wait(120);
          }
        } finally { Anim.timeScale = speed; }
      } else if (n === 4) {
        d.before = [null].concat(sc.pos.slice(1));
        await playGroup(ctx, SORT_GROUPS[SORT_GROUPS.length - 1]);
        for (let p = 1; p <= 6; p++) sc.mark(p, 'sorted');
        if (!Anim.isInstant()) {
          const c = sc.cellXY(3.5), st = sc.toStage(c.x, c.y);
          FX.burst(st.x, st.y, { count: 110 });
        }
      }
    },
  });

  /* ======================================================================
   * 13 · Analysis
   * ==================================================================== */
  const LEVELS = [
    { n: 1, h: 3 }, { n: 2, h: 2 }, { n: 4, h: 1 }, { n: 8, h: 0 },
  ];
  Deck.add({
    id: 'heap-analysis', act: 'heap', steps: 4,
    title: { en: 'How fast is heapsort?', tr: 'Heapsort ne kadar hızlı?' },
    html: `
      <div class="an-grid" style="height:420px; grid-template-rows: 1fr">
        <div class="panel ticks an-card" data-step="1">
          <h3>${L('Stage 1 · build', 'Aşama 1 · kurma')} <span class="badge-o">Θ(n)</span></h3>
          <div class="an-levels">
            ${LEVELS.map((l) => `<div class="an-level"><span>${l.n} ${L(l.n === 1 ? 'node' : 'nodes', 'düğüm')} × ≤${l.h} ${L(l.h === 1 ? 'level' : 'levels', 'seviye')}</span>
              <div class="bar" data-w="${(2 * l.n * l.h) / 8}" style="transform:scaleX(0)"></div><b>${2 * l.n * l.h}</b></div>`).join('')}
          </div>
          <div class="an-total">${L('2 comparisons per level · n = 15 → at most', 'seviye başına 2 karşılaştırma · n = 15 → en fazla')} <b class="an-sum">0</b> = 2(n − log₂(n+1)) <span class="c-ok">≤ 2n</span></div>
        </div>
        <div class="panel ticks an-card" data-step="2">
          <h3>${L('Stage 2 · sort', 'Aşama 2 · sıralama')} <span class="badge-o">Θ(n log n)</span></h3>
          <svg class="an-sortviz" viewBox="0 0 700 210" width="700" height="210" aria-hidden="true"></svg>
          <div class="an-total">${L('n − 1 root removals × at most 2 log₂ n comparisons each', 'n − 1 kök çıkarma × her biri en fazla 2 log₂ n karşılaştırma')}</div>
        </div>
      </div>
      <div class="an-grid" style="top:450px; height:300px">
        <div class="panel an-card" data-step="3">
          <h3>${L('Total', 'Toplam')} <span class="badge-o">Θ(n log n)</span></h3>
          <p class="txt" style="margin-top:12px">${L('Worst case <b>and</b> average case: no Θ(n²) surprise, unlike quicksort.<br><span class="c-ok">In-place ✓</span> only swaps inside the array, no second array.',
            'En kötü <b>ve</b> ortalama durumda: quicksort’taki gibi Θ(n²) sürprizi yok.<br><span class="c-ok">Yerinde ✓</span> sadece dizi içinde takas, ikinci dizi yok.')}</p>
        </div>
        <div class="panel an-card" data-step="4">
          <h3>${L('Stable?', 'Kararlı mı?')} <span class="badge-o bad">${L('no ✗', 'hayır ✗')}</span></h3>
          <div class="an-stab">
            <div class="an-chip" style="--c:var(--cmp)">1<sub>a</sub></div>
            <div class="an-chip" style="--c:var(--reduce)">1<sub>b</sub></div>
            <svg width="80" height="40" viewBox="0 0 80 40" aria-hidden="true"><path d="M4,20 H70" style="stroke:var(--ink-2);stroke-width:4" marker-end="url(#arrow-ink)"/></svg>
            <div class="an-out" style="display:flex; gap:26px"></div>
          </div>
          <p class="small muted" style="margin-top:12px">${L('Equal keys can swap their order.', 'Eşit anahtarlar sıralarını değiştirebilir.')}</p>
        </div>
      </div>`,
    init(ctx) {
      // stage-2 visual: one bar per removal, height = 2⌊log₂ i⌋ comparisons
      const svg = ctx.$('.an-sortviz');
      const n = 15;
      for (let i = n; i >= 2; i--) {
        const x = 10 + (n - i) * 48;
        const hgt = 2 * Math.floor(Math.log2(i - 1 || 1)) * 24 + 8;
        const r = U.s('rect', { x, y: 200 - hgt, width: 34, height: hgt, rx: 5, style: 'fill:var(--represent)' });
        r.dataset.bar = '';
        Anim.set(r, { scale: 0.001 });
        svg.appendChild(r);
      }
    },
    async step(n, ctx) {
      if (n === 1) {
        const bars = ctx.$$('.an-level .bar');
        await Anim.stagger(bars, (b, i, delay) => Anim.run((p) => { b.style.transform = 'scaleX(' + (Number(b.dataset.w) * Math.min(1, p)) + ')'; }, { dur: 600, delay, ease: 'outBack' }), 180);
        await FX.count(ctx.$('.an-sum'), 0, 22, { dur: 900 });
      } else if (n === 2) {
        const bars = ctx.$$('.an-sortviz rect');
        await Anim.stagger(bars, (b, i, delay) => Anim.to(b, { scale: 1 }, { dur: 380, delay, ease: 'outBack' }), 60);
      } else if (n === 4) {
        const out = ctx.$('.an-out');
        const chips = ctx.$$('.an-stab > .an-chip');
        const b = chips[1].cloneNode(true), a = chips[0].cloneNode(true);
        out.append(b, a);
        Anim.set(b, { opacity: 0, x: -140 }); Anim.set(a, { opacity: 0, x: -260 });
        await Promise.all([
          Anim.to(b, { opacity: 1, x: 0 }, { dur: 700, arc: 40 }),
          Anim.to(a, { opacity: 1, x: 0 }, { dur: 700, delay: 120, arc: -40 }),
        ]);
      }
    },
  });

  /* ======================================================================
   * 14 · Priority queue + insertion
   * ==================================================================== */
  const INS = H.insert([9, 6, 8, 2, 5, 7], 10);
  const ICON = {
    find: '<svg class="ico" viewBox="-32 -32 64 64"><path d="' + Viz.ICONS.crown + '" transform="scale(0.8)" style="fill:var(--star)"/></svg>',
    del: '<svg class="ico" viewBox="-32 -32 64 64"><circle r="22" style="fill:none;stroke:var(--swap);stroke-width:5"/><path d="M-12,0 H12" style="stroke:var(--swap);stroke-width:6"/></svg>',
    ins: '<svg class="ico" viewBox="-32 -32 64 64"><circle r="22" style="fill:none;stroke:var(--ok);stroke-width:5"/><path d="M-12,0 H12 M0,-12 V12" style="stroke:var(--ok);stroke-width:6"/></svg>',
  };
  Deck.add({
    id: 'priority-queue', act: 'heap', steps: 3,
    title: { en: 'Heaps power priority queues', tr: 'Öncelik kuyruklarının motoru: heap' },
    html: `
      <div class="pq-ops">
        <div class="panel pq-op" data-step="1" data-anim="left">${ICON.find}
          <div><h3>${L('find max', 'en büyüğü bul')}</h3><p>${L('it is H[1]', 'H[1]’de durur')}</p></div><span class="badge-o ok">O(1)</span></div>
        <div class="panel pq-op" data-step="1" data-anim="left" style="--d:150ms">${ICON.del}
          <div><h3>${L('delete max', 'en büyüğü sil')}</h3><p>${L('root ↔ last, sift down', 'kök ↔ son, aşağı it')}</p></div><span class="badge-o">O(log n)</span></div>
        <div class="panel pq-op" data-step="1" data-anim="left" style="--d:300ms">${ICON.ins}
          <div><h3>${L('insert', 'ekle')}</h3><p>${L('add at the end, sift up', 'sona ekle, yukarı it')}</p></div><span class="badge-o">O(log n)</span></div>
        <p class="txt" data-step="1" style="--d:450ms">${L('Emergency room, CPU scheduler, Dijkstra: always serve the most urgent first.',
          'Acil servis, işlemci zamanlayıcı, Dijkstra: her zaman önce en acil olan.')}</p>
      </div>
      <div class="pq-queue" data-step="1" data-anim="fade" style="--d:600ms">
        <div class="pq-door"><svg viewBox="-30 -36 60 72" width="54" height="64" aria-hidden="true">
          <rect x="-24" y="-34" width="48" height="68" rx="6" style="fill:none;stroke:var(--ok);stroke-width:4"/>
          <path d="M-8,0 h16 M0,-8 v16" style="stroke:var(--ok);stroke-width:5"/></svg></div>
        <div class="pq-line" data-ambient>${[3, 9, 5, 7, 2].map((v) => `<span class="pq-p" data-v="${v}">
          <svg viewBox="-16 -20 32 40" width="34" height="42" aria-hidden="true"><circle cy="-11" r="7" style="fill:var(--ink-2)"/>
          <path d="M-12,18 v-8 a12,12 0 0 1 24,0 v8 z" style="fill:var(--ink-2)"/></svg><b>${v}</b></span>`).join('')}</div>
      </div>
      <div class="pq-scene"></div>
      <div class="pq-caption caption"></div>`,
    init(ctx) {
      const d = ctx.data;
      d.scene = new HeapScene(ctx.$('.pq-scene'), {
        width: 1000, height: 640, values: [9, 6, 8, 2, 5, 7], slots: 7, ghosts: true,
        tree: { x: 40, y: 60, w: 920, gap: 150, r: 44 },
        array: { x: 51, y: 470, cell: 116, gap: 14 },
      });
      d.caption = new Viz.Caption(ctx.$('.pq-caption'));
    },
    enter(ctx) {
      const pats = ctx.$$('.pq-p');
      const top = pats.find((p) => p.dataset.v === '9');
      const line = ctx.$('.pq-line');
      ctx.loop(async (A) => {
        if (ctx.step < 1) { await A.wait(400); return; }
        await A.wait(1600);
        top.classList.add('urgent');
        const dx = line.offsetLeft + 8 - top.offsetLeft;   // into the free spot by the door (decorative)
        await A.to(top, { x: dx, y: -6 }, { dur: 900, arc: 50, ease: 'inOut' });
        await A.wait(1300);
        await A.to(top, { x: 0, y: 0, opacity: 1 }, { dur: 700 });
        top.classList.remove('urgent');
      });
    },
    async step(n, ctx) {
      const d = ctx.data, sc = d.scene;
      if (n === 2) {
        d.caption.set(L('Insert ' + K(10, 'star') + ' at the end: position 7', K(10, 'star') + ' sona eklenir: 7. konum'));
        await sc.apply(INS.events.find((e) => e.t === 'append'));
      } else if (n === 3) {
        d.caption.set(L(K(10, 'star') + ' bubbles up while it beats its parent: 10 &gt; 8, 10 &gt; 9 → root. At most h = log₂ n swaps.',
          K(10, 'star') + ' ebeveyninden büyük oldukça yukarı çıkar: 10 &gt; 8, 10 &gt; 9 → kök. En fazla h = log₂ n takas.'));
        for (const e of INS.events) {
          if (e.t === 'compareUp' || e.t === 'swap' || e.t === 'ok') await sc.apply(e);
        }
        sc.clear();
        sc.mark(1, 'max');
        await sc.crown(true);
      }
    },
  });

  // exported for the playground slide
  window.HeapSlides = { clickGroups, playGroup, BUILD_CODE };
})();
