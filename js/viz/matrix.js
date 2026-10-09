/* MatrixView — an (augmented) matrix of exact values, drawn in HTML and laid
 * out from its own model (no DOM measuring), with animated cell changes.
 * Styles live in css/act-simplify.css (classes .mx-*).
 *
 *   const mv = new MatrixView(host, {
 *     rows: [[2, -4, 1, 6], …],           // numbers, fractions ({p, q} such as
 *                                         // Algo.gauss Fractions) or HTML strings
 *     x: 0, y: 0,                         // top-left of cell (0, 0) inside host, px
 *     cw: 150, ch: 104,                   // cell size, px
 *     aug: 3,                             // first column after the "|" bar (null: none)
 *     augGap: 34,                         // extra room for the bar
 *     rowLabels: ['R₁', 'R₂', 'R₃'],      // optional, left of the bracket
 *     colLabels: ['x₁', 'x₂', 'x₃', 'b'], // optional, above the bracket
 *     fmt: (v) => html,                   // optional cell formatter (default MatrixView.fmt)
 *   });
 *
 * Geometry  mv.cellX(c), mv.rowY(r)        left / top of a cell (host px)
 *           mv.cellXY(r, c)                centre of a cell
 *           mv.width, mv.height            size of the cell area (bar gap included)
 * Values    mv.value(r, c);  mv.set(r, c, v)            change instantly
 *           await mv.flip(r, c, v, {dur, delay})        card-flip to a new value
 *           await mv.poof(r, c, v, {dur, delay})        old value bursts, v pops in
 *                                                       (use it for new zeros)
 * State     mv.mark(r, c, cls, on), mv.markRow(r, cls, on), mv.markCol(c, cls, on),
 *           mv.clear([classes])  — cell classes styled in CSS:
 *           pivot (ring), src (sky tint), dst (magenta tint), zero (muted),
 *           glow (act-colour tint), ok (green), dim
 * Ghost row const g = mv.ghost(r, {tag})   a floating copy of row r, placed over it.
 *           Move it with Anim.to(g.el, {y: mv.rowY(k) - mv.rowY(r)}); g.cells[c];
 *           await g.flip(c, v, opts); g.setTag(html); g.remove() when done
 *           (always remove it inside the same step so instant replay matches).
 * Overlay   mv.svg                         an <svg> over the cell area (same px)
 *           mv.stairPath(n)                path d around the upper triangle of an
 *                                          n × n coefficient block
 * Helpers   MatrixView.fmt(v)              HTML for a value: integers plain, fractions
 *                                          stacked, real minus sign (U+2212)
 *           MatrixView.inline(v)           same, for running text (smaller fraction)
 *
 * Every animation goes through Anim, so a slide step that uses it replays
 * instantly and lands in the same state.
 */
