---
type: object
cluster: view-chain
universe: live
status: verified
entity: src/terminal-tab-manager.ts
---

# TerminalTabManager

The heart of the plugin (1,418 lines): owns every live `TerminalSession`, builds the xterm instances, spawns/wires/cleans up PTYs, renders the tab bar, and implements search, autocomplete, drag-drop, rename, pin, and notification behavior. Class `TerminalTabManager` (`terminal-tab-manager.ts:396`).

## Why this shape

One manager per view holds all sessions so tab switching (show/hide DOM, keep PTYs alive) is a pure in-memory operation, and cleanup is centralized in `teardownSession` (`terminal-tab-manager.ts:1068`) / `destroyAll` (`:1182`). Every xterm addon (fit, serialize, web-links, search) is attached per session here.

## Shape

- `TerminalSession` (`terminal-tab-manager.ts:65-91`): id, name, xterm `Terminal`, addons, `pty: PtyManager`, `parserDisposables`, `mode2031`, `pinned`, autocomplete, drag label, search overlay
- `createTab` (`:962`) → `buildXterm` (`:529`) → `spawnPty` (`:910`)
- `serializeSessions` (`:1162`) → `SavedTab[]` for view state
- `consumeOutputDirty` (`:449`) feeds the 10s layout-save cadence
- Key events flow: `installKeyHandler` (`:790`) → registry chain → built-in autocomplete/search handling
- Auto-resume / startup command hooks: `setupAutoResume` (`:460`), `setupStartupCommand` (`:500`)

Citations: `src/terminal-tab-manager.ts:396-1418`

## Connected to

- **owns:** TerminalSession[], one PtyManager per session
- **owned-by:** TerminalView (constructed in `onOpen`)
- **joins:** ThemeRegistry, BinaryManager, KeyHandlerRegistry, WikiLinkAutocomplete, path-links, tab-colors, settings — nearly everything lands here eventually
- **looks-like-but-is-not:** does not open leaves — that routing decision is TerminalOpener's

## If you change this

- **Hits:** PTY cleanup (zombie risk), tab state serialization, key-handler contract, theme application — this file is in the session-lifecycle Tier-1 review tier
- **Does not hit:** how a view/leaf is chosen for a new tab (terminal-opener.ts); shell detection (pty-manager.ts)

## Surfaces

| Surface | Role |
|---|---|
| Humans | direct interaction (tabs, keys, search, rename) |
| Agents | most feature work lands here; always check PTY cleanup on close paths |

## See

- Source: `src/terminal-tab-manager.ts`
