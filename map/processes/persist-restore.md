---
type: process
status: verified
consumes: ["../objects/persistence-registries/saved-tab.md", "../objects/view-chain/terminal-view.md", "../objects/persistence-registries/recent-sessions.md", "../objects/config-theming/settings.md"]
produces: ["../objects/persistence-registries/saved-tab.md"]
---

# Persist & restore sessions

Terminal tabs survive app reloads via workspace.json, and closed tabs get a second life via the recents rescue buffer.

## Input → Movement → Output

Input: live sessions in a TerminalView. Movement: serialize to `SavedTab[]` → Obsidian layout save → rehydrate through `setState` on next open. Output: identical tabs, buffers re-rendered from `bufferSerial`.

## Why this shape

Two storage homes, two lifecycles: workspace.json holds the *live* layout (dies with a clean quit only if saved); data.json recents hold *closed* tabs deliberately. Saving per output chunk used to lag the terminal, so saves are cadence-based.

## Steps

1. Output dirties a flag; every 10s `consumeOutputDirty()` triggers `requestSaveLayout` (`src/terminal-view.ts:124-131`); quit flushes with `.run()` (`src/main.ts:214-217`).
2. Obsidian calls `getState` → `tabManager.serializeSessions()` → `SavedTab[]` incl. `bufferSerial` (`src/terminal-view.ts:170-184`; `src/terminal-tab-manager.ts:1162-1170`).
3. Close paths push each tab to recents via `onSessionClose → pushRecentSession` (`src/terminal-view.ts:82`; `src/recent-sessions.ts:16-28`).
4. Restore: `parseSavedViewState`/`sanitizeTab` validate (strict `claude --resume` uuid regex) (`src/terminal-view.ts:223-255`), then tabs replay through `createTab` (`:131-147`).
5. Manual rescue: "Restore recent terminal session" picker (`src/recent-sessions.ts:32-135`).

## If you change this

- **Hits:** SavedTab schema compatibility (old workspace.json layouts), save cadence/perf, recents capacity
- **Does not hit:** release/build; PTY spawn options

## Surfaces

| Surface | Role |
|---|---|
| Obsidian | owns workspace.json and data.json writes |
| Humans | never think about it — that's the point |

## See

- Objects: saved-tab, terminal-view, recent-sessions
- Source: `src/terminal-view.ts:109-189`
