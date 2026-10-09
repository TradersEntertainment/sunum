/* Viz — small shared pieces for scenes: SVG setup, bilingual SVG text,
 * self-drawing paths, captions, trace tables, legends and icons. */
(function (root) {
  'use strict';

  const ICONS = {
    lock: '<g class="lock"><rect x="-9" y="-3" width="18" height="14" rx="3" style="fill:var(--ok)"/>'
      + '<path d="M-5,-3 v-4 a5,5 0 0 1 10,0 v4" style="fill:none;stroke:var(--ok);stroke-width:3"/></g>',
    crown: 'M-30,12 L-34,-16 L-15,-2 L0,-24 L15,-2 L34,-16 L30,12 Z',
    check: 'M-14,0 L-4,10 L16,-12',
    cross: 'M-12,-12 L12,12 M12,-12 L-12,12',
  };

  /* An SVG filling `container`, sized in stage pixels (viewBox 1:1). */
  function svg(container, w, h, cls) {
    const el = U.s('svg', {
      class: 'scene-svg' + (cls ? ' ' + cls : ''),
      width: w, height: h, viewBox: '0 0 ' + w + ' ' + h,
    });
    container.appendChild(el);
    return el;
  }

  /* Bilingual SVG text: two <text> elements; CSS hides the inactive one. */
  function text(parent, x, y, en, tr, attrs) {
    const g = U.s('g', { class: 'bt' });
    const a = Object.assign({ x, y }, attrs || {});
    g.appendChild(U.s('text', Object.assign({ lang: 'en' }, a), en));
    g.appendChild(U.s('text', Object.assign({ lang: 'tr' }, a), tr == null ? en : tr));
    parent.appendChild(g);
    return g;
  }

  /* Animate a path drawing itself (needs pathLength="1"). */
  function draw(path, opts) {
    const o = Object.assign({ dur: 700, ease: 'inOut' }, opts);
    path.setAttribute('pathLength', '1');
    path.style.strokeDasharray = '1 1';
    path.style.opacity = '1';
    return Anim.run((p) => { path.style.strokeDashoffset = String(1 - Math.min(1, p)); }, o);
  }

  /* A path that is hidden until drawn (markers included). */
  function hiddenPath(attrs) {
    const path = U.s('path', attrs);
    path.setAttribute('pathLength', '1');
    path.style.strokeDasharray = '1 1';
    path.style.strokeDashoffset = '1';
    path.style.opacity = '0';
    return path;
  }

  /* SVG stamp (✓ / ✗) that renders the same on every system. */
  function stamp(ok, extra) {
    return '<div class="stamp ' + (ok ? 'ok' : 'bad') + '"' + (extra || '') + '><svg viewBox="-20 -20 40 40" width="46" height="46" aria-hidden="true">'
      + '<path d="' + (ok ? ICONS.check : ICONS.cross) + '" style="fill:none;stroke:currentColor;stroke-width:6;stroke-linecap:round;stroke-linejoin:round"/></svg></div>';
  }

  function undraw(path, opts) {
    const o = Object.assign({ dur: 400, ease: 'inOut' }, opts);
    path.setAttribute('pathLength', '1');
    path.style.strokeDasharray = '1 1';
    return Anim.run((p) => { path.style.strokeDashoffset = String(Math.min(1, p)); }, o);
  }

  /* Fade an element in/out (opacity only). */
  function fade(el, to, opts) {
    return Anim.to(el, { opacity: to }, Object.assign({ dur: 350 }, opts));
  }

  /* Caption line: set(html) cross-fades to new content. */
  class Caption {
    constructor(el) { this.el = el; this.html = ''; }
    async set(html) {
      if (html === this.html) return;
      this.html = html;
      if (Anim.isInstant()) { this.el.innerHTML = html; return; }
      this.el.classList.add('swap-out');
      await Anim.wait(180);
      this.el.innerHTML = html;
      this.el.classList.remove('swap-out');
    }
  }

  /* Trace table like the deck's: rows of values with a sorted-part bar. */
  class TraceTable {
    constructor(el, title) {
      this.el = el;
      this.el.classList.add('trace');
      this.el.innerHTML = title ? '<div class="tr-title">' + title + '</div>' : '';
      this.prev = null;
    }
    add(vals, m, opts) {
      const o = opts || {};
      const row = U.h('div', { class: 'tr-row' });
      vals.forEach((v, i) => {
        if (m != null && i === m) row.appendChild(U.h('i', {}, '|'));
        const changed = this.prev && this.prev[i] !== v && !o.noDiff;
        const sorted = m != null && i >= m;
        row.appendChild(U.h('span', { class: sorted ? 'done' : changed ? 'ch' : '' }, U.num(v)));
      });
      this.el.appendChild(row);
      this.prev = vals.slice();
      const rows = this.el.querySelectorAll('.tr-row');
      if (o.max && rows.length > o.max) rows[0].remove();
      return row;
    }
  }

  function legend(keys) {
    const L2 = {
      cmp: ['compare', 'karşılaştır'],
      swap: ['swap', 'yer değiştir'],
      ok: ['OK ✓', 'uygun ✓'],
      bad: ['violation ✗', 'ihlal ✗'],
      sorted: ['sorted (locked)', 'sıralandı (kilitli)'],
      focus: ['being fixed', 'düzeltiliyor'],
    };
    const color = { cmp: 'var(--cmp)', swap: 'var(--swap)', ok: 'var(--ok)', bad: 'var(--bad)', sorted: 'var(--ok)', focus: 'var(--ink)' };
    return '<div class="legend">' + keys.map((k) =>
      '<span style="--c:' + color[k] + '"><i></i>' + L(L2[k][0], L2[k][1]) + '</span>').join('') + '</div>';
  }

  /* Highlight a key inside a caption: K(9, 'cmp'). */
  function K(v, cls) { return '<span class="k ' + (cls || '') + '">' + U.num(v) + '</span>'; }

  root.Viz = { ICONS, svg, text, draw, undraw, hiddenPath, stamp, fade, Caption, TraceTable, legend, K };
})(window);
