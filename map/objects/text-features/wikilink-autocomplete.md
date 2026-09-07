---
type: object
cluster: text-features
universe: live
status: verified
entity: src/wikilink-autocomplete.ts
---

# WikiLinkAutocomplete

A `[[` overlay for vault notes inside the terminal: keystrokes intercepted at the xterm layer, suggestion dropdown, and a host-supplied `ResolveInsertion` that decides what string is written to the PTY. Class `WikiLinkAutocomplete` (`wikilink-autocomplete.ts:64`).

## Why this shape

Interception happens in xterm's parser (not DOM), so the feature works inside TUIs like vim and claude-code (`wikilink-autocomplete.ts:1-7` port note). Shell semantics (wikilink vs vault-path vs absolute-path, quoting) are delegated to the host via `ResolveInsertion` (`:36-38`) so this class stays UI-only.

## Shape

- `AutocompleteEntry` (`:15-33`): name, folder, vault-relative path (empty for unresolved), isFile, mtime
- `defaultResolveInsertion` (`:38`) implements the three `WikiLinkInsertMode` settings values
- Ported from internetvin/internetvin-terminal (MIT) — see NOTICE
- Controlled by the "Wiki-link autocomplete" setting (`settings.ts:888`)

Citations: `src/wikilink-autocomplete.ts:1-64` (493 lines total)

## Connected to

- **owns:** the overlay UI + key interception while active
- **owned-by:** TerminalTabManager (`buildAutocomplete`, `terminal-tab-manager.ts:870`), which also hosts the key-handler chain it feeds
- **joins:** Obsidian vault file listing (TFile scans); settings (`WikiLinkInsertMode`)
- **looks-like-but-is-not:** path-links (detection vs insertion)

## If you change this

- **Hits:** keystroke flow in every terminal (interception must consume-or-pass correctly or normal typing breaks); key-handler-registry ordering (custom handlers run first)
- **Does not hit:** click detection; persistence

## Surfaces

| Surface | Role |
|---|---|
| Humans | type `[[` in any shell/TUI |
| Tests | `wikilink-autocomplete.test.ts` |

## See

- Source: `src/wikilink-autocomplete.ts`
