#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const file = join(root, 'jobs.md');

const raw = readFileSync(file, 'utf8');
const lines = raw.split(/\r?\n/);

function isBlank(line) {
  return line.trim() === '';
}

function skipBlank(i) {
  while (i < lines.length && isBlank(lines[i])) i++;
  return i;
}

function headingText(heading) {
  return heading.replace(/^##\s+/, '').replace(/\\/g, '').trim();
}

function githubAnchor(heading) {
  return headingText(heading)
    .toLowerCase()
    .replace(/[^\w\- ]+/g, '')
    .trim()
    .replace(/ /g, '-');
}

function sectionKey(heading) {
  const text = headingText(heading);
  return text.charAt(0).toUpperCase();
}

function parseRow(line) {
  const t = line.trim();
  if (!t.startsWith('|') || !t.endsWith('|')) return null;
  const cells = t.slice(1, -1).split('|').map((c) => c.trim());
  if (cells.length < 2) return null;
  const link = cells[0].match(/^\[([^\]]+)\]\(([^)]+)\)$/);
  if (link) {
    return { kind: 'link', name: link[1], url: link[2] };
  }
  return { kind: 'raw', name: cells[0], cells };
}

function formatRow(row) {
  if (row.kind === 'link') {
    return `| [${row.name}](${row.url}) | <${row.url}> |`;
  }
  return `| ${row.cells.join(' | ')} |`;
}

function parseSectionBody(body) {
  const nonEmpty = body.filter((l) => !isBlank(l));
  const rows = [];
  const extras = [];
  let inTable = false;
  let sawHeader = false;
  let sawSep = false;

  for (const line of nonEmpty) {
    const t = line.trim();
    if (t.startsWith('|')) {
      inTable = true;
      if (!sawHeader) {
        sawHeader = true;
        continue;
      }
      if (!sawSep && /^\|[\s\-|]+\|$/.test(t)) {
        sawSep = true;
        continue;
      }
      const row = parseRow(t);
      if (row) rows.push(row);
      else extras.push(t);
    } else if (inTable) {
      extras.push(t);
    } else {
      extras.push(t);
    }
  }

  return { rows, extras, hasTable: sawHeader };
}

function compareNames(a, b) {
  return a.name.toLowerCase().localeCompare(b.name.toLowerCase(), 'en');
}

const STAMP_RE = /^Last updated: .+$/;

function utcStamp(date = new Date()) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  const hh = String(date.getUTCHours()).padStart(2, '0');
  const mm = String(date.getUTCMinutes()).padStart(2, '0');
  return `Last updated: ${y}-${m}-${d} ${hh}:${mm} UTC`;
}

function stripStamp(content) {
  return content
    .split('\n')
    .filter((l) => !STAMP_RE.test(l.trim()))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\n*$/, '\n');
}

// Parse title
let i = skipBlank(0);
const titleLines = [];
while (i < lines.length && lines[i].startsWith('# ')) {
  titleLines.push(lines[i].trim());
  i++;
}
const title = titleLines[0] ?? '# Remote Jobs';

i = skipBlank(i);

// Parse existing "Last updated" line
let lastUpdated = null;
if (i < lines.length && STAMP_RE.test(lines[i].trim())) {
  lastUpdated = lines[i].trim();
  i++;
}
i = skipBlank(i);

// Skip existing TOC (line starting with '[')
if (i < lines.length && lines[i].startsWith('[')) {
  i++;
}
i = skipBlank(i);

// Parse sections
const sections = [];
while (i < lines.length) {
  if (lines[i].startsWith('## ')) {
    const heading = lines[i].replace(/\s+$/, '');
    i++;
    const start = i;
    while (i < lines.length && !lines[i].startsWith('## ')) i++;
    const body = lines.slice(start, i);
    sections.push({ heading, ...parseSectionBody(body) });
    i = skipBlank(i);
  } else {
    i++;
  }
}

sections.sort((a, b) =>
  sectionKey(a.heading).localeCompare(sectionKey(b.heading), 'en')
);

for (const s of sections) {
  s.rows.sort(compareNames);
}

const toc = sections
  .map((s) => `[${headingText(s.heading)}](#${githubAnchor(s.heading)})`)
  .join(' | ');

const out = [];
out.push(title, '', toc);

for (const s of sections) {
  out.push('', s.heading, '');
  out.push('| Site | URL |');
  out.push('| --- | --- |');
  for (const row of s.rows) out.push(formatRow(row));
  for (const extra of s.extras) out.push(extra);
}

const body = out.join('\n').replace(/\n{3,}/g, '\n\n').replace(/\n*$/, '\n');
const rawNorm = raw.replace(/\r\n/g, '\n');
const bodyChanged = body !== stripStamp(rawNorm);
const stamp = bodyChanged || !lastUpdated ? utcStamp() : lastUpdated;
const result = body.replace(/^([^\n]+\n\n)/, `$1${stamp}\n\n`);

if (result !== rawNorm) {
  writeFileSync(file, result, 'utf8');
  console.log(`Formatted jobs.md (${stamp})`);
} else {
  console.log(`jobs.md already formatted (${stamp})`);
}
