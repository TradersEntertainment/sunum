/* BinTreeView — a binary search tree (BST / AVL) drawn from Algo.bst
 * snapshots, animated between them by stable identity ("magic move").
 *
 * Layout: x = rank of the key among all keys of the example (its in-order
 * position), y = depth. Insertions never push existing nodes sideways and
 * rotations move nodes only up or down, so the picture itself shows that a
 * rotation keeps the keys in sorted order. Nodes are identified by key;
 * edges by the pair of keys they join, so during a rotation the edge between
 * the two pivot keys stays and visibly turns over, while the edges that
 * change owner fade out and in. Edges are recomputed every frame from the
 * node positions, so they always follow moving nodes.
 *
 *   const v = new BinTreeView(container, {
 *     width, height, keys,          // keys = every key of the example (columns)
 *     x0, colW, y0, rowH, r,        // geometry (x0 = left of column 0, y0 = root y)
 *     badges: true,                 // balance-factor pills above the nodes
 *     guides: true, axis: 600,      // faint column guides / sorted keys at y = axis
 *     ambient: true,                // mark every element data-ambient (for loops)
 *   });
 *   v.set(snap);                                  // jump
 *   await v.insert(key, path, snap, {from});      // trace the search path, pop the node
 *   await v.rotate(rotateEvent);                  // one or two single rotations
 *   await v.morph(snap, {pair: [a, b]});          // generic magic move
 * Animated methods take opts.A = {to, wait, run}: Anim by default, or the A
 * of an ambient loop.
 *
 * TreeQueue draws the row of keys still waiting to be inserted.
 */
