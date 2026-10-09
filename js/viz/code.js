/* CodeView — pseudocode panel with a moving line highlight. Lines are plain
 * text; keywords and // comments are coloured automatically. */
(function (root) {
  'use strict';

  const KW = /\b(for|to|downto|do|while|if|then|else|return|and|or|not|break|swap|Algorithm)\b/g;

  function esc(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function fmt(line) {
    const at = line.indexOf('//');
    const code = at >= 0 ? line.slice(0, at) : line;
    const comment = at >= 0 ? line.slice(at) : '';
    return esc(code).replace(KW, '<span class="kw">$1</span>')
      + (comment ? '<span class="cm">' + esc(comment) + '</span>' : '');
  }

  class CodeView {
    constructor(el, lines, title) {
      this.el = el;
      el.classList.add('codebox');
      el.innerHTML = (title ? '<div class="code-title">' + title + '</div>' : '')
        + lines.map((l, i) => '<div class="ln" data-n="' + (i + 1) + '">' + fmt(l) + '</div>').join('');
      this.lines = Array.from(el.querySelectorAll('.ln'));
      this.cur = 0;
    }

    /* Highlight line n (1-based); 0 clears. */
    line(n) {
      this.cur = n;
      this.lines.forEach((l, i) => l.classList.toggle('on', i + 1 === n));
    }
  }

  root.CodeView = CodeView;
})(window);
