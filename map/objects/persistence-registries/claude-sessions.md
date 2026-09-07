---
type: object
cluster: persistence-registries
universe: live
status: verified
entity: src/claude-sessions.ts
---

# ClaudeSessions (conversation registry)

Scans Claude Code's on-disk project transcripts (`~/.claude/projects/<encoded-cwd>/*.jsonl`) into a registry used by the restore picker and resume links. Key exports: `ClaudeSessionEntry` (`claude-sessions.ts:6`), `encodeProjectDir` (`:30`), `scanClaudeProjectSessions` (`:39`), `refreshClaudeRegistry` (`:193`), `resumeClaudeSession` (`:260`), `getVaultBasePath` (`:282`).

## Why this shape

Claude Code already persists conversations as JSONL keyed by an encoded cwd (non-alphanumerics → `-`); the plugin just mirrors that encoding and cross-references `sessions-index.json` for summaries (`claude-sessions.ts:24-27,39-60`). "Resume" is a new terminal tab whose `resumeCommand` replays `claude --resume <uuid>` — no live-session coupling.

## Shape

- Path-safety check: must be absolute, no `..` segments (`claude-sessions.ts:43-46`)
- Registry note written into the vault for clickable `obsidian://lean-terminal?resume=<id>` links
- URI handler is always registered; the setting gates behavior, not registration (`main.ts:180-186`)

Citations: `src/claude-sessions.ts:1-286`

## Connected to

- **owns:** nothing persistent except the generated registry note in the vault
- **owned-by:** TerminalPlugin (commands + URI handler)
- **joins:** terminal-opener (resume opens a tab), recent-sessions (picker source), TerminalTabManager (`setupAutoResume` runs the resume command after spawn, `terminal-tab-manager.ts:460`)
- **looks-like-but-is-not:** a terminal session registry — collision called out in the map catalog

## If you change this

- **Hits:** the `encodeProjectDir` contract with Claude Code's own on-disk layout; URI links already written into user vaults (external consumers — changing the protocol params breaks old notes)
- **Does not hit:** normal tab persistence (SavedTab) except via `resumeCommand`

## Surfaces

| Surface | Role |
|---|---|
| Claude Code users | picker + resume links |
| External | vault notes contain `obsidian://lean-terminal?resume=...` URIs — a consumer outside the repo |

## See

- Source: `src/claude-sessions.ts`
