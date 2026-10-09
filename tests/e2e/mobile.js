// Phone / tablet check with real touch events on emulated devices.
//
//   NODE_PATH=/opt/node-tools/node_modules node tests/e2e/mobile.js [--url=https://…/] [--shots=dir]
//
// For every device it checks: the page never scrolls; the control bar is visible
// with ≥ 44 px tap targets, inside the screen and clear of the slide; tapping
// the slide, the buttons and swiping navigate; language / theme / overview work
// (the overview can reach its first card and has a close button); the
// "rotate your phone" tip appears only on portrait phones and can be dismissed.
// A desktop window must keep the old behaviour (no bar, slide centred).
const { chromium, devices } = require('playwright');
const path = require('path');
const fs = require('fs');

const args = Object.fromEntries(process.argv.slice(2).map((a) => {
  const m = a.match(/^--([^=]+)=?(.*)$/);
  return m ? [m[1], m[2] || true] : [a, true];
}));
const target = args.url ? String(args.url) : 'file://' + path.resolve(__dirname, '..', '..', 'index.html');
if (args.shots) fs.mkdirSync(args.shots, { recursive: true });

const DEVICES = ['iPhone SE', 'iPhone SE landscape', 'iPhone 14', 'iPhone 14 landscape', 'Pixel 7', 'Pixel 7 landscape',
  'iPad (gen 7)', 'iPad (gen 7) landscape'];

let failures = 0;
const fail = (msg) => { failures++; console.log('  ✗ ' + msg); };
const ok = (cond, msg) => { if (!cond) fail(msg); };

const rectOf = (page, sel) => page.evaluate((s) => {
  const el = document.querySelector(s);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { l: r.left, t: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height, shown: r.width > 0 && r.height > 0 };
}, sel);

const overlap = (a, b) => a.l < b.r - 1 && b.l < a.r - 1 && a.t < b.b - 1 && b.t < a.b - 1;
const step = (page) => page.evaluate(() => Deck.snapshot().step);
const idle = (page) => page.waitForFunction(() => !Deck.busy, null, { timeout: 15000 });

async function swipe(cdp, x1, y1, x2, y2) {
  const pt = (x, y) => [{ x: Math.round(x), y: Math.round(y) }];
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: pt(x1, y1) });
  for (let i = 1; i <= 6; i++) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: pt(x1 + (x2 - x1) * i / 6, y1 + (y2 - y1) * i / 6) });
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}