(function (root) {
  'use strict';

  const T = { fly: 240, hop: 140, hold: 60, pop: 300, morph: 950, badge: 260 };
  const lerp = (a, b, p) => a + (b - a) * p;
  const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
  const eid = (a, b) => (a < b ? a + '-' + b : b + '-' + a);

  class BinTreeView {
    constructor(container, o) {
      const keys = o.keys.slice().sort((a, b) => a - b);
      this.o = Object.assign({ x0: 0, y0: 70, rowH: 110, r: 40, badgeGap: 21 }, o);
      if (!this.o.colW) this.o.colW = (o.width - 2 * this.o.x0) / keys.length;
      this.keys = keys;
      this.rank = {};
      keys.forEach((k, i) => { this.rank[k] = i; });
      this.R = this.o.r;
      this.svg = Viz.svg(container, o.width, o.height, 'bin-svg');
      this.amb(this.svg);
      this.gUnder = this.layer('under');
      this.gGuides = this.layer('bin-guides');
      this.gEdges = this.layer('edges');
      this.gNodes = this.layer('bin-nodes');
      this.gBadges = this.layer('bin-badges');
      this.gOver = this.layer('over');
      this.snap = Algo.bst.empty();
      this.cur = {};       // key -> {x, y}: where the node is drawn now
      this.nodes = {};     // key -> <g class="node">
      this.edges = {};     // 'a-b' -> {g, line, a, b}
      this.badges = {};    // key -> {g, text, v}
      this.cols = {};      // key -> column guide / axis label group
      this.pending = [];
      if (this.o.guides || this.o.axis != null) this.buildColumns();
    }

    layer(cls) { const g = U.s('g', { class: cls }); this.svg.appendChild(g); return g; }
    amb(el) { if (this.o.ambient) el.setAttribute('data-ambient', ''); return el; }

    /* ---------- geometry ---------- */
    colX(key) { return this.o.x0 + (this.rank[key] + 0.5) * this.o.colW; }
    rowY(depth) { return this.o.y0 + depth * this.o.rowH; }
    layout(snap) {
      const d = Algo.bst.depths(snap);
      const pos = {};
      for (const k in d) pos[k] = { x: this.colX(Number(k)), y: this.rowY(d[k]) };
      return pos;
    }
    pos(key) { const c = this.cur[key]; return c ? { x: c.x, y: c.y } : null; }

    /* ---------- elements ---------- */
    buildColumns() {
      const o = this.o;
      const top = o.y0 - this.R - 12;
      const bottom = o.axis != null ? o.axis - 34 : o.height - 10;
      if (o.axis != null) {
        const x1 = o.x0 + o.colW * 0.15, x2 = o.x0 + o.colW * (this.keys.length - 0.15);
        this.gGuides.appendChild(this.amb(U.s('line', { class: 'bin-axis-line', x1, x2, y1: o.axis - 34, y2: o.axis - 34 })));
      }
      for (const k of this.keys) {
        const x = this.colX(k);
        const g = this.amb(U.s('g', { class: 'bin-col' }));
        if (o.guides) g.appendChild(U.s('line', { class: 'bin-guide', x1: x, x2: x, y1: top, y2: bottom }));
        if (o.axis != null) {
          g.appendChild(U.s('line', { class: 'bin-tick', x1: x, x2: x, y1: o.axis - 42, y2: o.axis - 26 }));
          g.appendChild(U.s('text', { class: 'bin-axis', x, y: o.axis }, U.num(k)));
        }
        Anim.set(g, { opacity: 0 });
        this.gGuides.appendChild(g);
        this.cols[k] = g;
      }
    }

    makeNode(key) {
      const R = this.R;
      const g = this.amb(U.s('g', { class: 'node bin-node', 'data-key': key }));
      g.innerHTML = '<circle class="ring" r="' + (R + 10) + '"/><circle class="disc" r="' + R + '"/>'
        + '<text class="key"' + (this.o.keySize ? ' style="font-size:' + this.o.keySize + 'px"' : '') + '>' + U.num(key) + '</text>';
      this.gNodes.appendChild(g);
      this.nodes[key] = g;
      return g;
    }

    makeEdge(a, b) {
      const g = this.amb(U.s('g', { class: 'bin-edge' }));
      const line = U.s('line', { class: 'edge' });
      g.appendChild(line);
      this.gEdges.appendChild(g);
      const e = { g, line, a, b };
      this.edges[eid(a, b)] = e;
      return e;
    }

    makeBadge(key) {
      const g = this.amb(U.s('g', { class: 'bin-badge' }));
      g.innerHTML = '<rect x="-27" y="-17" width="54" height="34" rx="17"/><text>0</text>';
      this.gBadges.appendChild(g);
      const b = { g, text: g.querySelector('text'), v: null };
      this.badges[key] = b;
      return b;
    }

    setBadge(key, v) {
      const b = this.badges[key] || this.makeBadge(key);
      b.v = v;
      b.text.textContent = U.num(v);
      b.g.classList.toggle('bad', Math.abs(v) > 1);
      return b;
    }

    makeProbe(key) {
      const r = Math.round(this.R * 0.8);
      const g = this.amb(U.s('g', { class: 'node new bin-probe' }));
      g.innerHTML = '<circle class="disc" r="' + r + '"/><text class="key" style="font-size:' + Math.max(30, Math.round(this.R * 0.85)) + 'px">' + U.num(key) + '</text>';
      this.gOver.appendChild(g);
      return g;
    }

    dropNode(k) {
      if (this.nodes[k]) this.nodes[k].remove();
      delete this.nodes[k];
      delete this.cur[k];
      if (this.badges[k]) { this.badges[k].g.remove(); delete this.badges[k]; }
    }

    /* Redraw nodes, badges and edges from this.cur. */
    frame() {
      const by = this.R + this.o.badgeGap;
      for (const k in this.nodes) {
        const c = this.cur[k];
        if (!c) continue;
        Anim.set(this.nodes[k], { x: c.x, y: c.y });
        const b = this.badges[k];
        if (b) Anim.set(b.g, { x: c.x, y: c.y - by });
      }
      for (const id in this.edges) {
        const e = this.edges[id];
        const a = this.cur[e.a], b = this.cur[e.b];
        if (!a || !b) continue;
        e.line.setAttribute('x1', a.x.toFixed(1));
        e.line.setAttribute('y1', a.y.toFixed(1));
        e.line.setAttribute('x2', b.x.toFixed(1));
        e.line.setAttribute('y2', b.y.toFixed(1));
      }
    }

    /* ---------- state ---------- */
    mark(key, cls, on) { const g = this.nodes[key]; if (g) g.classList.toggle(cls, on !== false); }
    edgeMark(a, b, cls, on) { const e = this.edges[eid(a, b)]; if (e) e.line.classList.toggle(cls, on !== false); }
    clear(list) {
      const cls = list || ['cmp', 'swap', 'ok', 'bad', 'focus', 'dim', 'new'];
      for (const k in this.nodes) this.nodes[k].classList.remove(...cls);
      if (!list) this.clearEdges();
    }
    clearEdges() { for (const id in this.edges) this.edges[id].line.classList.remove('hot', 'ok', 'bad', 'turn'); }
    markAll(cls) { for (const k in this.nodes) this.nodes[k].classList.add(cls); }

    /* Jump to a snapshot. */
    set(snap) {
      const pos = this.layout(snap);
      for (const k of Object.keys(this.nodes)) if (!(k in pos)) this.dropNode(k);
      for (const k in pos) {
        const g = this.nodes[k] || this.makeNode(Number(k));
        this.cur[k] = { x: pos[k].x, y: pos[k].y };
        Anim.set(g, { scale: 1, opacity: 1 });
      }
      const want = {};
      for (const [p, c] of Algo.bst.edges(snap)) want[eid(p, c)] = [p, c];
      for (const id of Object.keys(this.edges)) if (!want[id]) { this.edges[id].g.remove(); delete this.edges[id]; }
      for (const id in want) Anim.set((this.edges[id] || this.makeEdge(want[id][0], want[id][1])).g, { opacity: 1 });
      if (this.o.badges) {
        const bf = Algo.bst.balance(snap);
        for (const k in bf) Anim.set(this.setBadge(Number(k), bf[k]).g, { scale: 1, opacity: 1 });
      }
      for (const k in this.cols) Anim.set(this.cols[k], { opacity: k in pos ? 1 : 0 });
      this.snap = Algo.bst.clone(snap);
      this.frame();
    }

    /* Balance-factor pills: new ones pop in, changed ones pulse. */
    async badgesTo(snap, o) {
      if (!this.o.badges) return;
      const A = (o && o.A) || Anim;
      const bf = Algo.bst.balance(snap);
      const jobs = [];
      for (const k in bf) {
        const fresh = !this.badges[k];
        const old = fresh ? null : this.badges[k].v;
        const g = this.setBadge(Number(k), bf[k]).g;
        if (fresh) {
          Anim.set(g, { opacity: 0, scale: 0.4 });
          jobs.push(A.to(g, { opacity: 1, scale: 1 }, { dur: T.badge, ease: 'outBack' }));
        } else if (old !== bf[k]) {
          jobs.push(A.to(g, { scale: 1.45 }, { dur: T.badge * 0.45, ease: 'out' })
            .then(() => A.to(g, { scale: 1 }, { dur: T.badge * 0.55, ease: 'outBack' })));
        }
      }
      this.frame();
      await Promise.all(jobs);
    }

    /* Insert `key`: a probe walks the search path (each visited node lights
     * up, the probe sits on the side it will go), then the node pops in.
     * o: {from: {x, y}, fly, hop, hold, pop, overlap, badges}
     * With overlap: true the pop finishes in the background (see settle()). */
    async insert(key, path, snap, o) {
      o = o || {};
      const A = o.A || Anim;
      const R = this.R;
      const fly = o.fly || T.fly, hop = o.hop || T.hop, hold = o.hold != null ? o.hold : T.hold, pop = o.pop || T.pop;
      this.clear(['ok', 'new', 'bad', 'focus', 'swap']);
      const target = this.layout(snap)[key];
      const probe = this.makeProbe(key);
      const start = o.from || { x: target.x, y: target.y - this.o.rowH };
      Anim.set(probe, { x: start.x, y: start.y, scale: 0.5, opacity: 0 });
      const appear = A.to(probe, { scale: 1, opacity: 1 }, { dur: Math.min(160, fly) });
      let prev = null;
      for (const k of path) {
        const c = this.cur[k];
        const dir = key < k ? -1 : 1;
        if (prev != null) this.edgeMark(prev, k, 'hot');
        await A.to(probe, { x: c.x + dir * R * 1.62, y: c.y - R * 0.92 }, { dur: prev == null ? fly : hop });
        this.mark(k, 'cmp');
        if (hold) await A.wait(hold);
        prev = k;
      }
      await appear;
      // land
      const node = this.makeNode(key);
      this.cur[key] = { x: target.x, y: target.y };
      Anim.set(node, { scale: 0.3, opacity: 0 });
      let edge = null;
      if (prev != null) {
        edge = this.makeEdge(prev, key);
        Anim.set(edge.g, { opacity: 0 });
        edge.line.classList.add('hot');
      }
      this.frame();
      await A.to(probe, { x: target.x, y: target.y }, { dur: path.length ? hop : fly });
      for (const k of path) this.mark(k, 'cmp', false);
      this.clearEdges();
      node.classList.add('new');
      this.snap = Algo.bst.clone(snap);
      const done = Promise.all([
        A.to(node, { scale: 1, opacity: 1 }, { dur: pop, ease: 'outBack' }),
        A.to(probe, { scale: 1.5, opacity: 0 }, { dur: pop * 0.7 }),
        edge && A.to(edge.g, { opacity: 1 }, { dur: pop * 0.8 }),
        this.cols[key] && A.to(this.cols[key], { opacity: 1 }, { dur: 300 }),
        this.o.badges && o.badges !== false ? this.badgesTo(snap, { A }) : null,
      ]).then(() => probe.remove());
      if (o.overlap) this.pending.push(done);
      else await done;
    }

    /* Wait for pops started with overlap: true. */
    async settle() { await Promise.all(this.pending.splice(0)); }

    /* Magic move to another snapshot of the same keys. o.pair = [a, b]
     * highlights the edge between a and b (the pivot of a rotation). */
    async morph(snap, o) {
      o = o || {};
      const A = o.A || Anim;
      const to = this.layout(snap);
      const from = {};
      for (const k in to) from[k] = this.cur[k] ? { x: this.cur[k].x, y: this.cur[k].y } : { x: to[k].x, y: to[k].y };
      const want = {};
      for (const [p, c] of Algo.bst.edges(snap)) want[eid(p, c)] = [p, c];
      const added = [], removed = [];
      for (const id in want) {
        if (this.edges[id]) continue;
        const e = this.makeEdge(want[id][0], want[id][1]);
        Anim.set(e.g, { opacity: 0 });
        added.push(e);
      }
      for (const id in this.edges) if (!want[id]) removed.push(id);
      const turn = o.pair ? this.edges[eid(o.pair[0], o.pair[1])] : null;
      if (turn) turn.line.classList.add('turn');
      await A.run((p) => {
        const q = clamp01(p);
        for (const k in to) this.cur[k] = { x: lerp(from[k].x, to[k].x, p), y: lerp(from[k].y, to[k].y, p) };
        for (const id of removed) Anim.set(this.edges[id].g, { opacity: 1 - clamp01(q * 2.4) });
        for (const e of added) Anim.set(e.g, { opacity: clamp01(q * 2.4 - 1.4) });
        this.frame();
      }, { dur: o.dur || T.morph, ease: o.ease || 'inOut' });
      for (const id of removed) { this.edges[id].g.remove(); delete this.edges[id]; }
      for (const e of added) Anim.set(e.g, { opacity: 1 });
      if (turn && !o.keepTurn) turn.line.classList.remove('turn');
      this.snap = Algo.bst.clone(snap);
      this.frame();
    }

    /* Play a rotation event from Algo.bst.avlInsertAll: each single rotation
     * lights its two pivot keys (swap colour), turns the edge between them
     * and moves the nodes; then the balance factors update.
     * o.onStage(stage, i) is called before each single rotation. */
    async rotate(ev, o) {
      o = o || {};
      const A = o.A || Anim;
      for (let i = 0; i < ev.stages.length; i++) {
        const s = ev.stages[i];
        this.clear(['bad', 'focus', 'swap', 'cmp', 'ok']);
        this.mark(s.at, 'swap');
        this.mark(s.up, 'swap');
        if (o.onStage) o.onStage(s, i);
        await this.morph(s.snap, { A, pair: [s.at, s.up], dur: o.dur });
        this.mark(s.at, 'swap', false);
        this.mark(s.up, 'swap', false);
        if (i < ev.stages.length - 1) await A.wait(o.gap != null ? o.gap : 180);
      }
      await this.badgesTo(ev.snap, { A });
    }

    /* Stage coordinates (for FX bursts only — never for layout). */
    toStage(x, y) {
      const r = this.svg.getBoundingClientRect();
      const st = Deck.dom.stage ? Deck.dom.stage.getBoundingClientRect() : r;
      const s = st.width / 1920 || 1;
      return { x: (r.left - st.left) / s + x, y: (r.top - st.top) / s + y };
    }
  }

  /* A row of key chips waiting to be inserted. */
  class TreeQueue {
    constructor(parent, keys, o) {
      this.o = Object.assign({ size: 60, gap: 14 }, o);
      const n = keys.length, s = this.o.size;
      this.x0 = this.o.x - (n * s + (n - 1) * this.o.gap) / 2 + s / 2;
      this.g = U.s('g', { class: 'tq' });
      parent.appendChild(this.g);
      if (this.o.label) {
        Viz.text(this.g, this.x0 - s / 2 - 16, this.o.y, this.o.label[0], this.o.label[1], { class: 'tq-label', 'text-anchor': 'end' });
      }
      this.items = keys.map((k, i) => {
        const g = U.s('g', { class: 'tq-chip' });
        g.innerHTML = '<rect x="' + (-s / 2) + '" y="' + (-s / 2) + '" width="' + s + '" height="' + s + '" rx="12"/><text>' + U.num(k) + '</text>';
        Anim.set(g, this.pos(i));
        this.g.appendChild(g);
        return g;
      });
      this.items[0].classList.add('next');
    }
    pos(i) { return { x: this.x0 + i * (this.o.size + this.o.gap), y: this.o.y }; }
    use(i) {
      this.items[i].classList.remove('next');
      this.items[i].classList.add('used');
      if (this.items[i + 1]) this.items[i + 1].classList.add('next');
    }
  }

  BinTreeView.T = T;
  root.BinTreeView = BinTreeView;
  root.TreeQueue = TreeQueue;
})(window);
