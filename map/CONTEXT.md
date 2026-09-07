---
type: context
scope: map/
---

# How to walk this map

This is a **System map**: a record library of nouns (`objects/`), a shelf of verbs (`processes/`), and a change-impact index (`effects/`). The repo itself is the source of truth; every claim on a card carries a `path:line` citation against commit `2cd98ff` (2026-09-07).

## Universes

| Universe | Meaning |
|---|---|
| live | In force. Implement and cite against these. |
| leftover | Still present, no longer the main path. Touch only if that path is in scope: `.planning/phases/`, `docs/code-review-2026-04-28.md`. |
| ghost | Named or filed, not wired. None at map time. |

## Name collisions

- **Session** — live terminal tab session (`TerminalSession` / `SavedTab`) vs Claude Code conversation transcript (`claude-sessions.ts`). Different nouns, different clusters.
- **Theme** — xterm color theme vs Obsidian dark/light class. `themes.ts` owns the former; the MutationObserver in `main.ts:onload` watches the latter.
- **Binary** — node-pty native package (`binary-manager.ts`) vs `main.js` build output.

## Schema

Node types are closed: see `_meta/schema.md`. Cards are one of `object` (clustered) or `process`. No other card types.

## Status

`status: verified` on a card = claims re-checked against source at the dated commit. Anything `stub` or `stale` is named as such in `objects/_index.md`. Do not paste audit reports into cards.
