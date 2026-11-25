#!/usr/bin/env node
// Vocabulary-consistency checker: binds `vocab.html` to `vocab.ttl`.
//
// `vocab.html` is hand-written documentation. Its tables restate, in a second
// notation, the `rdfs:subClassOf` / `rdfs:domain` / `rdfs:range` triples that
// `vocab.ttl` asserts, and its term names are restated again in `spec.html`,
// `interop.html`, `migration.html`, `paper.html`, `changelog.html` and the
// README. Nothing in CI extracted those symbols, so the notations agreed only
// for as long as nobody edited one of them: a term added to the Turtle stayed
// invisible on the page, a cell edited on the page stayed invisible in the
// Turtle, and a property named in `spec.html` that no release of the vocabulary
// defines was invisible everywhere. `check-links.mjs` proves a target file
// exists and `check-version.mjs` proves the version strings agree — neither
// reads a term. This is the extraction step the site was missing: parse the
// Turtle, parse the page's tables, exit 1 naming every way they disagree.
//
// Known-positive: `node scripts/check-vocab.mjs --self-test` runs every
// comparison against the live pair once (it must be clean, or an arm cannot
// attribute its own defect) and then once per planted defect, each of which must
// be named by the failure it provokes. A check whose failure path cannot fire
// would pass this repo by accident; the arms are what stop that. The self-test
// then falls through to the live check, like `check-version.mjs`.
//
// The namespace registry below is deliberately independent of `vocab.ttl`: a
// prefix typed with a mistyped IRI is exactly the drift this file cannot
// self-report. Its literals were compared byte-wise against the declarations in
// the published Turtle (see `--self-test` arm "a mistyped namespace IRI").
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => readFileSync(path.join(ROOT, rel), "utf8");

// The namespace IRI each prefix must resolve to, per its publisher. Written out
// rather than fetched: the site is static, offline in CI, and a reader pastes
// `@prefix agent:` straight out of `vocab.html` — one wrong character makes
// every triple in a pasted document resolve to nothing.
export const CANONICAL_PREFIXES = {
  rdf: "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
  rdfs: "http://www.w3.org/2000/01/rdf-schema#",
  xsd: "http://www.w3.org/2001/XMLSchema#",
  foaf: "http://xmlns.com/foaf/0.1/",
  prov: "http://www.w3.org/ns/prov#",
  dct: "http://purl.org/dc/terms/",
  owl: "http://www.w3.org/2002/07/owl#",
  agent: "https://awkronos.github.io/web/vocab#",
};

const CLASS_TYPES = new Set(["rdfs:Class", "owl:Class"]);
const PROPERTY_TYPES = new Set([
  "rdf:Property",
  "owl:DatatypeProperty",
  "owl:ObjectProperty",
  "owl:AnnotationProperty",
  "owl:FunctionalProperty",
]);

// ---------------------------------------------------------------- Turtle side

// A minimal Turtle reader — enough of the shape `vocab.ttl` is written in
// (blocks separated by blank lines, one subject per subject line, predicate–
// object lists ending in `;` with the last one in `.`), with no parser
// dependency, like the rest of scripts/. Returns {prefixes, terms}: `terms` is
// keyed by the compact name the page shows, e.g. `agent:AIAgent`.
export function parseTtl(text) {
  const prefixes = {};
  for (const m of text.matchAll(/^@prefix\s+([A-Za-z0-9_]+):\s*<([^>]*)>\s*\.\s*$/gm)) {
    prefixes[m[1]] = m[2];
  }

  const terms = {};
  for (const block of text.split(/\r?\n\s*\r?\n/)) {
    const lines = block
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l !== "" && !l.startsWith("#"));
    if (lines.length === 0) continue;
    const head = /^([A-Za-z0-9_]+):([A-Za-z0-9_-]+)\s*$/.exec(lines[0]);
    if (!head) continue; // the ontology IRI block documents no term
    const compact = `${head[1]}:${head[2]}`;
    const chunk = lines.slice(1).join(" ");

    const typesMatch = /(?:^|[\s;])a\s+([^;.]+)[;.]/.exec(chunk);
    const types = typesMatch
      ? typesMatch[1].split(",").map((t) => t.trim()).filter((t) => t !== "")
      : [];
    const objects = (predicate) =>
      [...chunk.matchAll(new RegExp(`(?:^|[\\s;])rdfs:${predicate}\\s+(\\S+?)(?=[\\s;,.])`, "g"))]
        .map((m) => m[1]);

    const term = {
      compact,
      local: head[2],
      types,
      subClassOf: objects("subClassOf"),
      domain: objects("domain"),
      range: objects("range"),
      comment: (chunk.match(/(?:^|[\s;])rdfs:comment\s+"([^"]*)"/) ?? [])[1] ?? null,
    };
    if (terms[compact]) term.duplicateInTtl = true;
    terms[compact] = term;
  }
  return { prefixes, terms };
}

