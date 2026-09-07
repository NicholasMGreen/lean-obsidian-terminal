---
type: object
cluster: config-theming
universe: live
status: verified
entity: src/tab-colors.ts
---

# TabColors (palette + tinting)

Tab accent colors: a built-in palette of `TabColorDef` presets plus user-defined colors (`tab-colors.ts:6-27`), and the sRGB mixing math that tints the terminal background toward the tab color (`color-utils.ts:43` `mixHex`).

## Why this shape

A chosen tab color must both label the tab and tint the terminal background — without losing contrast. Tint strength is capped (`MAX_TINT_STRENGTH = 30`, `tab-colors.ts:23`) so a red tab never makes the terminal unreadable.

## Shape

- `DEFAULT_TAB_COLORS`, `findTabColor(palette, hex)` (`tab-colors.ts:13,29`)
- `mixHex(base, overlay, ratio)` — pure function, unit-tested (`color-utils.ts:43`)
- Palette is mutable via Settings (add custom color rows, `settings.ts:582`)

Citations: `src/tab-colors.ts:1-34`, `src/color-utils.ts:1-50`

## Connected to

- **owns:** the color palette + mixing math
- **owned-by:** settings (`settings.tabColors` array)
- **joins:** TerminalTabManager `updateBackgroundColor` (`terminal-tab-manager.ts:1304`) applies tint; `SavedTab.color` stores the hex
- **looks-like-but-is-not:** not a theme — themes restyle all ANSI colors; tab colors tint one session

## If you change this

- **Hits:** visual appearance only; `SavedTab.color` semantics if palette keys change
- **Does not hit:** PTY, persistence structure (color is just a stored string)

## Surfaces

| Surface | Role |
|---|---|
| Humans | pick/define colors in Settings and per-tab |
| Tests | `tab-colors.test.ts`, `color-utils.test.ts` |

## See

- Source: `src/tab-colors.ts`, `src/color-utils.ts`
