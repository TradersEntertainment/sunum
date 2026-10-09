/* Opening: title and the big idea. (temporary engine test version) */
(function () {
  'use strict';
  Deck.add({
    id: 'title', act: 'opening', bare: true, steps: 1,
    title: { en: 'Transform & Conquer', tr: 'Dönüştür ve Fethet' },
    html: `<div class="center fill"><h1 class="slide-title" data-in="up">Transform &amp; Conquer</h1>
      <p class="lead" data-step="1">${L('Step one appears', 'Birinci adım görünür')}</p></div>`,
  });
  Deck.add({
    id: 'big-idea', act: 'opening', steps: 2,
    title: { en: 'The big idea', tr: 'Ana fikir' },
    html: `<div class="row"><div class="panel ticks" style="padding:30px" data-in="up"><p class="txt">${L('A panel', 'Bir panel')}</p></div>
      <div id="dot" style="width:60px;height:60px;border-radius:50%;background:var(--star)"></div></div>`,
    init(ctx) { Anim.set(ctx.$('#dot'), { x: 0 }); },
    async step(n, ctx) {
      if (n === 1) await Anim.to(ctx.$('#dot'), { x: 600 }, { dur: 1200, arc: 120 });
      if (n === 2) await Anim.to(ctx.$('#dot'), { x: 900, scale: 2 }, { dur: 800, ease: 'outBack' });
    },
  });
})();
