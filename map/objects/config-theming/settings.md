---
type: object
cluster: config-theming
universe: live
status: verified
entity: src/settings.ts
---

# Settings

User configuration: the `TerminalPluginSettings` interface + `DEFAULT_SETTINGS`, `resolveShellPath()`, and the Settings UI (`TerminalSettingTab`). File `settings.ts` (`settings.ts:38,80,118,124`).

## Why this shape

Settings is both a **data noun** (serialized whole into `data.json` via `saveData`) and a **UI surface**. The UI is declarative-schema based with in-app search on Obsidian 1.13+, imperative rendering as fallback (repo CLAUDE.md). `tabColors` is the only array and is deep-cloned on load so mutations don't leak into the module-level default (`main.ts:392`).

## Shape

- `TerminalPluginSettings` (`settings.ts:38`), `DEFAULT_SETTINGS` (`:78`)
- Enum types: `NotificationSound`, `WikiLinkInsertMode`, `CursorStyle` (`:25-36`)
- `showTabBar` (`:70`, default `true`, `:110`): hides the in-panel tab bar via the `terminal-tabs-hidden` CSS class — CSS-only, so sessions/switching/restore are unaffected. Fan-out: `TerminalPlugin.updateTabBarVisibility` → `TerminalView.updateTabBarVisibility`
- `resolveShellPath` (`:115`) maps a settings shell path to a real executable
- Sections in the UI: Terminal binary, Behavior, Appearance, plus tab colors, Claude integration, persistence (`:760-1165`)
- Recents buffer lives here too: `settings.recentSessions` (see recent-sessions card)

Citations: `src/settings.ts:25-1165` (1,370 lines)

## Connected to

- **owns:** all persisted user prefs in `data.json`
- **owned-by:** TerminalPlugin (`loadSettings`/`saveSettings`, `main.ts:385-393`)
- **joins:** everything — tab manager reads it directly; BinaryManager status is rendered inside it
- **looks-like-but-is-not:** `themes.json` is NOT settings — it is an optional override file read by ThemeRegistry

## If you change this

- **Hits:** `data.json` compatibility on upgrade (schema changes need migration thought — Tier-1 per repo CLAUDE.md); Settings UI; every reader of the changed key
- **Does not hit:** themes.ts built-ins; PTY behavior except through the setting values it reads

## Surfaces

| Surface | Role |
|---|---|
| Humans | edit in Settings tab |
| Obsidian | persists `data.json` |

## See

- Source: `src/settings.ts`
- As-built: `docs/settings.md`
