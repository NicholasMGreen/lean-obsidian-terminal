---
type: object
cluster: pty-platform
universe: live
status: verified
entity: src/node-api.ts
---

# NodeApi (requireNode)

Structural TypeScript types for the Node APIs used through Electron's `require`, plus `requireNode()` and the shared `nodeProcess` handle. File `node-api.ts` (`node-api.ts:89` for `requireNode`).

## Why this shape

The Obsidian review bot type-checks the plugin **without `@types/node`**, so every Node capability (fs, path, child_process, crypto, readline, process) must be re-declared structurally here (`node-api.ts:15-87`). This is a lint-gate constraint, not a style choice — see repo CLAUDE.md "Lint".

## Shape

- `NodeModuleMap` maps module id → structural interface
- `requireNode<K>(id)` is a typed wrapper over `require`
- `global.d.ts` declares `window.require`/`process` for TS

Citations: `src/node-api.ts:1-97`, `src/global.d.ts`

## Connected to

- **owns:** the vocabulary of Node types used across src
- **owned-by:** nothing (leaf module)
- **joins:** used by pty-manager, binary-manager, shell-integration, main, view, claude-sessions, theme-registry, tab-manager
- **looks-like-but-is-not:** not a runtime shim — `require` is real Electron require at runtime

## If you change this

- **Hits:** any file needing a Node API not yet typed here (extend, don't bypass); lint gate failures if someone imports `@types/node` style types directly
- **Does not hit:** runtime behavior (types only, plus the one `require` wrapper)

## Surfaces

| Surface | Role |
|---|---|
| Agents | read this first when a build/lint error mentions Node types |

## See

- Source: `src/node-api.ts`
