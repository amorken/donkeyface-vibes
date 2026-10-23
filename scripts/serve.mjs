import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { basename, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const { values } = parseArgs({
  options: {
    host: { type: 'string', default: '127.0.0.1' },
    port: { type: 'string', default: '4173' },
    file: { type: 'string', default: fileURLToPath(new URL('../release/Donkey-Face.html', import.meta.url)) },
  },
});
const port = Number(values.port);
if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error('Port must be an integer between 0 and 65535.');
const file = resolve(values.file);
if (!(await stat(file)).isFile()) throw new Error(`Not an HTML file: ${file}`);
const route = `/${basename(file)}`;

// Serve only the chosen release, not the source tree or arbitrary filesystem paths.
const server = createServer(async (request, response) => {
  if (!['GET', 'HEAD'].includes(request.method)) {
    response.writeHead(405, { Allow: 'GET, HEAD' }); response.end('Method not allowed'); return;
  }
  let path;
  try { path = decodeURIComponent(new URL(request.url, 'http://localhost').pathname); }
  catch { response.writeHead(400); response.end('Invalid URL'); return; }
  if (path !== '/' && path !== route) { response.writeHead(404); response.end('Not found'); return; }
  try {
    const html = await readFile(file);
    response.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Length': html.length,
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    });
    response.end(request.method === 'HEAD' ? undefined : html);
  } catch {
    response.writeHead(500); response.end('Could not read the show file');
  }
});
server.on('error', (error) => { console.error(error.message); process.exitCode = 1; });
server.listen(port, values.host, () => {
  const address = server.address();
  const host = values.host.includes(':') ? `[${values.host}]` : values.host;
  console.log(`Serving ${basename(file)} at http://${host}:${address.port}/`);
});
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close());
