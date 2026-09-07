---
type: object
cluster: view-chain
universe: live
status: verified
entity: src/terminal-opener.ts
---

# TerminalOpener

A 42-line bridge: "open a tab with these options" → existing view's manager, or a fresh leaf whose default tab gets destroyed and replaced. Function `openTabOrView` (`terminal-opener.ts:13`).

## Why this shape

`CreateTabOpts` carries transient hints (`runResumeCommand`) that are not part of `SavedTab`, so they can't round-trip through `setViewState`. The destroy-and-recreate of the default tab preserves them (`terminal-opener.ts:3-11` doc comment).

## Shape

- Single export, no class. Leaf choice mirrors `defaultLocation` handling in `main.ts:openTerminalAt`.

Citations: `src/terminal-opener.ts:1-42`

## Connected to

- **owns:** nothing — stateless
- **owned-by:** callers: `claude-sessions.ts` (resume), `recent-sessions.ts` (restore)
- **joins:** TerminalTabManager (`createTab`, `destroyAll(false)`)
- **looks-like-but-is-not:** `main.ts:activateTerminal` does NOT go through this — it restores saved view state instead

## If you change this

- **Hits:** every restore path (recent sessions, Claude resume) and `CreateTabOpts` consumers
- **Does not hit:** PTY spawn options — opts flow through TabManager, not here

## Surfaces

| Surface | Role |
|---|---|
| Internal callers | reads only |

## See

- Source: `src/terminal-opener.ts`
