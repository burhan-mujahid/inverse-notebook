import http from 'node:http';
import { readFile, realpath } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const port = Number(process.env.PORT || 5173);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be a valid TCP port.');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.md': 'text/plain', '.json': 'application/json' };
const server = http.createServer(async (request, response) => {
  try {
    if (!['GET', 'HEAD'].includes(request.method)) { response.writeHead(405); response.end('Method not allowed'); return; }
    const url = new URL(request.url, 'http://127.0.0.1');
    const pathname = decodeURIComponent(url.pathname);
    const relative = pathname === '/' ? 'index.html' : pathname.slice(1);
    if (!/^(index\.html|README\.md|PRODUCT\.md|DESIGN\.md|src\/[a-zA-Z0-9._-]+|public\/[a-zA-Z0-9._-]+|docs\/[a-zA-Z0-9._-]+)$/.test(relative)) {
      response.writeHead(404); response.end('Not found'); return;
    }
    const target = await realpath(path.join(root, relative));
    if (!target.startsWith(await realpath(root) + path.sep)) { response.writeHead(403); response.end('Forbidden'); return; }
    const content = await readFile(target);
    response.writeHead(200, {
      'Content-Type': `${types[path.extname(target)] || 'application/octet-stream'}; charset=utf-8`,
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'",
    });
    response.end(request.method === 'HEAD' ? undefined : content);
  } catch (error) {
    response.writeHead(error.code === 'ENOENT' ? 404 : 400);
    response.end('File unavailable');
  }
});
server.on('error', error => { console.error(`Cannot start Inverse: ${error.message}`); process.exitCode = 1; });
server.listen(port, '127.0.0.1', () => console.log(`Inverse is running at http://127.0.0.1:${port}`));
