// Build the speech script from js/notes.js and check it against the slides:
// every [click] marker must match a click step.
//
//   NODE_PATH=/opt/node-tools/node_modules node tools/build-speech.js [--split=<slide id>]
//
// Writes
//   KONUSMA_METNI.md            the whole talk, both languages (Markdown)
//   KONUSMA_BOLUM_1_EN.txt      first presenter  (every slide before --split), English only: what to say
//   KONUSMA_BOLUM_1_TR.txt      first presenter, Turkish only: what it means
//   KONUSMA_BOLUM_2_EN.txt      second presenter (--split and everything after), English only
//   KONUSMA_BOLUM_2_TR.txt      second presenter, Turkish only
// (plain UTF-8 text; default split: heap-intro, the heap section). The EN and TR files
// of a part have the same slides, the same order and the same click markers.
// Q&A items and appendix slides go to whoever presents the slide they belong to
// ("slide" on a Q&A item, "about" on an appendix note in js/notes.js).
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const WPM = 125;   // calm classroom pace
const args = Object.fromEntries(process.argv.slice(2).map((a) => {
  const m = a.match(/^--([^=]+)=?(.*)$/);
  return m ? [m[1], m[2] || true] : [a, true];
}));
const SPLIT = String(args.split || 'heap-intro');

const fmt = (sec) => Math.floor(sec / 60) + ':' + String(Math.round(sec % 60)).padStart(2, '0');
const paras = (v) => (Array.isArray(v) ? v : v ? [v] : []);
const clicks = (s) => (s.match(/\[click\]/g) || []).length;
const strip = (s) => s.replace(/<[^>]+>/g, '').replace(/\[click\]/g, '');
const words = (s) => strip(s).split(/\s+/).filter(Boolean).length;
const entities = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ');
const md = (s, label) => entities(s
  .replace(/\[click\]/g, '**[▶ ' + label + ']**')
  .replace(/<b>|<\/b>|<strong>|<\/strong>/g, '**')
  .replace(/<i>|<\/i>|<em>|<\/em>/g, '_')
  .replace(/<br\s*\/?>/g, '  \n')
  .replace(/<[^>]+>/g, ''));

/* ---------- plain-text helpers (for the .txt files) ---------- */
const W = 90;                                    // wrap width: readable in any editor, even without word wrap
const rule = (ch) => ch.repeat(W);
const plain = (s, label) => entities(s
  .replace(/\[click\]/g, '[[' + label + ']]')    // no spaces: never split across two lines
  .replace(/<br\s*\/?>/g, ' ')
  .replace(/<[^>]+>/g, ''));
