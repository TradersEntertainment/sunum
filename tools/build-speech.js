// Build KONUSMA_METNI.md (the speech script) from js/notes.js and check it
// against the slides: every [click] marker must match a click step.
//   NODE_PATH=/opt/node-tools/node_modules node tools/build-speech.js
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const WPM = 125;   // calm classroom pace

const fmt = (sec) => Math.floor(sec / 60) + ':' + String(Math.round(sec % 60)).padStart(2, '0');
const paras = (v) => (Array.isArray(v) ? v : v ? [v] : []);
const clicks = (s) => (s.match(/\[click\]/g) || []).length;
const strip = (s) => s.replace(/<[^>]+>/g, '').replace(/\[click\]/g, '');
const words = (s) => strip(s).split(/\s+/).filter(Boolean).length;
const md = (s, label) => s
  .replace(/\[click\]/g, '**[▶ ' + label + ']**')
  .replace(/<b>|<\/b>|<strong>|<\/strong>/g, '**')
  .replace(/<i>|<\/i>|<em>|<\/em>/g, '_')
  .replace(/<br\s*\/?>/g, '  \n')
  .replace(/<[^>]+>/g, '')
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('file://' + path.join(ROOT, 'index.html'));
  await page.waitForFunction(() => window.Deck && Deck.current, null, { timeout: 20000 });
  const data = await page.evaluate(() => ({
    slides: Deck.slides.map((s, i) => ({ id: s.id, act: s.act, steps: s.steps, title: s.title || { en: s.id, tr: s.id }, label: Deck.label(i) })),
    acts: Object.fromEntries(Object.entries(Deck.ACTS).map(([k, v]) => [k, { en: v.en, tr: v.tr }])),
    notes: window.NOTES || {},
  }));
  await browser.close();

  const problems = [];
  const main = data.slides.filter((s) => s.act !== 'appendix');
  const appendix = data.slides.filter((s) => s.act === 'appendix');
  let total = 0, totalWords = 0;
  const rows = [];
  for (const s of main) {
    const n = data.notes[s.id];
    if (!n) { problems.push(`${s.id}: no notes`); continue; }
    const en = paras(n.en).join(' '), tr = paras(n.tr).join(' ');
    if (clicks(en) !== s.steps) problems.push(`${s.id}: EN has ${clicks(en)} [click] markers, slide has ${s.steps} steps`);
    if (clicks(tr) !== s.steps) problems.push(`${s.id}: TR has ${clicks(tr)} [click] markers, slide has ${s.steps} steps`);
    if (n.cues && n.cues.length !== s.steps) problems.push(`${s.id}: ${n.cues.length} cues for ${s.steps} steps`);
    const w = words(en);
    const speak = (w / WPM) * 60;
    if (n.time && speak > n.time * 1.25) problems.push(`${s.id}: ~${Math.round(speak)} s of speech for a ${n.time} s budget`);
    rows.push({ s, n, start: total, w });
    total += n.time || Math.round(speak);
    totalWords += w;
  }

  let out = '';
  out += '# Transform & Conquer — Konuşma Metni\n\n';
  out += `> **Süre:** yaklaşık ${fmt(total)} dakika · **Ana konu:** Heaps & Heapsort · ` +
    `**Konuşma dili:** İngilizce (her bölümün altındaki Türkçe metin, ne söylediğini anlaman için)\n\n`;
  out += '## Nasıl kullanılır\n\n';
  out += '- Sunumu aç: `index.html` dosyasına çift tıkla (internet gerekmez). `F` ile tam ekran yap.\n';
  out += '- Metindeki her **[▶ CLICK]** / **[▶ TIKLA]** işareti = bir kez `→` (ya da sunum kumandasındaki ileri tuşu). O anda ekranda bir animasyon oynar.\n';
  out += '- Animasyon oynarken tekrar basarsan animasyon hemen tamamlanır; yanlışlıkla ileri gittiysen `←` ile bir adım geri dön.\n';
  out += '- `S`: sunucu penceresi. Bu metin, süre sayacı ve "sonraki tıklama" ipucu orada görünür; ikinci ekranda (laptop) aç, sunum projeksiyonda kalsın. Tek ekranda `N` notları altta gösterir.\n';
  out += '- `L`: ekrandaki yazıları Türkçe ⇄ İngilizce yapar. Soru-cevapta Türkçe açıklamak istersen kullan.\n';
  out += '- Konuşma yavaş ve net olsun: dakikada ~120 kelime. Animasyonlar zaten anlatıyor, acele etme.\n\n';

  out += '## Zaman planı\n\n| # | Slayt | Tıklama | Süre | Başlangıç |\n|---|---|---|---|---|\n';
  for (const r of rows) out += `| ${r.s.label} | ${r.s.title.en} | ${r.s.steps} | ${fmt(r.n.time || 0)} | ${fmt(r.start)} |\n`;
  out += `| | **Toplam** | | **${fmt(total)}** | |\n\n`;

  for (const r of rows) {
    const act = data.acts[r.s.act] || { en: '', tr: '' };
    out += '---\n\n';
    out += `## ${r.s.label} · ${r.s.title.en}\n`;
    out += `*${r.s.title.tr}* · ${act.en} / ${act.tr} · **${fmt(r.start)} → ${fmt(r.start + (r.n.time || 0))}** · ${r.s.steps} ${r.s.steps === 1 ? 'tıklama' : 'tıklama'}\n\n`;
    if (r.n.cues && r.n.cues.length) {
      out += '**Tıklamalar:** ' + r.n.cues.map((c, i) => `(${i + 1}) ${md(c, '')}`).join(' · ') + '\n\n';
    }
    out += '**EN — söyleyeceğin:**\n\n' + paras(r.n.en).map((p) => md(p, 'CLICK')).join('\n\n') + '\n\n';
    out += '**TR — anlamı:**\n\n' + paras(r.n.tr).map((p) => '> ' + md(p, 'TIKLA')).join('\n>\n') + '\n\n';
  }

  if (appendix.length) {
    out += '---\n\n## Ek slaytlar (soru-cevap için)\n\n';
    for (const s of appendix) {
      const n = data.notes[s.id];
      out += `### ${s.label} · ${s.title.en} — *${s.title.tr}*\n\n`;
      if (n) {
        out += paras(n.en).map((p) => md(p, 'CLICK')).join('\n\n') + '\n\n';
        if (n.tr) out += paras(n.tr).map((p) => '> ' + md(p, 'TIKLA')).join('\n>\n') + '\n\n';
      }
    }
  }
  const qa = data.notes.__qa;
  if (qa && qa.length) {
    out += '---\n\n## Olası sorular ve kısa cevaplar\n\n';
    qa.forEach((q, i) => {
      out += `**${i + 1}. ${q.q}**  \n*${q.qtr}*\n\n${q.a}\n\n> ${q.atr}\n\n`;
    });
  }
  out += `\n<sub>Bu dosya \`node tools/build-speech.js\` ile js/notes.js dosyasından üretildi. Toplam ${totalWords} İngilizce kelime.</sub>\n`;
  fs.writeFileSync(path.join(ROOT, 'KONUSMA_METNI.md'), out);
  console.log(`KONUSMA_METNI.md: ${rows.length} slides, ${totalWords} EN words, planned ${fmt(total)}`);
  if (problems.length) {
    console.log('PROBLEMS:\n- ' + problems.join('\n- '));
    process.exit(1);
  }
})().catch((e) => { console.error(e); process.exit(1); });
