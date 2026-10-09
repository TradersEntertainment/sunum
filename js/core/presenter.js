/* Presenter view: index.html#presenter, opened from the main window with S.
 * It shows the speaker notes (EN + TR), the click cues, a timer and the next
 * slide, and drives the main window over postMessage (works on file:// too). */
(function (root) {
  'use strict';

  let state = null;
  let t0 = null, elapsed = 0, ticking = false;
  const TARGET = 10 * 60;   // seconds

  function send(cmd, extra) {
    if (!root.opener) return;
    try { root.opener.postMessage(Object.assign({ type: 'tc-cmd', cmd }, extra || {}), '*'); } catch (e) { /* ignore */ }
  }

  function fmt(sec) {
    const s = Math.max(0, Math.round(sec));
    return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  }

  function render() {
    const app = document.getElementById('pv');
    if (!app) return;
    if (!state) {
      app.querySelector('.pv-main').innerHTML = '<p class="pv-wait">' + (root.opener
        ? 'Waiting for the presentation window… / Sunum penceresi bekleniyor…'
        : 'Open this from the presentation with the S key. / Bu pencereyi sunumda S tuşuyla açın.') + '</p>';
      return;
    }
    const s = state.slides[state.index];
    const nx = state.slides[state.index + 1];
    const notes = (root.NOTES || {})[s.id] || {};
    const cues = notes.cues || [];
    const title = (s.title && (s.title[state.lang] || s.title.en)) || s.id;
    app.querySelector('.pv-where').innerHTML = '<b>' + s.label + '</b> / ' + state.total
      + ' · ' + title + ' · <span>' + (state.steps ? 'click ' + state.step + ' / ' + state.steps : 'no clicks') + '</span>';
    app.querySelector('.pv-main').innerHTML =
      '<div class="pv-notes"><div class="pv-en" lang="en">' + (Deck.notesHtml(notes.en, state.step) || '—') + '</div>'
      + '<div class="pv-tr" lang="tr">' + Deck.notesHtml(notes.tr, state.step) + '</div></div>'
      + (cues.length ? '<ol class="pv-cues">' + cues.map((c, i) =>
        '<li class="' + (i + 1 === state.step + 1 ? 'next' : i + 1 <= state.step ? 'done' : '') + '">' + c + '</li>').join('') + '</ol>' : '');
    app.querySelector('.pv-next').innerHTML = state.step < state.steps
      ? 'Next click: ' + (cues[state.step] || '—')
      : nx ? 'Next slide: ' + ((nx.title && (nx.title.en)) || nx.id) : 'End of presentation';
    const budget = notes.time ? ' · this slide ' + fmt(notes.time) : '';
    app.querySelector('.pv-budget').textContent = 'target ' + fmt(TARGET) + budget;
  }

  function tick() {
    const now = performance.now();
    const total = elapsed + (ticking && t0 != null ? (now - t0) / 1000 : 0);
    const el = document.querySelector('.pv-time');
    if (el) {
      el.textContent = fmt(total);
      el.classList.toggle('warn', total > TARGET - 60);
      el.classList.toggle('over', total > TARGET);
    }
    requestAnimationFrame(tick);
  }

  function toggleTimer() {
    if (ticking) { elapsed += (performance.now() - t0) / 1000; ticking = false; }
    else { t0 = performance.now(); ticking = true; }
    document.querySelector('[data-pv="timer"]').textContent = ticking ? 'Pause timer' : 'Start timer';
  }

  function start() {
    document.title = 'Presenter · Transform & Conquer';
    document.documentElement.classList.add('presenter-mode');
    const host = document.getElementById('app') || document.body;
    host.innerHTML = '<div id="pv" class="pv">'
      + '<header class="pv-head"><div class="pv-where"></div>'
      + '<div class="pv-clock"><span class="pv-time">0:00</span><span class="pv-budget"></span></div></header>'
      + '<main class="pv-main"></main>'
      + '<footer class="pv-foot"><div class="pv-next"></div><div class="pv-btns">'
      + '<button type="button" data-pv="prev">◀ Back</button>'
      + '<button type="button" data-pv="next" class="pv-go">Next ▶</button>'
      + '<button type="button" data-pv="timer">Start timer</button>'
      + '<button type="button" data-pv="reset">Reset timer</button>'
      + '</div></footer></div>';
    host.addEventListener('click', (e) => {
      const b = e.target.closest('[data-pv]');
      if (!b) return;
      const a = b.dataset.pv;
      if (a === 'next') { send('next'); if (!ticking && !elapsed) toggleTimer(); }
      else if (a === 'prev') send('prev');
      else if (a === 'timer') toggleTimer();
      else if (a === 'reset') { elapsed = 0; t0 = performance.now(); }
    });
    root.addEventListener('keydown', (e) => {
      const k = e.key;
      if (['ArrowRight', 'ArrowDown', 'PageDown', ' ', 'Enter'].includes(k)) { e.preventDefault(); send('next'); if (!ticking && !elapsed) toggleTimer(); }
      else if (['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace'].includes(k)) { e.preventDefault(); send('prev'); }
      else if (k === 'b' || k === 'B' || k === '.') send('blackout');
    });
    root.addEventListener('message', (e) => {
      const m = e.data;
      if (m && m.type === 'tc-state') { state = m.state; render(); }
    });
    // Say hello until the main window answers (it also re-answers after a reload).
    const hello = () => { if (!state) send('hello'); };
    hello();
    setInterval(hello, 1000);
    render();
    requestAnimationFrame(tick);
  }

  root.Presenter = { start };
})(window);
