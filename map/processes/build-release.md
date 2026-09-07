---
type: process
status: verified
consumes: ["../objects/delivery/plugin-artifacts.md", "../objects/pty-platform/binary-manager.md", "../objects/pty-platform/windows-conpty.md"]
produces: ["../objects/delivery/plugin-artifacts.md"]
---

# Build & release

A git tag becomes an installable plugin release plus downloadable node-pty binaries.

## Input → Movement → Output

Input: a bare semver tag (`1.4.0`, never `v1.4.0` — must match manifest.json). Movement: CI builds the plugin, builds node-pty per-platform with the ConoutConnection patch, creates a GitHub release. Output: release assets users' BinaryManager downloads.

## Why this shape

The plugin bundle and native binaries are built by separate workflows because node-pty needs a native toolchain per platform, and arm64-prebuilds are downloaded from a prior release asset rather than tracked in git (repo CLAUDE.md CI/CD note).

## Steps

1. Developer: `npm test`, `npm run lint`, `npm run build` (tsc type-check + esbuild production) (`package.json` scripts).
2. Push tag → `release.yml` builds plugin + creates the GitHub release; `build-node-pty.yml` builds per-platform node-pty zips (win32-x64 includes `third_party` ConPTY, arm64 does not).
3. `changelog.yml` regenerates CHANGELOG on release; skips prereleases.
4. `ci.yml` runs tests+lint on pushes to master.
5. User's BinaryManager downloads the platform zip from releases at runtime (`src/binary-manager.ts:22-23`).

## If you change this

- **Hits:** asset naming that binary-manager matches; arm64 ConPTY gate assumptions (windows-conpty card); CHANGELOG generation
- **Does not hit:** runtime behavior of already-installed plugins

## Surfaces

| Surface | Role |
|---|---|
| Developers | tag pushes |
| GitHub Actions | all building — never build releases by hand |

## See

- Objects: plugin-artifacts, binary-manager, windows-conpty
- Source: `.github/workflows/*.yml`
