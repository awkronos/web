#!/usr/bin/env node
// Single owner of the specification version: package.json `version`.
//
// The site has no build step, so the published pages restate the version in
// a few places a reader must see (spec/vocab headers, the ontology's
// versionInfo/versionIRI, the paper's self-citation, the changelog's newest
// row). Each of those is pinned here to package.json; any other copy (file
// banners, comments) was deleted rather than kept in sync.
//
// The ontology additionally advertises an `owl:versionIRI`
// (e.g. https://awkronos.github.io/web/vocab/0.2.0#) that points at a
// per-version immutable copy of the vocabulary published under `vocab/`. A
// version IRI is a permanent identifier: once minted it must always resolve
// to the exact bytes it was minted with, never to whatever `vocab.ttl`
// happens to say next. PUBLISHED_VERSIONS below is the single owner of
// those pinned bytes, keyed by version; the `vocab/` tree is checked
// against it, not the other way around. Adding a release means adding one
// entry here and freezing one pair of files under `vocab/` — never editing
// or renaming an existing entry's or file's bytes in place.
//
// Known-positive: `node scripts/check-version.mjs --self-test` mutates the
// owner in memory and proves every site would be reported, and proves each
// versioned-copy failure mode (wrong version, wrong content, candidate
// bytes, rolling-release drift) would be reported too.
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => readFileSync(path.join(ROOT, rel), "utf8");

const BASE_IRI = "https://awkronos.github.io/web/vocab";
const VERSION_DIR = "vocab";
const VERSION_RESOURCE_RE = /^(\d+\.\d+\.\d+)(\.ttl)?$/;

// Version → lowercase hex SHA-256 of the exact bytes published at
// `vocab/<version>` and `vocab/<version>.ttl` (both are byte-identical
// copies of each other, frozen at release time). A version resource that
// needs different bytes is a different version: bump, never overwrite.
const PUBLISHED_VERSIONS = {
  // First minted copy of the 0.2.0 version resource. Provenance: byte-identical
  // to `vocab.ttl` at the commit that pinned it; the vocabulary's own content
  // had earlier drifted (a redundant "# Version 0.2.0" comment line, removed
  // in e0439b2) with no version bump — that drift is exactly what the
  // rolling-release check below now forbids going forward.
  "0.2.0": "23c9b14191d357ca8a2405078f1235d5014afddfb2a81c998ddde08a10c97a86",
};

