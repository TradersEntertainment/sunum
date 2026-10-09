// Inline every stylesheet, script and font into one HTML file.
//   node tools/bundle.js
// Writes:
//   dist/transform-and-conquer.html   standalone page (USB stick, e-mail, offline)
//   dist/artifact.html                the same content without the <html>/<head>/<body>
//                                     wrapper, for publishing as a claude.ai artifact
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const html = read('index.html');

function inlineFonts(css, cssPath) {
  return css.replace(/url\(([^)]+\.woff2)\)/g, (m, rel) => {
    const file = path.resolve(path.dirname(path.join(ROOT, cssPath)), rel.replace(/['"]/g, ''));
    const b64 = fs.readFileSync(file).toString('base64');
    return 'url(data:font/woff2;base64,' + b64 + ')';
  });
}

let styles = '';
let out = html.replace(/<link rel="stylesheet" href="([^"]+)">\n?/g, (m, href) => {
  styles += '/* ' + href + ' */\n' + inlineFonts(read(href), href) + '\n';
  return '';
});
out = out.replace('</head>', '<style>\n' + styles + '</style>\n</head>');
out = out.replace(/<script src="([^"]+)"><\/script>/g, (m, src) =>
  '<script>/* ' + src + ' */\n' + read(src).replace(/<\/script/gi, '<\\/script') + '\n</script>');

fs.mkdirSync(path.join(ROOT, 'dist'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'dist', 'transform-and-conquer.html'), out);

// Artifact variant: the host supplies doctype/html/head/body; keep the title
// first (it is read from the first 8 KB), then styles, then the page.
const title = (out.match(/<title>[\s\S]*?<\/title>/) || [''])[0];
const style = (out.match(/<style>[\s\S]*?<\/style>/) || [''])[0];
const body = (out.match(/<body>([\s\S]*)<\/body>/) || ['', ''])[1];
fs.writeFileSync(path.join(ROOT, 'dist', 'artifact.html'), title + '\n' + style + '\n' + body.trim() + '\n');

const kb = (f) => Math.round(fs.statSync(path.join(ROOT, 'dist', f)).size / 1024) + ' KB';
console.log('dist/transform-and-conquer.html', kb('transform-and-conquer.html'));
console.log('dist/artifact.html', kb('artifact.html'));
