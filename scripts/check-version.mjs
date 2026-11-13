#!/usr/bin/env node
// Single owner of the specification version: package.json `version`.
//
// The site has no build step, so the published pages restate the version in
// a few places a reader must see (spec/vocab headers, the ontology's
// versionInfo/versionIRI, the paper's self-citation, the changelog's newest
// row). Each of those is pinned here to package.json; any other copy (file
// banners, comments) was deleted rather than kept in sync.
//
// Known-positive: `node scripts/check-version.mjs --self-test` mutates the
// owner in memory and proves every site would be reported.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => readFileSync(path.join(ROOT, rel), "utf8");

// [file, label, regex whose group 1 is the restated version]
const SITES = [
  ["spec.html", "spec header", /<p class="spec-meta">\s*Version (\d+\.\d+\.\d+) ·/],
  ["vocab.html", "vocab header", /<code>https:\/\/awkronos\.github\.io\/web\/vocab#<\/code> ·\s*Version (\d+\.\d+\.\d+) ·/],
  ["vocab.ttl", "owl:versionInfo", /owl:versionInfo "(\d+\.\d+\.\d+)"/],
  ["vocab.ttl", "owl:versionIRI", /owl:versionIRI <https:\/\/awkronos\.github\.io\/web\/vocab\/(\d+\.\d+\.\d+)#>/],
  ["paper.html", "self-citation", /Agent Data Pod Specification, Version (\d+\.\d+\.\d+)\./],
  ["changelog.html", "newest history row", /<tbody>\s*<tr><td><strong>(\d+\.\d+\.\d+)<\/strong><\/td>/],
];

function check(owner, files) {
  const failures = [];
  for (const [file, label, re] of SITES) {
    const m = files[file].match(re);
    if (!m) failures.push(`${file}: ${label} not found (pattern drifted)`);
    else if (m[1] !== owner) failures.push(`${file}: ${label} says ${m[1]}, package.json says ${owner}`);
  }
  return failures;
}

const owner = JSON.parse(read("package.json")).version;
const files = Object.fromEntries([...new Set(SITES.map(([f]) => f))].map((f) => [f, read(f)]));

if (process.argv.includes("--self-test")) {
  const mutated = check("9.9.9", files);
  if (mutated.length !== SITES.length) {
    console.error(`self-test FAILED: mutated owner flagged ${mutated.length}/${SITES.length} sites`);
    process.exit(1);
  }
  console.log(`version self-test: mutated owner flagged ${mutated.length}/${SITES.length} sites`);
}

const failures = check(owner, files);
if (failures.length) {
  console.error(`version drift (${failures.length}):\n  ` + failures.join("\n  "));
  process.exit(1);
}
console.log(`version ${owner}: ${SITES.length} restated sites agree with package.json`);
