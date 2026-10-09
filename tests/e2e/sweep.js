// End-to-end sweep over every slide and click step.
//
//   NODE_PATH=/opt/node-tools/node_modules node tests/e2e/sweep.js
//     [--only=id1,id2] [--langs=en,tr] [--themes=dark] [--shots=dir] [--speed=8] [--file=index.html]
//
// For every slide × step it checks:
//   1. no console errors / page errors;
//   2. layout: nothing visible sticks out of the 1920×1080 stage, and no
//      scroll-clipped box overflows (text that does not fit);
//   3. determinism: the state reached by playing the animations forward equals
//      the state rebuilt instantly by Deck.goto(slide, step), and the state
//      reached by stepping back from step k+1.
// Exit code 1 on any failure.
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const args = Object.fromEntries(process.argv.slice(2).map((a) => {
  const m = a.match(/^--([^=]+)=?(.*)$/);
  return m ? [m[1], m[2] || true] : [a, true];
}));
const LANGS = String(args.langs || 'en,tr').split(',');
const THEMES = String(args.themes || 'dark').split(',');
const SPEED = Number(args.speed || 8);
const file = 'file://' + path.resolve(__dirname, '..', '..', args.file || 'index.html');
if (args.shots) fs.mkdirSync(args.shots, { recursive: true });

/* ---------- functions evaluated inside the page ---------- */
function pageSnapshot() {
  const ctx = Deck.current;
  const root = ctx.el;
  const out = [];
  const ATTRS = ['x', 'y', 'cx', 'cy', 'r', 'd', 'x1', 'y1', 'x2', 'y2', 'width', 'height', 'points', 'transform', 'hidden'];
  const round = (s) => String(s).replace(/-?\d+\.\d+/g, (n) => (Math.round(Number(n) * 10) / 10).toString());
  (function walk(el, depth) {
    if (el.hasAttribute && el.hasAttribute('data-ambient')) return;
    const st = el.style || {};
    const cls = (el.getAttribute('class') || '').split(/\s+/).filter((c) => c && c !== 'instant' && c !== 'entered').sort().join('.');
    const attrs = ATTRS.filter((a) => el.hasAttribute(a)).map((a) => a + '=' + round(el.getAttribute(a))).join(' ');
    const sty = ['transform', 'opacity', 'strokeDashoffset', 'clipPath', 'stroke', 'fill', 'width', 'height', 'left', 'top']
      .filter((k) => st[k]).map((k) => k + ':' + round(st[k])).join(';');
    let text = '';
    for (const n of el.childNodes) if (n.nodeType === 3 && n.textContent.trim()) text += n.textContent.trim();
    out.push(depth + ' ' + el.tagName + (cls ? '.' + cls : '') + (attrs ? ' [' + attrs + ']' : '') + (sty ? ' {' + sty + '}' : '') + (text ? ' "' + text + '"' : ''));
    for (const c of el.children) walk(c, depth + 1);
  })(root, 0);
  return out.join('\n');
}

function pageLayout() {
  const stage = Deck.dom.stage.getBoundingClientRect();
  const s = stage.width / 1920;
  const root = Deck.current.el;
  const problems = [];
  const visible = (el) => {
    for (let e = el; e && e !== root.parentNode; e = e.parentElement) {
      const cs = getComputedStyle(e);
      if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) < 0.05) return false;
      if (e.hasAttribute && e.hasAttribute('data-ambient')) return false;
    }
    return true;
  };
  const name = (el) => el.tagName.toLowerCase() + (el.getAttribute('class') ? '.' + el.getAttribute('class').trim().split(/\s+/).join('.') : '')
    + (el.textContent && el.children.length === 0 ? ' "' + el.textContent.trim().slice(0, 30) + '"' : '');
  for (const el of root.querySelectorAll('*')) {
    if (el.closest('defs, marker, .shared-defs')) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) continue;
    const L = (r.left - stage.left) / s, T = (r.top - stage.top) / s;
    const R = (r.right - stage.left) / s, B = (r.bottom - stage.top) / s;
    if ((L < -2 || T < -2 || R > 1922 || B > 1082) && visible(el)) {
      problems.push('outside stage: ' + name(el) + ' @ ' + [L, T, R, B].map(Math.round).join(','));
    }
    if (el instanceof HTMLElement && !/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) {
      const cs = getComputedStyle(el);
      const clips = /(hidden|auto|scroll|clip)/.test(cs.overflowX + cs.overflowY);
      if (clips && (el.scrollWidth > el.clientWidth + 2 || el.scrollHeight > el.clientHeight + 2) && visible(el)) {
        problems.push('content clipped: ' + name(el) + ' (' + el.scrollWidth + 'x' + el.scrollHeight + ' in ' + el.clientWidth + 'x' + el.clientHeight + ')');
      }
    }
  }
  return Array.from(new Set(problems)).slice(0, 12);
}

