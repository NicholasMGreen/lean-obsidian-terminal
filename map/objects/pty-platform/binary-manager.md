---
type: object
cluster: pty-platform
universe: live
status: verified
entity: src/binary-manager.ts
---

# BinaryManager

Downloads, checks, updates, and removes the platform-specific **node-pty** native package under `pluginDir/node_modules/node-pty`, tracked by `.binary-manifest.json`. Class `BinaryManager` (`binary-manager.ts:26`).

## Why this shape

The plugin cannot bundle node-pty (esbuild external; Obsidian review bot forbids `@types/node`), so users click "Download binaries" in Settings and the zip is fetched from this repo's GitHub releases at runtime (`REPO_OWNER = "sdkasper"`, `binary-manager.ts:22-23`). Status is a small state machine surfaced in Settings UI.

## Shape

- `BinaryStatus`: `not-installed | checking | downloading | ready | error` (`binary-manager.ts:13`)
- `checkInstalled` verifies `lib/index.js` exists and manifest platform/arch match (`:44-60`)
- Downloads via Obsidian `requestUrl`, extracts with child_process + crypto hash checks (`:6-11`)
- The win32-x64 package includes `third_party/conpty` (built by CI); win32-arm64 does not — see the ConPTY gate card

Citations: `src/binary-manager.ts:1-264`

## Connected to

- **owns:** `node_modules/node-pty/` contents, `.binary-manifest.json`
- **owned-by:** TerminalPlugin (constructed in `onload`, `main.ts:59-64`); Settings UI renders its status
- **joins:** pty-manager (consumes the files at spawn time), CI `build-node-pty.yml` (produces the release assets it downloads)
- **looks-like-but-is-not:** does not build or patch node-pty itself; the ConoutConnection patch is applied at CI build time

## If you change this

- **Hits:** first-run UX on every platform; release asset naming contract with `.github/workflows/build-node-pty.yml`; the ConPTY dll gate assumptions
- **Does not hit:** plugin bundle build; themes/settings

## Surfaces

| Surface | Role |
|---|---|
| Humans | click Download/Remove in Settings |
| GitHub releases | serves the zips (external consumer of repo tags) |

## See

- Source: `src/binary-manager.ts`
