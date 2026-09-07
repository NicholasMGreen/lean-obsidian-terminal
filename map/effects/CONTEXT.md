---
type: context
scope: effects/
---

# Change-impact index

"If you are changing X, open these cards." First-order effects only; each card's own "Hits / Does not hit" holds the detail. If this index and a card disagree, fix the card.

| You are changing… | Open first | Second-order to know about |
|---|---|---|
| `main.ts` (commands, ribbon, lifecycle) | `../objects/view-chain/terminal-plugin.md` | plugin discovery/review tier 1 |
| Tab UI, close/pin/rename, search | `../objects/view-chain/terminal-tab-manager.md` | `../processes/pty-lifecycle.md` (cleanup), `../processes/persist-restore.md` (serialization) |
| View open/restore/state | `../objects/view-chain/terminal-view.md` | `../processes/open-terminal.md`, saved-tab card |
| PTY spawn, shells, env | `../objects/pty-platform/pty-manager.md` | shell-integration, windows-conpty cards |
| node-pty binaries / download | `../objects/pty-platform/binary-manager.md` | build-release process, windows-conpty |
| Windows anything | `../objects/pty-platform/windows-conpty.md` | pty-manager, binary-manager |
| Settings schema or UI | `../objects/config-theming/settings.md` | persist-restore (data.json), every reader of the key |
| Themes / colors | `../objects/config-theming/themes.md`, `tab-colors.md` | tab-manager `updateTheme`/`updateBackgroundColor` |
| Persistence types | `../objects/persistence-registries/saved-tab.md` | terminal-view sanitize regexes |
| Claude resume / registry | `../objects/persistence-registries/claude-sessions.md` | **external: URIs already written in user vaults** |
| Keystroke handling / autocomplete | `../objects/text-features/key-handler-registry.md`, `wikilink-autocomplete.md` | ordering contract in key-handler card |
| Clickable paths | `../objects/text-features/path-links.md` | — |
| Build, CI, release, versioning | `../processes/build-release.md` | plugin-artifacts, binary-manager |
| Node API usage / lint errors | `../objects/pty-platform/node-api.md` | — |

## Outside-in consumers (break silently)

Nothing in the repo references these; they reference the repo:

1. **User vaults** contain `obsidian://lean-terminal?resume=<uuid>` links — changing the URI scheme or params breaks existing notes (`claude-sessions.ts:260+`, handler at `main.ts:180-186`).
2. **Downstream plugins** call `registerKeyHandler()` and read `app.plugins.plugins["lean-terminal"]` — the registry contract and exported types (`TerminalSession`, `TerminalKeyHandler`) are public API (`main.ts:15-16,37`).
3. **Installed plugins in the wild** fetch release assets by name from `sdkasper/lean-obsidian-terminal` (`binary-manager.ts:22-23`) — renaming release assets strands existing installs.
4. **Tag format** is a CI trigger contract: bare semver matching manifest.json exactly; `arm64-prebuilds-v1` release asset is consumed by CI (repo CLAUDE.md).
5. **`install.mjs`** hardcodes `D:\LOS Test` as default vault path (`install.mjs:8`) — an author-machine path, not portable.
6. **Agile artifacts** live in the user's vault at `01 Projects/LP Products/Lean Obsidian Terminal/` — referenced by repo CLAUDE.md, not by the tree.
