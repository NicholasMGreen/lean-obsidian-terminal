---
type: object
cluster: delivery
universe: live
status: verified
entity: main.js
---

# PluginArtifacts (bundle, manifest, install)

What ships: `main.js` (esbuild CJS bundle, node-pty and Node builtins external — `esbuild.config.mjs:24-44`), `manifest.json` (id `lean-terminal`, `isDesktopOnly: true`), `styles.css`, `versions.json`; plus `install.mjs` which copies those three into a vault's `.obsidian/plugins/lean-terminal/`.

## Why this shape

node-pty must stay external so it can be loaded via Electron's require at runtime (never bundled), and the raw-text `?raw` plugin inlines the Windows ConoutConnection patch into the bundle (`esbuild.config.mjs:10-21`). `install.mjs` defaults to `D:\LOS Test` (author's test vault) but takes a path argument.

## Shape

- `npm run build` = `tsc -noEmit -skipLibCheck` + esbuild production (package.json scripts)
- `install.mjs` requires `main.js` to exist first — build before install (`install.mjs:23-27`)
- Release versioning: bare semver tags matching manifest.json exactly (repo CLAUDE.md)

Citations: `esbuild.config.mjs:1-60`, `install.mjs:1-30`, `package.json`

## Connected to

- **owns:** build outputs in repo root
- **owned-by:** CI (release.yml, build-node-pty.yml) and the developer loop (`npm run dev`)
- **joins:** binary-manager downloads the *other* artifact family (node-pty zips) from releases
- **looks-like-but-is-not:** "binaries" in the UI — collision in the map catalog

## If you change this

- **Hits:** release automation assumptions (asset names, tag format), lint gate (`eslint src`, review bot)
- **Does not hit:** runtime plugin behavior except through what gets bundled

## Surfaces

| Surface | Role |
|---|---|
| Developers | `npm run dev/build`, `node install.mjs` |
| GitHub Actions | builds and releases on tags |

## See

- Source: `esbuild.config.mjs`, `install.mjs`
