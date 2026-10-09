// Screenshot slides at given steps by jumping straight to them (instant rebuild).
// usage: node tools/shots.js --ids=heap-build,heapsort [--steps=all|0,2] [--lang=en|tr]
//        [--theme=dark|light] [--out=dir] [--settle=ms] [--w=1920 --h=1080]
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const args = Object.fromEntries(process.argv.slice(2).map((a) => {
  const m = a.match(/^--([^=]+)=?(.*)$/);
  return m ? [m[1], m[2] || true] : [a, true];
}));
const out = args.out || path.join(process.cwd(), 'artifacts', 'shots');
fs.mkdirSync(out, { recursive: true });

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: Number(args.w || 1920), height: Number(args.h || 1080) } });
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  const file = 'file://' + path.resolve(__dirname, '..', args.file || 'index.html');
  await page.addInitScript(([lang, theme]) => {
    try { localStorage.setItem('tc.lang', lang); localStorage.setItem('tc.theme', theme); } catch (e) { /* ignore */ }
  }, [args.lang || 'en', args.theme || 'dark']);
  await page.goto(file);
  await page.waitForFunction(() => window.Deck && Deck.current, null, { timeout: 15000 });
  const slides = await page.evaluate(() => Deck.slides.map((s) => ({ id: s.id, steps: s.steps })));
  const ids = args.ids ? String(args.ids).split(',') : slides.map((s) => s.id);
  for (const id of ids) {
    const i = slides.findIndex((s) => s.id === id);
    if (i < 0) { console.log('no slide', id); continue; }
    const all = Array.from({ length: slides[i].steps + 1 }, (_, k) => k);
    const steps = !args.steps || args.steps === 'all' ? all : String(args.steps).split(',').map(Number);
    for (const k of steps) {
      await page.evaluate(([i, k]) => Deck.goto(i, k), [i, k]);
      await page.waitForFunction(() => !Deck.busy);
      await page.waitForTimeout(Number(args.settle || 900));
      const name = `${String(i + 1).padStart(2, '0')}-${id}-s${k}-${args.lang || 'en'}-${args.theme || 'dark'}.png`;
      await page.screenshot({ path: path.join(out, name) });
      console.log('shot', name);
    }
  }
  console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'no console errors');
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
