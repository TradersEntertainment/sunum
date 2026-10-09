// The static server used for deployment (Railway etc.): what it serves, what it
// must never serve, caching, compression and method handling.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const { createServer } = require('../server.js');

const ROOT = path.resolve(__dirname, '..');
let server, port;

before(async () => {
  server = createServer(ROOT);
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  port = server.address().port;
});

after(async () => {
  if (server.closeAllConnections) server.closeAllConnections();
  await new Promise((r) => server.close(r));
});

// Raw request: the path is sent exactly as given (no client-side normalising).
function request(rawPath, { method = 'GET', headers = {} } = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request({ host: '127.0.0.1', port, path: rawPath, method, headers, agent: false }, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks) }));
    });
    req.on('error', reject);
    req.end();
  });
}

test('health check answers ok', async () => {
  const r = await request('/healthz');
  assert.equal(r.status, 200);
  assert.equal(r.body.toString(), 'ok');
});

test('/ serves the presentation page', async () => {
  const r = await request('/');
  assert.equal(r.status, 200);
  assert.match(r.headers['content-type'], /^text\/html/);
  assert.match(r.body.toString(), /<title>Transform &amp; Conquer<\/title>/);
});

test('every local file referenced by index.html and fonts.css is served', async () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const refs = [...html.matchAll(/(?:src|href)="([^"#?:]+\.(?:js|css))"/g)].map((m) => '/' + m[1]);
  assert.ok(refs.length > 30, 'expected many script/style references, got ' + refs.length);
  const css = fs.readFileSync(path.join(ROOT, 'css', 'fonts.css'), 'utf8');
  const fonts = [...css.matchAll(/url\(\.\.\/(fonts\/[^)]+)\)/g)].map((m) => '/' + m[1]);
  assert.ok(fonts.length >= 12, 'expected the vendored fonts, got ' + fonts.length);
  for (const url of refs.concat(fonts)) {
    const r = await request(url);
    assert.equal(r.status, 200, url);
  }
});

test('content types: js, css, woff2', async () => {
  assert.match((await request('/js/core/deck.js')).headers['content-type'], /^text\/javascript/);
  assert.match((await request('/css/base.css')).headers['content-type'], /^text\/css/);
  const font = (await request('/fonts/tc-math.woff2')).headers;
  assert.equal(font['content-type'], 'font/woff2');
  assert.match(font['cache-control'], /immutable/);
});

test('the single-file bundle is served', async () => {
  const r = await request('/dist/transform-and-conquer.html');
  assert.equal(r.status, 200);
});

test('gzip when accepted, identity otherwise, same content', async () => {
  const disk = fs.readFileSync(path.join(ROOT, 'js', 'core', 'deck.js'));
  const zipped = await request('/js/core/deck.js', { headers: { 'accept-encoding': 'gzip, deflate, br' } });
  assert.equal(zipped.headers['content-encoding'], 'gzip');
  assert.equal(zipped.headers.vary, 'Accept-Encoding');
  assert.ok(zipped.body.length < disk.length);
  assert.deepEqual(zlib.gunzipSync(zipped.body), disk);
  const plainRes = await request('/js/core/deck.js');
  assert.equal(plainRes.headers['content-encoding'], undefined);
  assert.deepEqual(plainRes.body, disk);
});

test('ETag revalidation returns 304 with no body', async () => {
  const first = await request('/css/base.css');
  const etag = first.headers.etag;
  assert.ok(etag);
  assert.equal(first.headers['cache-control'], 'no-cache');
  const again = await request('/css/base.css', { headers: { 'if-none-match': etag } });
  assert.equal(again.status, 304);
  assert.equal(again.body.length, 0);
  const stale = await request('/css/base.css', { headers: { 'if-none-match': '"nope"' } });
  assert.equal(stale.status, 200);
});

test('files that are not part of the site are never served', async () => {
  for (const url of ['/package.json', '/server.js', '/railway.json', '/README.md', '/KONUSMA_METNI.md',
    '/tests/heap.test.js', '/tools/bundle.js', '/docs/AUTHORING.md', '/.git/config', '/.gitignore',
    '/node_modules/x', '/js', '/js/', '/css/nope.css', '/fonts/']) {
    const r = await request(url);
    assert.equal(r.status, 404, url);
  }
});

test('path traversal attempts never return a file', async () => {
  for (const url of ['/js/../package.json', '/../package.json', '/%2e%2e/package.json', '/..%2fpackage.json',
    '/js/%2e%2e/%2e%2e/etc/passwd', '/js/..%5c..%5cpackage.json', '/%00', '/js/core/deck.js%00.png',
    '//etc/passwd', '/index.html/../../package.json']) {
    const r = await request(url);
    assert.ok(r.status === 404 || r.status === 400, url + ' → ' + r.status);
    assert.doesNotMatch(r.body.toString(), /"scripts"|root:/, url);
  }
});

test('malformed percent-encoding is a 400, not a crash', async () => {
  assert.equal((await request('/%E0%A4%A')).status, 400);
  assert.equal((await request('/healthz')).status, 200);
});

test('only GET and HEAD are allowed', async () => {
  const post = await request('/', { method: 'POST' });
  assert.equal(post.status, 405);
  assert.equal(post.headers.allow, 'GET, HEAD');
  const head = await request('/', { method: 'HEAD' });
  assert.equal(head.status, 200);
  assert.ok(Number(head.headers['content-length']) > 0);
  assert.equal(head.body.length, 0);
});

test('security headers are set', async () => {
  const r = await request('/');
  assert.equal(r.headers['x-content-type-options'], 'nosniff');
  assert.ok(r.headers['referrer-policy']);
});
