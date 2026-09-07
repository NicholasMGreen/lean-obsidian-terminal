---
type: object
cluster: pty-platform
universe: live
status: verified
entity: src/pty-manager.ts
---

# PtyManager

Thin wrapper over the node-pty process: shell detection, spawn options (including the Windows ConPTY DLL gate), I/O, resize, kill. One instance per `TerminalSession`. Class `PtyManager` (`pty-manager.ts:152`).

## Why this shape

node-pty is loaded at runtime via Electron's `require` (never bundled — see node-api / esbuild externals), so spawn must first resolve `pluginDir/node_modules/node-pty` (`pty-manager.ts:32-45`). Platform decisions live here so no caller ever branches on OS.

## Shape

- Shell detection: Windows tries PowerShell 7 paths, MS Store pwsh, then `%COMSPEC%`; POSIX uses `$SHELL || /bin/bash` (`pty-manager.ts:101-118`)
- Login shell `-l` on POSIX for PATH/profile sourcing (`:119-131`)
- `shouldEnableConptyDll` (`:72-100`): enables node-pty's bundled OpenConsole only when conpty.dll + OpenConsole.exe exist on disk for the host arch (win32-arm64 packages and older downloads lack them — GitHub issue #92 context in `:53-71`)
- `spawn` merges env: process env ← shell-integration env ← caller env (`:165-200`)
- `kill` and `resize` swallow errors — process may already be dead / mid-resize

Citations: `src/pty-manager.ts:1-246`

## Connected to

- **owns:** one IPtyProcess
- **owned-by:** TerminalTabManager (one per session)
- **joins:** shell-integration (env/args injection), node-api (`window.require`), binary-manager (supplies the node-pty files this loads)
- **looks-like-but-is-not:** does not download binaries (that's BinaryManager) and does not touch xterm

## If you change this

- **Hits:** all three platforms' spawn behavior; Windows 10 mouse support; shell-integration contract; zombie processes if kill paths change — Tier-1 review
- **Does not hit:** binary download/version logic; tab UI

## Surfaces

| Surface | Role |
|---|---|
| Shell process | bidirectional I/O |
| Agents | edit with care: platform-specific, review-tiered per repo CLAUDE.md |

## See

- Source: `src/pty-manager.ts`
- As-built context: Windows ConPTY notes in `patches/windowsConoutConnection.js` header (see windows-conpty card)
