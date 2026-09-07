---
type: process
status: verified
consumes: ["../objects/view-chain/terminal-plugin.md", "../objects/view-chain/terminal-view.md", "../objects/view-chain/terminal-opener.md", "../objects/view-chain/terminal-tab-manager.md", "../objects/persistence-registries/saved-tab.md"]
produces: ["../objects/persistence-registries/saved-tab.md"]
---

# Open terminal

A command or ribbon click becomes a visible, focused terminal tab — restoring saved sessions when any exist.

## Input → Movement → Output

Input: a user intent (command, ribbon, URI, file-menu "Open terminal here") with optional cwd. Movement: find-or-create a leaf of type `terminal-view`, hand it prior state or fresh tab options. Output: one focused tab backed by a live PTY.

## Why this shape

State restoration rides Obsidian's `setViewState`, so open-with-state and open-fresh must take different paths — that is why `main.ts:activateTerminal` and `terminal-opener.ts:openTabOrView` both exist and must not be merged.

## Steps

1. `activateTerminal` reveals an existing leaf, or creates one injecting `settings.lastViewState` (`src/main.ts:242-284`); the one-shot state is consumed and cleared (`main.ts:271-281`).
2. Leaf creation fires `TerminalView.onOpen` → builds TabManager; a default tab is created only when no saved state is incoming (`src/terminal-view.ts:72-86`).
3. `setState` (when state exists) destroys any default tab (`saveToRecents=false`) and replays each `SavedTab` (`src/terminal-view.ts:185-216`).
4. Fresh-tab-with-opts instead goes through `openTabOrView`, which destroys the default tab and re-creates with `CreateTabOpts` (`src/terminal-opener.ts:13-42`).
5. Each `createTab` → `buildXterm` → `spawnPty` (`src/terminal-tab-manager.ts:962,529,910`).

## If you change this

- **Hits:** restore-on-reload, open-here cwd handling, focus after reveal (`main.ts:246-256` comment on why `setActiveLeaf({focus:true})`)
- **Does not hit:** what happens when a tab is closed (pty-lifecycle)

## Surfaces

| Surface | Role |
|---|---|
| Humans | every entry point |
| Agents | change via main.ts/terminal-opener.ts — never by editing view state assumptions |

## See

- Objects: terminal-plugin, terminal-view, terminal-opener, terminal-tab-manager
- Source: `src/main.ts:242-284`, `src/terminal-opener.ts`
