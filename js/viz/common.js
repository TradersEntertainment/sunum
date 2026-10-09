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

  /* Generic line icons for the real-world strips (24×24, stroke = currentColor). */
  const RICONS = {
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18"/>',
    terminal: '<rect x="2.5" y="4" width="19" height="16" rx="2"/><path d="M6 9l3 3-3 3M11 15h6"/>',
    database: '<ellipse cx="12" cy="5.5" rx="8" ry="3"/><path d="M4 5.5v13c0 1.7 3.6 3 8 3s8-1.3 8-3v-13M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
    server: '<rect x="3" y="3.5" width="18" height="7" rx="1.5"/><rect x="3" y="13.5" width="18" height="7" rx="1.5"/><path d="M7 7h.01M7 17h.01"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
    route: '<circle cx="5" cy="18" r="2.5"/><circle cx="19" cy="6" r="2.5"/><path d="M7.5 18h6a3.5 3.5 0 0 0 0-7h-3a3.5 3.5 0 0 1 0-7h6"/>',
    search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L21 21"/>',
    zip: '<path d="M6 2.5h8l4 4v15H6z"/><path d="M14 2.5v4h4M10 5h2M10 8h2M10 11h2M10 14h2v3h-2z"/>',
    code: '<path d="M8 7l-5 5 5 5M16 7l5 5-5 5M14 4l-4 16"/>',
    chip: '<rect x="6" y="6" width="12" height="12" rx="1.5"/><path d="M9 2.5v3.5M15 2.5v3.5M9 18v3.5M15 18v3.5M2.5 9H6M2.5 15H6M18 9h3.5M18 15h3.5"/>',
    lock: '<rect x="4.5" y="10.5" width="15" height="11" rx="2"/><path d="M8 10.5V7a4 4 0 0 1 8 0v3.5"/>',
    folder: '<path d="M3 6.5a2 2 0 0 1 2-2h4l2 2.5h8a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
    chart: '<path d="M4 20V4M4 20h16"/><path d="M7 16l4-5 3 3 5-7"/>',
    people: '<circle cx="8" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M2.5 20a5.5 5.5 0 0 1 11 0M14 20a4 4 0 0 1 7.5-1.5"/>',
    plane: '<path d="M2.5 14.5l8-2.5 4-8.5 2 .5-1.5 8 5.5 1.5 1 2-6.5-.5-4 5-2-.5 1-4.5-7 .5z"/>',
    brain: '<path d="M9 4.5a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 2 5 3 3 0 0 0 3 2.5V4.5zM15 4.5a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3 3 0 0 1-2 5 3 3 0 0 1-3 2.5V4.5z"/>',
    calc: '<rect x="5" y="2.5" width="14" height="19" rx="2"/><path d="M8 6.5h8M8.5 11h.01M12 11h.01M15.5 11h.01M8.5 14.5h.01M12 14.5h.01M15.5 14.5h.01M8.5 18h.01M12 18h7"/>',
    hash: '<path d="M9 3L7 21M17 3l-2 18M3.5 8.5h18M2.5 15.5h18"/>',
    bolt: '<path d="M13 2.5L5 13.5h6l-1 8 8-11h-6z"/>',
  };

  /* A system name: plain string, or {en, tr} when it reads differently in Turkish. */
  function whoText(w) { return w && typeof w === 'object' ? L(w.en, w.tr) : w; }

  function ricon(name, size) {
    return '<svg class="ricon" viewBox="0 0 24 24" width="' + (size || 30) + '" height="' + (size || 30) + '" aria-hidden="true">'
      + (RICONS[name] || RICONS.globe) + '</svg>';
  }

  /* "Real world" strip: who uses this idea, and where.
   *   Viz.real([{icon: 'terminal', who: 'Linux kernel', en: '…', tr: '…'}, …],
   *            {layout: 'row' | 'col', attrs: ' data-step="3"'})          */
  function real(items, opts) {
    const o = opts || {};
    return '<div class="real ' + (o.layout || 'row') + (o.cls ? ' ' + o.cls : '') + '"' + (o.attrs || '') + '>'
      + '<div class="real-head">' + ricon('globe', 26) + L('Real world · who uses it?', 'Gerçek hayatta · kim kullanıyor?') + '</div>'
      + '<div class="real-items">' + items.map((it) => '<div class="real-item">'
        + '<span class="real-ic">' + ricon(it.icon, 30) + '</span>'
        + '<div class="real-txt"><b class="real-who">' + whoText(it.who) + '</b>' + L(it.en, it.tr) + '</div></div>').join('')
      + '</div></div>';
  }

  root.Viz = { ICONS, RICONS, ricon, real, whoText, svg, text, draw, undraw, hiddenPath, stamp, fade, Caption, TraceTable, legend, K };
})(window);
