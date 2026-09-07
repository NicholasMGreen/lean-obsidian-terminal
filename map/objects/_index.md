---
type: index
updated: 2026-09-07
commit: 2cd98ff
---

# Objects index

One line per noun. Status: verified (re-checked at commit above) | stub | stale.

| Card | Noun | Status |
|---|---|---|
| `view-chain/terminal-plugin.md` | TerminalPlugin — lifecycle, commands, ribbon, public API | verified |
| `view-chain/terminal-view.md` | TerminalView — ItemView shell, state save/restore boundary | verified |
| `view-chain/terminal-tab-manager.md` | TerminalTabManager — sessions, xterm build, tab bar (largest file) | verified |
| `view-chain/terminal-opener.md` | openTabOrView — open/restore routing bridge | verified |
| `pty-platform/pty-manager.md` | PtyManager — node-pty spawn wrapper, shell detection | verified |
| `pty-platform/binary-manager.md` | BinaryManager — node-pty download/manage | verified |
| `pty-platform/shell-integration.md` | ShellIntegration — OSC 133 init script injection | verified |
| `pty-platform/node-api.md` | requireNode — structural Node types (no @types/node) | verified |
| `pty-platform/windows-conpty.md` | Windows ConPTY dll gate + ConoutConnection patch | verified |
| `config-theming/settings.md` | Settings — data + UI (declarative schema) | verified |
| `config-theming/themes.md` | Themes — built-ins + ThemeRegistry/themes.json | verified |
| `config-theming/tab-colors.md` | TabColors — palette + mixHex tinting | verified |
| `persistence-registries/saved-tab.md` | SavedTab/SavedViewState/RecentSession types | verified |
| `persistence-registries/recent-sessions.md` | RecentSessions — rescue buffer + picker | verified |
| `persistence-registries/claude-sessions.md` | ClaudeSessions — transcript registry + resume | verified |
| `text-features/path-links.md` | PathLinks — clickable path tokens | verified |
| `text-features/wikilink-autocomplete.md` | WikiLinkAutocomplete — `[[` overlay in-terminal | verified |
| `text-features/key-handler-registry.md` | KeyHandlerRegistry — public registerKeyHandler API | verified |
| `delivery/plugin-artifacts.md` | main.js bundle, manifest, install.mjs | verified |

Not carded (deliberately): `constants.ts` (one constant), `obsidian-internals.ts` (typed access to drag manager — cited inside terminal-tab-manager), `styles.css`, test files (each card names its own `*.test.ts`).
