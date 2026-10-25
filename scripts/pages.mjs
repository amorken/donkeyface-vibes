import { copyFile, mkdir, writeFile } from 'node:fs/promises';

// Publish the self-contained release at the Pages site's root. Its inline
// assets and query-string stage route also work under a repository subpath.
await mkdir('dist-pages', { recursive: true });
await copyFile('release/Donkey-Face.html', 'dist-pages/index.html');
await writeFile('dist-pages/.nojekyll', '');
console.log('GitHub Pages site built in dist-pages/');