(function (root) {
  'use strict';

  function asFrac(v) {
    if (v && typeof v === 'object' && 'p' in v && 'q' in v) return { p: v.p, q: v.q };
    if (typeof v === 'number' && Number.isInteger(v)) return { p: v, q: 1 };
    return null;
  }

  function fmt(v) {
    if (v == null) return '';
    const f = asFrac(v);
    if (!f) return typeof v === 'number' ? U.num(v) : String(v);
    const sign = f.p < 0 ? '<span class="mx-sg">−</span>' : '';
    const a = Math.abs(f.p);
    if (f.q === 1) return sign + a;
    return sign + '<span class="mx-fr"><span>' + a + '</span><span>' + f.q + '</span></span>';
  }

  function inline(v) {
    return '<span class="mx-in">' + fmt(v) + '</span>';
  }

  class MatrixView {
    constructor(host, o) {
      this.o = Object.assign({ x: 0, y: 0, cw: 150, ch: 104, aug: null, augGap: 34 }, o);
      this.fmt = this.o.fmt || fmt;
      this.vals = o.rows.map((r) => r.slice());
      this.nr = this.vals.length;
      this.nc = this.vals[0].length;
      const O = this.o;
      this.width = this.nc * O.cw + (O.aug != null ? O.augGap : 0);
      this.height = this.nr * O.ch;
      this.el = U.h('div', { class: 'mx' });
      host.appendChild(this.el);

      // brackets and the augmented bar
      const pad = 14;
      this.el.appendChild(U.h('div', { class: 'mx-br l', style: { left: (O.x - 22) + 'px', top: (O.y - pad) + 'px', height: (this.height + 2 * pad) + 'px' } }));
      this.el.appendChild(U.h('div', { class: 'mx-br r', style: { left: (O.x + this.width + 6) + 'px', top: (O.y - pad) + 'px', height: (this.height + 2 * pad) + 'px' } }));
      if (O.aug != null) {
        this.el.appendChild(U.h('div', { class: 'mx-bar', style: { left: (O.x + O.aug * O.cw + O.augGap / 2 - 1.5) + 'px', top: (O.y - 4) + 'px', height: (this.height + 8) + 'px' } }));
      }
      if (O.rowLabels) {
        this.rowLabels = O.rowLabels.map((t, r) => {
          const e = U.h('div', { class: 'mx-rl', html: t, style: { left: (O.x - 100) + 'px', top: this.rowY(r) + 'px', width: '64px', height: O.ch + 'px' } });
          this.el.appendChild(e);
          return e;
        });
      }
      if (O.colLabels) {
        this.colLabels = O.colLabels.map((t, c) => {
          const e = U.h('div', { class: 'mx-cl', html: t, style: { left: this.cellX(c) + 'px', top: (O.y - pad - 46) + 'px', width: O.cw + 'px', height: '40px' } });
          this.el.appendChild(e);
          return e;
        });
      }

      // overlay svg (under the cells, so text stays on top)
      this.svg = U.s('svg', { class: 'mx-svg', width: this.width + 40, height: this.height + 40, viewBox: '-20 -20 ' + (this.width + 40) + ' ' + (this.height + 40) });
      this.svg.style.left = (O.x - 20) + 'px';
      this.svg.style.top = (O.y - 20) + 'px';
      this.el.appendChild(this.svg);

      this.cells = this.vals.map((row, r) => row.map((v, c) => {
        const cell = this.makeCell(r, c, v);
        this.el.appendChild(cell);
        return cell;
      }));
    }

    /* ---------- geometry ---------- */
    cellX(c) { const O = this.o; return O.x + c * O.cw + (O.aug != null && c >= O.aug ? O.augGap : 0); }
    rowY(r) { return this.o.y + r * this.o.ch; }
    cellXY(r, c) { return { x: this.cellX(c) + this.o.cw / 2, y: this.rowY(r) + this.o.ch / 2 }; }

    makeCell(r, c, v) {
      const O = this.o;
      const cell = U.h('div', { class: 'mx-cell', style: { left: this.cellX(c) + 'px', top: this.rowY(r) + 'px', width: O.cw + 'px', height: O.ch + 'px' } });
      cell.dataset.r = r;
      cell.dataset.c = c;
      cell.appendChild(U.h('span', { class: 'mx-v', html: this.fmt(v) }));
      return cell;
    }

    /* ---------- values ---------- */
    cell(r, c) { return this.cells[r][c]; }
    value(r, c) { return this.vals[r][c]; }

    set(r, c, v) {
      this.vals[r][c] = v;
      this.cells[r][c].firstChild.innerHTML = this.fmt(v);
    }

    /* Flip an element's .mx-v content to new HTML: squash, swap, unsquash. */
    static flipEl(cell, html, opts) {
      const o = Object.assign({ dur: 420, delay: 0, ease: 'inOut' }, opts);
      const inner = cell.firstChild;
      let swapped = false;
      return Anim.run((p) => {
        const q = Math.min(1, Math.max(0, p));
        if (q >= 0.5 && !swapped) { swapped = true; inner.innerHTML = html; }
        inner.style.transform = 'scaleY(' + Math.abs(1 - 2 * q).toFixed(3) + ')';
      }, o).then(() => { inner.style.transform = ''; });
    }

    flip(r, c, v, opts) {
      this.vals[r][c] = v;
      return MatrixView.flipEl(this.cells[r][c], this.fmt(v), opts);
    }

    /* The old value swells and fades, a ring bursts, the new value pops in. */
    poof(r, c, v, opts) {
      const o = Object.assign({ dur: 640, delay: 0 }, opts);
      const cell = this.cells[r][c];
      const inner = cell.firstChild;
      const html = this.fmt(v);
      this.vals[r][c] = v;
      if (Anim.isInstant()) { inner.innerHTML = html; return Promise.resolve(); }
      const old = U.h('span', { class: 'mx-v mx-puff', html: inner.innerHTML });
      const ring = U.h('span', { class: 'mx-ring' });
      cell.append(old, ring);
      inner.innerHTML = html;
      inner.style.opacity = '0';
      return Anim.run((p) => {
        const q = Math.min(1, Math.max(0, p));
        const a = Math.min(1, q / 0.5);               // old value: 0 → 0.5
        old.style.transform = 'scale(' + (1 + 0.8 * a).toFixed(3) + ')';
        old.style.opacity = String(Math.max(0, 1 - a).toFixed(3));
        ring.style.transform = 'scale(' + (0.3 + 1.3 * q).toFixed(3) + ')';
        ring.style.opacity = String((1 - q).toFixed(3));
        const b = Math.max(0, (q - 0.4) / 0.6);       // new value: 0.4 → 1
        const s = b <= 0 ? 0.3 : 0.3 + 0.7 * Anim.ease.outBack(b);
        inner.style.transform = 'scale(' + s.toFixed(3) + ')';
        inner.style.opacity = String(b.toFixed(3));
      }, Object.assign({ ease: 'linear' }, o)).then(() => {
        old.remove();
        ring.remove();
        inner.style.transform = '';
        inner.style.opacity = '';
      });
    }

    /* ---------- state ---------- */
    mark(r, c, cls, on) { this.cells[r][c].classList.toggle(cls, on !== false); }
    markRow(r, cls, on) { for (let c = 0; c < this.nc; c++) this.mark(r, c, cls, on); }
    markCol(c, cls, on) { for (let r = 0; r < this.nr; r++) this.mark(r, c, cls, on); }
    clear(classes) {
      const list = classes || ['pivot', 'src', 'dst', 'hit', 'ok', 'dim'];
      this.cells.forEach((row) => row.forEach((cell) => list.forEach((k) => cell.classList.remove(k))));
    }

    /* ---------- ghost row ---------- */
    ghost(r, opts) {
      const o = opts || {};
      const O = this.o;
      const el = U.h('div', { class: 'mx-ghost' });
      const box = U.h('div', { class: 'mx-ghost-box', style: { left: (O.x - 10) + 'px', top: (this.rowY(r) + 4) + 'px', width: (this.width + 20) + 'px', height: (O.ch - 8) + 'px' } });
      el.appendChild(box);
      const cells = this.vals[r].map((v, c) => {
        const cell = this.makeCell(r, c, v);
        cell.classList.add('mx-gcell');
        el.appendChild(cell);
        return cell;
      });
      const tag = U.h('div', { class: 'mx-tag', style: { left: (O.x - 112) + 'px', top: this.rowY(r) + 'px', width: '88px', height: O.ch + 'px' } });
      tag.appendChild(U.h('span', { class: 'mx-v', html: o.tag || '' }));
      el.appendChild(tag);
      this.el.appendChild(el);
      const fmtv = this.fmt;
      return {
        el, cells, tag,
        flip: (c, v, fo) => MatrixView.flipEl(cells[c], fmtv(v), fo),
        setTag: (html, fo) => MatrixView.flipEl(tag, html, fo),
        remove: () => el.remove(),
      };
    }

    /* Outline of the upper triangle (diagonal and above) of the first n
     * columns, in overlay-svg coordinates. */
    stairPath(n) {
      const O = this.o;
      const x0 = this.cellX(0) - O.x, y0 = 0;
      const right = this.cellX(n - 1) - O.x + O.cw;
      let d = 'M' + x0 + ',' + y0 + ' H' + right + ' V' + (n * O.ch);
      for (let k = n - 1; k >= 0; k--) {
        d += ' H' + (this.cellX(k) - O.x);
        if (k > 0) d += ' V' + (k * O.ch);
      }
      return d + ' Z';
    }
  }

  MatrixView.fmt = fmt;
  MatrixView.inline = inline;
  root.MatrixView = MatrixView;
})(window);
