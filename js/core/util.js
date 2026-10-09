/* Small DOM helpers shared by the deck, the views and the slides. */
(function (root) {
  'use strict';

  const SVGNS = 'http://www.w3.org/2000/svg';

  function applyAttrs(el, attrs) {
    if (!attrs) return;
    for (const k in attrs) {
      const v = attrs[k];
      if (v == null || v === false) continue;
      if (k === 'class') el.setAttribute('class', v);
      else if (k === 'style' && typeof v === 'object') {
        for (const sk in v) {
          if (sk.startsWith('--')) el.style.setProperty(sk, v[sk]);
          else el.style[sk] = v[sk];
        }
      }
      else if (k === 'html') el.innerHTML = v;
      else if (k === 'text') el.textContent = v;
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
      else if (k === 'dataset') Object.assign(el.dataset, v);
      else el.setAttribute(k, v === true ? '' : v);
    }
  }

  function append(el, children) {
    for (const c of children.flat(Infinity)) {
      if (c == null || c === false) continue;
      el.appendChild(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(String(c)) : c);
    }
    return el;
  }

  const U = {
    SVGNS,
    $: (sel, ctx) => (ctx || document).querySelector(sel),
    $$: (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel)),

    /* h('div', {class: 'x'}, child...) — HTML element. */
    h(tag, attrs, ...children) {
      const el = document.createElement(tag);
      applyAttrs(el, attrs);
      return append(el, children);
    },

    /* s('circle', {r: 10}) — SVG element. */
    s(tag, attrs, ...children) {
      const el = document.createElementNS(SVGNS, tag);
      applyAttrs(el, attrs);
      return append(el, children);
    },

    clamp: (v, lo, hi) => Math.min(hi, Math.max(lo, v)),
    range: (n, start) => Array.from({ length: n }, (_, i) => i + (start || 0)),

    /* localStorage can be missing or throw (private windows, sandboxed
     * frames); every access is guarded and the page works without it. */
    store: {
      get(key, fallback) {
        try {
          const v = root.localStorage.getItem('tc.' + key);
          return v == null ? fallback : v;
        } catch (e) { return fallback; }
      },
      set(key, value) {
        try { root.localStorage.setItem('tc.' + key, value); } catch (e) { /* ignore */ }
      },
    },

    /* Number formatting with a real minus sign (U+2212). */
    num(v) {
      return typeof v === 'number' && v < 0 ? '−' + Math.abs(v) : String(v);
    },

    shuffle(arr, seed) {
      const a = arr.slice();
      let s = seed || 1;
      const rnd = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(rnd() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    },
  };

  root.U = U;
})(window);
