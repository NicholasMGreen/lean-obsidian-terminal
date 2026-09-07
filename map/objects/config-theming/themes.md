---
type: object
cluster: config-theming
universe: live
status: verified
entity: src/themes.ts
---

# Themes (built-ins + ThemeRegistry)

xterm.js color themes. `themes.ts` holds 12 built-in `ITheme`s (`BUILTIN_THEMES`, `themes.ts:7`) plus `isObsidianDark()` (`:287`). `theme-registry.ts` (`ThemeRegistry`, `theme-registry.ts:9`) merges optional user overrides from `themes.json` in the plugin folder.

## Why this shape

Built-ins ship with the bundle; user overrides must survive plugin updates, so they live outside the bundle as a JSON file merged over built-ins at load (`theme-registry.ts:19-31`). Obsidian dark/light sync is handled upstream by the MutationObserver in `main.ts:220-230`, not here.

## Shape

- `BUILTIN_THEMES: Record<string, ITheme>` (`themes.ts:7-286`)
- `ThemeRegistry.load()` at plugin onload; load errors collected, not thrown (`theme-registry.ts:16-32`)
- Applied per session by `TerminalTabManager.updateTheme` (`terminal-tab-manager.ts:1311`), with tab-color tint mixing on top

Citations: `src/themes.ts:1-290`, `src/theme-registry.ts:1-73`

## Connected to

- **owns:** theme lookup for the whole plugin
- **owned-by:** TerminalPlugin (constructed in onload, `main.ts:66-68`)
- **joins:** tab-colors (background tint layered over theme background via `mixHex`); main.ts (dark/light observer)
- **looks-like-but-is-not:** not Obsidian's theme system — collision noted in map catalog

## If you change this

- **Hits:** every terminal's rendering; users with a `themes.json` overriding a same-named built-in
- **Does not hit:** tab accent colors (separate palette); settings schema

## Surfaces

| Surface | Role |
|---|---|
| Humans | pick in Settings; power users edit `themes.json` |
| Tests | `themes.test.ts`, `theme-registry.test.ts` |

## See

- Source: `src/themes.ts`, `src/theme-registry.ts`
