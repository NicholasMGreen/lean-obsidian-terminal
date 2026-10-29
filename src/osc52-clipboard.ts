// Write-only OSC 52 clipboard handler (#103). Programs in the terminal may SET
// the system clipboard, but a read query ("?") is ignored with no reply so a
// remote or untrusted process can never exfiltrate clipboard contents.
//
// Registered directly on xterm's parser instead of via @xterm/addon-clipboard:
// that addon's typings disagree with its real constructor argument order, and
// its decoder turns malformed input into an empty write that clears the clipboard.

/** Ignore pastes beyond this size so a runaway program cannot flood the clipboard. */
export const OSC52_MAX_WRITE_CHARS = 1_000_000;

interface OscParser {
  registerOscHandler(
    ident: number,
    callback: (data: string) => boolean | Promise<boolean>
  ): { dispose(): void };
}

// One UTF-16 unit is at most 3 UTF-8 bytes = 4 base64 chars. Checked before any
// regex or decode work: xterm allows OSC payloads up to 10M chars and a long
// input must never get far enough to overflow the stack.
const MAX_ENCODED_CHARS = 4 * OSC52_MAX_WRITE_CHARS + 4;

// Linear-time shape check (a grouped repeat overflows the stack on huge input).
const BASE64_CHARS_RE = /^[A-Za-z0-9+/]*={0,2}$/;

function decodeBase64Utf8(encoded: string): string | null {
  if (!encoded || encoded.length > MAX_ENCODED_CHARS) return null;
  if (encoded.length % 4 !== 0 || !BASE64_CHARS_RE.test(encoded)) return null;
  try {
    const binary = atob(encoded);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return null;
  }
}

/**
 * Handle OSC 52 (`52;<selections>;<base64>`). Only the system clipboard ("c",
 * or an empty selection list) is written; empty, malformed or oversized
 * payloads are ignored rather than clearing the clipboard.
 */
export function registerOsc52(
  parser: OscParser,
  write: (text: string) => Promise<void>
): { dispose(): void } {
  return parser.registerOscHandler(52, (data) => {
    // A synchronous throw from a handler kills xterm's write loop and the tab
    // stops parsing output for good, so nothing may escape this function.
    try {
      const sep = data.indexOf(";");
      if (sep === -1) return true;
      const selections = data.slice(0, sep);
      if (selections !== "" && !selections.includes("c")) return true;
      const text = decodeBase64Utf8(data.slice(sep + 1));
      if (text === null || text === "" || text.length > OSC52_MAX_WRITE_CHARS) return true;
      // Clipboard unavailable (permissions, focus): drop silently like a normal copy failure.
      void Promise.resolve().then(() => write(text)).catch(() => undefined);
    } catch {
      // Ignore: a malformed sequence must never reach the parser.
    }
    return true;
  });
}
