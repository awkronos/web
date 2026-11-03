# Citations — awkronos/web (Agent Data Pod Specification)

Structured, per-unit citations for this repository, following the Awkronos
citation carrier schema `{id, title, kind, authors, year, venue_or_status,
stable_link, cites, cited_by}`. If you use a *specific* unit, cite that entry;
if you use the repository as a whole, cite [`CITATION.cff`](../CITATION.cff).

**This file is the authoritative citation carrier for this repository.**
CFF 1.2.0 cannot express contributorship — measured against the CFF project's
own `schema.json` at ref `1.2.0`: root `required` is
`[authors, cff-version, message, title]`, there are 21 allowed root keys,
`additionalProperties: false`, and **there is no root `contributors` and no
root `year`**. A gate that only checks that `CITATION.cff` exists therefore
silently passes files that drop every contributor. The nine-field schema below
is the leg that carries kind, people, epistemic status and the citation graph.

## What this repository does and does not contain

Read this before the entries. It is the short version of the
[proven / computed / asserted table in the README](../README.md#proven-computed-asserted):

* **Theorems: 0.** There is no formal method, no proof assistant and no
  machine-checked artefact in this repository.
* **Algorithms: 0.** Nothing here is an algorithm in the citable sense; the
  closest is a key-derivation *requirement* (`[S2]`), which is a constraint on
  implementers, not a procedure this repository defines and evaluates.
* **Datasets: 0.** No corpus, no evaluation set, no measurements.
* **Artifacts: 7** — listed below. A specification profile, an RDF vocabulary,
  a conformance model, a taxonomy alignment, an interoperability matrix, a
  position paper and a migration guide.

So: **every citable unit in this repository is an `artifact`, and `asserted`
is the only epistemic class any of them can claim.** `kind` in the entries
below is therefore always `artifact`; `venue_or_status` always names a draft,
a submission, or an unverified claim. That is not modesty, it is what the
artefacts support: there is no conformance suite, no test file and no
implementation in-tree (`git ls-files` → 19 tracked files, 0 test files), so
nothing here has been computed either. An honest skeleton beats an invented
result set, and this file would be fabricating to include one.

Identifier policy: the stable identifier is a **dotted name scoped to this
project** (`agentdatapod.*`) plus a **commit-pinned permalink**. Ids survive
ref renames; a line number does not; a branch name does not. `vocab.ttl` is
the one unit that additionally has a specification-native stable identifier —
an `owl:versionIRI`
(<https://awkronos.github.io/web/vocab/0.2.0#>) — which is why its entry is
the most citable object in the repository.

`kind` is one of `theorem | algorithm | dataset | artifact`.
`venue_or_status` states the *epistemic* status, not a marketing status. The
vocabulary used here is `draft (unreviewed)`, `submitted (not adopted)`, and
`asserted (no in-repo evidence carrier)`.

Authorship convention: this repository's own metadata names one human
(Timothy Jacoby — `package.json` `author`, `vocab.ttl` `dct:creator`
`foaf:name`, site footer) beside agent/bot committers that carry no personal
name (16 of 18 commits). The citation law forbids a bare org as sole author
*where persons authored*, so every entry lists **Tim Jacoby + Awkronos**. The
history does not record a person-behind-each-unit mapping, and this lane will
not assert one.

Every value below is measured from `origin/main@88870343c6ec3f0d4d4e90b01fefab93c59274e3`
(2026-11-02 17:21:36 -0800) on host `Tims-MacBook-Pro-2`, 2026-11-03.

```yaml
carrier: citation.schema
repository: https://github.com/awkronos/web
homepage: https://awkronos.github.io/web/
schema_source: skills/_rules/scientific-citations.md
license: CC-BY-4.0   # measured: package.json, vocab.ttl dct:license, site footer
measured_at:
  ref: 88870343c6ec3f0d4d4e90b01fefab93c59274e3
  branch: refs/heads/main
  date: "2026-11-03"
citations:

  # ---------- the normative core ----------

  - id: agentdatapod.spec
    title: >-
      Agent Data Pod Specification, version 0.2.0 — a profile of the Solid
      Protocol for AI agent data storage
    kind: artifact
    authors: [Tim Jacoby, Awkronos]
    year: 2026
    venue_or_status: >-
      draft (unreviewed) — the document's own Status of This Document block
      states "This is a Draft Specification. It has not been reviewed or
      endorsed by any standards body." 0.2.0 dated 2026-02-03 by changelog.html
      (0.1.0 = 2026-02-01). No implementation and no conformance test exists in
      this repository, so satisfiability is unasserted.
    stable_link: >-
      https://github.com/awkronos/web/blob/88870343c6ec3f0d4d4e90b01fefab93c59274e3/spec.html
      -- served at https://awkronos.github.io/web/spec.html
    cites: [RFC2119, RFC9449, SOLID-PROTOCOL, WAC, PROV-O, RDFC-1.0, DID-WBA, A2A, MCP]
    cited_by:
      - agentdatapod.vocab
      - agentdatapod.conformance-model
      - agentdatapod.memory-sector-taxonomy
      - agentdatapod.interop-matrix
      - agentdatapod.migration-guide
      - agentdatapod.position-paper

  - id: agentdatapod.vocab
    title: >-
      Agent Data Pod Vocabulary, version 0.2.0 — an OWL/RDF vocabulary for
      agent memory, capabilities and audit provenance (25 terms: 6 classes,
      19 properties)
    kind: artifact
    authors: [Tim Jacoby, Awkronos]
    year: 2026
    venue_or_status: >-
      draft (unreviewed) — machine-readable normative artifact. Measured census
      of vocab.ttl at the pin: 25 declared `agent:*` subjects = 6 owl:Class
      (AIAgent, MemoryEpisode, Capability, CapabilitySet, AuditEntry,
      AgentDescriptionService) + 19 rdf:Property (17 DatatypeProperty,
      2 ObjectProperty); 3 superclass links (foaf:Agent, prov:Entity,
      prov:Activity); owl:imports on DC Terms and PROV-O; ontology metadata
      dct:created 2026-02-01, dct:modified 2026-02-03. Not validated by any
      reasoner or SHACL shape in this repository.
    stable_link: >-
      https://awkronos.github.io/web/vocab/0.2.0# (owl:versionIRI; namespace
      https://awkronos.github.io/web/vocab#) — source pinned at
      https://github.com/awkronos/web/blob/88870343c6ec3f0d4d4e90b01fefab93c59274e3/vocab.ttl
    cites: [FOAF, PROV-O, DCTERMS, MCP, ANP-AGENT-DESCRIPTION, OPENMEMORY-HMD-V2, agentdatapod.spec]
    cited_by:
      - agentdatapod.memory-sector-taxonomy
      - agentdatapod.interop-matrix
      - agentdatapod.migration-guide

  # ---------- sub-models of the specification ----------

  - id: agentdatapod.conformance-model
    title: >-
      Three-level conformance model (Minimal / Standard / Full) over 14
      identified requirement clauses
    kind: artifact
    authors: [Tim Jacoby, Awkronos]
    year: 2026
    venue_or_status: >-
      draft (unreviewed) — and currently INCOMPLETE as written: see the defect
      register. Measured: requirement identifiers actually defined in
      spec.html are [A1]-[A6] and [S1]-[S8] = 14 clauses, carrying 32 RFC 2119
      keyword instances (16 MUST, 1 MUST NOT, 7 SHOULD, 1 SHOULD NOT, 7 MAY; the
      negative forms are counted once each). The
      Standard level is specified as "Minimal + A6-A15" but [A7]-[A15] are not
      defined anywhere in the document (0 occurrences each), so no implementation
      can satisfy Standard as an enumerated obligation set.
    stable_link: >-
      https://github.com/awkronos/web/blob/88870343c6ec3f0d4d4e90b01fefab93c59274e3/spec.html
      (section 1.2 Conformance Levels; requirements in sections 2-5)
    cites: [RFC2119, agentdatapod.spec]
    cited_by: []

  - id: agentdatapod.memory-sector-taxonomy
    title: >-
      Five-sector memory taxonomy for agent:memoryType, aligned to OpenMemory
      HMD v2 (episodic, semantic, procedural, emotional, reflective)
    kind: artifact
    authors: [Tim Jacoby, Awkronos]
    year: 2026
    venue_or_status: >-
      draft (unreviewed) — an ALIGNMENT claim, not a derivation. The five value
      labels are stated in spec.html 3.3, vocab.ttl (agent:memoryType
      rdfs:comment) and interop.html; the target taxonomy is identified only
      by one hyperlink to a product repository (see OPENMEMORY-HMD-V2 in the
      register below), so the alignment cannot currently be checked against a
      versioned source.
    stable_link: >-
      https://github.com/awkronos/web/blob/88870343c6ec3f0d4d4e90b01fefab93c59274e3/spec.html
      (section 3.3) and
      https://github.com/awkronos/web/blob/88870343c6ec3f0d4d4e90b01fefab93c59274e3/vocab.ttl
      (`agent:memoryType`)
    cites: [OPENMEMORY-HMD-V2, agentdatapod.spec, agentdatapod.vocab]
    cited_by: []

  - id: agentdatapod.interop-matrix
    title: >-
      Protocol compatibility matrix — five protocols with support levels
      Solid Protocol (Native), ANP (Full), A2A (Compatible), MCP (Full),
      OpenMemory HMD v2 (Partial)
    kind: artifact
    authors: [Tim Jacoby, Awkronos]
    year: 2026
    venue_or_status: >-
      asserted (no in-repo evidence carrier) — this is the entry most likely to
      be mis-read as a measurement. The matrix states support levels with no
      hedging language anywhere in interop.html (a scan for
      `unverified|not verified|measured|tested|reference implementation|TBD|
      experimental` returns 0 matches), and the repository contains no
      conformance suite, no test fixtures and no dated results to back it.
      Cite it as design intent.
    stable_link: >-
      https://github.com/awkronos/web/blob/88870343c6ec3f0d4d4e90b01fefab93c59274e3/interop.html
      (section "Protocol Compatibility Matrix")
    cites: [SOLID-PROTOCOL, DID-WBA, ANP-AGENT-DESCRIPTION, A2A, MCP, RDFC-1.0, OPENMEMORY-HMD-V2, agentdatapod.spec, agentdatapod.vocab]
    cited_by: []

  # ---------- argument and guidance ----------

  - id: agentdatapod.position-paper
    title: >-
      Position Paper: A Data Sovereignty Layer for AI Agents — submitted to the
      W3C AI Agent Protocol Community Group
    kind: artifact
    authors: [Tim Jacoby, Awkronos]
    year: 2026
    venue_or_status: >-
      submitted (not adopted) — paper.html footer: "Submitted to W3C AI Agent
      Protocol Community Group, February 2026", provided under the W3C
      Community Contributor License Agreement. Its own Proposed Next Steps
      section still begins "Present this position paper at a CG meeting", so as
      of this pin it is submitted but not presented, reviewed or adopted.
      Section 5.1 contains a test claim with no in-repo carrier (defect D4).
    stable_link: >-
      https://github.com/awkronos/web/blob/88870343c6ec3f0d4d4e90b01fefab93c59274e3/paper.html
      -- served at https://awkronos.github.io/web/paper.html
    cites: [SOLID-PROTOCOL, DID-CORE, PROV-O, MCP, agentdatapod.spec]
    cited_by: []

  - id: agentdatapod.migration-guide
    title: >-
      Migration guide — two strategies (direct conversion, embedding-first) and
      conversion recipes for JSON chat history, SQLite/PostgreSQL, OpenAI
      Assistants API and LangChain memory
    kind: artifact
    authors: [Tim Jacoby, Awkronos]
    year: 2026
    venue_or_status: >-
      draft (unreviewed) — informative guidance. The four source formats and
      the embedding models named in it (text-embedding-3-small,
      text-embedding-3-large) are referenced by product name only, with no
      version, URL or citation, so the recipes are not pinned to a testable
      source behaviour.
    stable_link: >-
      https://github.com/awkronos/web/blob/88870343c6ec3f0d4d4e90b01fefab93c59274e3/migration.html
    cites: [agentdatapod.spec, agentdatapod.vocab]
    cited_by: []
```

## Prior work, by identifier

The ids used in `cites:` above. Eleven of the fourteen are the exact set this
repository names in its own References sections (spec.html §6 normative +
informative, paper.html §7, interop.html) plus RFC 9449, cited normatively in
prose. `authors` for prior work is given as the publishing body named by the
source or the repository's own label, never invented.

| Id | Work | Publisher / author as recorded | Stable link | Notes |
|-||-|-|-|-|
| `RFC2119` | Key words for use in RFCs to Indicate Requirement Levels | IETF, March 1997 | <https://www.rfc-editor.org/rfc/rfc2119> | **No DOI on its own page** (checked). Spec §1.1 |
| `RFC9449` | OAuth 2.0 Demonstrating Proof of Possession (DPoP) | IETF, September 2023 | <https://datatracker.ietf.org/doc/html/rfc9449> | Cited as "RFC 9449" in spec §5.7 prose; **absent from spec §6** (defect D2). Title/date verified on the IETF page |
| `SOLID-PROTOCOL` | Solid Protocol, Version 0.11.0 | Solid Project, May 2024 | <https://solidproject.org/TR/protocol> | Normative base of the whole profile |
| `WAC` | Web Access Control | Solid Project | <https://solid.github.io/web-access-control-spec/> | Requirement `[S3]` |
| `PROV-O` | PROV-O: The PROV Ontology, W3C Recommendation, 30 April 2013 | W3C | dated: <https://www.w3.org/TR/2013/REC-prov-o-20130430/> · latest: <https://www.w3.org/TR/prov-o/> | Dated permalink verified against the W3C page. **No DOI.** Superclasses in `vocab.ttl` |
| `RDFC-1.0` | RDF Dataset Canonicalization | W3C | <https://w3c.github.io/rdf-canon/spec/> | Requirement `[S5]`, `agent:contentHash`. Dated version **not** verified — no DOI (checked) |
| `DID-CORE` | Decentralized Identifiers (DIDs) v1.0, W3C Recommendation, July 2022 | W3C | <https://www.w3.org/TR/did-core/> | paper.html §7 only |
| `DID-WBA` | ANP did:wba Method Specification | Agent Network Protocol | <https://agentnetworkprotocol.com/en/specs/03-did-wba-method-specification/> | Spec §6 informative; requirement `[S6]` |
| `ANP-AGENT-DESCRIPTION` | ANP Agent Description Protocol Specification | Agent Network Protocol | <https://agentnetworkprotocol.com/en/specs/07-anp-agent-description-protocol-specification/> | Defines `agent:AgentDescriptionService` |
| `A2A` | Agent2Agent Protocol Specification | A2A Protocol | <https://a2a-protocol.org/latest/specification/> | Cited as `/latest/` — no version of record |
| `MCP` | Model Context Protocol | Model Context Protocol | <https://modelcontextprotocol.io/> | interop.html also links the dated snapshot `/specification/2025-11-25` |
| `FOAF` | FOAF Vocabulary 0.99 | (namespace only) | <http://xmlns.com/foaf/0.1/> | `agent:AIAgent ⊑ foaf:Agent`. Cited by namespace URI, no document link in-repo |
| `DCTERMS` | DCMI Metadata Terms | (namespace only) | <http://purl.org/dc/terms/> | `owl:imports` in `vocab.ttl`. Same limitation |
| `OPENMEMORY-HMD-V2` | OpenMemory HMD v2 (Human Memory Descriptor) taxonomy | mem0 project | <https://github.com/mem0ai/mem0> | See register below — weakest identifier here |

## Identifier-only and unverified register — blocked, not skipped

These are named in this repository but cannot currently be cited responsibly.
They are recorded rather than quietly dropped, and rather than filled in from
recall.

| Item | Where named | Why it is not citable yet |
|-|-|-|
| `OPENMEMORY-HMD-V2` | 17 regex occurrences of `OpenMemory\|HMD v2` across 4 of 19 tracked files (`interop.html` 11, `spec.html` 2, `vocab.ttl` 2, `changelog.html` 2) | **Exactly one** hyperlink exists (`interop.html:268`) and it points to `github.com/mem0ai/mem0` — a moving product repository, not a versioned specification. No version, no commit, no date, no DOI. The five-sector "alignment" therefore has no fixed referent to check against |
| "Community Solid Server (CSS) v7.x" and "Inrupt Pod Spaces" | `paper.html` §5.1 | Asserted as a *completed* test ("The specification has been tested with") with no test artifacts, no results, no dates and no server versions-of-record anywhere in the tree. Do not cite this as an empirical result |
| `A2A`, `MCP` | spec §6, interop, paper | Both also cited via `latest` URLs. interop.html does link one dated MCP snapshot (`2025-11-25`); no dated A2A reference exists |
| LangChain, OpenAI Assistants API, SQLite, PostgreSQL, numpy, `text-embedding-3-small` / `-large` | `migration.html` | Product/model names only — no URL, no version, no citation. The recipes are not pinned to testable behaviour |
| `Ed25519VerificationKey2019`, `JsonWebKey2020`, `EcdsaSecp256k1` signature suites | `spec.html` §5.6, `vocab.ttl` | Named as verification methods with no normative reference (the W3C suites are not cited in §6) |

## Defects that bear on citation claims

Found while measuring, deliberately **not** edited by this lane (a citation
lane must not silently rewrite normative content). Each is stated with its
receipt so a follow-up lane or an issue can adjudicate.

| Id | Defect | Receipt |
|-|-|-|
| **D1** | `spec.html` §1.2 defines **Standard** conformance as "Minimal + A6-A15", but `[A7]`–`[A15]` are defined nowhere | `spec.html:95` is the only occurrence of `A6-A15`; `[A7]`…`[A15]` → 0 occurrences each. Defined set = `[A1]`–`[A6]`, `[S1]`–`[S8]` |
| **D2** | `RFC 9449` is cited normatively in prose but is absent from the References section | `grep 'RFC 94' spec.html` → 1 hit (§5.7 `[S7]`); `'9449' in text after '6. References'` → `False` |
| **D3** | `changelog.html` cites **6 section references that do not exist** in `spec.html`: §6.1, §6.2, §8.3, §8.5, §8.7, §10 | `spec.html` defines exactly 24 numbered headings — 1, 1.1, 1.2, 2, 2.1–2.3, 3, 3.1–3.3, 4, 4.1, 4.2, 5, 5.1–5.8, 6. The changelog's §4.1 and §5.2 **do** resolve; §6 has no subsections and there is no §7–§10. The unreferenced majority describes a different (earlier) document structure, so changelog section pointers are not reliable locators |
| **D4** | `paper.html` §5.1 states the specification "has been tested with" two Solid servers, with no in-repo evidence carrier | 0 test files tracked; the only CI gate is `npm run validate` = `html-validate *.html && stylelint style.css`, which checks this repo's markup, not protocol conformance |
| **D5** | No `LICENSE` file is tracked, so GitHub's license detector reports none, while three in-repo sources state CC-BY-4.0 | `gh api repos/awkronos/web/license` → 404; `git ls-files \| grep -i licen` → none; CC-BY-4.0 in `package.json`, `vocab.ttl` `dct:license`, site footer |
| **D6** | `paper.html` §7 and `interop.html` self-cite `[AGENT-DATA-POD]` via a relative link (`spec.html`) | Not a defect for readers of the site, but it means the paper's reference list contains no resolvable identifier for the spec it proposes; the CFF and this file supply one |

## Citation graph, read the other way

`agentdatapod.spec` is cited by all six other units; `agentdatapod.vocab` by
three. `agentdatapod.conformance-model`, `memory-sector-taxonomy`,
`interop-matrix`, `position-paper` and `migration-guide` currently have
`cited_by: []` — no in-repo unit cites them back. That is expected for a leaf
document set, and it is stated so that a carrier check reading empty
`cited_by` as "missing data" can distinguish it from an unbuilt edge.

## Verification limits of this file

What this lane did **not** measure, so nothing above should be read as
asserting it:

* **No implementation exists to test.** Nothing here verifies that the profile
  is satisfiable on a real Solid server, or that any protocol in the interop
  matrix behaves as claimed. Compatibility claims are `asserted`, and this
  file says so in every affected `venue_or_status`.
* **DOI/arXiv availability was checked for 3 of 14** prior-work ids (RFC 2119,
  PROV-O, RDF Dataset Canonicalization → no DOI on their canonical pages), plus
  RFC 9449's title and date. The remaining ids were taken from this repository's
  own reference text; their DOI status is unexamined, not "none".
* **No reasoner or SHACL validation** was run against `vocab.ttl`; the 25-term
  census is a syntax-level count of declared subjects.
* **`npm ci && npm run validate` was not executed locally.** The claim that the
  gate only checks markup comes from reading `package.json` and
  `.github/workflows/deploy.yml`, plus the recorded CI runs on the pin
  (`Deploy to GitHub Pages`, both `push` and `schedule`, `completed`/`success`).
* `authors` per unit is project-scope (person + org); no unit-level
  person-attribution mapping exists in the git history.

## Re-validating the CFF

`CITATION.cff` in this repository validates against the CFF project's own
`schema.json` at ref `1.2.0` (63,763 bytes, root `cff-version` pattern
`^1\.2\.0$`, `additionalProperties: false`). The validator is a spine-side
asset, intentionally **not** vendored into this repository; see
[`CITATION.cff`](../CITATION.cff) header comments for the measured key set.

Last measured 2026-11-03 against `refs/heads/main@88870343c6ec3f0d4d4e90b01fefab93c59274e3`.
