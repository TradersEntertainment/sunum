/* Bilingual text. On-screen text is written as paired spans,
 *   <span lang="en">…</span><span lang="tr">…</span>
 * and the stylesheet hides the inactive language based on html[data-lang].
 * lang="tr" also gives the Turkish dotted/dotless i rules to text-transform. */
(function (root) {
  'use strict';

  let current = 'en';

  /* L(en, tr) -> HTML string with both languages. */
  function L(en, tr) {
    return '<span lang="en">' + en + '</span><span lang="tr">' + (tr == null ? en : tr) + '</span>';
  }

  /* pick({en, tr}) -> string in the current language (for canvas, titles…). */
  function pick(v) {
    if (v && typeof v === 'object') return v[current] != null ? v[current] : v.en;
    return v == null ? '' : String(v);
  }

  function setLang(lang, opts) {
    current = lang === 'tr' ? 'tr' : 'en';
    const html = document.documentElement;
    html.dataset.lang = current;
    html.lang = current;
    if (!opts || opts.save !== false) U.store.set('lang', current);
    root.dispatchEvent(new CustomEvent('langchange', { detail: current }));
  }

  function toggle() { setLang(current === 'en' ? 'tr' : 'en'); }

  function init() {
    setLang(U.store.get('lang', 'en'), { save: false });
  }

  root.I18n = { L, pick, setLang, toggle, init, get lang() { return current; } };
  root.L = L;
})(window);