function wrapHang(text, first, rest) {          // first line starts with `first`, the others with `rest`
  const out = [];
  let line = '';
  let prefix = first;
  for (const word of text.split(/\s+/).filter(Boolean)) {
    if (line && (prefix + line + ' ' + word).length > W) { out.push(prefix + line); prefix = rest; line = word; }
    else line = line ? line + ' ' + word : word;
  }
  if (line) out.push(prefix + line);
  return out.join('\n');
}
const cut = (s, n) => (s.length > n ? s.slice(0, n - 3) + '...' : s);

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
  const qa = data.notes.__qa || [];
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

  /* ================= KONUSMA_METNI.md (whole talk, both languages) ================= */
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
  out += '- Konuşma yavaş ve net olsun: dakikada ~120 kelime. Animasyonlar zaten anlatıyor, acele etme.\n';
  out += '- İki kişi sunuyorsanız her birinin kendi dosyaları var, dil dil ayrı: `KONUSMA_BOLUM_1_EN.txt` / `KONUSMA_BOLUM_1_TR.txt` ve `KONUSMA_BOLUM_2_EN.txt` / `KONUSMA_BOLUM_2_TR.txt` (devir teslim cümleleri ve kendi soruları dahil).\n\n';

  out += '## Zaman planı\n\n| # | Slayt | Tıklama | Süre | Başlangıç |\n|---|---|---|---|---|\n';
  for (const r of rows) out += `| ${r.s.label} | ${r.s.title.en} | ${r.s.steps} | ${fmt(r.n.time || 0)} | ${fmt(r.start)} |\n`;
  out += `| | **Toplam** | | **${fmt(total)}** | |\n\n`;

  for (const r of rows) {
    const act = data.acts[r.s.act] || { en: '', tr: '' };
    out += '---\n\n';
    out += `## ${r.s.label} · ${r.s.title.en}\n`;
    out += `*${r.s.title.tr}* · ${act.en} / ${act.tr} · **${fmt(r.start)} → ${fmt(r.start + (r.n.time || 0))}** · ${r.s.steps} tıklama\n\n`;
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
  if (qa.length) {
    out += '---\n\n## Olası sorular ve kısa cevaplar\n\n';
    qa.forEach((q, i) => {
      out += `**${i + 1}. ${q.q}**  \n*${q.qtr}*\n\n${q.a}\n\n> ${q.atr}\n\n`;
    });
  }
  out += `\n<sub>Bu dosya \`node tools/build-speech.js\` ile js/notes.js dosyasından üretildi. Toplam ${totalWords} İngilizce kelime.</sub>\n`;
  fs.writeFileSync(path.join(ROOT, 'KONUSMA_METNI.md'), out);
  console.log(`KONUSMA_METNI.md: ${rows.length} slides, ${totalWords} EN words, planned ${fmt(total)}`);

  /* ================= two presenters x two languages ================= */
  const mainIds = main.map((s) => s.id);
  const splitAt = mainIds.indexOf(SPLIT);
  if (splitAt < 1) {
    problems.push(`--split=${SPLIT}: must be the id of a main slide after the first one (${mainIds.slice(1).join(', ')})`);
  } else {
    const owner = (id) => (mainIds.indexOf(id) < splitAt ? 0 : 1);        // 0 = part 1, 1 = part 2
    const parts = [0, 1].map((p) => ({ rows: rows.filter((r) => owner(r.s.id) === p), qa: [], appendix: [] }));
    qa.forEach((q, i) => {
      if (!q.slide || !mainIds.includes(q.slide)) problems.push(`Q&A #${i + 1} ("${q.q}") has no valid "slide" owner`);
      else parts[owner(q.slide)].qa.push(q);
    });
    appendix.forEach((s) => {
      const a = (data.notes[s.id] || {}).about;
      if (!a || !mainIds.includes(a)) problems.push(`appendix slide ${s.id} has no valid "about" slide in js/notes.js`);
      else parts[owner(a)].appendix.push(s);
    });
    // Every main slide is in exactly one part, and nothing is lost on the way.
    const seen = parts.flatMap((p) => p.rows.map((r) => r.s.id));
    if (seen.length !== rows.length || new Set(seen).size !== seen.length) problems.push('the two parts do not cover every slide exactly once');
    if (parts[0].qa.length + parts[1].qa.length !== qa.length) problems.push('a Q&A item was not assigned to a part');
    if (parts[0].appendix.length + parts[1].appendix.length !== appendix.length) problems.push('an appendix slide was not assigned to a part');
    if (!parts[0].rows.length || !parts[1].rows.length) problems.push('one of the parts has no slides');

    const nextAct = data.acts[rows[splitAt].s.act] || { en: '', tr: '' };
    const handOver = {
      en: `That was the first part. Now my friend continues with: ${nextAct.en}.`,
      tr: `İlk bölüm bu kadardı. Şimdi arkadaşım devam edecek, konusu: ${nextAct.tr}.`,
    };
    const takeOver = { en: 'Thank you! I will continue from here.', tr: 'Teşekkürler! Buradan ben devam ediyorum.' };
    const fileName = (p, lang) => `KONUSMA_BOLUM_${p + 1}_${lang.toUpperCase()}.txt`;

    /* One part, one language. The English file is what to say out loud; the Turkish file is its
     * meaning, slide by slide, with the same click markers. */
    const partText = (p, lang) => {
      const en = lang === 'en';
      const T = (a, b) => (en ? a : b);
      const part = parts[p];
      const first = part.rows[0], last = part.rows[part.rows.length - 1];
      const t0 = first.start, t1 = last.start + (last.n.time || 0);
      const nWords = part.rows.reduce((a, r) => a + r.w, 0);
      const other = parts[1 - p].rows;
      const title = (s) => (en ? s.title.en : s.title.tr);
      const marker = en ? 'CLICK' : 'TIKLA';
      const L = [];
      L.push(rule('='));
      L.push(T(`SPEECH SCRIPT - PART ${p + 1}/2 - ENGLISH (the words to say out loud)  |  Transform & Conquer (CMP3005, Chapter 6)`,
        `KONUŞMA METNİ - BÖLÜM ${p + 1}/2 - TÜRKÇE (İngilizce metnin anlamı)  |  Transform & Conquer (CMP3005, Bölüm 6)`));
      L.push(rule('='));
      L.push(`${T('Slides      ', 'Slaytlar    ')}: ${first.s.label}-${last.s.label}  (${title(first.s)}  ...  ${title(last.s)})`);
      L.push(`${T('Time        ', 'Süre        ')}: ${T('about', 'yaklaşık')} ${fmt(t1 - t0)} ${T('(planned)', '(planlanan)')}  |  ${T('in the whole talk', 'tüm sunumda')} ${fmt(t0)} -> ${fmt(t1)}`);
      L.push(`${T('Words       ', 'Kelime      ')}: ${nWords} ${T('(English)', '(İngilizce metindeki)')}`);
      L.push(`${T('Other part  ', 'Diğer bölüm ')}: ${other[0].s.label}-${other[other.length - 1].s.label} ${T('(your friend)  - not in this file', '(arkadaşın)  - bu dosyada yok')}`);
      L.push(`${T('Companion   ', 'Eş dosya    ')}: ${fileName(p, en ? 'tr' : 'en')} = ${T('the same text in Turkish (what it means)', 'aynı metnin İngilizcesi (sesli söyleyeceğin)')}`);
      L.push('');
      L.push(T('HOW TO USE', 'NASIL KULLANILIR'));
      (en ? [
        'Say the text below out loud, slowly and clearly (about 125 words a minute). The animations do half of the explaining.',
        'When you see [[CLICK]], press the forward key (->) once. An animation plays on screen.',
        'If you press again while it plays, it finishes at once. Press <- to go back one step.',
        'Presentation: double-click index.html. F = full screen, S = presenter window (notes + timer), L = language.',
        `The Turkish meaning of every paragraph is in ${fileName(p, 'tr')}, in the same order.`,
      ] : [
        'Bu dosya, İngilizce metnin Türkçe anlamıdır: slayt sırası ve tıklama işaretleri İngilizce dosyayla aynı. Sesli söyleyeceğin metin İngilizce dosyada.',
        '[[TIKLA]] işareti, İngilizce metindeki [[CLICK]] anıdır: o noktada ileri tuşuna (->) bir kez bas. Ekranda bir animasyon oynar.',
        'Animasyon oynarken tekrar basarsan hemen tamamlanır. Yanlışlıkla ileri gittiysen <- ile bir adım geri dön.',
        'Sunum: index.html dosyasına çift tıkla. F = tam ekran, S = sunucu penceresi (not + süre sayacı), L = dil.',
        'Yavaş ve net konuş: dakikada yaklaşık 125 kelime. Animasyonlar zaten anlatıyor, acele etme.',
      ]).forEach((t) => L.push(wrapHang(t, '- ', '  ')));
      L.push('');

      L.push(T('TIME PLAN', 'ZAMAN PLANI'));
      L.push(T(' No  ' + 'Slide'.padEnd(46) + 'Clk  Time   Part time    Overall',
        ' No  ' + 'Slayt'.padEnd(46) + 'Tık  Süre   Bölüm saati  Genel saat'));
      for (const r of part.rows) {
        L.push(` ${String(r.s.label).padEnd(3)} ${cut(title(r.s), 45).padEnd(46)}${String(r.s.steps).padStart(2)}   ${fmt(r.n.time || 0).padEnd(6)} ${fmt(r.start - t0).padEnd(12)} ${fmt(r.start)}`);
      }
      L.push(` ${''.padEnd(3)} ${T('TOTAL', 'TOPLAM').padEnd(46)}${''.padStart(2)}   ${fmt(t1 - t0).padEnd(6)}`);
      L.push('');

      if (p === 1) {
        L.push(rule('*'));
        L.push(T(`START - when slide ${first.s.label} is on the screen, first say:`, `BAŞLANGIÇ - ${first.s.label}. slayt ekrana gelince önce şunu söyle:`));
        L.push(rule('*'));
        L.push(wrapHang(en ? takeOver.en : takeOver.tr, T('SAY: ', 'ANLAMI: '), ' '.repeat(T(5, 8))));
        L.push('');
      }

      part.rows.forEach((r, k) => {
        const act = data.acts[r.s.act] || { en: '', tr: '' };
        L.push(rule('-'));
        L.push(`${T('SLIDE', 'SLAYT')} ${r.s.label} / ${main.length}  -  ${title(r.s)}`);
        L.push(`[${en ? act.en : act.tr}]`);
        L.push(`${T('Time', 'Süre')} ${fmt(r.n.time || 0)}  |  ${T('part time', 'bölüm saati')} ${fmt(r.start - t0)} -> ${fmt(r.start - t0 + (r.n.time || 0))}  |  ${r.s.steps} ${T(r.s.steps === 1 ? 'click' : 'clicks', 'tıklama')}`);
        L.push(rule('-'));
        if (en && r.n.cues && r.n.cues.length) {      // what each click shows (written in English only)
          L.push(wrapHang(r.n.cues.map((c, i) => `(${i + 1}) ${plain(c, '')}`).join('   '), 'Clicks: ', ' '.repeat(8)));
          L.push('');
        }
        L.push(T('SAY (English):', 'ANLAMI (Türkçe):'));
        paras(en ? r.n.en : r.n.tr).forEach((t) => { L.push(wrapHang(plain(t, marker), '  ', '  ')); L.push(''); });
        if (p === 0 && k === part.rows.length - 1) {
          L.push(rule('*'));
          L.push(T(`HAND-OVER - after the last click of slide ${r.s.label}, say this, then press -> to go to slide ${rows[splitAt].s.label}:`,
            `DEVİR TESLİM - ${r.s.label}. slaytın son tıklamasından sonra söyle, sonra -> ile ${rows[splitAt].s.label}. slayta geç:`));
          L.push(rule('*'));
          L.push(wrapHang(en ? handOver.en : handOver.tr, T('SAY: ', 'ANLAMI: '), ' '.repeat(T(5, 8))));
          L.push('');
        }
      });

      if (part.qa.length) {
        L.push(rule('='));
        L.push(T('LIKELY QUESTIONS (your topics)', 'OLASI SORULAR (senin konuların)'));
        L.push(rule('='));
        part.qa.forEach((q, i) => {
          L.push(wrapHang(en ? q.q : q.qtr, `${i + 1}) `, '   '));
          L.push(wrapHang(en ? q.a : q.atr, '   ', '   '));
          L.push('');
        });
      }
      if (part.appendix.length) {
        L.push(rule('='));
        L.push(T('EXTRA SLIDES (show them only if someone asks)', 'EK SLAYTLAR (sadece soru gelirse göster)'));
        L.push(rule('='));
        part.appendix.forEach((s) => {
          const n = data.notes[s.id] || {};
          L.push(`${T('EXTRA', 'EK')} ${s.label}  -  ${title(s)}`);
          paras(en ? n.en : n.tr).forEach((t) => L.push(wrapHang(plain(t, marker), '  ', '  ')));
          L.push('');
        });
      }
      L.push(rule('-'));
      L.push(T(`Generated by "node tools/build-speech.js" from js/notes.js (split point: --split=${SPLIT}).`,
        `"node tools/build-speech.js" ile js/notes.js dosyasından üretildi (bölme noktası: --split=${SPLIT}).`));
      return L.join('\n') + '\n';
    };

    if (!problems.length) {
      parts.forEach((part, p) => {
        const lastRow = part.rows[part.rows.length - 1];
        const t1 = lastRow.start + (lastRow.n.time || 0);
        for (const lang of ['en', 'tr']) {
          fs.writeFileSync(path.join(ROOT, fileName(p, lang)), partText(p, lang));
          console.log(`${fileName(p, lang)}: slides ${part.rows[0].s.label}-${lastRow.s.label} (${part.rows.length}), planned ${fmt(t1 - part.rows[0].start)}, Q&A ${part.qa.length}, appendix ${part.appendix.length}`);
        }
      });
    }
  }

  if (problems.length) {
    console.log('PROBLEMS:\n- ' + problems.join('\n- '));
    process.exit(1);
  }
})().catch((e) => { console.error(e); process.exit(1); });
