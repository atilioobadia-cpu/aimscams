#!/usr/bin/env node
// Extracts every ```mermaid block from the spec documents and parses it with the
// real mermaid parser. Fails the build on any syntax error.
//
// Usage:  npm install && node check.mjs ../../docs
//         node check.mjs ../../docs --quiet

import fs from 'node:fs';
import path from 'node:path';
import { JSDOM } from 'jsdom';

const dir = path.resolve(process.argv[2] ?? '../../docs');
const quiet = process.argv.includes('--quiet');

// mermaid touches the DOM during parse; give it a minimal one.
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', { pretendToBeVisual: true });
for (const key of ['window', 'document', 'navigator', 'HTMLElement', 'SVGElement', 'Element', 'Node', 'DOMParser', 'getComputedStyle']) {
  const value = key === 'window' ? dom.window : dom.window[key];
  try {
    Object.defineProperty(globalThis, key, { value, configurable: true, writable: true });
  } catch {
    // Some globals (e.g. navigator on newer Node) are locked; mermaid does not need them.
  }
}

const mermaid = (await import('mermaid')).default;
mermaid.initialize({ startOnLoad: false, securityLevel: 'loose' });

const files = fs
  .readdirSync(dir)
  .filter((f) => f.endsWith('.md'))
  .sort();

let checked = 0;
const failures = [];

for (const file of files) {
  const text = fs.readFileSync(path.join(dir, file), 'utf8');
  const re = /```mermaid[^\n]*\n([\s\S]*?)```/g;
  let match;
  let index = 0;

  while ((match = re.exec(text)) !== null) {
    index += 1;
    checked += 1;
    const line = text.slice(0, match.index).split('\n').length;
    const body = match[1];

    try {
      await mermaid.parse(body, { suppressErrors: false });
      if (!quiet) console.log(`ok   ${file} #${index} (line ${line})`);
    } catch (err) {
      const message = String(err?.message ?? err).split('\n').slice(0, 8).join('\n     ');
      failures.push({ file, index, line, message });
      console.error(`FAIL ${file} #${index} (line ${line})\n     ${message}`);
    }
  }
}

console.log(`\n${checked} diagram(s) checked, ${failures.length} failure(s) in ${files.length} file(s)`);

if (failures.length > 0) {
  process.exit(1);
}
