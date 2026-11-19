#!/usr/bin/env node
// Local-link checker for the root pages of this site.
//
// The site has no build step, so nothing else proves that an `href`, `src`
// or CSS `url()` written by hand still points at a file in the repo after a
// rename or a deleted asset. This script is that proof: it parses every
// `.html` file in the repository root, collects each local reference
// (fragment-only and external-scheme values are not local), resolves it
// against the repo, and exits 1 naming every missing target.
//
// Known-positive: `node scripts/check-links.mjs --self-test` runs against a
// temp fixture tree — one page with every reference kind (href double- and
// single-quoted, src, quoted and bare url()) pointing at files that exist,
// which must pass, and a second page carrying exactly one planted broken
// link, which must fail with that link named. A checker whose failure path
// cannot fire would pass this repo by accident; the self-test is what stops
// it from passing by accident ever again.
import { readFileSync, readdirSync, existsSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import path from "node:path";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// [label, regex with the target in group 1]: href="…"/href='…', src, and
// CSS url(…) in any quoting style. One pass over the raw file text per kind
// keeps this dependency-free, like the rest of scripts/.
const PATTERNS = [
  ["href", /href\s*=\s*"([^"]*)"/g],
  ["href", /href\s*=\s*'([^']*)'/g],
  ["src", /src\s*=\s*"([^"]*)"/g],
  ["src", /src\s*=\s*'([^']*)'/g],
  ["url()", /url\(\s*"([^"]*)"\s*\)/g],
  ["url()", /url\(\s*'([^']*)'\s*\)/g],
  ["url()", /url\(\s*([^'")\s][^)]*)\)/g],
];

const isExternal = (target) =>
  /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(target) || target.startsWith("//");

// Every local reference in one HTML source string, as {kind, target, file}.
export function collectRefs(file, html) {
  const refs = [];
  for (const [kind, re] of PATTERNS) {
    for (const m of html.matchAll(re)) {
      const target = m[1].trim();
      // Fragment-only (or empty) links point inside the page itself.
      if (target === "" || target.startsWith("#")) continue;
      if (isExternal(target)) continue;
      refs.push({ kind, target, file });
    }
  }
  return refs;
}

// Resolve a local target against the repo and report whether it exists.
export function resolveMissing(root, target) {
  const bare = target.split("#")[0].split("?")[0];
  if (bare === "") return null; // query/fragment only, page itself
  const abs = path.resolve(root, decodeURI(bare));
  if (abs !== root && !abs.startsWith(root + path.sep)) {
    return `${target} (escapes repo root)`;
  }
  return existsSync(abs) ? null : target;
}

export function checkRoot(root) {
  const pages = readdirSync(root, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith(".html"))
    .map((e) => e.name)
    .sort();
  const missing = [];
  let total = 0;
  for (const page of pages) {
    const refs = collectRefs(page, readFileSync(path.join(root, page), "utf8"));
    total += refs.length;
    for (const ref of refs) {
      const bad = resolveMissing(root, ref.target);
      if (bad) missing.push(`${ref.file} · ${ref.kind}: ${bad}`);
    }
  }
  return { pages, total, missing };
}

// --self-test: a temp tree, one clean page (must pass) plus one page with a
// single planted broken link (must fail, naming it).
function selfTest() {
  const dir = path.join(tmpdir(), `check-links-selftest-${process.pid}`);
  try {
    mkdirSync(path.join(dir, "assets"), { recursive: true });
    writeFileSync(path.join(dir, "index.html"), [
      `<a href="assets/a.css">a</a>`,
      `<img src='assets/b.png'>`,
      `<p style="background: url('assets/c.png')">c</p>`,
      `<p style="background: url(assets/d.png)">d</p>`,
      `<a href="#frag">f</a><a href="https://example.com/">ext</a>`,
    ].join("\n"));
    writeFileSync(path.join(dir, "clean.html"), `<a href="index.html">i</a>`);
    writeFileSync(path.join(dir, "assets", "a.css"), "");
    for (const n of ["b.png", "c.png", "d.png"]) {
      writeFileSync(path.join(dir, "assets", n), "");
    }

    const good = checkRoot(dir);
    if (good.missing.length !== 0) {
      console.error(`self-test FAILED: clean fixture reported ${good.missing.length} missing: ${good.missing.join("; ")}`);
      return 1;
    }

    writeFileSync(path.join(dir, "broken.html"), `<a href="assets/does-not-exist.svg">x</a>`);
    const bad = checkRoot(dir);
    if (bad.missing.length !== 1 || !bad.missing[0].includes("assets/does-not-exist.svg")) {
      console.error(`self-test FAILED: planted broken link not reported alone: ${JSON.stringify(bad.missing)}`);
      return 1;
    }
    console.log(`self-test OK: ${good.total} refs clean, planted broken link reported as "${bad.missing[0]}"`);
    return 0;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function main() {
  if (process.argv.includes("--self-test")) process.exit(selfTest());
  const { pages, total, missing } = checkRoot(ROOT);
  for (const line of missing) console.error(`missing target: ${line}`);
  console.log(`${pages.length} pages, ${total} local refs checked, ${missing.length} missing`);
  process.exit(missing.length === 0 ? 0 : 1);
}

// Run only when invoked directly, so `checkRoot`/`collectRefs` above stay
// importable by tests and other scripts.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
