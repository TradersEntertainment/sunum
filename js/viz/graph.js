/* GraphView — a small directed graph in SVG for the counting-paths slide
 * (Levitin §6.6): vertices are discs with the same look as tree nodes
 * (scenes.css .node states work), edges are arrows that can light up, and a
 * token can travel along a path of vertices.
 *
 *   const g = new GraphView(svgOrGroup, {
 *     nodes: { 1: {x, y}, 2: {x, y}, … },   // SVG user units
 *     edges: [[1, 3], [2, 1], …],            // directed u → v
 *     r: 44,
 *   });
 *   g.edge(2, 1, 'ok');          // edge state: hot | ok | star | dim (false = off)
 *   g.node(1, 'cmp');            // node state classes from scenes.css
 *   await g.travel([2, 1, 4], { cls: 'ok' });   // token moves 2 → 1 → 4
 *
 * Everything animates through Anim, so instant replay works.
 */
(function (root) {
  'use strict';

  // arrowhead marker per edge state (markers are defined once by the deck)
  const MARKER = { hot: 'cmp', ok: 'ok', star: 'star', dim: 'muted', act: 'line' };
  const STATES = ['hot', 'ok', 'star', 'dim'];

  class GraphView {
    constructor(parent, o) {
      this.o = o;
      this.r = o.r || 40;
      this.g = U.s('g', { class: 'gv' });
      this.gEdges = U.s('g', { class: 'gv-edges' });
      this.gTokens = U.s('g', { class: 'gv-tokens' });    // under the discs: a token "enters" a vertex
      this.gNodes = U.s('g', { class: 'gv-nodes' });
      this.gOver = U.s('g', { class: 'gv-over' });
      this.g.append(this.gEdges, this.gTokens, this.gNodes, this.gOver);
      parent.appendChild(this.g);
      this.nodes = {};
      this.edges = {};
      Object.keys(o.nodes).forEach((id) => this.makeNode(id));
      (o.edges || []).forEach(([u, v]) => this.makeEdge(u, v));
    }

    pos(id) { return this.o.nodes[id]; }

    /* Segment of the edge u → v between the two discs (the arrow tip stops
     * just short of the target disc). */
    ends(u, v) {
      const a = this.pos(u), b = this.pos(v);
      const dx = b.x - a.x, dy = b.y - a.y;
      const len = Math.hypot(dx, dy) || 1;
      const ux = dx / len, uy = dy / len;
      const s = this.r + 6, e = this.r + 12;
      return { x1: a.x + ux * s, y1: a.y + uy * s, x2: b.x - ux * e, y2: b.y - uy * e, ux, uy, len };
    }

    /* Point at fraction t of the way from the centre of u to the centre of v. */
    at(u, v, t) {
      const a = this.pos(u), b = this.pos(v);
      return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
    }

    /* Midpoint of the visible edge (for labels or tokens that leave it). */
    mid(u, v) {
      const e = this.ends(u, v);
      return { x: (e.x1 + e.x2) / 2, y: (e.y1 + e.y2) / 2 };
    }

    makeEdge(u, v) {
      const e = this.ends(u, v);
      const path = U.s('path', {
        class: 'gv-edge', d: 'M' + e.x1.toFixed(1) + ',' + e.y1.toFixed(1) + ' L' + e.x2.toFixed(1) + ',' + e.y2.toFixed(1),
        'marker-end': 'url(#arrow-line)',
      });
      this.gEdges.appendChild(path);
      this.edges[u + '>' + v] = path;
      return path;
    }

    makeNode(id) {
      const p = this.pos(id);
      const R = this.r;
      const n = U.s('g', { class: 'node gv-node', 'data-id': id });
      n.innerHTML = '<circle class="ring" r="' + (R + 11) + '"/><circle class="disc" r="' + R + '"/>'
        + '<text class="key">' + ((this.o.labels && this.o.labels[id]) || id) + '</text>';
      Anim.set(n, { x: p.x, y: p.y });
      this.gNodes.appendChild(n);
      this.nodes[id] = n;
      return n;
    }

    edgeEl(u, v) { return this.edges[u + '>' + v]; }

    /* Set (or clear with on === false) a state class on an edge; the
     * arrowhead follows the most important state that is on. */
    edge(u, v, cls, on) {
      const el = this.edgeEl(u, v);
      if (!el) return;
      el.classList.toggle(cls, on !== false);
      const st = STATES.find((s) => el.classList.contains(s) && s !== 'dim') || (el.classList.contains('dim') ? 'dim' : null);
      el.setAttribute('marker-end', 'url(#arrow-' + (st ? MARKER[st] : 'line') + ')');
    }

    node(id, cls, on) {
      const n = this.nodes[id];
      if (n) n.classList.toggle(cls, on !== false);
    }

    clear() {
      Object.keys(this.edges).forEach((k) => {
        const [u, v] = k.split('>');
        STATES.forEach((s) => this.edge(u, v, s, false));
      });
      Object.values(this.nodes).forEach((n) => ['cmp', 'swap', 'ok', 'bad', 'focus', 'dim', 'new', 'max'].forEach((c) => n.classList.remove(c)));
    }

    /* A token travels along the vertex path, lighting each edge (cls) as it
     * goes and marking each vertex it reaches. Ends hidden at the last vertex. */
    async travel(path, opts) {
      const o = Object.assign({ cls: 'ok', node: 'ok', dur: 560, pause: 120 }, opts);
      const dot = U.s('circle', { class: 'gv-token ' + o.cls, r: o.size || 15 });
      this.gTokens.appendChild(dot);
      const p0 = this.pos(path[0]);
      Anim.set(dot, { x: p0.x, y: p0.y, opacity: 0 });
      this.node(path[0], o.node);
      await Anim.to(dot, { opacity: 1 }, { dur: 140 });
      for (let i = 0; i + 1 < path.length; i++) {
        const u = path[i], v = path[i + 1];
        this.edge(u, v, o.cls);
        await Anim.run((p) => {
          const q = this.at(u, v, Math.min(1, Math.max(0, p)));
          Anim.set(dot, { x: q.x, y: q.y });
        }, { dur: o.dur, ease: 'inOut' });
        this.node(v, o.node);
        if (o.onArrive) o.onArrive(v, i + 1);
        if (i + 2 < path.length) await Anim.wait(o.pause);
      }
      await Anim.to(dot, { opacity: 0 }, { dur: 160 });
      dot.remove();
    }
  }

  root.GraphView = GraphView;
})(window);
