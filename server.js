/* Zero-dependency static server for the presentation.
 *
 *   npm start                  → http://localhost:3000
 *   PORT=8080 node server.js
 *
 * Made for Railway (any container host works): it reads $PORT, binds to
 * 0.0.0.0, answers GET /healthz and shuts down cleanly on SIGTERM.
 *
 * Only index.html, css/, js/, fonts/ and dist/ are ever served. Every file is
 * read into memory once at start-up, so a request can only match a URL that is
 * in that table: there is no file-system access per request and therefore no
 * path traversal. The whole site is a few MB, so memory stays small.
 */
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');

const ROOT = __dirname;
const PUBLIC = ['index.html', 'css', 'js', 'fonts', 'dist'];

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.woff2': 'font/woff2',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};
const COMPRESSIBLE = new Set(['.html', '.css', '.js', '.json', '.svg', '.txt']);

function listFiles(abs, url, out) {
  const st = fs.statSync(abs);
  if (st.isDirectory()) {
    for (const name of fs.readdirSync(abs).sort()) {
      if (name.startsWith('.')) continue;
      listFiles(path.join(abs, name), url + '/' + name, out);
    }
  } else if (st.isFile()) {
    out.push({ abs, url });
  }
  return out;
}

/* URL path → {type, body, gzip, etag, cache} for every public file. */
function loadSite(root) {
  const site = new Map();
  for (const entry of PUBLIC) {
    const abs = path.join(root, entry);
    if (!fs.existsSync(abs)) continue;
    for (const f of listFiles(abs, '/' + entry, [])) {
      const ext = path.extname(f.url).toLowerCase();
      const type = TYPES[ext];
      if (!type) continue;                              // unknown types are never served
      const body = fs.readFileSync(f.abs);
      let gzip = null;
      if (COMPRESSIBLE.has(ext) && body.length > 512) {
        const z = zlib.gzipSync(body, { level: 9 });
        if (z.length < body.length) gzip = z;
      }
      const tag = crypto.createHash('sha1').update(body).digest('base64url').slice(0, 22);
      site.set(f.url, {
        type, body, gzip,
        etag: '"' + tag + '"',
        etagGzip: '"' + tag + '-gzip"',
        // Fonts never change under the same name; everything else is revalidated
        // on each load (a cheap 304), so a redeploy shows up immediately.
        cache: ext === '.woff2' ? 'public, max-age=31536000, immutable' : 'no-cache',
      });
    }
  }
  return site;
}

function acceptsGzip(req) {
  return /\bgzip\b/i.test(req.headers['accept-encoding'] || '');
}

function etagMatches(header, etag) {
  if (!header) return false;
  return header.split(',').some((t) => t.trim().replace(/^W\//, '') === etag);
}

function plain(req, res, status, text) {
  res.writeHead(status, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Content-Length': Buffer.byteLength(text),
  });
  res.end(req.method === 'HEAD' ? undefined : text);
}

function createServer(root) {
  const site = loadSite(root || ROOT);

  const server = http.createServer((req, res) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.setHeader('Allow', 'GET, HEAD');
      return plain(req, res, 405, 'Method Not Allowed');
    }

    let pathname;
    try {
      pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    } catch (e) {
      return plain(req, res, 400, 'Bad Request');
    }

    if (pathname === '/healthz') return plain(req, res, 200, 'ok');
    if (pathname === '/') pathname = '/index.html';

    const f = site.get(pathname);
    if (!f) return plain(req, res, 404, 'Not found');

    const gz = !!f.gzip && acceptsGzip(req);
    const etag = gz ? f.etagGzip : f.etag;
    const headers = {
      'Content-Type': f.type,
      'Cache-Control': f.cache,
      ETag: etag,
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    };
    if (f.gzip) headers.Vary = 'Accept-Encoding';

    if (etagMatches(req.headers['if-none-match'], etag)) {
      res.writeHead(304, headers);
      return res.end();
    }

    const body = gz ? f.gzip : f.body;
    if (gz) headers['Content-Encoding'] = 'gzip';
    headers['Content-Length'] = body.length;
    res.writeHead(200, headers);
    res.end(req.method === 'HEAD' ? undefined : body);
  });

  // Hosting proxies keep connections open for ~60 s; stay above that so a
  // reused connection is never closed under their feet (sporadic 502s).
  server.keepAliveTimeout = 65000;
  server.headersTimeout = 66000;
  server.site = site;
  return server;
}

function start() {
  const port = Number(process.env.PORT) || 3000;
  const host = process.env.HOST || '0.0.0.0';       // never 127.0.0.1: unreachable in a container
  const server = createServer();
  server.listen(port, host, () => {
    let bytes = 0;
    server.site.forEach((f) => { bytes += f.body.length; });
    console.log('Transform & Conquer is up on ' + host + ':' + port
      + ' (' + server.site.size + ' files, ' + Math.round(bytes / 1024) + ' KB in memory)');
  });
  const stop = (signal) => {
    console.log(signal + ' received, shutting down');
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 5000).unref();
  };
  process.on('SIGTERM', () => stop('SIGTERM'));
  process.on('SIGINT', () => stop('SIGINT'));
  return server;
}

if (require.main === module) start();

module.exports = { createServer, loadSite, PUBLIC };
