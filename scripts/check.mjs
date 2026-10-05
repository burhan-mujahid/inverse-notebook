import { readdir, readFile, access } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const lists = await Promise.all(entries.filter(e => !['node_modules', '.git', 'artifacts'].includes(e.name)).map(e => {
    const name = path.join(directory, e.name);
    return e.isDirectory() ? walk(name) : [name];
  }));
  return lists.flat();
}
let checked = 0;
for (const file of await walk('.')) {
  if (/\.(js|mjs)$/.test(file)) {
    const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
    if (result.status) throw new Error(result.stderr);
    checked++;
  }
  if (file.endsWith('.md')) {
    const content = await readFile(file, 'utf8');
    for (const match of content.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
      const target = match[1].split('#')[0];
      if (!target || /^(https?:|mailto:)/.test(target)) continue;
      await access(path.resolve(path.dirname(file), target));
    }
  }
}
console.log(`Checked ${checked} JavaScript modules and all local Markdown links.`);
