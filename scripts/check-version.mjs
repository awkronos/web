#!/usr/bin/env node
// Single owner of the specification version: package.json `version`.
//
// The site has no build step, so the published pages restate the version in
// a few places a reader must see (spec/vocab headers, the ontology's
// versionInfo/versionIRI, the paper's self-citation, the changelog's newest
// row, the two vocab.html "immutable version copy" download links, the
// README front door — status line, BibTeX `version`, and the two document-map
// cells naming the versionIRI and the pinned copy — and CITATION.cff's
// `version` field and title). Each of those is pinned here to package.json;
// any other copy (file banners, comments) was deleted rather than kept in
// sync. Deliberately NOT pinned: CITATION.cff `date-released`/`commit` (they
// track the release's date and SHA, not the owner string, and are updated by
// the minting change itself), and the changelog's "0.1.0 → 0.2.0" span rows
// (informative history, not a claim about the current version).
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
// That pair is the WHOLE vocabulary of the `vocab/` tree, not merely the pair
// the manifest happens to read: the tree is checked exhaustively, because
// GitHub Pages serves every name under it (deploy.yml uploads `path: "."`)
// and only names listed in PUBLISHED_VERSIONS have pinned bytes. A third name
// for a pinned version, or any name that matches no version at all, therefore
// serves vocabulary bytes no check can ever account for. Measured 2026-11-24
// (WEB-RSI-cdfd83): `vocab/draft.ttl`, `vocab/0.2.0.ttl.orig` and
// `vocab/0.2.1.TTL` each passed this gate at rc 0 before that was fixed.
//
// Known-positive: `node scripts/check-version.mjs --self-test` mutates the
// owner in memory and proves every site would be reported, and proves each
// versioned-copy failure mode (wrong version, wrong content, candidate
// bytes, rolling-release drift, advertised release without bytes) would be
// reported too. The two arms that need an *unpublished* version choose it at
// run time from the pinned manifest, so they cannot rot into no-ops the day a
// future release is minted; the self-test proves that choice reads the
// fixture.
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => readFileSync(path.join(ROOT, rel), "utf8");

const BASE_IRI = "https://awkronos.github.io/web/vocab";
const VERSION_DIR = "vocab";
// The extension is matched case-insensitively so a copy minted as
// `vocab/0.2.1.TTL` is still classified as a version resource: the two
// pinned forms below are lower-case, so the case variant is a refusal, and
// it deserves the version-aware message rather than a generic one.
const VERSION_RESOURCE_RE = /^(\d+\.\d+\.\d+)(\.ttl)?$/i;

