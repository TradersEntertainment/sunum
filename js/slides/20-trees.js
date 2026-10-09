/* Search trees (Levitin §6.3): the BST problem, AVL trees, 2-3 trees. */
(function () {
  'use strict';

  const B = Algo.bst;
  const T3 = Algo.tree23;
  const K = Viz.K;
  const list = (keys, cls) => keys.map((k) => K(k, cls || 'star')).join(', ');

  /* Bilingual SVG text as markup (for static drawings inside html). */
  function svgT(x, y, en, tr, cls) {
    const a = ' x="' + x + '" y="' + y + '" class="' + cls + '"';
    return '<text lang="en"' + a + '>' + en + '</text><text lang="tr"' + a + '>' + tr + '</text>';
  }

  /* Caption changes cross-fade alongside the animation; a step waits for
   * them at its end so nothing is left pending. */
  function narrate(d, html) { (d.talk || (d.talk = [])).push(d.caption.set(html)); }
  function hush(d) { return Promise.all((d.talk || []).splice(0)); }

  /* Fade-and-rise reveal for HTML/SVG pieces hidden in init. */
  function hideForReveal(el, dy) { Anim.set(el, { opacity: 0, y: dy == null ? 16 : dy }); }
  function reveal(el, o) { return Anim.to(el, { opacity: 1, y: 0 }, Object.assign({ dur: 450, ease: 'out' }, o)); }

  /* Clockwise / counter-clockwise rotation icons (R = clockwise, L = counter). */
  function rotIcon(kind) {
    const d = kind === 'L' ? 'M39,30 A16,16 0 1 0 9,30' : 'M9,30 A16,16 0 1 1 39,30';
    return '<span class="rot-ico" data-k="' + kind + '"><svg viewBox="0 0 48 48" width="56" height="56" aria-hidden="true">'
      + '<path d="' + d + '" marker-end="url(#arrow-swap)"/></svg><b>' + kind + '</b></span>';
  }

  /* ======================================================================
   * The BST problem: random order gives a bushy tree, sorted order a stick
   * ==================================================================== */
  const BP_A = [5, 3, 1, 10, 12, 7, 9];
  const BP_B = [1, 2, 3, 4, 5, 6, 7];
  const RUN_A = B.bstInsertAll(BP_A);
  const RUN_B = B.bstInsertAll(BP_B);
  const BP_GEOM = { width: 800, height: 600, x0: 90, colW: 100, y0: 130, rowH: 66, r: 34 };

  /* Faint level lines with their depth number; shown as levels fill up. */
  function levelLines(view, count) {
    const g = U.s('g', { class: 'bp-levels' });
    view.gUnder.appendChild(g);
    const items = [];
    for (let dp = 0; dp < count; dp++) {
      const y = view.rowY(dp);
      const it = U.s('g', { class: 'bp-lev' });
      it.appendChild(U.s('line', { x1: 66, x2: 796, y1: y, y2: y }));
      it.appendChild(U.s('text', { x: 40, y }, String(dp)));
      Anim.set(it, { opacity: 0 });
      g.appendChild(it);
      items.push(it);
    }
    return items;
  }

  async function buildTree(view, queue, run, levels, o) {
    const fades = [];
    for (let i = 0; i < run.events.length; i++) {
      const e = run.events[i];
      queue.use(i);
      await view.insert(e.key, e.path, e.snap, Object.assign({ from: queue.pos(i), overlap: true }, o));
      const lv = levels[e.path.length];
      if (lv && !lv.classList.contains('shown')) {
        lv.classList.add('shown');
        fades.push(Anim.to(lv, { opacity: 1 }, { dur: 300 }));
      }
    }
    await view.settle();
    await Promise.all(fades);
    view.clear(['new']);
  }

  /* Mini drawings for the two remedies (static SVG). */
  function miniNode(x, y, k) {
    return '<g class="node" transform="translate(' + x + ',' + y + ')"><circle class="disc" r="27"/><text class="key" style="font-size:34px">' + k + '</text></g>';
  }
  function artBalanced() {
    const P = { 4: [165, 46], 2: [85, 128], 6: [245, 128], 1: [45, 210], 3: [125, 210], 5: [205, 210], 7: [285, 210] };
    const E = [[4, 2], [4, 6], [2, 1], [2, 3], [6, 5], [6, 7]];
    return E.map(([a, b]) => '<line class="edge" x1="' + P[a][0] + '" y1="' + P[a][1] + '" x2="' + P[b][0] + '" y2="' + P[b][1] + '"/>').join('')
      + Object.keys(P).map((k) => miniNode(P[k][0], P[k][1], k)).join('')
      + '<text class="bp-art-h" x="165" y="272">h = 2</text>';
  }
  function miniBox(cx, cy, keys) {
    const slot = 46, pad = 8, w = 2 * pad + keys.length * slot, h = 58;
    const x = cx - w / 2, y = cy - h / 2;
    let s = '<rect class="tt-box" x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="16"/>';
    for (let j = 1; j < keys.length; j++) s += '<path class="tt-div" d="M' + (x + pad + slot * j) + ',' + (y + 11) + 'V' + (y + h - 11) + '"/>';
    keys.forEach((k, i) => { s += '<text class="bp-art-key" x="' + (x + pad + slot * (i + 0.5)) + '" y="' + cy + '">' + k + '</text>'; });
    return s;
  }
  function art23() {
    const root = [165, 70], L1 = [[69, 196, [1, 2]], [166, 196, [4]], [263, 196, [6, 7]]];
    const anchors = [128, 166, 204];
    return L1.map((l, i) => '<line class="edge" x1="' + anchors[i] + '" y1="' + (root[1] + 26) + '" x2="' + l[0] + '" y2="' + (l[1] - 26) + '"/>').join('')
      + miniBox(root[0], root[1], [3, 5]) + L1.map((l) => miniBox(l[0], l[1], l[2])).join('')
      + '<text class="bp-art-h" x="165" y="272">h = 1</text>';
  }

  Deck.add({
    id: 'bst-problem', act: 'simplify', steps: 3,
    title: { en: 'Binary search trees: shape decides speed', tr: 'İkili arama ağacı: hızı şekil belirler' },
    html: `
      <div class="bp-panel bp-a" data-hide="3">
        <div class="bp-tag"><span class="pill">${L('keys arrive in random order', 'anahtarlar karışık sırayla gelir')}</span></div>
        <div class="bp-scene"></div>
        <div class="bp-res">
          <span class="bp-h c-ok">h = 3</span><span class="bp-eq">≈ log₂ n</span>
          <span class="bp-cost">${L('search', 'arama')}</span><span class="badge-o ok">O(log n)</span>
        </div>
      </div>
      <div class="panel ticks bp-rule" data-in="up" data-hide="2">
        <svg viewBox="0 0 300 200" width="300" height="200" aria-hidden="true">
          <line class="edge" x1="138" y1="58" x2="84" y2="112"/><line class="edge" x1="162" y1="58" x2="216" y2="112"/>
          <path class="bp-tri l" d="M84,104 l-46,74 h92 Z"/><path class="bp-tri r" d="M216,104 l-46,74 h92 Z"/>
          <g class="node" transform="translate(150,44)"><circle class="disc" r="34"/><text class="key">k</text></g>
          <text class="bp-tri-t" x="84" y="160">&lt; k</text><text class="bp-tri-t" x="216" y="160">&gt; k</text>
        </svg>
        <div class="bp-rule-txt">
          <h3>${L('Binary search tree (BST)', 'İkili arama ağacı (BST)')}</h3>
          <p>${L('Smaller keys go <b>left</b>, larger keys go <b>right</b>.', 'Küçük anahtarlar <b>sola</b>, büyükler <b>sağa</b> gider.')}</p>
          <p>${L('A search walks <b>one path</b> down from the root: at most <b>h + 1</b> comparisons.', 'Arama kökten <b>tek bir yol</b> boyunca iner: en fazla <b>h + 1</b> karşılaştırma.')}</p>
        </div>
      </div>
      <div class="bp-bwrap">
        <div class="bp-panel bp-b" data-step="2" data-anim="fade">
          <div class="bp-tag"><span class="pill bad">${L('keys arrive already sorted', 'anahtarlar sıralı gelir')}</span></div>
          <div class="bp-scene"></div>
          <div class="bp-res">
            <span class="bp-h c-bad">h = 6</span><span class="bp-eq">= n − 1</span>
            <span class="bp-cost">${L('search', 'arama')}</span><span class="badge-o bad">O(n)</span>
            <span class="bp-x">${Viz.stamp(false)}</span>
          </div>
          <div class="bp-list">${L('just a linked list!', 'resmen bir bağlı liste!')}</div>
        </div>
      </div>
      <svg class="bp-fork" width="120" height="750" viewBox="0 0 120 750" aria-hidden="true">
        <path class="bp-fork-line" d="M10,372 C60,372 50,190 104,190" style="stroke:var(--simplify)"/>
        <path class="bp-fork-head" d="M94,180 L112,190 L94,200 Z" style="fill:var(--simplify)"/>
        <path class="bp-fork-line" d="M10,378 C60,378 50,570 104,570" style="stroke:var(--represent)"/>
        <path class="bp-fork-head" d="M94,560 L112,570 L94,580 Z" style="fill:var(--represent)"/>
      </svg>
      <div class="panel ticks bp-door bp-d1" data-step="3" data-anim="right" style="--act:var(--simplify); --d:450ms">
        <svg class="bp-art" viewBox="0 0 330 290" width="330" height="290" aria-hidden="true">${artBalanced()}</svg>
        <div class="bp-door-txt">
          <span class="pill">${L('instance simplification', 'örneği basitleştirme')}</span>
          <h3>${L('Keep the tree balanced', 'Ağacı dengede tut')}</h3>
          <p>${L('AVL trees, red-black trees', 'AVL ağaçları, kırmızı-siyah ağaçlar')}</p>
        </div>
      </div>
      <div class="panel ticks bp-door bp-d2" data-step="3" data-anim="right" style="--act:var(--represent); --d:700ms">
        <svg class="bp-art" viewBox="0 0 330 290" width="330" height="290" aria-hidden="true">${art23()}</svg>
        <div class="bp-door-txt">
          <span class="pill">${L('representation change', 'gösterimi değiştirme')}</span>
          <h3>${L('Allow more keys per node', 'Düğüme birden çok anahtar koy')}</h3>
          <p>${L('2-3 trees, 2-3-4 trees, B-trees', '2-3 ağaçları, 2-3-4 ağaçları, B-ağaçları')}</p>
        </div>
      </div>`,
    init(ctx) {
      const d = ctx.data;
      const mk = (sel, keys) => new BinTreeView(ctx.$(sel), Object.assign({ keys }, BP_GEOM));
      d.A = mk('.bp-a .bp-scene', BP_A);
      d.B = mk('.bp-b .bp-scene', BP_B);
      d.qA = new TreeQueue(d.A.gUnder, BP_A, { x: 440, y: 36, size: 58, gap: 14 });
      d.qB = new TreeQueue(d.B.gUnder, BP_B, { x: 440, y: 36, size: 58, gap: 14 });
      d.levA = levelLines(d.A, 4);
      d.levB = levelLines(d.B, 7);
      // dashed ghost where the first key (the root) will land
      d.ghosts = [[d.A, BP_A[0]], [d.B, BP_B[0]]].map(([v, k]) => {
        const c = U.s('circle', { class: 'slot-ghost', cx: v.colX(k), cy: v.rowY(0), r: v.R });
        v.gUnder.appendChild(c);
        return c;
      });
      d.resA = ctx.$('.bp-a .bp-res');
      d.resB = ctx.$('.bp-b .bp-res');
      d.note = ctx.$('.bp-list');
      [d.resA, d.resB, d.note].forEach((el) => hideForReveal(el));
      d.forkLines = ctx.$$('.bp-fork-line');
      d.forkHeads = ctx.$$('.bp-fork-head');
      d.forkLines.forEach((p) => { p.setAttribute('pathLength', '1'); p.style.strokeDasharray = '1 1'; p.style.strokeDashoffset = '1'; });
      d.forkHeads.forEach((h) => Anim.set(h, { opacity: 0, scale: 0.3 }));
      // hand-drawn arrow from the note to the stick
      const v = d.B, n4 = { x: v.colX(4), y: v.rowY(3) };
      d.noteArrow = Viz.hiddenPath({      // arrowhead added once the stroke is drawn
        class: 'bp-note-arrow',
        d: 'M300,478 C350,440 360,' + (n4.y + 60) + ' ' + (n4.x - 30) + ',' + (n4.y + 30),
      });
      v.gOver.appendChild(d.noteArrow);
    },
    async step(n, ctx) {
      const d = ctx.data;
      if (n === 1) {
        const gone = Anim.to(d.ghosts[0], { opacity: 0 }, { dur: 300 });
        await buildTree(d.A, d.qA, RUN_A, d.levA, { fly: 170, hop: 90, hold: 30, pop: 260 });
        await gone;
        d.levA[3].classList.add('hi', 'ok');
        await reveal(d.resA);
      } else if (n === 2) {
        await Anim.wait(200);
        const gone = Anim.to(d.ghosts[1], { opacity: 0 }, { dur: 300 });
        await buildTree(d.B, d.qB, RUN_B, d.levB, { fly: 160, hop: 56, hold: 6, pop: 240 });
        await gone;
        d.levB[6].classList.add('hi', 'bad');
        await Promise.all([reveal(d.resB), reveal(d.note, { delay: 150 }),
          Viz.draw(d.noteArrow, { dur: 550, delay: 150 }).then(() => d.noteArrow.setAttribute('marker-end', 'url(#arrow-star)'))]);
      } else if (n === 3) {
        const move = Anim.to(ctx.$('.bp-bwrap'), { x: -900 }, { dur: 900, ease: 'inOut' });
        await Anim.wait(650);
        await Promise.all(d.forkLines.map((line, i) => Viz.draw(line, { dur: 450, delay: 180 * i })
          .then(() => Anim.to(d.forkHeads[i], { opacity: 1, scale: 1 }, { dur: 200, ease: 'outBack' }))));
        await move;
      }
    },
  });

  /* ======================================================================
   * AVL trees: insert 5 6 8 3 2 4 7, one click per rotation
   * ==================================================================== */
  const AVL_KEYS = [5, 6, 8, 3, 2, 4, 7];
  const AVL = B.avlInsertAll(AVL_KEYS);
  const AVL_CLICKS = [];
  {
    let cur = [];
    for (const e of AVL.events) { cur.push(e); if (e.t === 'rotate') { AVL_CLICKS.push(cur); cur = []; } }
  }
  const AVL_SAY = {
    'L(5)': {
      ins: L('Insert ' + list([5, 6, 8]) + ' — the pill above a node is its balance factor',
        list([5, 6, 8]) + ' eklenir — her düğümün üstündeki sayı, o düğümün denge faktörü'),
      unb: L('Node ' + K(5, 'bad') + ': bf = ' + K(-2, 'bad') + ', its right side is two levels taller ✗',
        K(5, 'bad') + ' düğümü: bf = ' + K(-2, 'bad') + ', sağ tarafı iki seviye daha uzun ✗'),
      rot: L(K('L(5)', 'swap') + ': rotate left at 5 — ' + K(6, 'swap') + ' goes up, ' + K(5, 'swap') + ' comes down',
        K('L(5)', 'swap') + ': 5’te sola döndür — ' + K(6, 'swap') + ' yukarı çıkar, ' + K(5, 'swap') + ' aşağı iner'),
    },
    'R(5)': {
      ins: L('Insert ' + list([3, 2]), list([3, 2]) + ' eklenir'),
      unb: L(K(6, 'bad') + ' and ' + K(5, 'bad') + ' are both at bf = ' + K(2, 'bad') + ' — fix the lowest one, 5',
        K(6, 'bad') + ' ve ' + K(5, 'bad') + ' düğümlerinde bf = ' + K(2, 'bad') + ' — en alttakini, yani 5’i düzelt'),
      rot: L(K('R(5)', 'swap') + ': rotate right at 5 — ' + K(3, 'swap') + ' goes up',
        K('R(5)', 'swap') + ': 5’te sağa döndür — ' + K(3, 'swap') + ' yukarı çıkar'),
    },
    'LR(6)': {
      ins: L('Insert ' + list([4]), list([4]) + ' eklenir'),
      unb: L('Node ' + K(6, 'bad') + ': bf = ' + K(2, 'bad') + ', and the path down to 4 zig-zags: left, then right',
        K(6, 'bad') + ' düğümü: bf = ' + K(2, 'bad') + ' ve 4’e inen yol zikzak çiziyor: önce sol, sonra sağ'),
      rot: L(K('LR(6)', 'swap') + ': two rotations — L at 3, then R at 6; ' + K(5, 'swap') + ' rises to the top',
        K('LR(6)', 'swap') + ': iki döndürme — önce 3’te L, sonra 6’da R; ' + K(5, 'swap') + ' en üste çıkar'),
    },
    'RL(6)': {
      ins: L('Insert ' + list([7]), list([7]) + ' eklenir'),
      unb: L('Node ' + K(6, 'bad') + ': bf = ' + K(-2, 'bad') + ', a zig-zag again: right, then left',
        K(6, 'bad') + ' düğümü: bf = ' + K(-2, 'bad') + ', yine zikzak: önce sağ, sonra sol'),
      rot: L(K('RL(6)', 'swap') + ': R at 8, then L at 6 — ' + K(7, 'swap') + ' goes up',
        K('RL(6)', 'swap') + ': önce 8’de R, sonra 6’da L — ' + K(7, 'swap') + ' yukarı çıkar'),
    },
  };
  const AVL_IDLE = '<span class="avl-rot-idle">' + L('appears when |bf| = 2', '|bf| = 2 olunca devreye girer') + '</span>';
  /* The two edges below the unbalanced node, toward the new key: a straight
   * line means a single rotation, a zig-zag a double one. */
  function heavyPath(snap, at, key) {
    const c = key < at ? snap.nodes[at].l : snap.nodes[at].r;
    const g = key < c ? snap.nodes[c].l : snap.nodes[c].r;
    return [at, c, g];
  }
  const AVL_FINAL = L('Balanced ✓ and still sorted: ' + K('2, 3, 4, 5, 6, 7, 8', 'ok') + ' — rotations never change the order',
    'Dengeli ✓ ve hâlâ sıralı: ' + K('2, 3, 4, 5, 6, 7, 8', 'ok') + ' — döndürmeler sırayı hiç bozmaz');
  const AVL_REAL = [
    { icon: 'terminal', who: { en: 'Linux kernel', tr: 'Linux çekirdeği' }, en: 'The CPU scheduler keeps runnable tasks in a red-black tree, the AVL tree’s cousin, and runs the leftmost one.', tr: 'İşlemci zamanlayıcısı, çalışmaya hazır işlemleri AVL’nin kuzeni olan bir red-black ağaçta tutar ve en soldakini çalıştırır.' },
    { icon: 'code', who: 'Java TreeMap · C++ std::map', en: 'Sorted maps in standard libraries are self-balancing (red-black) trees: Θ(log n) per operation.', tr: 'Standart kütüphanelerdeki sıralı map’ler kendini dengeleyen (red-black) ağaçlardır: işlem başına Θ(log n).' },
    { icon: 'hash', who: 'Java HashMap (Java 8+)', en: 'A crowded hash bucket turns into a balanced tree, so its worst case drops from n to log n.', tr: 'Kalabalıklaşan bir hash kovası dengeli bir ağaca dönüşür; en kötü durum n’den log n’e iner.' },
  ];

  Deck.add({
    id: 'avl', act: 'simplify', steps: 5,
    title: { en: 'AVL trees: rotate to stay balanced', tr: 'AVL ağaçları: dengede kalmak için döndür' },
    html: `
      <div class="avl-left" data-hide="5">
        <div class="panel ticks avl-def" data-in="left">
          <h3>${L('Balance factor', 'Denge faktörü')}</h3>
          <svg class="avl-defviz" viewBox="0 0 470 156" width="470" height="156" aria-hidden="true">
            <path class="avl-tri l" d="M200,52 L150,128 L250,128 Z"/>
            <path class="avl-tri r" d="M292,52 L268,94 L316,94 Z"/>
            <line class="edge" x1="246" y1="28" x2="200" y2="54"/><line class="edge" x1="246" y1="28" x2="292" y2="54"/>
            <circle class="avl-v" cx="246" cy="26" r="20"/>
            <path class="avl-dim l" d="M122,52 V128 M114,52 H130 M114,128 H130"/>
            <path class="avl-dim r" d="M344,52 V94 M336,52 H352 M336,94 H352"/>
            <text class="avl-dimt l" x="106" y="90">h</text>
            <text class="avl-dimt r" x="362" y="73">h</text>
            ${svgT(200, 150, 'left', 'sol', 'avl-trit l')}
            ${svgT(292, 116, 'right', 'sağ', 'avl-trit r')}
          </svg>
          <div class="avl-formula">bf = h(<span class="c-cmp">${L('left', 'sol')}</span>) − h(<span class="c-star">${L('right', 'sağ')}</span>)</div>
          <div class="avl-allowed">
            <span class="avl-bf">−1</span><span class="avl-bf">0</span><span class="avl-bf">1</span><span class="c-ok avl-mk">✓</span>
            <span class="avl-bf bad">±2</span><span class="c-bad avl-mk">✗</span><span class="avl-then">→ ${L('rotate', 'döndür')}</span>
          </div>
          <p class="avl-empty">${L('empty subtree: height −1', 'boş alt ağaç: yükseklik −1')}</p>
        </div>
        <div class="panel avl-rot" data-in="left" style="--d:150ms">
          <div class="avl-rot-lbl">${L('rotation', 'döndürme (rotation)')}</div>
          <div class="avl-rot-name">${AVL_IDLE}</div>
          <div class="avl-rot-ico"></div>
        </div>
        <div class="avl-log" data-in="left" style="--d:250ms">
          ${AVL.rotations.map((r) => '<span class="avl-log-pill">' + r + '</span>').join('')}
        </div>
      </div>
      <div class="avl-scene"></div>
      <div class="avl-caption caption"></div>
      <div class="avl-stamp">${Viz.stamp(true)}</div>
      ${Viz.real(AVL_REAL, { layout: 'col', cls: 'avl-real', attrs: ' data-step="5" data-anim="left"' })}`,
    init(ctx) {
      const d = ctx.data;
      d.view = new BinTreeView(ctx.$('.avl-scene'), {
        width: 1140, height: 640, keys: AVL_KEYS, x0: 10, colW: 160, y0: 172, rowH: 110, r: 40,
        badges: true, guides: true, axis: 612,
      });
      d.queue = new TreeQueue(d.view.gUnder, AVL_KEYS, { x: 600, y: 40, size: 60, gap: 16, label: ['insert', 'ekle'] });
      d.ghost = U.s('circle', { class: 'slot-ghost', cx: d.view.colX(AVL_KEYS[0]), cy: d.view.rowY(0), r: 40 });
      d.view.gUnder.appendChild(d.ghost);
      d.caption = new Viz.Caption(ctx.$('.avl-caption'));
      d.caption.el.innerHTML = L('AVL tree: a BST in which every node’s balance factor is −1, 0 or 1',
        'AVL ağacı: her düğümün denge faktörünün −1, 0 ya da 1 olduğu bir BST');
      d.caption.html = d.caption.el.innerHTML;
      d.rotBox = ctx.$('.avl-rot');
      d.rotName = ctx.$('.avl-rot-name');
      d.rotIco = ctx.$('.avl-rot-ico');
      d.log = ctx.$$('.avl-log-pill');
      d.log.forEach((p) => Anim.set(p, { opacity: 0, scale: 0.5 }));
      d.stamp = ctx.$('.avl-stamp');
      Anim.set(d.stamp, { opacity: 0, scale: 0.4 });
    },
    async step(n, ctx) {
      const d = ctx.data, v = d.view;
      if (n > AVL_CLICKS.length) return;          // the real-world strip is a fragment
      const G = AVL_CLICKS[n - 1];
      const ins = G.filter((e) => e.t === 'insert');
      const unb = G.find((e) => e.t === 'unbalanced');
      const rot = G.find((e) => e.t === 'rotate');
      const say = AVL_SAY[rot.name];
      d.rotBox.classList.remove('live', 'done');
      d.rotName.innerHTML = AVL_IDLE;
      d.rotIco.innerHTML = '';
      narrate(d, say.ins);
      if (n === 1) Anim.set(d.ghost, { opacity: 0 });
      for (const e of ins) {
        const i = AVL_KEYS.indexOf(e.key);
        d.queue.use(i);
        await v.insert(e.key, e.path, e.snap, { from: d.queue.pos(i), overlap: true });
      }
      await v.settle();
      // out of balance: red node(s), and the path below shows the shape
      v.clear(['new']);
      unb.all.forEach((k) => v.mark(k, 'bad'));
      v.mark(unb.at, 'focus');
      const hp = heavyPath(ins[ins.length - 1].snap, unb.at, ins[ins.length - 1].key);
      v.edgeMark(hp[0], hp[1], 'hot');
      v.edgeMark(hp[1], hp[2], 'hot');
      narrate(d, say.unb);
      await Anim.wait(700);
      // the rotation, named
      v.clearEdges();
      d.rotName.textContent = rot.name;
      d.rotIco.innerHTML = rot.kind.split('').map(rotIcon).join('<i class="rot-then">→</i>');
      d.rotBox.classList.add('live');
      Anim.set(d.rotName, { scale: 0.4, opacity: 0 });
      narrate(d, say.rot);
      const named = Anim.to(d.rotName, { scale: 1, opacity: 1 }, { dur: 380, ease: 'outBack' });
      await Anim.wait(200);
      const icons = Array.from(d.rotIco.querySelectorAll('.rot-ico'));
      await v.rotate(rot, {
        dur: rot.stages.length > 1 ? 700 : 800, gap: 160,
        onStage: (s, i) => icons.forEach((ic, j) => ic.classList.toggle('on', j === i)),
      });
      await named;
      icons.forEach((ic) => ic.classList.remove('on'));
      v.clear(['bad', 'focus']);
      v.markAll('ok');
      d.rotBox.classList.remove('live');
      d.rotBox.classList.add('done');
      const logged = Anim.to(d.log[n - 1], { opacity: 1, scale: 1 }, { dur: 340, ease: 'outBack' });
      if (n < AVL_CLICKS.length) await logged;
      else {
        v.svg.classList.add('sorted');
        narrate(d, AVL_FINAL);
        await Promise.all([logged, Anim.to(d.stamp, { opacity: 1, scale: 1 }, { dur: 420, ease: 'outBack' })]);
        if (!Anim.isInstant()) {
          const c = v.pos(5), st = v.toStage(c.x, c.y);
          FX.burst(st.x, st.y - 40, { count: 70, spread: Math.PI * 0.9 });
        }
      }
      await hush(d);
    },
  });

  /* ======================================================================
   * 2-3 trees: insert 9 5 8 3 2 4 7, splits push the middle key up
   * ==================================================================== */
  const T23_KEYS = [9, 5, 8, 3, 2, 4, 7];
  const T23 = T3.insertAll(T23_KEYS);
  const T23_GROUPS = [[9, 5, 8], [3, 2, 4], [7]];
  const T23_CLICKS = T23_GROUPS.map((keys) => {
    const out = [];
    let on = false;
    for (const e of T23.events) {
      if (e.t === 'insert') on = keys.includes(e.key);
      if (on && e.t !== 'done') out.push(e);
    }
    return out;
  });
  const T23_FINAL = T23.final;
  const T23_REAL = [
    { icon: 'database', who: 'MySQL · PostgreSQL · SQLite', en: 'Every index is a B-tree: the 2-3 tree idea with hundreds of keys per node. About 100 million rows fit in 3–4 levels.', tr: 'Her indeks bir B-ağacıdır: düğüm başına yüzlerce anahtarlı 2-3 ağacı fikri. Yaklaşık 100 milyon satır 3–4 seviyeye sığar.' },
    { icon: 'folder', who: 'NTFS · APFS · Btrfs', en: 'File systems find your files and folders with B-trees.', tr: 'Dosya sistemleri dosya ve klasörlerinizi B-ağaçlarıyla bulur.' },
  ];

  function t23Say(e) {
    const ks = (a) => '[' + a.join(' ') + ']';
    if (e.t === 'overflow') {
      return L(K(ks(e.keys), 'bad') + ' has three keys: too many ✗', K(ks(e.keys), 'bad') + ' üç anahtar tutuyor: fazla ✗');
    }
    if (e.t === 'split') {
      return e.newRoot
        ? L('Split: ' + K(e.up, 'swap') + ' moves up and becomes the new root', 'Bölünme: ' + K(e.up, 'swap') + ' yukarı taşınır ve yeni kök olur')
        : L('Split: ' + K(e.up, 'swap') + ' moves up into the parent', 'Bölünme: ' + K(e.up, 'swap') + ' yukarıdaki düğüme taşınır');
    }
    return '';
  }

  /* Static 2-node / 3-node legend. */
  function t23Legend() {
    const tri = (x, y, label) => '<path class="t23-tri" d="M' + x + ',' + y + ' l-30,58 h60 Z"/>'
      + '<text class="t23-tri-t" x="' + x + '" y="' + (y + 84) + '">' + label + '</text>';
    const box = (cx, cy, keys) => {
      const w = 22 + keys.length * 50, x = cx - w / 2;
      let s = '<rect class="tt-box" x="' + x + '" y="' + (cy - 28) + '" width="' + w + '" height="56" rx="16"/>';
      for (let j = 1; j < keys.length; j++) s += '<path class="tt-div" d="M' + (x + 11 + 50 * j) + ',' + (cy - 18) + 'V' + (cy + 18) + '"/>';
      keys.forEach((k, i) => { s += '<text class="t23-lk" x="' + (x + 11 + 50 * (i + 0.5)) + '" y="' + cy + '">' + k + '</text>'; });
      return s;
    };
    return '<line class="edge" x1="98" y1="62" x2="62" y2="104"/><line class="edge" x1="122" y1="62" x2="158" y2="104"/>'
      + box(110, 36, ['k']) + tri(62, 104, '&lt; k') + tri(158, 104, '&gt; k')
      + '<line class="edge" x1="290" y1="62" x2="252" y2="104"/><line class="edge" x1="330" y1="62" x2="330" y2="104"/><line class="edge" x1="370" y1="62" x2="408" y2="104"/>'
      + box(330, 36, ['a', 'b']) + tri(252, 104, '&lt; a') + tri(330, 104, 'a…b') + tri(408, 104, '&gt; b');
  }

  /* Static "overflow → split" rule picture. */
  function t23Rule() {
    const key = (x, y, k, cls) => '<text class="t23-lk' + (cls ? ' ' + cls : '') + '" x="' + x + '" y="' + y + '">' + k + '</text>';
    return '<rect class="tt-box bad" x="18" y="62" width="172" height="58" rx="16"/>'
      + '<path class="tt-div bad" d="M75,72V110 M133,72V110"/>'
      + key(47, 91, 'a') + key(104, 91, 'b') + key(162, 91, 'c')
      + '<path class="t23-arrow" d="M206,91 H244" marker-end="url(#arrow-ink)"/>'
      + '<line class="edge" x1="345" y1="56" x2="300" y2="104"/><line class="edge" x1="363" y1="56" x2="408" y2="104"/>'
      + '<rect class="tt-box up" x="324" y="2" width="60" height="56" rx="16"/>' + key(354, 30, 'b', 'up')
      + '<rect class="tt-box" x="270" y="104" width="60" height="56" rx="16"/>' + key(300, 132, 'a')
      + '<rect class="tt-box" x="378" y="104" width="60" height="56" rx="16"/>' + key(408, 132, 'c')
      + '<path class="t23-up" d="M300,52 C300,30 312,22 322,22" marker-end="url(#arrow-swap)"/>';
  }

  Deck.add({
    id: 'two-three', act: 'represent', steps: 5,
    title: { en: '2-3 trees: a full node splits in two', tr: '2-3 ağaçları: dolan düğüm ikiye bölünür' },
    html: `
      <div class="t23-left" data-hide="5">
        <div class="panel ticks t23-legend" data-in="left">
          <svg viewBox="0 0 440 200" width="440" height="200" aria-hidden="true">${t23Legend()}</svg>
          <div class="t23-names">
            <span><b>2-${L('node', 'düğüm')}</b> ${L('1 key · 2 children', '1 anahtar · 2 çocuk')}</span>
            <span><b>3-${L('node', 'düğüm')}</b> ${L('2 keys · 3 children', '2 anahtar · 3 çocuk')}</span>
          </div>
        </div>
        <div class="panel ticks t23-rule">
          <svg viewBox="0 0 450 165" width="450" height="165" aria-hidden="true">${t23Rule()}</svg>
          <p>${L('3 keys? <b>Split</b>: the middle key <b>moves up</b>.', '3 anahtar mı? <b>Bölünür</b>: ortadaki anahtar <b>yukarı taşınır</b>.')}</p>
        </div>
      </div>
      <div class="t23-scene"></div>
      <div class="t23-caption caption"></div>
      ${Viz.real(T23_REAL, { layout: 'col', cls: 't23-real', attrs: ' data-step="5" data-anim="left"' })}`,
    init(ctx) {
      const d = ctx.data;
      d.view = new Tree23View(ctx.$('.t23-scene'), { width: 1180, height: 640, x0: 0, w: 1180, base: 520, rowH: 158 });
      const v = d.view;
      d.queue = new TreeQueue(v.gUnder, T23_KEYS, { x: 600, y: 40, size: 60, gap: 16, label: ['insert', 'ekle'] });
      const gw = v.boxW(1);
      d.ghost = U.s('rect', { class: 'slot-ghost', x: v.o.x0 + v.o.w / 2 - gw / 2, y: v.o.base - v.H / 2, width: gw, height: v.H, rx: 20 });
      v.gUnder.appendChild(d.ghost);
      d.caption = new Viz.Caption(ctx.$('.t23-caption'));
      d.caption.el.innerHTML = L('Every node holds <b>1 or 2 keys</b>, and every leaf sits on the <b>same level</b>.',
        'Her düğüm <b>1 ya da 2 anahtar</b> tutar ve bütün yapraklar <b>aynı seviyededir</b>.');
      d.caption.html = d.caption.el.innerHTML;
      d.rule = ctx.$('.t23-rule');
      hideForReveal(d.rule, 24);
      // "all leaves on one level" line, from the final layout
      const L3 = v.layout(T23_FINAL);
      const leaves = T3.walk(T23_FINAL).leaves.map((id) => L3.boxes[id]);
      const y = v.o.base + v.H / 2 + 22;
      const x1 = leaves[0].x - leaves[0].w / 2 - 34, x2 = leaves[leaves.length - 1].x + leaves[leaves.length - 1].w / 2 + 34;
      d.line = U.s('path', { class: 't23-level', d: 'M' + x1 + ',' + y + ' H' + x1 });
      d.lineGeom = { x1, x2, y };
      v.gUnder.appendChild(d.line);
      d.lineLbl = Viz.text(v.gUnder, (x1 + x2) / 2, y + 40, 'all leaves on one level ✓', 'tüm yapraklar aynı seviyede ✓', { class: 't23-level-t' });
      Anim.set(d.lineLbl, { opacity: 0 });
      // "grows at the root" note next to the final root
      const r = L3.boxes[T23_FINAL.root];
      d.grow = U.s('g', { class: 't23-grow' });
      d.grow.appendChild(U.s('path', { d: 'M' + (r.x + 160) + ',' + (r.y + 22) + ' C' + (r.x + 120) + ',' + (r.y + 18) + ' ' + (r.x + 100) + ',' + (r.y - 30) + ' ' + (r.x + 52) + ',' + (r.y - 38), 'marker-end': 'url(#arrow-star)' }));
      Viz.text(d.grow, r.x + 172, r.y + 30, 'it grows only at the top', 'yalnızca tepeden büyür', { class: 'callout', style: 'font-size:34px' });
      Anim.set(d.grow, { opacity: 0 });
      v.gOver.appendChild(d.grow);
    },
    async step(n, ctx) {
      const d = ctx.data, v = d.view;
      if (n <= T23_CLICKS.length) {
        const G = T23_CLICKS[n - 1];
        const keys = G.filter((e) => e.t === 'insert').map((e) => e.key);
        const extra = [];
        let prevT = null;
        narrate(d, L('Insert ' + list(keys), list(keys) + ' eklenir'));
        if (n === 1) Anim.set(d.ghost, { opacity: 0 });
        for (const e of G) {
          if (e.t === 'insert') {
            const i = T23_KEYS.indexOf(e.key);
            d.queue.use(i);
            if (prevT === 'split') {
              const others = e.snap.nodes[e.leaf].keys.filter((k) => k !== e.key);
              narrate(d, L(K(e.key, 'star') + ' joins [' + others.join(' ') + ']: two keys fit ✓', K(e.key, 'star') + ', [' + others.join(' ') + '] düğümüne girer: iki anahtar sığar ✓'));
            }
            await v.insert(e, { from: d.queue.pos(i) });
          } else if (e.t === 'overflow') {
            narrate(d, t23Say(e));
            if (!d.ruleShown) { d.ruleShown = true; extra.push(reveal(d.rule, { dur: 500 })); }
            await v.overflow(e.node);
            await Anim.wait(200);
          } else if (e.t === 'split') {
            narrate(d, t23Say(e));
            await v.split(e);
            await Anim.wait(80);
          }
          prevT = e.t;
        }
        v.clear(['new']);
        await Promise.all(extra);
      } else if (n === T23_CLICKS.length + 1) {
        narrate(d, L('Always perfectly balanced, so search, insert and delete cost ' + K('Θ(log n)', 'ok'),
          'Her zaman tam dengeli; bu yüzden arama, ekleme ve silme ' + K('Θ(log n)', 'ok')));
        v.leaves().forEach((b) => b.g.classList.add('ok'));
        const g = d.lineGeom;
        await Anim.run((p) => d.line.setAttribute('d', 'M' + g.x1 + ',' + g.y + ' H' + (g.x1 + (g.x2 - g.x1) * Math.min(1, p)).toFixed(1)), { dur: 800 });
        await Promise.all([Anim.to(d.lineLbl, { opacity: 1 }, { dur: 350 }), Anim.to(d.grow, { opacity: 1 }, { dur: 450 })]);
      }
      await hush(d);
    },
  });
})();
