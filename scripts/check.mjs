import { readFile, readdir, access } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
for (const file of await readdir(resolve(root, 'assets'))) {
  if (file.endsWith('.js')) {
    try { execFileSync(process.execPath, ['--check', resolve(root, 'assets', file)], { stdio: 'pipe' }); }
    catch (error) { failures.push(`${file}: ${error.stderr}`); }
  }
}
for (const file of ['index.html', 'docs/research.html']) {
  const full = resolve(root, file), html = await readFile(full, 'utf8');
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  if (new Set(ids).size !== ids.length) failures.push(`${file}: duplicate element IDs`);
  for (const [, target] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    if (/^(https?:|data:|mailto:)/.test(target)) continue;
    if (target.startsWith('#')) { if (!ids.includes(target.slice(1))) failures.push(`${file}: unknown anchor ${target}`); continue; }
    const path = resolve(dirname(full), target.split('#')[0].split('?')[0]);
    try { await access(path); } catch { failures.push(`${file}: missing local target ${target}`); }
  }
}
for (const file of ['app.js','hardware.js','code-explorer.js','firmwares.js','sound-lab.js']) {
  const text = await readFile(resolve(root, 'assets', file), 'utf8');
  for (const [, path] of text.matchAll(/from\s+['"](\.\.?\/[^'"]+)['"]/g)) {
    try { await access(resolve(root, 'assets', path.split('?')[0])); } catch { failures.push(`${file}: missing import ${path}`); }
  }
}
if (failures.length) { console.error(failures.join('\n')); process.exitCode = 1; }
else console.log('Passed: all JavaScript parses; local links, anchors, module imports and assets resolve.');
