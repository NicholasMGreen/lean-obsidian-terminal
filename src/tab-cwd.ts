export interface TabCwdPlan {
  /** Directory to spawn the shell in. */
  spawn: string;
  /** Directory to persist on the session. Keeps the requested path after a fallback. */
  stored: string;
  /** True when a non-empty request was replaced by the fallback. */
  fellBack: boolean;
}

/**
 * Decide the working directory for a new tab. An empty or whitespace-only string counts
 * as missing: node-pty would otherwise fall back to Obsidian's process cwd instead of
 * the view's default cwd (the vault root). A requested cwd that is not an existing
 * directory (a restored tab whose folder was moved or deleted) also falls back,
 * because spawning into it fails outright. `isDir` is injected so this stays pure.
 *
 * The requested path is still what gets stored: a drive that is only temporarily
 * missing must not lose its saved folder the next time the layout is saved.
 */
export function planTabCwd(
  requested: string | undefined,
  fallback: string,
  isDir: (path: string) => boolean
): TabCwdPlan {
  if (!requested?.trim()) return { spawn: fallback, stored: fallback, fellBack: false };
  let exists = false;
  try {
    exists = isDir(requested);
  } catch {
    exists = false;
  }
  return exists
    ? { spawn: requested, stored: requested, fellBack: false }
    : { spawn: fallback, stored: requested, fellBack: true };
}
