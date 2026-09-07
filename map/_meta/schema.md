---
type: schema
---

# Node types (closed)

## object

One durable noun: a class, module, type, or owning file. Frontmatter: `type: object`, `cluster`, `universe`, `status: stub|verified|stale`, `entity` (owning path). Required sections: Why this shape / Shape / Connected to / If you change this (Hits, Does not hit) / Surfaces / See. Template: `_templates/object.md`.

## process

One repeating movement that actually runs. Frontmatter: `type: process`, `consumes: []`, `produces: []` (links to object cards). Required sections: Input → Movement → Output / Steps (cited) / If you change this / Surfaces. Template: `_templates/process.md`.

## Clusters

Clusters are how an editor asks, not src folder layout (src is flat):

| Cluster | Question it answers |
|---|---|
| `view-chain` | How does a command become a visible terminal tab? |
| `pty-platform` | How does the shell process actually run, cross-platform? |
| `config-theming` | What can the user configure and how does it reach the terminal? |
| `persistence-registries` | What survives a reload, and what registries exist? |
| `text-features` | What text-level features sit between keystroke and PTY? |
| `delivery` | How does source become an installed, released plugin? |

Status vocabulary: `stub` (unverified lines only), `verified` (re-checked against source, dated), `stale` (known to have drifted). Generated indexes (`_index.md`) are rebuilt by the mapper, never hand-edited inconsistently — update the whole file or none of it.