// [file, label, regex whose group 1 is the restated version]
const SITES = [
  ["spec.html", "spec header", /<p class="spec-meta">\s*Version (\d+\.\d+\.\d+) ·/],
  ["vocab.html", "vocab header", /<code>https:\/\/awkronos\.github\.io\/web\/vocab#<\/code> ·\s*Version (\d+\.\d+\.\d+) ·/],
  ["vocab.ttl", "owl:versionInfo", /owl:versionInfo "(\d+\.\d+\.\d+)"/],
  ["vocab.ttl", "owl:versionIRI", /owl:versionIRI <https:\/\/awkronos\.github\.io\/web\/vocab\/(\d+\.\d+\.\d+)#>/],
  ["vocab.html", "alternate Turtle link", /type="text\/turtle" href="vocab\/(\d+\.\d+\.\d+)\.ttl"/],
  ["vocab.html", "versioned-copy IRI", /https:\/\/awkronos\.github\.io\/web\/vocab\/(\d+\.\d+\.\d+)#<\/code>/],
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

const sha256 = (text) => createHash("sha256").update(Buffer.from(text, "utf8")).digest("hex");

// Pure: given the owner version, the pinned-bytes manifest, the file
// contents (keyed by repo-relative path, only the paths mentioned below
// need be present) and the `vocab/` directory listing, report every way a
// version resource could be wrong. Kept side-effect free so --self-test can
// drive each arm with synthetic inputs, exactly like `check()` above.
function checkVersioned(owner, published, files, dirListing) {
  const failures = [];

  // Candidate bytes: a file under vocab/ that looks like a version resource
  // but has no manifest entry — unpublished, or a rename/typo that would
  // otherwise silently serve something no release ever pinned.
  for (const name of dirListing) {
    const m = name.match(VERSION_RESOURCE_RE);
    if (!m) continue;
    const [, version] = m;
    if (!(version in published)) {
      failures.push(
        `${VERSION_DIR}/${name}: candidate bytes — version ${version} matches the version-resource pattern but has no PUBLISHED_VERSIONS entry; an unreleased copy must never be published under a version IRI`,
      );
    }
  }

  for (const [version, pinnedSha] of Object.entries(published)) {
    for (const suffix of ["", ".ttl"]) {
      const rel = `${VERSION_DIR}/${version}${suffix}`;
      const text = files[rel];
      if (text === undefined) {
        failures.push(`${rel}: missing — PUBLISHED_VERSIONS advertises ${version} but no bytes are published for it`);
        continue;
      }
      // Wrong content: the published bytes are not the pinned bytes.
      if (sha256(text) !== pinnedSha) {
        failures.push(
          `${rel}: wrong content — sha256 ${sha256(text)} does not match PUBLISHED_VERSIONS "${version}" = ${pinnedSha}; a version resource is immutable, a fix is a new version, not an edit in place`,
        );
      }
      // Wrong version: the file at this path describes a different version
      // than its own path says.
      const infoMatch = text.match(/owl:versionInfo "(\d+\.\d+\.\d+)"/);
      const iriMatch = text.match(new RegExp(`owl:versionIRI <${BASE_IRI.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/(\\d+\\.\\d+\\.\\d+)#>`));
      if (!infoMatch) failures.push(`${rel}: owl:versionInfo not found (pattern drifted)`);
      else if (infoMatch[1] !== version) failures.push(`${rel}: wrong version — owl:versionInfo says ${infoMatch[1]}, path says ${version}`);
      if (!iriMatch) failures.push(`${rel}: owl:versionIRI not found (pattern drifted)`);
      else if (iriMatch[1] !== version) failures.push(`${rel}: wrong version — owl:versionIRI says ${iriMatch[1]}, path says ${version}`);
    }
  }

  // Rolling-release drift: the live entrypoint and the immutable copy for
  // the current version are two names for the same release and must be the
  // same bytes. If vocab.ttl moves without package.json's version moving
  // with it, the pinned copy for `owner` is now describing bytes that no
  // longer exist anywhere, while the advertised IRI still resolves to them.
  if (owner in published && files["vocab.ttl"] !== undefined) {
    if (sha256(files["vocab.ttl"]) !== published[owner]) {
      failures.push(
        `vocab.ttl: rolling-release drift — the live entrypoint's bytes differ from the pinned copy for its own version ${owner}; bump package.json's version (and add a new PUBLISHED_VERSIONS entry) or restore the bytes, never edit the published copy in place`,
      );
    }
  }

  return failures;
}

function readVersioned() {
  const dir = path.join(ROOT, VERSION_DIR);
  const listing = existsSync(dir) ? readdirSync(dir) : [];
  const rels = new Set(["vocab.ttl"]);
  for (const version of Object.keys(PUBLISHED_VERSIONS)) {
    rels.add(`${VERSION_DIR}/${version}`);
    rels.add(`${VERSION_DIR}/${version}.ttl`);
  }
  const vFiles = {};
  for (const rel of rels) if (existsSync(path.join(ROOT, rel))) vFiles[rel] = read(rel);
  return { vFiles, listing };
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

  const { vFiles: baseVFiles, listing: baseListing } = readVersioned();

  const arms = [
    {
      name: "wrong version",
      files: { ...baseVFiles, "vocab/0.2.0": baseVFiles["vocab/0.2.0"].replace('owl:versionInfo "0.2.0"', 'owl:versionInfo "0.2.1"') },
      listing: baseListing,
      expect: /wrong version/,
    },
    {
      name: "wrong content",
      files: { ...baseVFiles, "vocab/0.2.0.ttl": baseVFiles["vocab/0.2.0.ttl"].replace("Agent Data Pod Vocabulary", "Agent Data Pod Vocabylary") },
      listing: baseListing,
      expect: /wrong content/,
    },
    {
      name: "candidate bytes",
      files: baseVFiles,
      listing: [...baseListing, "0.9.9.ttl"],
      expect: /candidate bytes/,
    },
    {
      name: "rolling-release drift",
      files: { ...baseVFiles, "vocab.ttl": baseVFiles["vocab.ttl"].replace("Agent Data Pod Vocabulary", "Agent Data Pod Vocabylary") },
      listing: baseListing,
      expect: /rolling-release drift/,
    },
  ];

  for (const arm of arms) {
    const caught = checkVersioned(owner, PUBLISHED_VERSIONS, arm.files, arm.listing);
    if (!caught.some((f) => arm.expect.test(f))) {
      console.error(`self-test FAILED: arm "${arm.name}" was not caught (got ${caught.length} unrelated failures)`);
      process.exit(1);
    }
    console.log(`version self-test: arm "${arm.name}" caught: ${caught.find((f) => arm.expect.test(f))}`);
  }
}

const failures = check(owner, files);
const { vFiles, listing } = readVersioned();
failures.push(...checkVersioned(owner, PUBLISHED_VERSIONS, vFiles, listing));

if (failures.length) {
  console.error(`version drift (${failures.length}):\n  ` + failures.join("\n  "));
  process.exit(1);
}
const versionCount = Object.keys(PUBLISHED_VERSIONS).length;
console.log(
  `version ${owner}: ${SITES.length} restated sites agree with package.json; ${versionCount} immutable version resource(s) pinned under ${VERSION_DIR}/`,
);
