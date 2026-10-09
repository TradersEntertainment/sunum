/* Appendix (Q&A backup): the four AVL rotations side by side, looping, and
 * the height bounds of AVL and 2-3 trees (Levitin §6.3). */
(function () {
  'use strict';

  const B = Algo.bst;

  /* Each case: insert three keys into an empty AVL tree; the third insert
   * unbalances the root and triggers the rotation. */
  const CASES = [
    { keys: [3, 2, 1], name: 'R', en: 'single right rotation', tr: 'tek sağa döndürme' },
    { keys: [1, 2, 3], name: 'L', en: 'single left rotation', tr: 'tek sola döndürme' },
    { keys: [3, 1, 2], name: 'LR', en: 'double left-right rotation', tr: 'çift sol-sağ döndürme' },
    { keys: [1, 3, 2], name: 'RL', en: 'double right-left rotation', tr: 'çift sağ-sol döndürme' },
  ].map((c) => {
    const run = B.avlInsertAll(c.keys);
    const ins = run.events.filter((e) => e.t === 'insert');
    return Object.assign(c, {
      before: ins[ins.length - 1].snap,
      unb: run.events.find((e) => e.t === 'unbalanced'),
      rot: run.events.find((e) => e.t === 'rotate'),
    });
  });

  function reset(v, c) {
    v.set(c.before);
    v.clear();
    c.unb.all.forEach((k) => v.mark(k, 'bad'));
  }

  async function play(v, c, A) {
    await A.wait(1100);
    await v.rotate(c.rot, { A, dur: 1000, gap: 300 });
    v.markAll('ok');
  }

  Deck.add({
    id: 'avl-rotations', act: 'appendix', steps: 2,
    title: { en: 'The four AVL rotations', tr: 'Dört AVL döndürmesi' },
    html: `
      <div class="rot-grid">
        ${CASES.map((c) => `<div class="panel rot-card">
          <div class="rot-head"><b>${c.name}</b><span>${L(c.en, c.tr)}</span></div>
          <div class="rot-scene"></div>
          <div class="rot-when">${c.name.length === 1 ? L('straight line', 'düz çizgi') : L('zig-zag', 'zikzak')}</div>
        </div>`).join('')}
      </div>
      <div class="rot-bounds">
        <div class="panel ticks rot-b" data-step="1">
          <h3>${L('AVL tree height', 'AVL ağacının yüksekliği')}</h3>
          <div class="formula">h ≤ 1.4404 log₂(n + 2) − 1.3277</div>
          <p class="rot-avg">${L('on average ≈ 1.01 log₂ n + 0.1 (large n)', 'ortalamada ≈ 1.01 log₂ n + 0.1 (büyük n için)')}</p>
          <p class="rot-avg">${L('A rotation only re-links a few pointers: O(1). One insertion needs at most one (single or double) rotation.',
            'Döndürme yalnızca birkaç işaretçiyi değiştirir: O(1). Bir ekleme en fazla bir (tek ya da çift) döndürme gerektirir.')}</p>
        </div>
        <div class="panel ticks rot-b" data-step="2">
          <h3>${L('2-3 tree height', '2-3 ağacının yüksekliği')}</h3>
          <div class="formula">log₃(n + 1) − 1 ≤ h ≤ log₂(n + 1) − 1</div>
          <p class="rot-avg">${L('Every leaf on the same level; a full node splits and the tree grows at the root.', 'Tüm yapraklar aynı seviyede; dolan düğüm bölünür, ağaç kökten büyür.')}</p>
          <p class="rot-avg">${L('search, insert, delete:', 'arama, ekleme, silme:')} <span class="badge-o ok">Θ(log n)</span> ${L('in both trees', 'iki ağaçta da')}</p>
        </div>
      </div>`,
    init(ctx) {
      const d = ctx.data;
      d.views = ctx.$$('.rot-scene').map((host, i) => {
        const v = new BinTreeView(host, {
          width: 395, height: 330, keys: [1, 2, 3], x0: 32, colW: 110, y0: 82, rowH: 92, r: 36,
          badges: true, ambient: true,
        });
        reset(v, CASES[i]);
        return v;
      });
    },
    enter(ctx) {
      const d = ctx.data;
      ctx.loop(async (A) => {
        await Promise.all(d.views.map((v, i) => play(v, CASES[i], A)));
        await A.wait(2200);
        await Promise.all(d.views.map((v) => A.to(v.svg, { opacity: 0 }, { dur: 380 })));
        d.views.forEach((v, i) => reset(v, CASES[i]));
        await Promise.all(d.views.map((v) => A.to(v.svg, { opacity: 1 }, { dur: 380 })));
      });
    },
  });
})();
