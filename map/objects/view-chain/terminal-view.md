---
type: object
cluster: view-chain
universe: live
status: verified
entity: src/terminal-view.ts
---

# TerminalView

The Obsidian `ItemView` shell: one DOM container (tab bar + terminal host), one `TerminalTabManager`, resize handling, and the save/restore boundary for view state. Class `TerminalView` (`terminal-view.ts:9`).

## Why this shape

Obsidian persists view state through `getState`/`setState`, so this class is the only place that translates between Obsidian's leaf lifecycle and the tab manager's sessions. Restoration is synchronous by design (`setState` just queues `pendingState`; `applyPendingState` (`terminal-view.ts:202-216`) replays each `SavedTab` through `createTab`).

## Shape

- `onOpen` builds tab bar + host, computes cwd (vault base path), constructs `TerminalTabManager` with callbacks (`terminal-view.ts:41-121`)
- ResizeObserver debounced 50ms → `fitActive()` + conditional `focusActive()` (`terminal-view.ts:98-110`)
- Periodic save: every 10s flush layout only if `consumeOutputDirty()` — replaced per-chunk saves that lagged under heavy output (`terminal-view.ts:124-131`)
- `sanitizeTab` / `parseSavedViewState` validate unknown state; `resumeCommand` must match a strict `claude --resume <uuid>` regex (`terminal-view.ts:225-259`)
- `updateTabBarVisibility` (`terminal-view.ts:173-179`) toggles the `terminal-tabs-hidden` class from `settings.showTabBar`

Citations: `src/terminal-view.ts:9-189`

## Connected to

- **owns:** one TerminalTabManager
- **owned-by:** Obsidian workspace leaf (type `terminal-view`)
- **joins:** recent-sessions via `onSessionClose` callback (`terminal-view.ts:82`)
- **looks-like-but-is-not:** does not touch xterm or PTY directly — all terminal work is delegated

## If you change this

- **Hits:** session restore across reloads; layout-save cadence; focus behavior
- **Does not hit:** what a session contains (`TerminalSession`) — that shape lives in terminal-tab-manager

## Surfaces

| Surface | Role |
|---|---|
| Obsidian workspace | reads/writes view state on layout save/load |
| Humans | see the panel; ResizeObserver adapts |

## See

- Source: `src/terminal-view.ts`
