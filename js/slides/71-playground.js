/* Appendix A1 — interactive heapsort playground (for Q&A). */
(function () {
  'use strict';

  const H = Algo.heap;
  const K = Viz.K;
  const MAX = 15;
  const DEFAULT = [4, 15, 8, 23, 42, 16, 11, 7, 30, 2];

  function parse(text) {
    const vals = String(text).split(/[\s,;]+/).filter(Boolean).map(Number);
    if (!vals.length) return { err: L('Type a few numbers.', 'Birkaç sayı yazın.') };
    if (vals.some((v) => !Number.isFinite(v) || Math.abs(v) > 999 || !Number.isInteger(v))) {
      return { err: L('Use whole numbers between −999 and 999.', '−999 ile 999 arasında tam sayılar kullanın.') };
    }
    if (vals.length > MAX) return { err: L('At most ' + MAX + ' numbers.', 'En fazla ' + MAX + ' sayı.') };
    return { vals };
  }

  function sayFor(e, sc) {
    const v = (p) => sc.values[sc.pos[p]];
    switch (e.t) {
      case 'phase': return e.name === 'build'
        ? L('<b>Stage 1</b>: build the heap bottom-up', '<b>Aşama 1</b>: heap’i aşağıdan yukarı kur')
        : L('<b>Stage 2</b>: move the max to the end, again and again', '<b>Aşama 2</b>: en büyüğü tekrar tekrar sona taşı');
      case 'sift': return L('Fix the subtree at position ' + e.i, e.i + '. konumdaki alt ağacı düzelt');
      case 'compare': return L('Compare ' + K(v(e.k), 'cmp') + ' with its larger child ' + K(v(e.j), 'cmp'), K(v(e.k), 'cmp') + ' ile büyük çocuğu ' + K(v(e.j), 'cmp') + ' karşılaştırılır');
      case 'swap': return L('Swap ' + K(v(e.i), 'swap') + ' and ' + K(v(e.j), 'swap'), K(v(e.i), 'swap') + ' ve ' + K(v(e.j), 'swap') + ' yer değiştirir');
      case 'ok': return L(K(v(e.k), 'ok') + ' ≥ ' + K(v(e.j), 'ok') + ': heap condition holds ✓', K(v(e.k), 'ok') + ' ≥ ' + K(v(e.j), 'ok') + ': heap koşulu sağlandı ✓');
      case 'swapRoot': return L('Max ' + K(v(e.i), 'star') + ' goes to position ' + e.j, 'En büyük ' + K(v(e.i), 'star') + ' ' + e.j + '. konuma gider');
      case 'done': return L('Sorted! ✓', 'Sıralandı! ✓');
      default: return null;
    }
  }

  Deck.add({
    id: 'playground', act: 'appendix', steps: 0,
    title: { en: 'Try it: heapsort playground', tr: 'Deneyin: heapsort oyun alanı' },
    html: `
      <div class="pg-caption caption" data-interactive></div>
      <div class="pg-scene" data-interactive></div>
      <div class="pg-panel panel ticks" data-interactive>
        <label for="pg-input">${L('your numbers (max 15)', 'sayılarınız (en fazla 15)')}</label>
        <input id="pg-input" type="text" spellcheck="false" autocomplete="off">
        <div class="pg-msg" role="status"></div>
        <div class="pg-btns">
          <button class="btn" type="button" data-act="load">${L('Load', 'Yükle')}</button>
          <button class="btn" type="button" data-act="random">${L('Random', 'Rastgele')}</button>
          <button class="btn" type="button" data-act="sorted">${L('Already sorted', 'Zaten sıralı')}</button>
        </div>
        <div class="pg-btns">
          <button class="btn primary" type="button" data-act="play">${L('▶ Play', '▶ Oynat')}</button>
          <button class="btn" type="button" data-act="step">${L('Step ▸', 'Adım ▸')}</button>
          <button class="btn" type="button" data-act="reset">${L('Reset', 'Başa dön')}</button>
        </div>
        <div class="pg-speed"><span>${L('speed', 'hız')}</span><input type="range" min="0.5" max="4" step="0.25" value="1.5" aria-label="speed"><b class="pg-speed-v">×1.5</b></div>
        <div class="counters" style="flex-wrap:wrap">
          <span>${L('comparisons', 'karşılaştırma')}<b class="c-cmp">0</b></span>
          <span>${L('swaps', 'takas')}<b class="c-swp">0</b></span>
        </div>
        <p class="small muted">${L('Arrow keys still change slides; click the buttons to drive the demo.', 'Ok tuşları slayt değiştirir; demoyu düğmelerle yönetin.')}</p>
      </div>`,
    init(ctx) {
      const d = ctx.data;
      d.input = ctx.$('#pg-input');
      d.msg = ctx.$('.pg-msg');
      d.caption = new Viz.Caption(ctx.$('.pg-caption'));
      d.speed = 1.5;
      d.input.value = DEFAULT.join(', ');
      load(ctx, DEFAULT);
    },
    enter(ctx) {
      const d = ctx.data;
      ctx.el.querySelector('.pg-panel').addEventListener('click', (e) => {
        const b = e.target.closest('[data-act]');
        if (!b) return;
        e.stopPropagation();
        const act = b.dataset.act;
        if (act === 'load') {
          const r = parse(d.input.value);
          if (r.err) { d.msg.innerHTML = r.err; return; }
          load(ctx, r.vals);
        } else if (act === 'random') {
          // event handler, not a slide step: real randomness is fine here
          const n = 7 + Math.floor(Math.random() * 9);
          const vals = Array.from({ length: n }, () => 1 + Math.floor(Math.random() * 99));
          d.input.value = vals.join(', ');
          load(ctx, vals);
        } else if (act === 'sorted') {
          const vals = Array.from({ length: 15 }, (_, i) => i + 1);
          d.input.value = vals.join(', ');
          load(ctx, vals);
        } else if (act === 'play') {
          if (d.playing) pause(ctx); else play(ctx);
        } else if (act === 'step') {
          pause(ctx);
          stepOnce(ctx);
        } else if (act === 'reset') {
          load(ctx, d.values);
        }
      });
      const range = ctx.$('.pg-speed input');
      range.addEventListener('input', () => {
        d.speed = Number(range.value);
        ctx.$('.pg-speed-v').textContent = '×' + d.speed;
      });
      d.input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); ctx.el.querySelector('[data-act="load"]').click(); }
        e.stopPropagation();
      });
    },
    leave(ctx) { pause(ctx); },
  });

  function load(ctx, values) {
    const d = ctx.data;
    pause(ctx);
    d.token = (d.token || 0) + 1;
    d.values = values.slice();
    d.msg.innerHTML = '';
    const host = ctx.$('.pg-scene');
    host.innerHTML = '';
    const n = values.length;
    const cell = Math.min(80, Math.floor(1060 / n) - 8);
    d.scene = new HeapScene(host, {
      width: 1100, height: 620, values, slots: n, divider: true,
      tree: { x: 20, y: 46, w: 1060, gap: 112, r: n > 7 ? 30 : 38 },
      array: { x: (1100 - n * (cell + 8)) / 2, y: 500, cell, gap: 8 },
    });
    const r = H.heapsort(values);
    d.events = [{ t: 'phase', name: 'build' }].concat(
      r.build.events.filter((e) => e.t !== 'init' && e.t !== 'row' && e.t !== 'done'),
      [{ t: 'phase', name: 'sort' }],
      r.sort.events.filter((e) => e.t !== 'init' && e.t !== 'row'),
    );
    d.base = { cmp: 0, swaps: 0 };
    d.buildTotals = { cmp: r.build.cmp, swaps: r.build.swaps };
    d.i = 0;
    d.inSort = false;
    setCounters(ctx, 0, 0);
    d.caption.el.innerHTML = L('Press <b>▶ Play</b> or <b>Step</b>.', '<b>▶ Oynat</b> veya <b>Adım</b>’a basın.');
    d.caption.html = d.caption.el.innerHTML;
    updatePlay(ctx);
  }

  function setCounters(ctx, c, s) {
    ctx.$('.c-cmp').textContent = c;
    ctx.$('.c-swp').textContent = s;
  }

  async function stepOnce(ctx) {
    const d = ctx.data;
    if (d.busy || d.i >= d.events.length) return false;
    d.busy = true;
    const token = d.token;
    const e = d.events[d.i++];
    const speed = Anim.timeScale;
    Anim.timeScale = d.speed;
    try {
      const say = sayFor(e, d.scene);
      if (say) d.caption.set(say);
      if (e.t === 'phase') { d.inSort = e.name === 'sort'; await Anim.wait(500); }
      else await d.scene.apply(e);
      if (token !== d.token) return false;
      if (e.cmp != null) {
        const c = e.cmp + (d.inSort ? d.buildTotals.cmp : 0);
        const s = e.swaps + (d.inSort ? d.buildTotals.swaps : 0);
        setCounters(ctx, c, s);
      }
      if (e.t === 'done') {
        for (let p = 1; p <= d.values.length; p++) d.scene.mark(p, 'sorted');
      }
    } finally {
      Anim.timeScale = speed;
      d.busy = false;
    }
    return d.i < d.events.length;
  }

  async function play(ctx) {
    const d = ctx.data;
    if (d.i >= d.events.length) load(ctx, d.values);
    d.playing = true;
    updatePlay(ctx);
    const token = d.token;
    while (d.playing && ctx.alive && token === d.token) {
      const more = await stepOnce(ctx);
      if (!more) break;
      await new Promise((r) => requestAnimationFrame(r));
    }
    if (token === d.token) { d.playing = false; updatePlay(ctx); }
  }

  function pause(ctx) {
    const d = ctx.data;
    d.playing = false;
    updatePlay(ctx);
  }

  function updatePlay(ctx) {
    const b = ctx.el.querySelector('[data-act="play"]');
    if (b) b.innerHTML = ctx.data.playing ? L('❚❚ Pause', '❚❚ Durdur') : L('▶ Play', '▶ Oynat');
  }
})();
