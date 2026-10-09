/* Tree23View — a 2-3 tree drawn from Algo.tree23 snapshots.
 *
 * Nodes are rounded boxes holding 1–2 keys (3 while overflowing). Boxes are
 * identified by node id and keys by value; every key is its own element and
 * travels on its own (into a leaf, up into a parent during a split). Leaves
 * sit on a fixed baseline, evenly spaced, and parents are centred over their
 * children, so the tree visibly grows upward when the root splits.
 * Edges are identified by the child (every node has one parent), so when a
 * split hands two children to the new right node their edges slide over.
 *
 *   const v = new Tree23View(container, { width, height, x0, w, base, rowH });
 *   v.set(snap);
 *   await v.insert(insertEvent, {from});      // probe walks down, key lands in its leaf
 *   await v.overflow(nodeId);                 // swell + red
 *   await v.split(splitEvent);                // break in two, middle key floats up
 * Animated methods take opts.A = {to, wait, run} (Anim by default).
 */
(function (root) {
  'use strict';

  const T = { fly: 230, hop: 170, hold: 50, land: 400, swell: 300, brk: 340, rise: 680 };
  const lerp = (a, b, p) => a + (b - a) * p;
  const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

  class Tree23View {
    constructor(container, o) {
      this.o = Object.assign({ x0: 0, base: 520, rowH: 150, h: 76, slot: 64, pad: 12 }, o);
      if (this.o.w == null) this.o.w = o.width - 2 * this.o.x0;
      this.H = this.o.h;
      this.svg = Viz.svg(container, o.width, o.height, 'tt-svg');
      this.gUnder = this.layer('under');
      this.gEdges = this.layer('edges');
      this.gBoxes = this.layer('tt-boxes');
      this.gKeys = this.layer('tt-keys');
      this.gOver = this.layer('over');
      this.snap = { root: null, nodes: {} };
      this.box = {};      // id -> {g, rect, dA, dB, x, y, w, s, o, nA, nB, mix}
      this.keyEl = {};    // key -> {g, chip, x, y, s, o, c}
      this.edges = {};    // child id -> {g, line, c, pA, fA, pB, fB, t, o}
    }

    layer(cls) { const g = U.s('g', { class: cls }); this.svg.appendChild(g); return g; }
    boxW(n) { return 2 * this.o.pad + n * this.o.slot; }

    /* Box centres, widths and key positions for a snapshot. */
    layout(snap) {
      const { depth, leaves } = Algo.tree23.walk(snap);
      const h = Algo.tree23.height(snap);
      const boxes = {}, keys = {};
      const m = leaves.length;
      leaves.forEach((id, i) => { boxes[id] = { x: this.o.x0 + this.o.w * (i + 0.5) / m }; });
      const centre = (id) => {
        const n = snap.nodes[id];
        if (!n.kids.length) return;
        n.kids.forEach(centre);
        boxes[id] = { x: (boxes[n.kids[0]].x + boxes[n.kids[n.kids.length - 1]].x) / 2 };
      };
      if (snap.root != null) centre(snap.root);
      for (const id in boxes) {
        const n = snap.nodes[id];
        const b = boxes[id];
        b.y = this.o.base - (h - depth[id]) * this.o.rowH;
        b.w = this.boxW(n.keys.length);
        b.n = n.keys.length;
        n.keys.forEach((k, i) => { keys[k] = { x: b.x - b.w / 2 + this.o.pad + this.o.slot * (i + 0.5), y: b.y }; });
      }
      return { boxes, keys };
    }

    edgeMap(snap) {
      const m = {};
      for (const id in snap.nodes) {
        const n = snap.nodes[id];
        n.kids.forEach((c, i) => { m[c] = { p: Number(id), f: (i + 0.5) / n.kids.length }; });
      }
      return m;
    }

    /* ---------- elements ---------- */
    makeBox(id) {
      const g = U.s('g', { class: 'tt-node', 'data-id': id });
      const rect = U.s('rect', { class: 'tt-box', rx: 20, ry: 20 });
      const dA = U.s('path', { class: 'tt-div' });
      const dB = U.s('path', { class: 'tt-div' });
      g.append(rect, dA, dB);
      this.gBoxes.appendChild(g);
      const b = { id, g, rect, dA, dB, x: 0, y: 0, w: this.boxW(1), s: 1, o: 1, nA: 1, nB: 1, mix: 1 };
      this.box[id] = b;
      return b;
    }

    makeKey(k) {
      const g = U.s('g', { class: 'tt-key', 'data-key': k });
      const c = 32;
      const chip = U.s('rect', { class: 'tt-chip', x: -c, y: -c, width: 2 * c, height: 2 * c, rx: 16 });
      g.append(chip, U.s('text', {}, U.num(k)));
      this.gKeys.appendChild(g);
      const e = { g, chip, x: 0, y: 0, s: 1, o: 1, c: 0 };
      this.keyEl[k] = e;
      return e;
    }

    makeEdge(c) {
      const g = U.s('g', { class: 'tt-edge' });
      const line = U.s('line', { class: 'edge' });
      g.appendChild(line);
      this.gEdges.appendChild(g);
      const e = { g, line, c, pA: null, fA: 0.5, pB: null, fB: 0.5, t: 0, o: 1 };
      this.edges[c] = e;
      return e;
    }

    /* Point on the bottom of box pid at fraction f of its width. */
    anchor(pid, f) {
      const b = this.box[pid];
      if (!b) return null;
      const w = b.w * b.s;
      return { x: b.x - w / 2 + w * f, y: b.y + (this.H * b.s) / 2 - 3 };
    }

    divPath(b, n, x, y, w, h) {
      let d = '';
      const pad = this.o.pad * b.s;
      for (let j = 1; j < n; j++) {
        const dx = x + pad + ((w - 2 * pad) * j) / n;
        d += 'M' + dx.toFixed(1) + ',' + (y + 13).toFixed(1) + 'V' + (y + h - 13).toFixed(1);
      }
      return d;
    }

    frame() {
      for (const id in this.box) {
        const b = this.box[id];
        const w = b.w * b.s, h = this.H * b.s;
        const x = b.x - w / 2, y = b.y - h / 2;
        b.rect.setAttribute('x', x.toFixed(1));
        b.rect.setAttribute('y', y.toFixed(1));
        b.rect.setAttribute('width', Math.max(0, w).toFixed(1));
        b.rect.setAttribute('height', Math.max(0, h).toFixed(1));
        b.g.style.opacity = b.o >= 0.999 ? '' : String(Math.max(0, b.o).toFixed(3));
        b.dA.setAttribute('d', this.divPath(b, b.nA, x, y, w, h));
        b.dB.setAttribute('d', this.divPath(b, b.nB, x, y, w, h));
        // old dividers leave early, new ones arrive late: never both at once
        b.dA.style.opacity = String(clamp01(1 - b.mix * 3).toFixed(3));
        b.dB.style.opacity = String(clamp01(b.mix * 3 - 2).toFixed(3));
      }
      for (const k in this.keyEl) {
        const e = this.keyEl[k];
        Anim.set(e.g, { x: e.x, y: e.y, scale: e.s, opacity: e.o });
        e.chip.style.opacity = String(clamp01(e.c).toFixed(3));
      }
      for (const c in this.edges) {
        const e = this.edges[c];
        const a = this.anchor(e.pA, e.fA), b = this.anchor(e.pB, e.fB);
        const cb = this.box[c];
        if (!a || !b || !cb) continue;
        e.line.setAttribute('x1', lerp(a.x, b.x, e.t).toFixed(1));
        e.line.setAttribute('y1', lerp(a.y, b.y, e.t).toFixed(1));
        e.line.setAttribute('x2', cb.x.toFixed(1));
        e.line.setAttribute('y2', (cb.y - (this.H * cb.s) / 2 + 3).toFixed(1));
        e.g.style.opacity = e.o >= 0.999 ? '' : String(Math.max(0, e.o).toFixed(3));
      }
    }

    /* ---------- state ---------- */
    mark(id, cls, on) { const b = this.box[id]; if (b) b.g.classList.toggle(cls, on !== false); }
    clear(list) {
      const cls = list || ['cmp', 'bad', 'ok', 'new', 'dim'];
      for (const id in this.box) this.box[id].g.classList.remove(...cls);
    }
    markAll(cls) { for (const id in this.box) this.box[id].g.classList.add(cls); }

    /* Leaves (left to right) of the current tree, with their geometry. */
    leaves() {
      const { leaves } = Algo.tree23.walk(this.snap);
      return leaves.map((id) => this.box[id]).filter(Boolean);
    }

    /* Jump to a snapshot. */
    set(snap) {
      const L = this.layout(snap);
      for (const id of Object.keys(this.box)) if (!(id in L.boxes)) { this.box[id].g.remove(); delete this.box[id]; }
      for (const k of Object.keys(this.keyEl)) if (!(k in L.keys)) { this.keyEl[k].g.remove(); delete this.keyEl[k]; }
      for (const id in L.boxes) {
        const t = L.boxes[id];
        Object.assign(this.box[id] || this.makeBox(Number(id)), { x: t.x, y: t.y, w: t.w, s: 1, o: 1, nA: t.n, nB: t.n, mix: 1 });
      }
      for (const k in L.keys) Object.assign(this.keyEl[k] || this.makeKey(Number(k)), { x: L.keys[k].x, y: L.keys[k].y, s: 1, o: 1, c: 0 });
      const want = this.edgeMap(snap);
      for (const c of Object.keys(this.edges)) if (!(c in want)) { this.edges[c].g.remove(); delete this.edges[c]; }
      for (const c in want) Object.assign(this.edges[c] || this.makeEdge(Number(c)), { pA: want[c].p, fA: want[c].f, pB: want[c].p, fB: want[c].f, t: 0, o: 1 });
      this.snap = Algo.tree23.clone(snap);
      this.frame();
    }

    /* Magic move to a snapshot. o.init = {id: {x, y, w, s, o}} gives new
     * boxes their starting geometry (default: in place, small, transparent). */
    async morph(snap, o) {
      o = o || {};
      const A = o.A || Anim;
      const L = this.layout(snap);
      const bF = {};
      for (const id in L.boxes) {
        const t = L.boxes[id];
        let b = this.box[id];
        if (!b) {
          b = this.makeBox(Number(id));
          Object.assign(b, { x: t.x, y: t.y, w: t.w, s: 0.6, o: 0, nA: t.n, nB: t.n }, o.init && o.init[id]);
        }
        b.nA = b.nB;
        b.nB = t.n;
        b.mix = b.nA === b.nB ? 1 : 0;
        bF[id] = { x: b.x, y: b.y, w: b.w, s: b.s, o: b.o };
      }
      const kF = {};
      for (const k in L.keys) {
        let e = this.keyEl[k];
        if (!e) { e = this.makeKey(Number(k)); Object.assign(e, { x: L.keys[k].x, y: L.keys[k].y, o: 0 }); }
        kF[k] = { x: e.x, y: e.y, s: e.s, o: e.o, c: e.c };
      }
      const want = this.edgeMap(snap);
      const fresh = [];
      for (const c in want) {
        let e = this.edges[c];
        if (!e) {
          e = this.makeEdge(Number(c));
          Object.assign(e, { pA: want[c].p, fA: want[c].f, o: 0 });
          fresh.push(e);
        }
        Object.assign(e, { pB: want[c].p, fB: want[c].f, t: 0 });
      }
      await A.run((p) => {
        const q = clamp01(p);
        for (const id in L.boxes) {
          const b = this.box[id], f = bF[id], t = L.boxes[id];
          b.x = lerp(f.x, t.x, p);
          b.y = lerp(f.y, t.y, p);
          b.w = lerp(f.w, t.w, q);
          b.s = lerp(f.s, 1, q);
          b.o = lerp(f.o, 1, q);
          if (b.nA !== b.nB) b.mix = q;
        }
        for (const k in L.keys) {
          const e = this.keyEl[k], f = kF[k], t = L.keys[k];
          e.x = lerp(f.x, t.x, p);
          e.y = lerp(f.y, t.y, p);
          e.s = lerp(f.s, 1, q);
          e.o = lerp(f.o, 1, q);
          e.c = f.c * (1 - q);
        }
        for (const c in want) this.edges[c].t = q;
        for (const e of fresh) e.o = clamp01(q * 2 - 0.8);
        this.frame();
      }, { dur: o.dur || T.rise, ease: o.ease || 'inOut' });
      for (const c in want) {
        const e = this.edges[c];
        Object.assign(e, { pA: e.pB, fA: e.fB, t: 0, o: 1 });
      }
      for (const id in L.boxes) { const b = this.box[id]; b.nA = b.nB; b.mix = 1; }
      this.snap = Algo.tree23.clone(snap);
      this.frame();
    }

    /* A new key walks down from the root (hovering over the branch it takes),
     * then drops into its slot; the leaf widens to make room.
     * ev = {key, path, leaf, snap}; o = {from: {x, y}} */
    async insert(ev, o) {
      o = o || {};
      const A = o.A || Anim;
      this.clear(['new', 'ok', 'cmp']);
      const e = this.makeKey(ev.key);
      e.g.classList.add('probe');
      const from = o.from || { x: this.o.x0 + this.o.w / 2, y: 40 };
      Object.assign(e, { x: from.x, y: from.y, s: 0.6, o: 0, c: 1 });
      this.frame();
      const target = this.layout(ev.snap).keys[ev.key];
      // hover over each visited node, above the branch the key takes
      const pts = [];
      for (const id of ev.path) {
        const b = this.box[id];
        if (!b) continue;                      // the very first key: no tree yet
        const n = this.snap.nodes[id];
        const x = n.kids.length
          ? b.x - b.w / 2 + (b.w * (Algo.tree23.childIndex(n, ev.key) + 0.5)) / n.kids.length
          : target.x;
        pts.push({ x, y: b.y - this.H / 2 - 46, dur: pts.length ? (o.hop || T.hop) : (o.fly || T.fly), dwell: o.hold != null ? o.hold : T.hold, at: () => b.g.classList.add('cmp') });
      }
      const grow = A.run((p) => { e.s = lerp(0.6, 1, clamp01(p)); e.o = clamp01(p); this.frame(); }, { dur: 160 });
      if (pts.length) await root.BinTreeView.travel(A, from, pts, (x, y) => { e.x = x; e.y = y; this.frame(); });
      await grow;
      await this.morph(ev.snap, { A, dur: o.land || T.land });
      e.g.classList.remove('probe');
      this.clear(['cmp']);
      this.mark(ev.leaf, 'new');
    }

    /* A node with 3 keys: it swells and turns red. */
    async overflow(id, o) {
      const A = (o && o.A) || Anim;
      const b = this.box[id];
      this.clear(['new', 'cmp']);
      b.g.classList.add('bad');
      const s0 = b.s;
      await A.run((p) => { b.s = lerp(s0, 1.1, p); this.frame(); }, { dur: T.swell, ease: 'outBack' });
    }

    /* Split: the box breaks into [a] and [c], the middle key b floats up
     * into the parent (or into a new root), then everything settles. */
    async split(ev, o) {
      o = o || {};
      const A = o.A || Anim;
      const X = this.box[ev.node];
      const [a, b, c] = ev.keys;
      const ka = this.keyEl[a], kb = this.keyEl[b], kc = this.keyEl[c];
      const Y = this.makeBox(ev.right);
      Object.assign(Y, { x: kc.x, y: X.y, w: this.boxW(1), s: 1, o: 0, nA: 1, nB: 1, mix: 1 });
      Y.g.classList.add('bad');
      const f0 = { x: X.x, w: X.w, s: X.s, by: kb.y };
      X.nA = X.nB;
      X.nB = 1;
      X.mix = 0;
      kb.g.classList.add('up');
      // an internal node also hands its two right children to the new node
      const xn = this.snap.nodes[ev.node];
      const kids = xn ? xn.kids : [];
      const moved = [];
      if (kids.length === 4) {
        kids.forEach((cid, i) => {
          const e = this.edges[cid];
          if (!e) return;
          Object.assign(e, { pB: i < 2 ? ev.node : ev.right, fB: ((i % 2) + 0.5) / 2, t: 0 });
          moved.push(e);
        });
      }
      await A.run((p) => {
        const q = clamp01(p);
        X.x = lerp(f0.x, ka.x, p);
        X.w = lerp(f0.w, this.boxW(1), q);
        X.s = lerp(f0.s, 1, q);
        X.mix = q;
        Y.o = q;
        kb.y = lerp(f0.by, f0.by - this.H * 0.8, p);
        kb.c = q;
        for (const e of moved) e.t = q;
        this.frame();
      }, { dur: o.brk || T.brk, ease: 'inOut' });
      for (const e of moved) Object.assign(e, { pA: e.pB, fA: e.fB, t: 0 });
      X.nA = 1;
      X.mix = 1;
      X.g.classList.remove('bad');
      Y.g.classList.remove('bad');
      const init = {};
      if (ev.newRoot) init[ev.parent] = { x: kb.x, y: kb.y, w: this.boxW(1), s: 0.5, o: 0 };
      await this.morph(ev.snap, { A, dur: o.dur || T.rise, init });
      kb.g.classList.remove('up');
    }

    toStage(x, y) {
      const r = this.svg.getBoundingClientRect();
      const st = Deck.dom.stage ? Deck.dom.stage.getBoundingClientRect() : r;
      const s = st.width / 1920 || 1;
      return { x: (r.left - st.left) / s + x, y: (r.top - st.top) / s + y };
    }
  }

  Tree23View.T = T;
  root.Tree23View = Tree23View;
})(window);