async function checkDevice(browser, name) {
  const d = devices[name];
  if (!d) { fail('unknown device ' + name); return; }
  const ctx = await browser.newContext({ ...d });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(target + '#heap-build');
  await page.waitForFunction(() => window.Deck && Deck.current, null, { timeout: 20000 });
  await page.waitForTimeout(700);
  const vp = page.viewportSize();
  const portraitPhone = vp.height > vp.width && vp.width < 700;
  console.log(`- ${name} (${vp.width}x${vp.height})`);

  // 1. nothing scrolls
  const sc = await page.evaluate(() => ({ x: document.documentElement.scrollWidth - innerWidth, y: document.documentElement.scrollHeight - innerHeight }));
  ok(sc.x <= 1 && sc.y <= 1, `page scrolls (${sc.x}, ${sc.y})`);

  // 2. control bar: visible, big, on screen, clear of the slide
  const stage = await rectOf(page, '#stage');
  const bar = await rectOf(page, '.mbar');
  ok(bar && bar.shown, 'control bar is not visible');
  if (bar && bar.shown) {
    ok(!overlap(bar, stage), 'control bar overlaps the slide');
    ok(bar.l >= -1 && bar.t >= -1 && bar.r <= vp.width + 1 && bar.b <= vp.height + 1, 'control bar is off screen');
    const btns = await page.evaluate(() => Array.from(document.querySelectorAll('.mbtn')).filter((b) => !b.hidden).map((b) => {
      const r = b.getBoundingClientRect();
      return { cmd: b.dataset.cmd, w: r.width, h: r.height, l: r.left, t: r.top, r: r.right, b: r.bottom };
    }));
    ok(btns.length >= 5, `only ${btns.length} buttons`);
    btns.forEach((b) => {
      ok(b.w >= 43.5 && b.h >= 43.5, `button "${b.cmd}" is ${Math.round(b.w)}x${Math.round(b.h)} (needs ≥ 44)`);
      ok(b.l >= 0 && b.t >= 0 && b.r <= vp.width + 0.5 && b.b <= vp.height + 0.5, `button "${b.cmd}" is off screen`);
    });
  }
  ok((await rectOf(page, '.tools')).shown === false, 'the tiny scaled toolbar is still visible');
  ok(stage.l >= -1 && stage.t >= -1 && stage.r <= vp.width + 1 && stage.b <= vp.height + 1, 'slide is not fully on screen');

  // 3. rotate tip only on portrait phones
  const tip = await rectOf(page, '.mtip');
  ok(!!tip && tip.shown === portraitPhone, `rotate tip ${portraitPhone ? 'missing' : 'should be hidden'}`);
  if (tip && tip.shown) ok(!overlap(tip, stage), 'rotate tip overlaps the slide');

  // 4. navigation by touch
  const cx = stage.l + stage.w / 2, cy = stage.t + stage.h / 2;
  const s0 = await step(page);
  await page.touchscreen.tap(cx, cy);
  await idle(page);
  ok((await step(page)) === s0 + 1, 'tapping the slide does not advance');
  await page.tap('.mbtn[data-cmd="next"]'); await idle(page);
  ok((await step(page)) === s0 + 2, 'next button does not advance');
  await page.tap('.mbtn[data-cmd="prev"]'); await idle(page);
  ok((await step(page)) === s0 + 1, 'back button does not go back');
  const cdp = await ctx.newCDPSession(page);
  await swipe(cdp, cx + 80, cy, cx - 80, cy); await idle(page);
  ok((await step(page)) === s0 + 2, 'swipe left does not advance');
  await swipe(cdp, cx - 80, cy, cx + 80, cy); await idle(page);
  ok((await step(page)) === s0 + 1, 'swipe right does not go back');
  await swipe(cdp, cx, cy - 60, cx, cy + 60); await idle(page);
  ok((await step(page)) === s0 + 1, 'a vertical drag changed the step');

  // 5. language + theme
  const before = await page.evaluate(() => document.documentElement.dataset.lang + '/' + document.documentElement.dataset.theme);
  await page.tap('.mbtn[data-cmd="lang"]');
  await page.tap('.mbtn[data-cmd="theme"]');
  const after = await page.evaluate(() => document.documentElement.dataset.lang + '/' + document.documentElement.dataset.theme);
  ok(before !== after && before.split('/')[0] !== after.split('/')[0] && before.split('/')[1] !== after.split('/')[1], `lang/theme did not toggle (${before} → ${after})`);

  // 6. overview: opens, first card reachable, closes by the close button, jumps by a card
  await page.tap('.mbtn[data-cmd="overview"]');
  await page.waitForSelector('.overview:not([hidden]) .ov-card');
  const ov = await page.evaluate(() => {
    const o = document.querySelector('.overview');
    const close = o.querySelector('.ov-close').getBoundingClientRect();
    o.scrollTop = 0;                                   // the first card must be reachable by scrolling up
    const first = o.querySelector('.ov-card').getBoundingClientRect();
    return { firstTop: first.top, firstBottom: first.bottom, closeW: close.width, closeH: close.height, innerH: innerHeight };
  });
  ok(ov.firstTop >= 0 && ov.firstBottom <= ov.innerH, `overview: first card cannot be reached (top ${Math.round(ov.firstTop)})`);
  ok(ov.closeW >= 43.5 && ov.closeH >= 43.5, 'overview: close button is too small');
  if (args.shots) await page.screenshot({ path: path.join(args.shots, name.replace(/[^a-z0-9]+/gi, '_') + '_overview.png') });
  await page.tap('.ov-close');
  await page.waitForFunction(() => document.querySelector('.overview').hidden);
  await page.tap('.mbtn[data-cmd="overview"]');
  await page.waitForSelector('.overview:not([hidden]) .ov-card');
  await page.tap('.ov-card[data-i="2"]'); await idle(page);
  ok((await page.evaluate(() => Deck.snapshot().id)) === 'presorting', 'overview card did not open its slide');

  // 7. the tip can be dismissed and stays dismissed
  if (portraitPhone) {
    await page.tap('.mtip-x');
    ok(!(await rectOf(page, '.mtip')).shown, 'rotate tip was not dismissed');
    await page.reload(); await page.waitForFunction(() => window.Deck && Deck.current);
    ok(!(await rectOf(page, '.mtip')).shown, 'rotate tip came back after reload');
  }

  if (args.shots) {
    await page.evaluate(() => Deck.gotoId('heap-build', 3)); await idle(page); await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(args.shots, name.replace(/[^a-z0-9]+/gi, '_') + '.png') });
  }
  errors.forEach((e) => fail('console: ' + e));
  await ctx.close();
}

async function checkDesktop(browser) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await ctx.newPage();
  await page.goto(target);
  await page.waitForFunction(() => window.Deck && Deck.current, null, { timeout: 20000 });
  console.log('- desktop (1280x720, mouse)');
  ok(!(await rectOf(page, '.mbar')).shown, 'desktop shows the touch bar');
  ok((await rectOf(page, '.tools')).shown, 'desktop lost its toolbar');
  const st = await rectOf(page, '#stage');
  ok(Math.abs(st.w - 1280) < 1 && Math.abs(st.h - 720) < 1 && Math.abs(st.l) < 1 && Math.abs(st.t) < 1, `desktop slide moved (${Math.round(st.l)},${Math.round(st.t)} ${Math.round(st.w)}x${Math.round(st.h)})`);
  await ctx.close();
}

(async () => {
  const browser = await chromium.launch();
  await checkDesktop(browser);
  for (const name of DEVICES) await checkDevice(browser, name);
  await browser.close();
  console.log(failures ? `\n${failures} problem(s)` : '\nAll mobile checks passed');
  process.exit(failures ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
