---
type: object
cluster: pty-platform
universe: live
status: verified
entity: patches/windowsConoutConnection.js
---

# Windows ConPTY support (dll gate + ConoutConnection patch)

Two coordinated pieces that make Windows terminals usable:
1. **The dll gate** — `shouldEnableConptyDll` in `pty-manager.ts:72` decides whether node-pty may use its bundled OpenConsole.
2. **The ConoutConnection patch** — `patches/windowsConoutConnection.js`, inlined at build time and applied to node-pty at CI build (imported with `?raw` in `binary-manager.ts:3`).

## Why this shape

Obsidian's Electron renderer has no Worker threads, so node-pty's stock ConPTY ConoutConnection (Worker-based) deadlocks; the patch swaps in inline socket piping. The dll gate exists because the win32-arm64 package and older downloads lack `third_party/conpty/<ver>/<arch>/conpty.dll` + `OpenConsole.exe`, and enabling the flag without them breaks spawn (issue #92 context, `pty-manager.ts:53-71`).

## Shape

- Gate checks files on disk per host arch: `win10-x64` / `win10-arm64` under `node_modules/node-pty/third_party/conpty/` (`pty-manager.ts:50-60`)
- Patch is a raw-text esbuild import — edits to it rebuild into the bundle automatically (`esbuild.config.mjs:10-21`)
- CI assembles packages in `build-node-pty.yml`; only win32-x64 copies `third_party`

Citations: `src/pty-manager.ts:50-100`, `src/binary-manager.ts:3`, `esbuild.config.mjs:10-21`

## Connected to

- **owns:** the `useConptyDll` spawn decision
- **owned-by:** pty-manager (gate), CI build-node-pty workflow (patch application)
- **joins:** binary-manager (which packages have which files)
- **looks-like-but-is-not:** not a runtime download — the patch ships inside the downloaded binary package

## If you change this

- **Hits:** every Windows user's spawn; win32-arm64 spawn if the gate is loosened; CI package assembly
- **Does not hit:** macOS/Linux (gate returns false immediately, `pty-manager.ts:76`)

## Surfaces

| Surface | Role |
|---|---|
| Windows users | all terminal I/O flows through the patched connection |
| Agents | Tier-1 review per repo CLAUDE.md (native module changes) |

## See

- Source: `src/pty-manager.ts:50-100`, `patches/windowsConoutConnection.js`