// ------------------------------------------------------------------ HTML side

const stripTags = (s) => (s ?? "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
const NONE = "—"; // the em dash the tables use for "no such triple"

// What a cell says: the compact `prefix:LocalName` terms inside it, or empty
// when the cell is the em dash. Free text with no term is reported as such, so
// a row that lost its `<code>` markup still fails instead of silently vanishing.
function cellRef(cell) {
  const text = stripTags(cell);
  if (text === "" || text === NONE) return { empty: true, refs: [], text };
  const refs = [...text.matchAll(/(^|[\s(,])((?:[A-Za-z0-9_]+):[A-Za-z0-9_-]+)\b/g)].map(
    (m) => m[2],
  );
  return { empty: false, refs, text };
}

// Read each table's header row into column indices by column name, so the
// comparison follows the table's declared contract rather than a cell position
// that a reordered column would silently break.
export function parseTables(html) {
  const tables = [];
  for (const m of html.matchAll(/<table[^>]*>([\s\S]*?)<\/table>/g)) {
    const body = m[1];
    const caption = stripTags((body.match(/<caption[^>]*>([\s\S]*?)<\/caption>/) ?? [])[1] ?? "");
    const thead = (body.match(/<thead[^>]*>([\s\S]*?)<\/thead>/) ?? [])[1];
    const cols = thead
      ? [...thead.matchAll(/<th[^>]*>([\s\S]*?)<\/th>/g)].map((c) => stripTags(c[1]))
      : [];
    const col = (name) => cols.findIndex((c) => c.toLowerCase() === name);
    const rows = [];
    const tbody = (body.match(/<tbody[^>]*>([\s\S]*?)<\/tbody>/) ?? [])[1];
    if (tbody) {
      for (const r of tbody.matchAll(/<tr([^>]*)>([\s\S]*?)<\/tr>/g)) {
        rows.push({
          cells: [...r[2].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((c) => c[1]),
          anchor: (/id\s*=\s*"([^"]*)"/.exec(r[1]) ?? [])[1] ?? null,
        });
      }
    }
    tables.push({
      caption,
      cols,
      rows,
      term: col("class") >= 0 ? col("class") : col("property"),
      subClassOf: col("subclass of"),
      domain: col("domain"),
      range: col("range"),
      description: col("description"),
    });
  }
  return tables;
}

// Every `agent:` term a document mentions, so a page that names a symbol no
// release defines fails here rather than in a reader's parser.
export function mentions(text) {
  return [...text.matchAll(/(^|[\s(`])agent:([A-Za-z0-9_-]+)\b/gm)].map((m) => `agent:${m[2]}`);
}

// ------------------------------------------------------------------- checking

const sameSet = (a, b) =>
  a.length === b.length && [...a].sort().join("|") === [...b].sort().join("|");

function termKind(term) {
  const isClass = term.types.some((t) => CLASS_TYPES.has(t));
  const isProp = term.types.some((t) => PROPERTY_TYPES.has(t));
  if (isClass && !isProp) return "class";
  if (isProp && !isClass) return "property";
  return null;
}

// One cell vs one set of Turtle objects: an empty cell stands for "no such
// triple", and anything else must name exactly the same set of terms.
function compareCells(cell, objects, where, predicate, failures) {
  const shown = cell.empty ? [] : cell.refs;
  if (!sameSet(shown, objects)) {
    failures.push(
      `${where}: ${predicate} reads "${cell.empty ? NONE : shown.join(", ")}" but vocab.ttl asserts "${objects.join(", ")}"`,
    );
    return false;
  }
  return true;
}

// The whole comparison, side-effect free so --self-test can drive it with
// fixtures. `docs` is {rel: text} for the documents scanned for term mentions.
export function checkVocab(ttlText, pageText, docs = {}, opts = {}) {
  const canonical = opts.canonicalPrefixes ?? CANONICAL_PREFIXES;
  const failures = [];

  const { prefixes, terms } = parseTtl(ttlText);

  // (1) Namespace IRIs, against the registry rather than against the file.
  for (const [p, iri] of Object.entries(prefixes)) {
    const want = canonical[p];
    if (want === undefined) {
      failures.push(`vocab.ttl: prefix "${p}" declares <${iri}> and no canonical IRI is known for it`);
    } else if (iri !== want) {
      failures.push(`vocab.ttl: prefix "${p}" declares <${iri}> not the canonical <${want}>`);
    }
  }

  // (2) Every declared term is typed and documented, and every term it names
  //     resolves through a prefix the file itself declares — a `rdf:Property`
  //     typed without `@prefix rdf:` reads as nothing to every parser.
  for (const term of Object.values(terms)) {
    if (term.duplicateInTtl) {
      failures.push(`vocab.ttl: ${term.compact} is described twice, so its triples are split across blocks`);
    }
    for (const ref of [...term.types, ...term.subClassOf, ...term.domain, ...term.range]) {
      const p = ref.split(":")[0];
      if (!(p in prefixes)) {
        failures.push(`vocab.ttl: ${term.compact} asserts ${ref}, whose prefix "${p}" the file does not declare`);
      }
    }
    const kind = termKind(term);
    if (kind === null) {
      failures.push(`vocab.ttl: ${term.compact} declares no rdfs:Class/owl:Class or rdf:Property/owl:*Property type, so the page cannot classify its row`);
    } else if (kind === "property" && term.domain.length + term.range.length === 0) {
      failures.push(`vocab.ttl: ${term.compact} is a property with neither rdfs:domain nor rdfs:range`);
    }
    if (!term.comment) {
      failures.push(`vocab.ttl: ${term.compact} declares no rdfs:comment, so the page's description has no source`);
    }
  }

  // (3) The page's tables vs the Turtle, cell by cell.
  const documented = new Map(); // compact -> {caption, isClassTable}
  for (const table of parseTables(pageText)) {
    if (table.term < 0) continue; // not a term table: no Class/Property column
    const isClassTable = table.subClassOf >= 0 && table.domain < 0;
    for (const row of table.rows) {
      const termCell = cellRef(row.cells[table.term]);
      if (termCell.refs.length !== 1 || !termCell.refs[0].startsWith("agent:")) {
        failures.push(`vocab.html table "${table.caption}": a row must name exactly one agent: term, got "${termCell.text}"`);
        continue;
      }
      const compact = termCell.refs[0];
      const where = `vocab.html ${compact}`;
      if (documented.has(compact)) {
        failures.push(`${where} is documented twice ("${documented.get(compact).caption}" and "${table.caption}")`);
      }
      documented.set(compact, { caption: table.caption, isClassTable });

      const term = terms[compact];
      if (!term) {
        failures.push(`${where} is documented in "${table.caption}" but vocab.ttl declares no such term`);
        continue;
      }
      const listedKind = isClassTable ? "class" : "property";
      const ttlKind = termKind(term);
      if (ttlKind !== null && ttlKind !== listedKind) {
        failures.push(`${where} is listed as a ${listedKind} in "${table.caption}" but vocab.ttl types it ${ttlKind}`);
      }

      const columns = isClassTable
        ? [["subClassOf", table.subClassOf, "rdfs:subClassOf"]]
        : [["domain", table.domain, "rdfs:domain"], ["range", table.range, "rdfs:range"]];
      for (const [field, index, predicate] of columns) {
        const cell = cellRef(row.cells[index]);
        for (const ref of cell.refs) {
          const p = ref.split(":")[0];
          if (p !== "agent" && !(p in prefixes)) {
            failures.push(`${where} ${predicate} cell: ${ref} uses prefix "${p}" that vocab.ttl does not declare`);
          }
        }
        compareCells(cell, term[field === "subClassOf" ? "subClassOf" : field], where, predicate, failures);
      }

      const desc = stripTags(row.cells[table.description]);
      if (desc === "" || desc === NONE) {
        failures.push(`${where}: description cell is empty while vocab.ttl carries "${(term.comment ?? "").slice(0, 40)}"`);
      }
    }
  }

  // (4) Every typed Turtle term appears in a table.
  for (const term of Object.values(terms)) {
    if (termKind(term) === null) continue;
    if (!documented.has(term.compact)) {
      failures.push(`vocab.ttl ${term.compact} is declared but no vocab.html table row documents it`);
    }
  }

  // (5) Term mentions in the rest of the site resolve to declared terms.
  for (const [rel, text] of Object.entries(docs)) {
    for (const m of new Set(mentions(text))) {
      if (!(m in terms)) failures.push(`${rel}: mentions ${m}, which vocab.ttl does not declare`);
    }
  }

  return { failures, terms: Object.keys(terms).length, documented: documented.size, tables: parseTables(pageText).length };
}

// -------------------------------------------------------------------- fixtures

// A pair small enough to read at once, carrying one class, one property with a
// domain and range, one property with no domain (the em-dash case) and one
// mention in a third document. The arms mutate this pair, so every comparison
// above is exercised against known-good bytes rather than against the live
// files' 25 terms — and against the live files in the fall-through below.
const FIXTURE_TTL = [
  `@prefix agent: <https://awkronos.github.io/web/vocab#> .`,
  `@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .`,
  `@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .`,
  `@prefix owl: <http://www.w3.org/2002/07/owl#> .`,
  `@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .`,
  `@prefix foaf: <http://xmlns.com/foaf/0.1/> .`,
  ``,
  `agent:Thing`,
  `    a rdfs:Class, owl:Class ;`,
  `    rdfs:subClassOf foaf:Agent ;`,
  `    rdfs:comment "A class."@en .`,
  ``,
  `agent:size`,
  `    a rdf:Property, owl:DatatypeProperty ;`,
  `    rdfs:domain agent:Thing ;`,
  `    rdfs:range xsd:decimal ;`,
  `    rdfs:comment "How big."@en .`,
  ``,
  `agent:hash`,
  `    a rdf:Property, owl:DatatypeProperty ;`,
  `    rdfs:range xsd:string ;`,
  `    rdfs:comment "Integrity hash."@en .`,
].join("\n");

const FIXTURE_PAGE = [
  `<table><caption>Classes</caption><thead><tr>`,
  `<th scope="col">Class</th><th scope="col">Subclass Of</th><th scope="col">Description</th>`,
  `</tr></thead><tbody>`,
  `<tr id="Thing"><td><code>agent:Thing</code></td><td><code>foaf:Agent</code></td><td>A class</td></tr>`,
  `</tbody></table>`,
  `<table><caption>Properties</caption><thead><tr>`,
  `<th scope="col">Property</th><th scope="col">Domain</th><th scope="col">Range</th><th scope="col">Description</th>`,
  `</tr></thead><tbody>`,
  `<tr><td><code>agent:size</code></td><td><code>agent:Thing</code></td><td><code>xsd:decimal</code></td><td>How big</td></tr>`,
  `<tr><td><code>agent:hash</code></td><td>—</td><td><code>xsd:string</code></td><td>Integrity hash</td></tr>`,
  `</tbody></table>`,
].join("\n");

const FIXTURE_DOCS = { "spec.html": "the `agent:size` property" };

const ARMS = [
  {
    name: "term declared in the Turtle but missing from the page",
    mutate: (f) => f.ttl = f.ttl.replace("agent:hash\n", "agent:unlisted\n"),
    expect: /vocab\.ttl agent:unlisted is declared but no vocab\.html table row documents it/,
  },
  {
    name: "term documented on the page but absent from the Turtle",
    mutate: (f) => f.page = f.page.replace("<code>agent:hash</code>", "<code>agent:phantom</code>"),
    expect: /agent:phantom is documented in "Properties" but vocab\.ttl declares no such term/,
  },
  {
    name: "a class listed in the property table",
    mutate: (f) => f.page = f.page.replace("<code>agent:size</code>", "<code>agent:Thing</code>"),
    expect: /agent:Thing is listed as a property in "Properties" but vocab\.ttl types it class/,
  },
  {
    name: "a subclass cell that disagrees with rdfs:subClassOf",
    mutate: (f) => f.page = f.page.replace("<code>foaf:Agent</code>", "<code>xsd:decimal</code>"),
    expect: /agent:Thing: rdfs:subClassOf reads "xsd:decimal" but vocab\.ttl asserts "foaf:Agent"/,
  },
  {
    name: "a range cell that disagrees with rdfs:range",
    mutate: (f) => f.page = f.page.replace("<code>xsd:decimal</code>", "<code>xsd:integer</code>"),
    expect: /agent:size: rdfs:range reads "xsd:integer" but vocab\.ttl asserts "xsd:decimal"/,
  },
  {
    name: "a domain cell emptied while the Turtle declares a domain",
    mutate: (f) => f.page = f.page.replace("<code>agent:size</code></td><td><code>agent:Thing</code>", "<code>agent:size</code></td><td>—"),
    expect: /agent:size: rdfs:domain reads "—" but vocab\.ttl asserts "agent:Thing"/,
  },
  {
    name: "a domain cell filled where the Turtle declares none",
    mutate: (f) => f.page = f.page.replace("<code>agent:hash</code></td><td>—", "<code>agent:hash</code></td><td><code>agent:Thing</code>"),
    expect: /agent:hash: rdfs:domain reads "agent:Thing" but vocab\.ttl asserts ""/,
  },
  {
    name: "the same term documented in two tables",
    mutate: (f) => f.page = f.page.replace("<tbody>", '<tbody><tr><td><code>agent:size</code></td><td><code>agent:Thing</code></td><td><code>xsd:decimal</code></td><td>again</td></tr>'),
    expect: /agent:size is documented twice/,
  },
  {
    name: "an emptied description cell",
    mutate: (f) => f.page = f.page.replace("<td>How big</td>", "<td></td>"),
    expect: /agent:size: description cell is empty/,
  },
  {
    name: "a prefix used by a cell that the Turtle never declares",
    mutate: (f) => f.page = f.page.replace("<code>xsd:string</code>", "<code>schema:string</code>"),
    expect: /agent:hash rdfs:range cell: schema:string uses prefix "schema" that vocab\.ttl does not declare/,
  },
  {
    name: "a page mentioning a term no release defines",
    mutate: (f) => f.docs = { "spec.html": "the `agent:neverDefined` property" },
    expect: /spec\.html: mentions agent:neverDefined, which vocab\.ttl does not declare/,
  },
  {
    name: "a term declaring no rdfs:comment",
    mutate: (f) => f.ttl = f.ttl.replace('rdfs:comment "How big."', 'rdfs:label "Size"'),
    expect: /agent:size declares no rdfs:comment/,
  },
  {
    name: "a property declaring neither domain nor range",
    mutate: (f) => f.ttl = f.ttl.replace("    rdfs:range xsd:string ;\n", ""),
    expect: /agent:hash is a property with neither rdfs:domain nor rdfs:range/,
  },
  {
    name: "a term described in two Turtle blocks",
    mutate: (f) => {
      const start = f.ttl.indexOf("agent:size");
      const end = f.ttl.indexOf("\n\n", start);
      const block = f.ttl.slice(start, end);
      f.ttl = `${f.ttl.slice(0, end)}\n\n${block}${f.ttl.slice(end)}`;
    },
    expect: /agent:size is described twice, so its triples are split across blocks/,
  },
  {
    name: "an assertion whose prefix the Turtle never declares",
    mutate: (f) => f.ttl = f.ttl.replace("owl:DatatypeProperty", "owlx:DatatypeProperty"),
    expect: /agent:size asserts owlx:DatatypeProperty, whose prefix "owlx" the file does not declare/,
  },
  {
    name: "a mistyped namespace IRI",
    mutate: (f) => f.ttl = f.ttl.replace("http://www.w3.org/2001/XMLSchema#", "http://www.w3.org/2001/Schema#"),
    expect: /prefix "xsd" declares <http:\/\/www\.w3\.org\/2001\/Schema#> not the canonical/,
  },
];

// ----------------------------------------------------------------------- main

function fixture() {
  return { ttl: FIXTURE_TTL, page: FIXTURE_PAGE, docs: { ...FIXTURE_DOCS } };
}

function selfTest() {
  const base = fixture();
  const clean = checkVocab(base.ttl, base.page, base.docs);
  if (clean.failures.length !== 0) {
    console.error(`self-test FAILED: the clean fixture pair is not clean (${clean.failures.length}): ${clean.failures.join(" | ")}`);
    return 1;
  }
  if (clean.documented !== clean.terms) {
    console.error(`self-test FAILED: the fixture documents ${clean.documented} of ${clean.terms} terms`);
    return 1;
  }

  for (const arm of ARMS) {
    const f = fixture();
    arm.mutate(f);
    const failures = checkVocab(f.ttl, f.page, f.docs).failures;
    if (!failures.some((x) => arm.expect.test(x))) {
      console.error(`self-test FAILED: arm "${arm.name}" was not caught (got ${failures.length} unrelated: ${failures.slice(0, 2).join(" | ")})`);
      return 1;
    }
    console.log(`vocab self-test: arm "${arm.name}" caught: ${failures.find((x) => arm.expect.test(x))}`);
  }
  console.log(`vocab self-test: ${ARMS.length} arms, clean fixture documents ${clean.documented}/${clean.terms} terms`);

  // Fall through to the live pair, exactly as the non-flag run below does.
  return runLive();
}

function runLive() {
  const docs = {};
  for (const e of readdirSync(ROOT, { withFileTypes: true })) {
    if (e.isFile() && e.name.endsWith(".html") && e.name !== "vocab.html") docs[e.name] = read(e.name);
    if (e.isFile() && e.name.endsWith(".md")) docs[e.name] = read(e.name);
  }
  if (existsSync(path.join(ROOT, "docs"))) {
    for (const e of readdirSync(path.join(ROOT, "docs"), { withFileTypes: true })) {
      if (e.isFile() && e.name.endsWith(".md")) docs[`docs/${e.name}`] = read(`docs/${e.name}`);
    }
  }

  const { failures, terms, documented } = checkVocab(read("vocab.ttl"), read("vocab.html"), docs);
  if (failures.length) {
    console.error(`vocabulary drift (${failures.length}):\n  ` + failures.join("\n  "));
    return 1;
  }
  console.log(
    `vocab.html documents ${documented}/${terms} terms declared by vocab.ttl; ${Object.keys(docs).length} other documents mention declared terms only`,
  );
  return 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exit(process.argv.includes("--self-test") ? selfTest() : runLive());
}
