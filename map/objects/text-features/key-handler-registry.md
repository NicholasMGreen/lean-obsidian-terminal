---
type: object
cluster: text-features
universe: live
status: verified
entity: src/key-handler-registry.ts
---

# KeyHandlerRegistry (public API)

Plugin-level registry behind the public `TerminalPlugin.registerKeyHandler()` API: downstream plugins register handlers that see every keystroke in every terminal tab, before built-in handling. Class `KeyHandlerRegistry` (`key-handler-registry.ts:36`), type `TerminalKeyHandler` (`:23`).

## Why this shape

Dispatch is registration order — `custom[0]…custom[n] → built-in` — and the first handler returning `false` consumes the event (`key-handler-registry.ts:29-33`). The dispatch logic is deliberately free of Obsidian/xterm imports so it unit-tests in isolation (`:35-36`).

## Shape

- `register()` returns an idempotent unregister function for the caller's `onunload`
- Handlers receive the **DOM** `KeyboardEvent` (not xterm's internal `IKeyboardEvent` — see doc comment `:1-21`)
- One shared instance across all views/tabs (`main.ts:24`); cleared in `onunload`

Citations: `src/key-handler-registry.ts:1-87`, `src/main.ts:26-49`

## Connected to

- **owns:** the ordered handler list
- **owned-by:** TerminalPlugin
- **joins:** TerminalTabManager `installKeyHandler` (`terminal-tab-manager.ts:790`) calls the chain inside xterm's `attachCustomKeyEventHandler`; wikilink-autocomplete runs as the built-in tail of the chain
- **looks-like-but-is-not:** not the Obsidian command palette — this is keystroke-level, in-terminal

## If you change this

- **Hits:** downstream plugins' public contract (breaking change surface — the plugin's only public API besides exports); event ordering for autocomplete
- **Does not hit:** settings, persistence, PTY

## Surfaces

| Surface | Role |
|---|---|
| Downstream plugins | register/unregister — external consumer |
| Tests | `key-handler-registry.test.ts` |

## See

- Source: `src/key-handler-registry.ts`
- As-built: `docs/key-handler-api.md`
