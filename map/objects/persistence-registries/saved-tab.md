---
type: object
cluster: persistence-registries
universe: live
status: verified
entity: src/session-state.ts
---

# SavedTab (session persistence types)

The unit of terminal-session persistence. `session-state.ts` is types-only: `SavedTab` (`session-state.ts:8`), `SavedViewState` (`:29`), `RecentSession` (`:40`).

## Why this shape

One interface, three consumers with different storage homes: `SavedViewState` serializes into **workspace.json** (Obsidian layout), `RecentSession` goes into **data.json** (plugin settings), and `SavedTab` is the shared core. A tab is restorable purely from its fields: name, color, cwd, serialized xterm buffer, optional `resumeCommand` (`claude --resume <uuid>`), pinned.

## Shape

- `bufferSerial` — xterm SerializeAddon output; absent when persistBuffer off or nothing written (`session-state.ts:14-19`)
- `resumeCommand` — strict uuid regex enforced at parse time (`terminal-view.ts:225`)
- Validation/narrowing of unknown state happens in `terminal-view.ts` (`sanitizeTab`, `parseSavedViewState`), not here

Citations: `src/session-state.ts:1-43`

## Connected to

- **owns:** nothing (pure types)
- **owned-by:** TerminalView (serialize/restore), recent-sessions, settings storage
- **joins:** TerminalTabManager `serializeSessions`/`captureSession` produce them
- **looks-like-but-is-not:** a Claude session entry — different noun entirely (claude-sessions card)

## If you change this

- **Hits:** every restore path, workspace.json forward/backward compatibility, the sanitize regexes
- **Does not hit:** live session behavior (only what's saved)

## Surfaces

| Surface | Role |
|---|---|
| Obsidian | stores in workspace.json / data.json |
| Agents | additive changes only; removal breaks old saved layouts |

## See

- Source: `src/session-state.ts`
- As-built: `docs/session-persistence.md`