/* ---------- driver ---------- */
(async () => {
  const browser = await chromium.launch();
  let failures = 0;
  const fail = (msg) => { failures++; console.log('  ✗ ' + msg); };

  for (const theme of THEMES) {
    for (const lang of LANGS) {
      const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
      const errors = [];
      page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
      page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
      await page.addInitScript(([l, t]) => {
        try { localStorage.setItem('tc.lang', l); localStorage.setItem('tc.theme', t); } catch (e) { /* ignore */ }
      }, [lang, theme]);
      await page.goto(file + '?speed=' + SPEED);
      await page.waitForFunction(() => window.Deck && Deck.current, null, { timeout: 20000 });
      const slides = await page.evaluate(() => Deck.slides.map((s) => ({ id: s.id, steps: s.steps })));
      const only = args.only ? String(args.only).split(',') : null;
      console.log(`\n== ${lang} / ${theme}: ${slides.length} slides ==`);
      // errors while loading (e.g. a slide file with a syntax error) belong to no slide
      errors.splice(0).forEach((e) => fail(`page load: ${e}`));
      if (only) only.filter((id) => !slides.some((sl) => sl.id === id)).forEach((id) => fail(`slide "${id}" is not registered`));
      const idle = () => page.waitForFunction(() => !Deck.busy, null, { timeout: 30000 });

      for (let i = 0; i < slides.length; i++) {
        const { id, steps } = slides[i];
        if (only && !only.includes(id)) continue;
        const errBefore = errors.length;
        console.log(`- ${id} (${steps} steps)`);
        // forward, animated
        await page.evaluate((i) => Deck.goto(i, 0), i);
        await idle();
        await page.waitForTimeout(150);
        const fwd = [await page.evaluate(pageSnapshot)];
        for (let k = 1; k <= steps; k++) {
          await page.evaluate(() => Deck.next());
          await idle();
          await page.waitForTimeout(120);
          fwd.push(await page.evaluate(pageSnapshot));
          const lay = await page.evaluate(pageLayout);
          lay.forEach((p) => fail(`${id} step ${k}: ${p}`));
          if (args.shots) await page.screenshot({ path: path.join(args.shots, `${String(i + 1).padStart(2, '0')}-${id}-s${k}-${lang}-${theme}.png`) });
        }
        // instant rebuild must match the animated state
        for (let k = 0; k <= steps; k++) {
          await page.evaluate(([i, k]) => Deck.goto(i, k), [i, k]);
          await idle();
          const inst = await page.evaluate(pageSnapshot);
          if (k === 0) {
            const lay = await page.evaluate(pageLayout);
            lay.forEach((p) => fail(`${id} step 0: ${p}`));
            if (args.shots) await page.screenshot({ path: path.join(args.shots, `${String(i + 1).padStart(2, '0')}-${id}-s0-${lang}-${theme}.png`) });
          }
          if (inst !== fwd[k]) {
            const a = fwd[k].split('\n'), b = inst.split('\n');
            const at = a.findIndex((line, j) => line !== b[j]);
            fail(`${id} step ${k}: animated ≠ instant at line ${at}:\n      anim:    ${a[at]}\n      instant: ${b[at]}`);
          }
        }
        // stepping back from the last step lands on the same states
        if (steps > 0) {
          await page.evaluate(([i, k]) => Deck.goto(i, k), [i, steps]);
          await idle();
          for (let k = steps - 1; k >= 0; k--) {
            await page.evaluate(() => Deck.prev());
            await idle();
            const back = await page.evaluate(pageSnapshot);
            if (back !== fwd[k]) fail(`${id} step ${k}: state after "back" differs from forward state`);
          }
        }
        errors.slice(errBefore).forEach((e) => fail(`${id}: console: ${e}`));
      }
      await page.close();
    }
  }
  await browser.close();
  console.log(failures ? `\n${failures} problem(s)` : '\nAll checks passed');
  process.exit(failures ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
