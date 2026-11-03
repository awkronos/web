# Agent Data Pod Specification

**A profile of the Solid Protocol for AI agent data storage — container
structures, an RDF vocabulary, encryption requirements and access-control
patterns that make an agent's accumulated memory, state and capabilities
portable between implementations while staying under the user's control.**

Status: **draft**, version **0.2.0**. The specification's own
[Status of This Document](https://awkronos.github.io/web/spec.html) states:
*"This is a Draft Specification. It has not been reviewed or endorsed by any
standards body."* Nothing below softens that.

Published at <https://awkronos.github.io/web/> from `main` in this repository
via GitHub Pages (`.github/workflows/deploy.yml`). Licensed **CC BY 4.0**
(measured — see [License](#license)).

---

## Scientific context

### The problem class this work sits in

Agents accumulate state — episodic memories, learned preferences, declared
capabilities, audit trails — that today lives inside whichever vendor hosted
the agent. Portability of that state is therefore not a packaging problem but
a **representation** problem: it needs a data model that (a) is normative
enough for two implementations to interoperate, (b) carries provenance and
deletion semantics, and (c) inherits an access-control model rather than
inventing one.

This project takes the second option offered by the Solid ecosystem: rather
than define a new storage protocol, it defines a **profile** — conventions
layered on the [Solid Protocol][SOLID-PROTOCOL], [Web Access Control][WAC] and
[PROV-O][PROV-O], with identity linkage to [DID Core][DID-CORE] and
[did:wba][DID-WBA], and discovery surfaces exposed to
[ANP][ANP-AGENT-DESCRIPTION], [A2A][A2A] and [MCP][MCP].

Profiling rather than replacing is a design commitment with a citation
consequence: this repository's normative force is *derivative*, so every claim
it makes about interoperability is a claim about how its conventions compose
with someone else's specification, and each of those specifications is a
citable unit in its own right (see [`docs/CITATIONS.md`](docs/CITATIONS.md)).

### Literature this profile stands on

Cited by identifier, as the project's citation law requires. The identifiers
below are the ones used throughout this repository's own text; a short table
with stable links is repeated in
[`docs/CITATIONS.md`](docs/CITATIONS.md).

| Id | Work | Where used here |
|-||-|-|
| [RFC 2119][RFC2119] | Key words for use in RFCs to Indicate Requirement Levels (IETF, March 1997) | `spec.html` §1.1 — the MUST/SHOULD/MAY vocabulary |
| [RFC 9449][RFC9449] | OAuth 2.0 Demonstrating Proof of Possession (DPoP) | `spec.html` §5.7 `[S7]` — token binding |
| [Solid Protocol 0.11.0][SOLID-PROTOCOL] | Solid Protocol, Version 0.11.0 | normative base of the whole profile |
| [WAC][WAC] | Web Access Control | `[S3]` access control |
| [PROV-O][PROV-O] | PROV-O: The PROV Ontology (W3C Recommendation, 30 April 2013) | `agent:AuditEntry`, `agent:MemoryEpisode` superclassing |
| [RDFC-1.0][RDFC-1.0] | RDF Dataset Canonicalization | `[S5]` integrity hashing |
| [DID Core][DID-CORE] | Decentralized Identifiers (DIDs) v1.0 (W3C Recommendation, July 2022) | `paper.html` §7 |
| [did:wba][DID-WBA] | ANP did:wba Method Specification | identity linkage, `[S6]` |
| [ANP Agent Description][ANP-AGENT-DESCRIPTION] | ANP Agent Description Protocol | `agent:AgentDescriptionService`, `/public/agent/ad.json` |
| [A2A][A2A] | Agent2Agent Protocol Specification | Agent Card interop |
| [MCP][MCP] | Model Context Protocol | `agent:mcpEndpoint`, capability invocation |
| [FOAF][FOAF] | FOAF Vocabulary Specification 0.99 | `agent:AIAgent ⊑ foaf:Agent` |
| [DC Terms][DCTERMS] | DCMI Metadata Terms | `vocab.ttl` ontology metadata |
| [OpenMemory HMD v2][OPENMEMORY] | Human Memory Descriptor v2 taxonomy | memory sector taxonomy — 17 mentions across 4 files, **one** hyperlink, to a moving product repository rather than a versioned document |

**A measured caveat, stated rather than papered over.** The Awkronos citation
law asks for an arXiv id or DOI. None of the works above has one in this
repository's text, and the ones this lane could check directly (RFC 2119,
PROV-O, RDF Dataset Canonicalization) carry **no DOI on their own canonical
pages** either. For this reference class the stable identifier is the
specification's versioned URL — W3C in particular publishes a dated permalink
alongside the persistent "latest" URL, e.g. PROV-O's
`https://www.w3.org/TR/2013/REC-prov-o-20130430/`. This project therefore
cites standards by **version + URL**, and records the missing-DOI state
explicitly in [`docs/CITATIONS.md`](docs/CITATIONS.md) rather than inventing
identifiers to satisfy a field.

### Proven, computed, asserted

The three classes below are kept strictly separate — *proven* (machine-checked),
*computed* (measured, reproducible output) and *asserted* (design intent).
Applied honestly to this repository:

| Class | Claim in this repo | Count | Evidence carrier |
|-|-|-|-|
| **Proven** | none | **0** | no formal methods, no machine-checked proofs here |
| **Computed** | none | **0** | no conformance suite, no experiments, no benchmarks are tracked (`git ls-files` → 0 test files) |
| **Asserted** | the normative model: 14 requirement clauses `[A1]`–`[A6]`, `[S1]`–`[S8]`, carrying 32 RFC 2119 keywords (16 MUST, 1 MUST NOT, 7 SHOULD, 1 SHOULD NOT, 7 MAY) | **14 / 32** | `spec.html` prose |
| **Asserted** | the data model: 25 vocabulary terms — 6 classes + 19 properties (17 datatype, 2 object), 3 superclass links into FOAF/PROV-O | **25** | `vocab.ttl` (machine-readable) |
| **Asserted** | interoperability: 5-protocol compatibility matrix, support levels `Native`/`Full`/`Compatible`/`Partial` | **5 rows** | `interop.html` |
| **Asserted** | `paper.html` §5.1: *"The specification has been tested with: Community Solid Server (CSS) v7.x, Inrupt Pod Spaces"* | **1** | **no in-repo carrier** — see the defect register |

The last row deserves emphasis, because it is the one a reader is most likely
to mistake for a measurement. It is stated as a completed test, but this
repository contains no test harness, no conformance results, no dates and no
versions-of-record. Until such artifacts land, treat Solid-server
compatibility and every `interop.html` support level as **design intent**, not
verified behaviour. The document-level CI gate in this repo
(`npm run validate` → `html-validate` + `stylelint`) checks the *markup of the
specification pages*, not protocol conformance; a green deploy run is evidence
that the documents are well-formed HTML/CSS, and nothing more.

Known inconsistencies that bear on these counts are listed in
[`docs/CITATIONS.md`](docs/CITATIONS.md#defects-that-bear-on-citation-claims)
— notably that `spec.html` §1.2 defines the Standard conformance level as
*"Minimal + A6-A15"* while `[A7]`–`[A15]` do not exist anywhere in the
document.

---

## How to cite

If you use the repository as a whole, cite the artifact:

```bibtex
@misc{jacoby2026agentdatapod,
  title       = {Agent Data Pod Specification: A profile of the Solid
                 Protocol for AI agent data storage},
  author      = {Jacoby, Tim and Awkronos},
  year        = {2026},
  version     = {0.2.0},
  howpublished = {\url{https://awkronos.github.io/web/}},
  note        = {Draft specification; not reviewed or endorsed by any
                 standards body. Licensed CC BY 4.0.},
  url         = {https://github.com/awkronos/web}
}
```

Machine-readable form: [`CITATION.cff`](CITATION.cff) (CFF 1.2.0).

If you use a **specific** unit — the vocabulary, the conformance model, the
memory-sector taxonomy, the position paper, the interop matrix — cite that
entry from [`docs/CITATIONS.md`](docs/CITATIONS.md), which gives each unit a
stable id, its kind, its authors, its epistemic `venue_or_status`, a permalink
pinned to a commit, and the prior-work ids it cites. Per-result citation is the
load-bearing leg of the citation law, because CFF 1.2.0 cannot express
contributorship at all.

Citing prior work *from* anything built on this spec: use the identifiers in
the table above, not prose attribution.

---

## Document map

| File | What it is | Normative? |
|-|-|-|
| [`spec.html`](spec.html) | The specification: pod structure, memory episodes, capabilities, security requirements | **yes** |
| [`vocab.ttl`](vocab.ttl) | The RDF vocabulary, machine-readable (`https://awkronos.github.io/web/vocab#`, `owl:versionIRI` `…/vocab/0.2.0#`) | **yes** |
| [`vocab.html`](vocab.html) | Human-readable rendering of the vocabulary | derived |
| [`interop.html`](interop.html) | Interoperability guide + protocol compatibility matrix | informative |
| [`migration.html`](migration.html) | Migration guide (JSON chat history, SQLite/PostgreSQL, OpenAI Assistants, LangChain; embedding migration) | informative |
| [`paper.html`](paper.html) | W3C AI Agent Protocol Community Group position paper | informative |
| [`changelog.html`](changelog.html) | 0.1.0 (2026-02-01) → 0.2.0 (2026-02-03) | informative |

The vocabulary namespace is `https://awkronos.github.io/web/vocab#`, with
`agent:AIAgent ⊑ foaf:Agent`, `agent:MemoryEpisode ⊑ prov:Entity`,
`agent:AuditEntry ⊑ prov:Activity`, and `owl:imports` on DC Terms and PROV-O.

## Getting started

This repository is a static specification site; there is no runtime library to
install.

```bash
npm ci
npm run validate        # html-validate *.html && stylelint style.css
```

To use the vocabulary, dereference or copy `vocab.ttl` and declare the
prefix:

```turtle
@prefix agent: <https://awkronos.github.io/web/vocab#> .
```

Conformance is levelled (`spec.html` §1.2): **Minimal** = `[A1]`–`[A5]`,
**Standard** = Minimal + `[A6]`–`[A15]` *(as written; `[A7]`–`[A15]` are not
defined in the document — see the defect register)*, **Full** = Standard +
`[S1]`–`[S8]`.

## Contributing

Implementation feedback is the intended input channel: the specification's own
status block invites it via [GitHub Issues](https://github.com/awkronos/web/issues).
The position paper's proposed next steps are to present it at a Community Group
meeting, gather vocabulary/scope feedback, and revise — i.e. it is submitted,
not adopted.

## License

**CC BY 4.0**, measured from three independent places in this repository:
`package.json` (`"license": "CC-BY-4.0"`), `vocab.ttl`
(`dct:license <https://creativecommons.org/licenses/by/4.0/>`), and the site
footer (`An Awkronos for humans project · CC BY 4.0 · 2026 Timothy Jacoby`).
GitHub's license detector reports none, because no `LICENSE` file is tracked —
that is a repository gap, not a different license. `paper.html` additionally
states it is provided under the
[W3C Community Contributor License Agreement](https://www.w3.org/community/about/process/cla/).

## Authorship

Tim Jacoby (person) and Awkronos (organization). Measured basis:
`package.json` `author` and `vocab.ttl` `dct:creator` both name
Timothy Jacoby `<tim@awkronos.com>`; the site footer names
`2026 Timothy Jacoby`; the git history of this branch's base holds 18 commits
— 16 authored by Chronos Bot identities that carry no personal name and 2 by
`Tim Jacoby <timothy.jacoby@evite.com>`. Bots are not authors, so they are not
listed as one.

[RFC2119]: https://www.rfc-editor.org/rfc/rfc2119
[RFC9449]: https://datatracker.ietf.org/doc/html/rfc9449
[SOLID-PROTOCOL]: https://solidproject.org/TR/protocol
[WAC]: https://solid.github.io/web-access-control-spec/
[PROV-O]: https://www.w3.org/TR/prov-o/
[RDFC-1.0]: https://w3c.github.io/rdf-canon/spec/
[DID-CORE]: https://www.w3.org/TR/did-core/
[DID-WBA]: https://agentnetworkprotocol.com/en/specs/03-did-wba-method-specification/
[ANP-AGENT-DESCRIPTION]: https://agentnetworkprotocol.com/en/specs/07-anp-agent-description-protocol-specification/
[A2A]: https://a2a-protocol.org/latest/specification/
[MCP]: https://modelcontextprotocol.io/
[FOAF]: http://xmlns.com/foaf/0.1/
[DCTERMS]: http://purl.org/dc/terms/
[OPENMEMORY]: https://github.com/mem0ai/mem0
