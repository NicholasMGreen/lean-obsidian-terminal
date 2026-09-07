---
type: object
cluster: view-chain
universe: live
status: verified
entity: src/main.ts
---

# TerminalPlugin

The plugin lifecycle root: registers the view, all commands, the ribbon icon, settings, the URI handler, and the public key-handler API. File is `main.ts`, class `TerminalPlugin` (`main.ts:18`).

## Why this shape

Everything user-reachable (commands, ribbon, protocol handler) must be registered in `onload`, so this file is the single place a new entry point gets wired. It holds no terminal logic itself — it fans updates out to every `TerminalView` via `getLeavesOfType(VIEW_TYPE_TERMINAL)`.

## Shape

- `settings`, `binaryManager`, `themeRegistry`, shared `keyHandlerRegistry` (`main.ts:20-24`)
- Commands: open/close/toggle, new-tab, open-split, open-here, restore-recent, refresh-claude-registry, tab navigation 1–8 / first / last (`main.ts:78-186`)
- URI protocol handler `lean-terminal` — always registered; gating lives in `resumeClaudeSession` (`main.ts:180-186`)
- `onunload` clears the registry and detaches leaves after a tick (`main.ts:231+`)
- Quit flush: `workspace.on("quit") → requestSaveLayout.run()` (`main.ts:214-217`)
- Dark/light observer flips terminal themes on class change (`main.ts:220-230`)
- Public API: `registerKeyHandler()` (`main.ts:48`)

Citations: `src/main.ts:18-188`

## Connected to

- **owns:** BinaryManager, ThemeRegistry, KeyHandlerRegistry, TerminalSettingTab
- **owned-by:** Obsidian plugin loader (manifest id `lean-terminal`)
- **joins:** TerminalView via `registerView(VIEW_TYPE_TERMINAL)` (`main.ts:70`)
- **looks-like-but-is-not:** `constants.ts:1` exports the view type string; the view class lives in `terminal-view.ts`

## If you change this

- **Hits:** command palette surface, ribbon, plugin discovery — Obsidian review-bot territory; persistence paths that call `saveSettings`
- **Does not hit:** PTY spawn behavior or xterm rendering (this file never touches either)

## Surfaces

| Surface | Role |
|---|---|
| Obsidian app | reads manifest, invokes lifecycle |
| Downstream plugins | call `registerKeyHandler()` via `app.plugins.plugins["lean-terminal"]` |
| Agents (Claude Code) | edit commands here — this is a Tier-1 review file per repo CLAUDE.md |

## See

- Source: `src/main.ts`
