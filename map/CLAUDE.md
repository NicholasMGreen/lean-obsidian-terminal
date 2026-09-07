# lean-obsidian-terminal — system map

Obsidian desktop plugin: embedded PTY terminal panel (xterm.js + node-pty), no external windows. Chain: **Plugin → View → TabManager → PtyManager**. The subject tree (`src/`, `docs/`, `.github/`) stays the source of truth; these cards cite it, never restate it.

## Name collisions

| Word | Here means | Not |
|---|---|---|
| Session | A live terminal tab (`TerminalSession`), or its persisted form (`SavedTab`) | A Claude Code conversation (`claude-sessions.ts` scans transcripts) |
| Theme | xterm.js color theme (`themes.ts`, `theme-registry.ts`) | Obsidian's own dark/light theme (watched by an observer in `main.ts`) |
| Binary | The node-pty native module package downloaded at runtime (`binary-manager.ts`) | The plugin bundle `main.js` |

## Route by what just happened

| If you are asked to | Open | Then |
|---|---|---|
| understand the plugin lifecycle / commands / ribbon | `objects/view-chain/terminal-plugin.md` | |
| change tab UI, close/pin/rename, xterm wiring | `objects/view-chain/terminal-tab-manager.md` | |
| touch PTY spawn, shells, Windows ConPTY | `objects/pty-platform/pty-manager.md` | |
| touch native binary download/update | `objects/pty-platform/binary-manager.md` | |
| add/change a setting | `objects/config-theming/settings.md` | then `map/effects/CONTEXT.md` |
| change persistence / restore | `objects/persistence-registries/saved-tab.md` | |
| cut a release / change CI | `processes/build-release.md` | |
| know what a change will hit | `effects/CONTEXT.md` | open the cards it names |

## Universes

- **live** — in force; implement against these.
- **leftover** — present, not the main path (`.planning/phases/`, old code-review doc). Touch only if in scope.
- **ghost** — named but not wired. None found at map time (2026-09-07, commit 2cd98ff); if you find one, add it here.

## Rules

- Cards cite `path:line`; if a card and the code disagree, the code wins — fix the card.
- `AGENTS.md` and `routing.md` are byte-identical twins of this file. Never hand-edit them.
- Do not slurp `objects/` wholesale; the routing table above exists so you don't.
