/* HeapScene — a heap drawn twice, as a tree and as an array, kept in sync.
 *
 * Positions are 1-based slots. Tree slots and array cells are fixed; the
 * items (one tree node + one array chip per item) travel between them.
 * Items are identified by id (input index), so equal keys stay distinct.
 *
 *   const hs = new HeapScene(container, {
 *     width, height, values, ids, slots,       // values by id, ids by position
 *     tree: {x, y, w, gap, r}, array: {x, y, cell, gap},
 *     ghosts: true,                            // dashed outlines for empty slots
 *     labels: {id: 'a'},                       // small tag under a node (e.g. 1ₐ)
 *   });
 *   await hs.swap(1, 3);  await hs.apply(event);
 */
(function (root) {
  'use strict';

  const T = {      // timings (ms) at speed ×1
    mark: 380,
    swap: 680,
    lock: 480,
    pop: 520,
    hold: 260,
  };

  class HeapScene {
    constructor(container, o) {
      this.o = o;
      this.container = container;
      this.values = o.values.slice();
      this.slots = o.slots || o.values.length;
      this.pos = [null].concat(o.ids ? o.ids.slice() : o.values.map((_, i) => i));
      this.m = o.m == null ? this.pos.length - 1 : o.m;
      this.R = (o.tree && o.tree.r) || 40;
      this.items = {};
      this.svg = Viz.svg(container, o.width, o.height, 'heap-svg');
      this.gEdges = U.s('g', { class: 'edges' });
      this.gGhost = U.s('g', { class: 'ghosts' });
      this.gCells = U.s('g', { class: 'cells' });
      this.gUnder = U.s('g', { class: 'under' });
      this.gItems = U.s('g', { class: 'items' });
      this.gOver = U.s('g', { class: 'over' });
      this.svg.append(this.gEdges, this.gGhost, this.gCells, this.gUnder, this.gItems, this.gOver);
      this.edges = {};
      this.cells = {};
      this.idx = {};
      if (o.tree) this.buildTree();
      if (o.array) this.buildArray();
      this.pos.slice(1).forEach((id) => { if (id != null) this.makeItem(id); });
      this.place();
    }

    /* ---------- geometry ---------- */
    slotXY(p) {
      const t = this.o.tree;
      const L = Math.floor(Math.log2(p));
      const q = p - Math.pow(2, L);
      return { x: t.x + (q + 0.5) * (t.w / Math.pow(2, L)), y: t.y + L * t.gap };
    }

    cellXY(p) {
      const a = this.o.array;
      return { x: a.x + (p - 1) * (a.cell + a.gap) + a.cell / 2, y: a.y + a.cell / 2 };
    }

    /* ---------- construction ---------- */
    buildTree() {
      for (let p = 2; p <= this.slots; p++) {
        const a = this.slotXY(Math.floor(p / 2));
        const b = this.slotXY(p);
        const line = U.s('line', { class: 'edge', x1: a.x, y1: a.y, x2: b.x, y2: b.y });
        this.gEdges.appendChild(line);
        this.edges[p] = line;
      }
      if (this.o.ghosts) {
        for (let p = 1; p <= this.slots; p++) {
          const c = this.slotXY(p);
          this.gGhost.appendChild(U.s('circle', { class: 'slot-ghost', cx: c.x, cy: c.y, r: this.R }));
        }
      }
      if (this.o.treeIdx) {
        this.treeIdx = {};
        for (let p = 1; p <= this.slots; p++) {
          const c = this.slotXY(p);
          const t = U.s('text', { class: 'cell-idx tree-idx', x: c.x + this.R + 6, y: c.y - this.R + 4, 'text-anchor': 'start' }, String(p));
          this.gOver.appendChild(t);
          this.treeIdx[p] = t;
        }
      }
      this.refreshEdges();
    }

    buildArray() {
      const a = this.o.array;
      for (let p = 1; p <= this.slots; p++) {
        const c = this.cellXY(p);
        const box = U.s('rect', { class: 'cell-box', x: c.x - a.cell / 2, y: c.y - a.cell / 2, width: a.cell, height: a.cell, rx: 10 });
        const idx = U.s('text', { class: 'cell-idx', x: c.x, y: c.y + a.cell / 2 + 24 }, String(p));
        this.gCells.append(box, idx);
        this.cells[p] = box;
        this.idx[p] = idx;
      }
    }

    makeItem(id) {
      const v = this.values[id];
      const label = this.o.labels && this.o.labels[id];
      const it = { id };
      if (this.o.tree) {
        const R = this.R;
        it.node = U.s('g', { class: 'node', 'data-id': id });
        it.node.innerHTML = '<circle class="ring" r="' + (R + 11) + '"/>'
          + '<circle class="disc" r="' + R + '"/>'
          + '<text class="key">' + U.num(v) + '</text>'
          + '<g transform="translate(' + (R * 0.62) + ',' + (-R * 0.78) + ')">' + Viz.ICONS.lock + '</g>'
          + (label ? '<text class="tag" y="' + (R + 22) + '">' + label + '</text>' : '');
        if (this.o.colors && this.o.colors[id]) it.node.querySelector('.disc').style.stroke = this.o.colors[id];
        this.gItems.appendChild(it.node);
      }
      if (this.o.array) {
        const s = this.o.array.cell - 12;
        it.chip = U.s('g', { class: 'chip', 'data-id': id });
        it.chip.innerHTML = '<rect class="box" x="' + (-s / 2) + '" y="' + (-s / 2) + '" width="' + s + '" height="' + s + '" rx="10"/>'
          + '<text class="key">' + U.num(v) + '</text>'
          + (label ? '<text class="tag cell-idx" y="' + (s / 2 + 2) + '" style="font-size:16px">' + label + '</text>' : '');
        if (this.o.colors && this.o.colors[id]) it.chip.querySelector('.box').style.stroke = this.o.colors[id];
        this.gItems.appendChild(it.chip);
      }
      this.items[id] = it;
      return it;
    }

    /* Put every item at its slot instantly. */
    place() {
      for (let p = 1; p < this.pos.length; p++) {
        const it = this.items[this.pos[p]];
        if (!it) continue;
        if (it.node) Anim.set(it.node, Object.assign(this.slotXY(p), { scale: 1, opacity: 1 }));
        if (it.chip) Anim.set(it.chip, Object.assign(this.cellXY(p), { scale: 1, opacity: 1 }));
      }
      this.refreshEdges();
    }

    /* ---------- state helpers ---------- */
    at(p) { return this.items[this.pos[p]]; }
    els(p) { const it = this.at(p); return it ? [it.node, it.chip].filter(Boolean) : []; }

    mark(p, cls, on) {
      this.els(p).forEach((e) => e.classList.toggle(cls, on !== false));
    }

    clear(classes) {
      const list = classes || ['cmp', 'swap', 'ok', 'bad', 'focus', 'dim', 'new'];
      Object.values(this.items).forEach((it) => [it.node, it.chip].forEach((e) => e && list.forEach((c) => e.classList.remove(c))));
      Object.values(this.edges).forEach((e) => e.classList.remove('hot', 'ok', 'bad'));
      Object.values(this.idx).forEach((e) => e.classList.remove('hot'));
    }

    edge(child, cls, on) {
      const e = this.edges[child];
      if (e) e.classList.toggle(cls, on !== false);
    }

    /* Edges into positions beyond the heap (or beyond n) are cut. */
    refreshEdges() {
      const n = this.pos.length - 1;
      for (const p in this.edges) {
        const k = Number(p);
        const e = this.edges[k];
        e.classList.toggle('gone', k > n);
        e.classList.toggle('cut', k <= n && k > this.m);
      }
    }

    /* ---------- animated operations ---------- */
    async focus(p) {
      this.clear(['focus']);
      this.mark(p, 'focus');
      await Anim.wait(T.hold);
    }

    async compare(k, j, kids) {
      this.clear(['cmp', 'ok', 'bad', 'dim']);
      this.mark(k, 'focus');
      (kids || [j]).forEach((c) => { this.mark(c, 'cmp'); this.edge(c, 'hot'); });
      if (kids && kids.length > 1) {
        await Anim.wait(T.mark);
        kids.filter((c) => c !== j).forEach((c) => { this.mark(c, 'cmp', false); this.mark(c, 'dim'); this.edge(c, 'hot', false); });
      }
      this.mark(k, 'cmp');
      if (this.idx[k]) { this.idx[k].classList.add('hot'); this.idx[j].classList.add('hot'); }
      await Anim.wait(T.mark);
    }

    async ok(k, j) {
      this.clear(['cmp', 'dim']);
      this.mark(k, 'ok');
      if (j) { this.mark(j, 'ok'); this.edge(j, 'ok'); }
      const it = this.at(k);
      if (it && it.node && !Anim.isInstant()) {
        const c = this.slotXY(k);
        FX.ripple(this.toStage(c.x, c.y).x, this.toStage(c.x, c.y).y, '--ok', { r0: this.R, r1: this.R * 2.4 });
      }
      await Anim.wait(T.mark + 120);
    }

    async swap(i, j, opts) {
      const A = this.at(i), B = this.at(j);
      this.clear(['dim']);
      [i, j].forEach((p) => { this.mark(p, 'cmp', false); this.mark(p, 'swap'); });
      const lift = (opts && opts.lift) || 1;
      const jobs = [];
      const si = this.o.tree && this.slotXY(i), sj = this.o.tree && this.slotXY(j);
      const ci = this.o.array && this.cellXY(i), cj = this.o.array && this.cellXY(j);
      if (A.node) jobs.push(Anim.to(A.node, sj, { dur: T.swap, arc: 40 * lift }));
      if (B.node) jobs.push(Anim.to(B.node, si, { dur: T.swap, arc: 40 * lift }));
      const archeight = Math.min(120, 30 + Math.abs(j - i) * 22);
      if (A.chip) jobs.push(Anim.to(A.chip, cj, { dur: T.swap, arc: (j > i ? 1 : -1) * archeight }));
      if (B.chip) jobs.push(Anim.to(B.chip, ci, { dur: T.swap, arc: (j > i ? 1 : -1) * archeight }));
      const t = this.pos[i]; this.pos[i] = this.pos[j]; this.pos[j] = t;
      await Promise.all(jobs);
      [i, j].forEach((p) => this.mark(p, 'swap', false));
    }

    async lock(p) {
      this.clear(['cmp', 'swap', 'ok', 'focus', 'dim']);
      this.mark(p, 'sorted');
      if (p <= this.m) this.m = p - 1;
      this.refreshEdges();
      this.moveDivider();
      const it = this.at(p);
      if (it && it.node) {
        await Anim.to(it.node, { scale: 1.18 }, { dur: T.lock / 2, ease: 'out' });
        await Anim.to(it.node, { scale: 1 }, { dur: T.lock / 2, ease: 'outBack' });
      } else await Anim.wait(T.lock);
    }

    setHeapSize(m) {
      this.m = m;
      this.refreshEdges();
      this.moveDivider();
    }

    /* Sorted-part divider in the array view. */
    moveDivider() {
      if (!this.o.array || !this.o.divider) return;
      const a = this.o.array;
      const n = this.pos.length - 1;
      if (!this.div) {
        this.div = U.s('g', { class: 'div' });
        this.shelf = U.s('rect', { class: 'shelf', y: a.y - 14, height: a.cell + 28, rx: 14 });
        this.divLine = U.s('line', { class: 'divider', y1: a.y - 24, y2: a.y + a.cell + 24 });
        this.div.append(this.shelf, this.divLine);
        this.divText = Viz.text(this.div, 0, a.y - 34, 'sorted', 'sıralı', { class: 'divider-label' });
        this.gUnder.appendChild(this.div);
      }
      const visible = this.m < n;
      this.div.style.opacity = visible ? '1' : '0';
      const x = a.x + this.m * (a.cell + a.gap) - a.gap / 2;
      const right = a.x + n * (a.cell + a.gap) - a.gap / 2;
      this.divLine.setAttribute('x1', x); this.divLine.setAttribute('x2', x);
      this.shelf.setAttribute('x', x); this.shelf.setAttribute('width', Math.max(0, right - x + 4));
      this.divText.querySelectorAll('text').forEach((t) => t.setAttribute('x', (x + right) / 2));
    }

    /* New item at position p (insertion). */
    async append(p, id, value) {
      this.values[id] = value;
      this.pos[p] = id;
      const it = this.makeItem(id);
      const s = this.o.tree && this.slotXY(p);
      const c = this.o.array && this.cellXY(p);
      if (it.node) Anim.set(it.node, Object.assign({}, s, { scale: 0.2, opacity: 0 }));
      if (it.chip) Anim.set(it.chip, Object.assign({}, c, { scale: 0.2, opacity: 0 }));
      if (this.m === p - 1) this.m = p;
      this.refreshEdges();
      this.mark(p, 'new');
      await Promise.all([
        it.node && Anim.to(it.node, { scale: 1, opacity: 1 }, { dur: T.pop, ease: 'outBack' }),
        it.chip && Anim.to(it.chip, { scale: 1, opacity: 1 }, { dur: T.pop, ease: 'outBack' }),
      ]);
    }

    async compareUp(i, p) {
      this.clear(['cmp', 'ok', 'dim']);
      this.mark(i, 'cmp');
      this.mark(p, 'cmp');
      this.edge(i, 'hot');
      await Anim.wait(T.mark);
    }

    /* Convert stage coordinates for FX (the SVG sits inside the slide). */
    toStage(x, y) {
      const r = this.svg.getBoundingClientRect();
      const st = Deck.dom.stage ? Deck.dom.stage.getBoundingClientRect() : r;
      const s = st.width / 1920 || 1;
      return { x: (r.left - st.left) / s + x, y: (r.top - st.top) / s + y };
    }

    /* Crown over the root. */
    async crown(show) {
      if (!this.o.tree) return;
      if (!this.crownEl) {
        const c = this.slotXY(1);
        this.crownEl = U.s('path', { class: 'crown', d: Viz.ICONS.crown });
        Anim.set(this.crownEl, { x: c.x, y: c.y - this.R - 16, opacity: 0, scale: 0.4 });
        this.gOver.appendChild(this.crownEl);
      }
      await Anim.to(this.crownEl, { opacity: show === false ? 0 : 1, scale: show === false ? 0.4 : 0.8 }, { dur: 450, ease: 'outBack' });
    }

    /* ---------- event playback ---------- */
    async apply(ev) {
      switch (ev.t) {
        case 'sift': return this.focus(ev.i);
        case 'compare': return this.compare(ev.k, ev.j, ev.kids);
        case 'ok': return this.ok(ev.k, ev.j);
        case 'swap': await this.swap(ev.i, ev.j); this.mark(ev.j, 'focus'); return null;
        case 'swapRoot': return this.swap(ev.i, ev.j, { lift: 2 });
        case 'lock': return this.lock(ev.p);
        case 'leaf': this.clear(['cmp', 'dim']); return Anim.wait(T.hold);
        case 'settled': this.clear(); return null;
        case 'append': return this.append(ev.i, ev.id, ev.v != null ? ev.v : this.values[ev.id]);
        case 'compareUp': return this.compareUp(ev.i, ev.p);
        case 'done': this.clear(); return null;
        default: return null;
      }
    }
  }

  HeapScene.T = T;
  root.HeapScene = HeapScene;
})(window);
