---
type: object
cluster: pty-platform
universe: live
status: verified
entity: src/shell-integration.ts
---

# ShellIntegration

Materializes OSC 133 shell-integration init scripts (bash/zsh/pwsh) into `pluginDir/shell-integration/` on demand and returns the env/args that inject them. Function `getShellIntegration` (`shell-integration.ts:95`).

## Why this shape

Shells can't be assumed to have integration hooks installed, so the plugin writes its own tiny init files and points the shell at them via env (`BASH_ENV`) or args (`pwsh -File`) or a hijacked `ZDOTDIR` (`shell-integration.ts:117-130`).

## Shape

- `ShellIntegrationResult = { env, args }` (`shell-integration.ts:89-93`)
- Windows pwsh: `-NoLogo -NoExit -ExecutionPolicy Bypass -File <init>` (`:100-105`); cmd.exe: no hook support (`:107-108`)
- zsh: writes `.zshenv/.zprofile/.zshrc` wrappers that chain the user's real dotfiles (`:110-130`)
- Scripts are embedded strings in this file; `ensureScript` writes only if missing

Citations: `src/shell-integration.ts:80-142`

## Connected to

- **owns:** `pluginDir/shell-integration/` contents (generated, user-editable at their own risk)
- **owned-by:** PtyManager.spawn (called every spawn, `pty-manager.ts:169-177`)
- **joins:** OSC 133 sequences flow into xterm parser handlers in terminal-tab-manager (prompt marking)
- **looks-like-but-is-not:** not a general shell-config tool; only what OSC 133 needs

## If you change this

- **Hits:** every shell launch on every platform; zsh users with custom ZDOTDIR; spawn args precedence (script args *replace* base args like `-l`, `pty-manager.ts:177-180`)
- **Does not hit:** shell detection (which shell); binary download

## Surfaces

| Surface | Role |
|---|---|
| Shell process | receives env/args |
| Humans | see scripts appear in the plugin folder |

## See

- Source: `src/shell-integration.ts`