// The only names the `vocab/` tree may publish. A version resource has two
// pinned forms — the extensionless content-negotiated IRI and the explicit
// Turtle download — and nothing else.
const VERSION_RESOURCE_SUFFIXES = ["", ".ttl"];

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
  // Pinned by WEB-RSI-516138-RETRY: until this change a bump that moved the
  // eight sites above left these reader-visible restatements naming the
  // previous release — two of them labelled "owl:versionIRI target" on the
  // very page whose IRI text the gate already pins.
  ["vocab.html", "immutable-copy .ttl link", /<a href="vocab\/(\d+\.\d+\.\d+)\.ttl" download>/],
  ["vocab.html", "immutable-copy link", /<a href="vocab\/(\d+\.\d+\.\d+)">vocab\//],
  ["README.md", "front-door status line", /Status: \*\*draft\*\*, version \*\*(\d+\.\d+\.\d+)\*\*/],
  ["README.md", "BibTeX version field", /version\s*=\s*\{(\d+\.\d+\.\d+)\},/],
  ["README.md", "doc-map versionIRI cell", /`owl:versionIRI` `…\/vocab\/(\d+\.\d+\.\d+)#`/],
  ["README.md", "doc-map immutable-copy cell", /\[`vocab\/(\d+\.\d+\.\d+)`\]\(vocab\/\1\)/],
  ["CITATION.cff", "cff version field", /^version:\s*(\d+\.\d+\.\d+)/m],
  ["CITATION.cff", "cff title version", /\(draft, v(\d+\.\d+\.\d+)\)/],
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

const reEscape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Pure: pick a `major.minor.patch` string guaranteed NOT to be a key of
// `published`, walking patch numbers up from `base`. Used only by --self-test:
// the "advertised release without bytes" arm needs a version nobody has minted
// bytes for, and that must be discovered from the fixture at run time. A
// hard-coded probe would silently become a published version the day that
// release lands, turning the arm into a test of nothing.
function absentVersion(published, base) {
  const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(base);
  const [major, minor, firstPatch] = m ? [Number(m[1]), Number(m[2]), Number(m[3]) + 1] : [0, 0, 1];
  for (let patch = firstPatch; patch < firstPatch + 1000; patch += 1) {
    const candidate = `${major}.${minor}.${patch}`;
    if (!(candidate in published)) return candidate;
  }
  throw new Error(`absentVersion: every patch number in ${firstPatch}..${firstPatch + 999} is published — the probe needs a wider window`);
}

// Pure: given the owner version, the pinned-bytes manifest, the file
// contents (keyed by repo-relative path, only the paths mentioned below
// need be present) and the `vocab/` directory listing, report every way a
// version resource could be wrong. Kept side-effect free so --self-test can
// drive each arm with synthetic inputs, exactly like `check()` above.
function checkVersioned(owner, published, files, dirListing) {
  const failures = [];

  // The `vocab/` tree is exhaustive: every name in it is dereferenceable on
  // the published site (deploy.yml uploads `path: "."`), so a name is legal
  // only if it is one of the pinned forms of a pinned version. This is not a
  // tightening of a hypothetical — measured 2026-11-24 (WEB-RSI-cdfd83) that
  // `vocab/draft.ttl`, `vocab/0.2.0.ttl.orig` and `vocab/0.2.1.TTL` each
  // passed the gate at rc 0, because only names matching VERSION_RESOURCE_RE
  // were ever classified and a non-matching name was skipped with `continue`.
  // An unpinned vocabulary copy hiding behind a name typo was therefore
  // published silently, which is the exact failure this manifest exists to
  // prevent. Three refusals, so the cure stays obvious:
  //   candidate bytes  — version-shaped, that version was never pinned;
  //   unpinned alias   — version-shaped, that version IS pinned, but this is
  //                      not one of its two pinned paths (a second name for
  //                      the same bytes is a second permanent IRI nobody
  //                      pinned, and it survives a later byte change);
  //   unpinned name    — not version-shaped at all, so nothing in the
  //                      manifest can ever account for its bytes.
  const pinnedNames = new Set();
  for (const version of Object.keys(published)) {
    for (const suffix of VERSION_RESOURCE_SUFFIXES) pinnedNames.add(`${version}${suffix}`);
  }
  for (const name of dirListing) {
    if (pinnedNames.has(name)) continue;
    const m = name.match(VERSION_RESOURCE_RE);
    const version = m ? m[1] : null;
    if (version !== null && !(version in published)) {
      failures.push(
        `${VERSION_DIR}/${name}: candidate bytes — version ${version} matches the version-resource pattern but has no PUBLISHED_VERSIONS entry; an unreleased copy must never be published under a version IRI`,
      );
    } else if (version !== null) {
      failures.push(
        `${VERSION_DIR}/${name}: unpinned alias — version ${version} is published, but only ${VERSION_DIR}/${version} and ${VERSION_DIR}/${version}.ttl are pinned to its bytes; this second name serves the same bytes from a path no manifest entry covers, so it silently escapes every immutability check`,
      );
    } else {
      failures.push(
        `${VERSION_DIR}/${name}: unpinned name — the ${VERSION_DIR}/ tree publishes only pinned version resources (one of ${Object.keys(published).map((v) => `${VERSION_DIR}/${v} or ${VERSION_DIR}/${v}.ttl`).join(", ") || "(none yet)"}); this name matches no version pattern, so no PUBLISHED_VERSIONS entry can ever account for the bytes GitHub Pages serves at it — delete it from ${VERSION_DIR}/ or mint it as a real version`,
      );
    }
  }

  for (const [version, pinnedSha] of Object.entries(published)) {
    // The SAME suffix list decides which names may exist above and whose
    // bytes are pinned here, so a legal name can never be an unchecked one.
    for (const suffix of VERSION_RESOURCE_SUFFIXES) {
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
      const iriMatch = text.match(new RegExp(`owl:versionIRI <${reEscape(BASE_IRI)}/(\\d+\\.\\d+\\.\\d+)#>`));
      if (!infoMatch) failures.push(`${rel}: owl:versionInfo not found (pattern drifted)`);
      else if (infoMatch[1] !== version) failures.push(`${rel}: wrong version — owl:versionInfo says ${infoMatch[1]}, path says ${version}`);
      if (!iriMatch) failures.push(`${rel}: owl:versionIRI not found (pattern drifted)`);
      else if (iriMatch[1] !== version) failures.push(`${rel}: wrong version — owl:versionIRI says ${iriMatch[1]}, path says ${version}`);
    }
  }

  // The current release must itself be an immutable resource — this is
  // membership, not a past-release audit. A version bump that moves
  // package.json and vocab.ttl's advertised versionIRI without minting the
  // pinned bytes re-creates the original defect under a new number: the
  // advertised IRI resolves to nothing again. Owner membership is enforced,
  // never assumed; once the owner IS pinned, its live bytes are checked
  // against the pin (rolling-release drift), so vocab.ttl cannot move under
  // its own version either.
  if (!(owner in published)) {
    failures.push(
      `vocab.ttl: advertised version ${owner} has no PUBLISHED_VERSIONS entry — a release must mint its immutable copy (vocab/${owner} + vocab/${owner}.ttl) in the same change that bumps the version, or the advertised owl:versionIRI resolves to nothing`,
    );
  } else if (files["vocab.ttl"] !== undefined && sha256(files["vocab.ttl"]) !== published[owner]) {
    failures.push(
      `vocab.ttl: rolling-release drift — the live entrypoint's bytes differ from the pinned copy for its own version ${owner}; bump package.json's version (and add a new PUBLISHED_VERSIONS entry) or restore the bytes, never edit the published copy in place`,
    );
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

  // The probe version both "unpublished" arms need, chosen from the live
  // fixture rather than hard-coded — see absentVersion().
  const probe = absentVersion(PUBLISHED_VERSIONS, owner);
  console.log(`version self-test: probe version ${probe} is absent from the ${Object.keys(PUBLISHED_VERSIONS).length} pinned release(s)`);

  // A pinned version, read from the manifest rather than hard-coded, for the
  // arm that needs a name that IS version-shaped and IS published but is not
  // one of the two pinned paths.
  const [pinned] = Object.keys(PUBLISHED_VERSIONS);
  // The names the four tree-exhaustiveness arms inject. Each must be absent
  // from the live listing, or the arm would fire on the base tree too and
  // prove nothing about its own mutation.
  const syntheticNames = ["draft.ttl", `${pinned}.ttl.orig`, `${pinned}.TTL`, `${probe}.TTL`];
  for (const name of syntheticNames) {
    if (baseListing.includes(name)) {
      console.error(`self-test FAILED: ${VERSION_DIR}/${name} is already published, so the arm that injects it cannot attribute its own failure`);
      process.exit(1);
    }
  }
  console.log(`version self-test: tree-exhaustiveness probes ${syntheticNames.join(", ")} are all absent from the live ${VERSION_DIR}/ listing`);

  // The chooser must actually read the manifest it is handed. Proof: pin the
  // probe into a synthetic copy of the fixture and require a different probe
  // back. A constant-returning chooser passes every arm above and fails here.
  const dense = { ...PUBLISHED_VERSIONS, [probe]: "0".repeat(64) };
  const probeWhenPinned = absentVersion(dense, owner);
  if (probeWhenPinned === probe) {
    console.error(`self-test FAILED: absentVersion() returned ${probe} for a fixture that already pins ${probe} — the probe is not read from PUBLISHED_VERSIONS`);
    process.exit(1);
  }
  if (probe in PUBLISHED_VERSIONS || probeWhenPinned in dense) {
    console.error("self-test FAILED: absentVersion() returned a version present in its own fixture");
    process.exit(1);
  }
  for (const version of Object.keys(PUBLISHED_VERSIONS)) {
    if (probe === version) {
      console.error(`self-test FAILED: probe ${probe} collides with pinned release ${version}`);
      process.exit(1);
    }
  }
  console.log(`version self-test: probe chooser reads the fixture (${probe} -> ${probeWhenPinned} once ${probe} is pinned)`);

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
      listing: [...baseListing, `${probe}.ttl`],
      expect: /candidate bytes/,
    },
    {
      // The four arms below are the WEB-RSI-cdfd83 fix. Each one injects a
      // name the old loop skipped with `continue`, so against the pre-fix
      // classification every one of them returns zero failures and the
      // self-test exits 1 — the arms are the measurement, not a description
      // of it (proved by restoring the old loop and rerunning).
      name: "candidate bytes, non-canonical extension",
      files: baseVFiles,
      listing: [...baseListing, `${probe}.TTL`],
      expect: new RegExp(`${reEscape(VERSION_DIR)}/${reEscape(probe)}\\.TTL: candidate bytes`),
    },
    {
      name: "unpinned alias",
      files: baseVFiles,
      listing: [...baseListing, `${pinned}.TTL`],
      expect: new RegExp(`${reEscape(VERSION_DIR)}/${reEscape(pinned)}\\.TTL: unpinned alias`),
    },
    {
      name: "unpinned name",
      files: baseVFiles,
      listing: [...baseListing, "draft.ttl"],
      expect: new RegExp(`${reEscape(VERSION_DIR)}/draft\\.ttl: unpinned name`),
    },
    {
      name: "editor backup in the version tree",
      files: baseVFiles,
      listing: [...baseListing, `${pinned}.ttl.orig`],
      expect: new RegExp(`${reEscape(VERSION_DIR)}/${reEscape(pinned)}\\.ttl\\.orig: unpinned name`),
    },
    {
      name: "rolling-release drift",
      files: { ...baseVFiles, "vocab.ttl": baseVFiles["vocab.ttl"].replace("Agent Data Pod Vocabulary", "Agent Data Pod Vocabylary") },
      listing: baseListing,
      expect: /rolling-release drift/,
    },
    {
      // The review-found gap: owner moves to a version nobody minted bytes
      // for (and nobody added to PUBLISHED_VERSIONS). Every site pattern would
      // agree at that version in a real bump; only this arm can refuse it. The
      // version comes from absentVersion() so the arm keeps testing something
      // after future releases land — see the chooser proof above.
      name: "advertised release without bytes",
      ownerOverride: probe,
      files: baseVFiles,
      listing: baseListing,
      expect: new RegExp(`advertised version ${reEscape(probe)} has no PUBLISHED_VERSIONS entry`),
    },
  ];

  for (const arm of arms) {
    const caught = checkVersioned(arm.ownerOverride ?? owner, PUBLISHED_VERSIONS, arm.files, arm.listing);
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
