// The talk is CONFIG.agenda; every other slide is a backup slide.
//
//   NODE_PATH=/opt/node-tools/node_modules node tests/e2e/agenda.js [--url=https://…/]
//
// Checks: the talk is the agenda, in order, at most 8 slides, labelled 1..n; the backup slides
// follow, labelled A1..; the progress bar and the counter count only the talk; Home / End / the
// forward key stay inside the talk; the overview has one card per slide and a separator before
// the backup slides; a backup slide opens by #id; the presenter window plans from the talk's
// time budgets and says "End of presentation" after the last slide.
const { chromium } = require('playwright');
const path = require('path');

const args = Object.fromEntries(process.argv.slice(2).map((a) => {
  const m = a.match(/^--([^=]+)=?(.*)$/);
  return m ? [m[1], m[2] || true] : [a, true];
}));
const target = args.url ? String(args.url) : 'file://' + path.resolve(__dirname, '..', '..', 'index.html');
const MAX_SLIDES = 8;

let failures = 0;
const fail = (msg) => { failures++; console.log('  ✗ ' + msg); };
const ok = (cond, msg) => { if (!cond) fail(msg); };

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.type() + ': ' + m.text()); });
  const snap = () => page.evaluate(() => Deck.snapshot());
  const idle = () => page.waitForFunction(() => !Deck.busy, null, { timeout: 15000 });
  const open = async (hash) => {
    await page.goto(target + (hash || ''));
    await page.reload();                         // the hash alone would not reload the page
    await page.waitForFunction(() => window.Deck && Deck.current, null, { timeout: 20000 });
    await page.waitForTimeout(300);
  };

  console.log('- the talk');
  await open();
  const agenda = await page.evaluate(() => (window.CONFIG || {}).agenda || null);
  ok(Array.isArray(agenda) && agenda.length > 0, 'CONFIG.agenda is not set');
  let s = await snap();
  const talk = s.slides.filter((x) => !x.extra);
  const extras = s.slides.filter((x) => x.extra);
  ok(JSON.stringify(talk.map((x) => x.id)) === JSON.stringify(agenda), `the talk is not the agenda in order: ${talk.map((x) => x.id).join(', ')}`);
  ok(talk.length >= 1 && talk.length <= MAX_SLIDES, `the talk has ${talk.length} slides (max ${MAX_SLIDES})`);
  ok(s.total === talk.length && s.count === talk.length + extras.length, `snapshot counts: total ${s.total}, count ${s.count}`);
  ok(s.slides.slice(0, talk.length).every((x) => !x.extra) && s.slides.slice(talk.length).every((x) => x.extra), 'a backup slide sits inside the talk');
  ok(new Set(s.slides.map((x) => x.id)).size === s.slides.length, 'a slide id appears twice');
  ok(talk.every((x, i) => x.label === String(i + 1)), `talk labels: ${talk.map((x) => x.label).join(' ')}`);
  ok(extras.every((x, i) => x.label === 'A' + (i + 1)), `backup labels: ${extras.map((x) => x.label).join(' ')}`);
  ok(extras.length > 0, 'no backup slides');
  const chrome = await page.evaluate(() => ({ segs: document.querySelectorAll('.progress .seg').length, counter: document.querySelector('.counter').textContent }));
  ok(chrome.segs === talk.length, `progress bar has ${chrome.segs} segments, the talk has ${talk.length}`);
  ok(chrome.counter === `1/${talk.length}`, `counter reads "${chrome.counter}"`);

  console.log('- keys stay inside the talk');
  const last = talk[talk.length - 1];
  await page.keyboard.press('End'); await idle();
  s = await snap();
  ok(s.id === last.id && s.step === 0, `End went to ${s.id} step ${s.step}, not to ${last.id}`);
  for (let k = 0; k < last.steps + 4; k++) { await page.keyboard.press('ArrowRight'); await page.waitForTimeout(120); await idle(); }
  s = await snap();
  ok(s.id === last.id && s.step === last.steps, `after pressing → past the end: ${s.id} step ${s.step}`);
  const toast = await page.evaluate(() => ({ on: document.querySelector('.toast').classList.contains('on'), text: document.querySelector('.toast').textContent }));
  ok(toast.on && /backup|yedek/i.test(toast.text), `no end-of-talk hint (${toast.text})`);
  await page.keyboard.press('9'); await page.keyboard.press('9'); await page.keyboard.press('Enter'); await idle();
  ok((await snap()).id === last.id, 'number + Enter jumped past the talk');
  await page.keyboard.press('Home'); await idle();
  ok((await snap()).id === talk[0].id, 'Home did not go to the first slide');

  console.log('- overview');
  await page.keyboard.press('o');
  await page.waitForSelector('.overview:not([hidden]) .ov-card');
  const ov = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.ov-card'));
    const seps = Array.from(document.querySelectorAll('.ov-sep'));
    const sep = seps[0];
    return {
      cards: cards.length, seps: seps.length,
      before: sep ? cards.filter((c) => sep.compareDocumentPosition(c) & Node.DOCUMENT_POSITION_PRECEDING).length : -1,
      afterExtra: cards.filter((c) => sep && (sep.compareDocumentPosition(c) & Node.DOCUMENT_POSITION_FOLLOWING)).every((c) => c.classList.contains('extra')),
      sepBox: sep ? (() => { const r = sep.getBoundingClientRect(); return { w: r.width, h: r.height }; })() : null,
    };
  });
  ok(ov.cards === s.count, `overview has ${ov.cards} cards for ${s.count} slides`);
  ok(ov.seps === 1, `overview has ${ov.seps} separators`);
  ok(ov.before === talk.length, `${ov.before} cards before the separator, the talk has ${talk.length}`);
  ok(ov.afterExtra, 'a card after the separator is not marked as a backup');
  ok(ov.sepBox && ov.sepBox.w > 300 && ov.sepBox.h > 10, 'the separator has no room');
  await page.keyboard.press('Escape');

  console.log('- a backup slide opens by #id, and walks only through the backup slides');
  const bk = extras.find((x) => x.id === 'avl') || extras[0];
  await open('#' + bk.id);
  s = await snap();
  ok(s.id === bk.id && s.label === bk.label, `#${bk.id} opened ${s.id} (${s.label})`);
  const bchrome = await page.evaluate(() => ({ counter: document.querySelector('.counter').textContent, cur: document.querySelectorAll('.progress .seg.cur').length }));
  ok(bchrome.counter === bk.label, `backup counter reads "${bchrome.counter}"`);
  ok(bchrome.cur === 0, 'a backup slide lights a segment of the talk');
  await page.evaluate((i) => Deck.goto(i, 0), talk.length);
  await idle();
  await page.keyboard.press('ArrowLeft'); await idle();
  ok((await snap()).id === last.id, 'back from the first backup slide does not return to the end of the talk');
  await page.evaluate((i) => Deck.goto(i, 0), s.count - 1);
  await idle();
  const lastExtra = (await snap()).id;
  for (let k = 0; k < 12; k++) { await page.keyboard.press('ArrowRight'); await page.waitForTimeout(100); }
  await idle();
  ok((await snap()).id === lastExtra, 'forward moved past the last backup slide');

  console.log('- presenter window');
  await open();
  const [pv] = await Promise.all([ctx.waitForEvent('page', { timeout: 10000 }), page.keyboard.press('s')]);
  await pv.waitForSelector('.pv-where', { timeout: 10000 });
  await pv.waitForFunction(() => /\//.test(document.querySelector('.pv-where').textContent), null, { timeout: 10000 });
  const planned = await page.evaluate(() => {
    const notes = window.NOTES || {};
    return Deck.snapshot().slides.filter((x) => !x.extra).reduce((a, x) => a + ((notes[x.id] || {}).time || 0), 0);
  });
  const want = Math.ceil(planned / 30) * 30;
  const budget = await pv.evaluate(() => document.querySelector('.pv-budget').textContent);
  const wantText = 'target ' + Math.floor(want / 60) + ':' + String(want % 60).padStart(2, '0');
  ok(budget.startsWith(wantText), `presenter target "${budget}" (expected to start with "${wantText}")`);
  await page.bringToFront();
  await page.evaluate((i) => Deck.goto(i, Deck.slides[i].steps), talk.length - 1);
  await idle();
  await pv.waitForFunction(() => /End of presentation/.test(document.querySelector('.pv-next').textContent), null, { timeout: 10000 })
    .catch(() => fail('presenter does not say "End of presentation" after the last slide of the talk'));
  await pv.close();

  errors.forEach((e) => fail('console: ' + e));
  await browser.close();
  console.log(failures ? `\n${failures} problem(s)` : '\nAll agenda checks passed');
  process.exit(failures ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
