import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';

const manifest = JSON.parse(await readFile('dist/.vite/manifest.json', 'utf8'));
function dependencies(entry, seen = new Set()) {
  if (seen.has(entry)) return seen;
  seen.add(entry);
  for (const child of manifest[entry]?.imports ?? []) dependencies(child, seen);
  return seen;
}
async function size(entries) {
  let bytes = 0;
  for (const entry of entries) bytes += gzipSync(await readFile(`dist/${manifest[entry].file}`)).byteLength;
  return bytes;
}
const shell = dependencies('index.html');
const editing = new Set([...shell, ...dependencies('src/client/EditorPane.svelte')]);
const all = new Set([...editing, ...dependencies('src/client/editor/markdown.ts')]);
const result = {
  generatedAt: new Date().toISOString(),
  method: 'Sum of gzip-compressed JS resources in Vite manifest; CSS measured separately.',
  shellGzipBytes: await size(shell),
  editorReadyGzipBytes: await size(editing),
  withMarkdownGzipBytes: await size(all),
  cssGzipBytes: 0,
  budgets: { shell: 100 * 1024, editorReady: 300 * 1024 },
};
for (const css of manifest['index.html'].css ?? []) result.cssGzipBytes += gzipSync(await readFile(`dist/${css}`)).byteLength;
await mkdir('artifacts', { recursive: true });
await writeFile('artifacts/bundle.json', JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result, null, 2));
if (result.shellGzipBytes > result.budgets.shell || result.editorReadyGzipBytes > result.budgets.editorReady) process.exitCode = 1;
