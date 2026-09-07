---
type: process
status: verified
consumes: ["../objects/view-chain/terminal-tab-manager.md", "../objects/pty-platform/pty-manager.md", "../objects/pty-platform/shell-integration.md", "../objects/pty-platform/windows-conpty.md", "../objects/text-features/key-handler-registry.md"]
produces: []
---

# PTY lifecycle

A session's shell process from spawn to teardown — the zombie-prevention path.

## Input → Movement → Output

Input: a `TerminalSession` needing a shell (cwd, cols/rows, env). Movement: load node-pty, resolve shell + integration hooks, spawn, wire three streams and the exit handler. Output: a dead PTY with every disposable detached.

## Why this shape

All teardown is centralized (`teardownSession`/`forceCloseTab`/`destroyAll`) because a missed `kill()` or parser disposable means zombie shells or leaks into the next session — the repo's Tier-1 review concern.

## Steps

1. `spawnPty` calls `PtyManager.spawn(shellPath, cwd, cols, rows)` (`src/terminal-tab-manager.ts:910`; `src/pty-manager.ts:152-205`).
2. Shell resolution: explicit path or auto-detect (pwsh7 → MS Store pwsh → cmd; `$SHELL` on POSIX) (`src/pty-manager.ts:101-131`).
3. Integration env/args from `getShellIntegration`; script args *replace* base args (`src/pty-manager.ts:169-180`).
4. Windows: `shouldEnableConptyDll` gates `useConptyDll` (`src/pty-manager.ts:186-200`).
5. Wiring: `pty.onData → terminal.write`, `terminal.onData → pty.write`, resize from fit, `onExit → notifyCompletion + forceCloseTab` (`src/terminal-tab-manager.ts:910-960, 1194-1200`).
6. Teardown: `kill()` (swallows already-dead), dispose parser disposables, remove DOM (`src/pty-manager.ts:237-245`; `src/terminal-tab-manager.ts:1068-1132`).

## If you change this

- **Hits:** zombie processes, Windows 10 mouse, shell-integration contract, key-handler chain — request Tier-1 review
- **Does not hit:** persistence (buffer serialization is a separate concern)

## Surfaces

| Surface | Role |
|---|---|
| Shell process | lives and dies by this |
| Agents | verify cleanup on every new close path |

## See

- Objects: pty-manager, terminal-tab-manager, shell-integration, windows-conpty
- Source: `src/terminal-tab-manager.ts:910-1200`
