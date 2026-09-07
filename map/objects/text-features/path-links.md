---
type: object
cluster: text-features
universe: live
status: verified
entity: src/path-links.ts
---

# PathLinks (clickable paths)

Pure helpers that find clickable filesystem path tokens in terminal text and split `:line[:col]` suffixes. `findPathCandidates` (`path-links.ts:21`), `splitLineSuffix` (`:63`).

## Why this shape

Pure and string-only so it is unit-testable without xterm or Obsidian; the xterm link provider in TerminalTabManager (`ILink`) supplies the interaction. Used for the "Clickable file paths" setting.

## Shape

- No class, no state. Returns token spans (`start`/`end`) + parsed line numbers.

Citations: `src/path-links.ts:1-69`

## Connected to

- **owns:** path-token recognition rules
- **owned-by:** TerminalTabManager (WebLinksAddon / custom link checker)
- **joins:** none — deliberately dependency-free
- **looks-like-but-is-not:** wikilink-autocomplete (that inserts vault notes; this detects printed paths)

## If you change this

- **Hits:** click-to-open behavior and its tests only
- **Does not hit:** `[[` autocomplete; PTY stream

## Surfaces

| Surface | Role |
|---|---|
| Tests | `path-links.test.ts` |
| Humans | click detected paths in the terminal |

## See

- Source: `src/path-links.ts`
