---
type: object
cluster: persistence-registries
universe: live
status: verified
entity: src/recent-sessions.ts
---

# RecentSessions (rescue buffer)

A ring buffer of closed tabs stored in settings, plus a `FuzzySuggestModal` picker that merges recents with Claude sessions. Functions `pushRecentSession` (`recent-sessions.ts:16`), `openRecentSessionPicker` (`:32`).

## Why this shape

Closed terminal tabs die with their PTY — the buffer is the only second chance, so it captures a full `RecentSession` (`SavedTab` + `closedAt`) at close time via the `onSessionClose` callback (`terminal-view.ts:82`). The picker unifies two restore sources behind one command.

## Shape

- Trimmed to `settings.recentSessionsMax`; disabled when max ≤ 0 (`recent-sessions.ts:17-19`)
- Entries persisted in `data.json` (not workspace.json)
- Picker shows recents always; Claude sessions when `enableClaudeIntegration` (`:33-39`)

Citations: `src/recent-sessions.ts:1-146`

## Connected to

- **owns:** the recents slice of `data.json`
- **owned-by:** settings storage; fed by TerminalView's `onSessionClose`
- **joins:** claude-sessions (picker's second source); terminal-opener (performs restores)
- **looks-like-but-is-not:** claude-sessions — the picker mixes both, but they are separate registries

## If you change this

- **Hits:** data.json size/content, restore UX
- **Does not hit:** live tab state; workspace.json layout persistence

## Surfaces

| Surface | Role |
|---|---|
| Humans | invoke "Restore recent terminal session" command |
| Tests | `recent-sessions.test.ts` |

## See

- Source: `src/recent-sessions.ts`
