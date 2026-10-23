import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const dist = resolve('dist');
let html = await readFile(resolve(dist, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"[^>]*><\/script>/g)];
for (const [tag, source] of scripts) {
  const code = await readFile(resolve(dist, source), 'utf8');
  html = html.replace(tag, () => `<script type="module">${code.replaceAll('</script', '<\\/script')}</script>`);
}
const styles = [...html.matchAll(/<link\b[^>]*\bhref="([^"]+\.css)"[^>]*>/g)];
for (const [tag, source] of styles) {
  const css = await readFile(resolve(dist, source), 'utf8');
  html = html.replace(tag, () => `<style>${css}</style>`);
}
const favicon = await readFile(resolve(dist, 'favicon.svg'));
html = html.replace(/<link\b[^>]*\brel="icon"[^>]*>/, `<link rel="icon" href="data:image/svg+xml;base64,${favicon.toString('base64')}"/>`);
const fontLicense = await readFile('public/fonts/SpaceGrotesk-LICENSE.txt', 'utf8');
html = html.replace('</head>', () => `<!-- Bundled font license:\n${fontLicense.replaceAll('--', '—')}\n-->\n</head>`);
if (/<(?:script|link)\b[^>]*(?:src|href)="(?!data:)[^"]+"/i.test(html)) throw new Error('The release still contains an external script or stylesheet.');
await mkdir('release', { recursive: true });
await writeFile('release/Donkey-Face.html', html);
console.log(`Packaged release/Donkey-Face.html (${Math.round(Buffer.byteLength(html) / 1024)} KB). No server or installation required.`);
