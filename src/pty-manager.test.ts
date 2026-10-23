import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import {
  clearStorePwshCache,
  pickWindowsDefaultShell,
  repairConptyLayout,
  resolveWindowsStorePwshAlias,
  shouldEnableConptyDll,
} from "./pty-manager";
import type { ChildProcessApi, FsApi, PathApi } from "./node-api";

// shouldEnableConptyDll only touches existsSync and path.join, so an
// in-memory fake is enough - no real filesystem or Electron needed.
function fakeFs(files: Set<string>): FsApi {
  return {
    existsSync: (p: string) => files.has(p),
  } as unknown as FsApi;
}

const posixPath: PathApi = {
  join: (...parts: string[]) => parts.join("/"),
  isAbsolute: (p: string) => p.startsWith("/"),
  sep: "/",
};

const NODE_PTY_DIR = "/plugin/node_modules/node-pty";

// node-pty's native loader resolves conpty.dll / OpenConsole.exe relative to
// the directory holding conpty.node, i.e. prebuilds/<platform>-<arch>/conpty/.
const conptyDir = (arch: string) => `${NODE_PTY_DIR}/prebuilds/win32-${arch}/conpty`;
const conptyFiles = (arch: string) => [
  `${conptyDir(arch)}/conpty.dll`,
  `${conptyDir(arch)}/OpenConsole.exe`,
];

describe("shouldEnableConptyDll", () => {
  it("returns false on non-Windows platforms", () => {
    const fs = fakeFs(new Set());
    expect(shouldEnableConptyDll(fs, posixPath, NODE_PTY_DIR, "darwin", "x64")).toBe(false);
  });

  it("returns false for unsupported Windows architectures", () => {
    const fs = fakeFs(new Set());
    expect(shouldEnableConptyDll(fs, posixPath, NODE_PTY_DIR, "win32", "ia32")).toBe(false);
  });

  it("returns false when prebuilds/<arch>/conpty is absent", () => {
    const fs = fakeFs(new Set());
    expect(shouldEnableConptyDll(fs, posixPath, NODE_PTY_DIR, "win32", "arm64")).toBe(false);
  });

  it("returns false when only one of conpty.dll / OpenConsole.exe exists", () => {
    const fs = fakeFs(new Set([`${conptyDir("x64")}/conpty.dll`]));
    expect(shouldEnableConptyDll(fs, posixPath, NODE_PTY_DIR, "win32", "x64")).toBe(false);
  });

  it("returns true when conpty.dll and OpenConsole.exe exist in prebuilds/<arch>/conpty", () => {
    const fsX64 = fakeFs(new Set(conptyFiles("x64")));
    expect(shouldEnableConptyDll(fsX64, posixPath, NODE_PTY_DIR, "win32", "x64")).toBe(true);
    const fsArm = fakeFs(new Set(conptyFiles("arm64")));
    expect(shouldEnableConptyDll(fsArm, posixPath, NODE_PTY_DIR, "win32", "arm64")).toBe(true);
  });

  it("returns false for an arm64 host even when only x64 files are present", () => {
    const fs = fakeFs(new Set(conptyFiles("x64")));
    expect(shouldEnableConptyDll(fs, posixPath, NODE_PTY_DIR, "win32", "arm64")).toBe(false);
  });

  it("returns false when existsSync throws (e.g. permission error)", () => {
    const fs: FsApi = {
      existsSync: () => {
        throw new Error("EACCES");
      },
    } as unknown as FsApi;
    expect(shouldEnableConptyDll(fs, posixPath, NODE_PTY_DIR, "win32", "x64")).toBe(false);
  });

  // Regression for #105: the 1.4.0 win32-arm64 package shipped third_party/conpty
  // plus conpty.dll / OpenConsole.exe flat in prebuilds/win32-arm64/. The gate used
  // to pass on third_party alone, then node-pty failed to spawn with "Cannot find
  // conpty.dll at <...>/prebuilds/win32-arm64/conpty/conpty.dll".
  it("returns false for the 1.4.0 arm64 layout (third_party + flat prebuilds, no conpty/ subdir)", () => {
    const tp = `${NODE_PTY_DIR}/third_party/conpty/1.23.251008001/win10-arm64`;
    const flat = `${NODE_PTY_DIR}/prebuilds/win32-arm64`;
    const fs = fakeFs(
      new Set([
        `${tp}/conpty.dll`,
        `${tp}/OpenConsole.exe`,
        `${flat}/conpty.dll`,
        `${flat}/OpenConsole.exe`,
      ])
    );
    expect(shouldEnableConptyDll(fs, posixPath, NODE_PTY_DIR, "win32", "arm64")).toBe(false);
  });
});

// Mutable in-memory fs for repairConptyLayout: tracks files, records copies.
function writableFs(initial: string[]) {
  const files = new Set(initial);
  const copies: Array<[string, string]> = [];
  const fs = {
    existsSync: (p: string) => files.has(p),
    mkdirSync: () => {},
    copyFileSync: (src: string, dest: string) => {
      if (!files.has(src)) throw new Error(`ENOENT: ${src}`);
      files.add(dest);
      copies.push([src, dest]);
    },
  } as unknown as FsApi;
  return { fs, copies };
}

describe("repairConptyLayout", () => {
  const flatDir = `${NODE_PTY_DIR}/prebuilds/win32-arm64`;
  const flat = [`${flatDir}/conpty.dll`, `${flatDir}/OpenConsole.exe`];

  // Regression for #105: installs from the 1.4.0 win32-arm64 zip have the files
  // flat; repairing them must make the gate pass without a re-download.
  it("copies flat conpty.dll/OpenConsole.exe into conpty/ so the gate passes", () => {
    const { fs, copies } = writableFs(flat);
    expect(shouldEnableConptyDll(fs, posixPath, NODE_PTY_DIR, "win32", "arm64")).toBe(false);

    expect(repairConptyLayout(fs, posixPath, NODE_PTY_DIR, "win32", "arm64")).toBe(true);

    expect(copies).toEqual([
      [`${flatDir}/conpty.dll`, `${conptyDir("arm64")}/conpty.dll`],
      [`${flatDir}/OpenConsole.exe`, `${conptyDir("arm64")}/OpenConsole.exe`],
    ]);
    expect(shouldEnableConptyDll(fs, posixPath, NODE_PTY_DIR, "win32", "arm64")).toBe(true);
  });

  it("is a no-op when the conpty/ layout is already correct", () => {
    const { fs, copies } = writableFs(conptyFiles("x64"));
    expect(repairConptyLayout(fs, posixPath, NODE_PTY_DIR, "win32", "x64")).toBe(false);
    expect(copies).toEqual([]);
  });

  it("only copies the file that is missing from a partial conpty/ dir", () => {
    const { fs, copies } = writableFs([...flat, `${conptyDir("arm64")}/conpty.dll`]);
    expect(repairConptyLayout(fs, posixPath, NODE_PTY_DIR, "win32", "arm64")).toBe(true);
    expect(copies).toEqual([
      [`${flatDir}/OpenConsole.exe`, `${conptyDir("arm64")}/OpenConsole.exe`],
    ]);
  });

  it("does nothing when the flat files are absent (nothing to repair from)", () => {
    const { fs, copies } = writableFs([]);
    expect(repairConptyLayout(fs, posixPath, NODE_PTY_DIR, "win32", "arm64")).toBe(false);
    expect(copies).toEqual([]);
  });

  it("does nothing on non-Windows platforms or unsupported architectures", () => {
    const { fs, copies } = writableFs(flat);
    expect(repairConptyLayout(fs, posixPath, NODE_PTY_DIR, "darwin", "arm64")).toBe(false);
    expect(repairConptyLayout(fs, posixPath, NODE_PTY_DIR, "win32", "ia32")).toBe(false);
    expect(copies).toEqual([]);
  });

  it("never throws and returns false when the copy fails (e.g. read-only dir)", () => {
    const fs = {
      existsSync: (p: string) => flat.includes(p),
      mkdirSync: () => {},
      copyFileSync: () => {
        throw new Error("EACCES");
      },
    } as unknown as FsApi;
    expect(repairConptyLayout(fs, posixPath, NODE_PTY_DIR, "win32", "arm64")).toBe(false);
  });
});

describe("resolveWindowsStorePwshAlias", () => {
  const alias = "C:\\Users\\Test\\AppData\\Local\\Microsoft\\WindowsApps\\pwsh.exe";
  const installed = "C:\\Program Files\\WindowsApps\\Microsoft.PowerShell_7.6.6.0_x64__8wekyb3d8bbwe\\pwsh.exe";

  const installLocation = installed.slice(0, -"\\pwsh.exe".length);
  // Mirrors the 60 s cool-off after a failed lookup in pty-manager.ts.
  const STORE_RETRY_MS = 60_000;

  beforeEach(() => {
    clearStorePwshCache();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-22T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function storeFs(present: string[] = [installed]): FsApi {
    return {
      existsSync: () => true,
      statSync: (path: string) => {
        if (!present.includes(path)) {
          throw Object.assign(new Error("ENOENT"), { code: "ENOENT" });
        }
        return { isFile: () => true };
      },
    } as unknown as FsApi;
  }

  // Each call consumes the next output (the last one repeats); an Error is thrown,
  // like execFileSync does on a non-zero exit or a timeout.
  function countingChildProcess(...outputs: Array<string | Error>) {
    const calls: string[] = [];
    const argLists: string[][] = [];
    const optionsList: unknown[] = [];
    const childProcess = {
      execFileSync: (file: string, args: string[], options: unknown) => {
        const output = outputs[Math.min(calls.length, outputs.length - 1)];
        calls.push(file);
        argLists.push(args);
        optionsList.push(options);
        if (output instanceof Error) throw output;
        return output;
      },
    } as unknown as ChildProcessApi;
    return { calls, argLists, optionsList, childProcess };
  }

  it("resolves the Store alias via Get-AppxPackage only, never where.exe", () => {
    const { calls, childProcess } = countingChildProcess(`${installLocation}\r\n`);

    expect(resolveWindowsStorePwshAlias(alias, storeFs(), childProcess)).toBe(installed);
    expect(calls).toEqual(["powershell.exe"]);
  });

  it("runs a fixed, non-interactive command that never contains the shell path", () => {
    const { argLists, childProcess } = countingChildProcess(installLocation);

    resolveWindowsStorePwshAlias(alias, storeFs(), childProcess);
    const args = argLists[0];
    expect(args.slice(0, 4)).toEqual(["-NoLogo", "-NoProfile", "-NonInteractive", "-Command"]);
    expect(args).toHaveLength(5);
    expect(args[4]).toContain("Get-AppxPackage -Name Microsoft.PowerShell");
    expect(args.join(" ")).not.toContain(alias);
  });

  it("pins the 5 s timeout, hidden window and utf8 output on the lookup", () => {
    const { optionsList, childProcess } = countingChildProcess(installLocation);

    resolveWindowsStorePwshAlias(alias, storeFs(), childProcess);
    expect(optionsList[0]).toEqual({ encoding: "utf8", timeout: 5000, windowsHide: true });
  });

  it("pins the numeric [version] sort in the command", () => {
    const { argLists, childProcess } = countingChildProcess(installLocation);

    resolveWindowsStorePwshAlias(alias, storeFs(), childProcess);
    expect(argLists[0][4]).toContain("Sort-Object { [version]$_.Version } -Descending");
  });

  it("ignores warning lines printed before the install location", () => {
    const { childProcess } = countingChildProcess(
      `WARNING: Module 'Appx' loaded with compatibility\r\n${installLocation}\r\n`
    );

    expect(resolveWindowsStorePwshAlias(alias, storeFs(), childProcess)).toBe(installed);
  });

  it("looks the package up once and reuses the result for later spawns", () => {
    const { calls, childProcess } = countingChildProcess(installLocation);
    const fs = storeFs();

    expect(resolveWindowsStorePwshAlias(alias, fs, childProcess)).toBe(installed);
    expect(resolveWindowsStorePwshAlias(alias, fs, childProcess)).toBe(installed);
    expect(calls).toEqual(["powershell.exe"]);
  });

  it("picks up the new versioned folder after a Store update", () => {
    const updated = "C:\\Program Files\\WindowsApps\\Microsoft.PowerShell_7.6.7.0_x64__8wekyb3d8bbwe\\pwsh.exe";
    const updatedLocation = updated.slice(0, -"\\pwsh.exe".length);
    const { calls, childProcess } = countingChildProcess(installLocation, updatedLocation);

    expect(resolveWindowsStorePwshAlias(alias, storeFs([installed]), childProcess)).toBe(installed);
    // The old folder is gone after the update; only the new one exists.
    expect(resolveWindowsStorePwshAlias(alias, storeFs([updated]), childProcess)).toBe(updated);
    expect(calls).toEqual(["powershell.exe", "powershell.exe"]);
  });

  it("remembers a clean empty answer instead of repeating the lookup", () => {
    const { calls, childProcess } = countingChildProcess("");
    const fs = storeFs([]);

    expect(resolveWindowsStorePwshAlias(alias, fs, childProcess)).toBe(alias);
    expect(resolveWindowsStorePwshAlias(alias, fs, childProcess)).toBe(alias);
    expect(calls).toEqual(["powershell.exe"]);
  });

  it("does not cache a timeout or non-zero exit, so a later spawn retries", () => {
    const timeout = Object.assign(new Error("spawnSync powershell.exe ETIMEDOUT"), { code: "ETIMEDOUT" });
    const { calls, childProcess } = countingChildProcess(timeout, installLocation);
    const fs = storeFs();

    expect(resolveWindowsStorePwshAlias(alias, fs, childProcess)).toBe(alias);
    vi.advanceTimersByTime(STORE_RETRY_MS + 1);
    expect(resolveWindowsStorePwshAlias(alias, fs, childProcess)).toBe(installed);
    expect(calls).toEqual(["powershell.exe", "powershell.exe"]);
  });

  it("does not look up again for 60 s after a failure, so a hung lookup cannot freeze every tab", () => {
    const timeout = Object.assign(new Error("spawnSync powershell.exe ETIMEDOUT"), { code: "ETIMEDOUT" });
    const { calls, childProcess } = countingChildProcess(timeout, installLocation);
    const fs = storeFs();

    expect(resolveWindowsStorePwshAlias(alias, fs, childProcess)).toBe(alias);
    vi.advanceTimersByTime(STORE_RETRY_MS - 1);
    expect(resolveWindowsStorePwshAlias(alias, fs, childProcess)).toBe(alias);
    expect(calls).toEqual(["powershell.exe"]);

    vi.advanceTimersByTime(2);
    expect(resolveWindowsStorePwshAlias(alias, fs, childProcess)).toBe(installed);
    expect(calls).toEqual(["powershell.exe", "powershell.exe"]);
  });

  it("ends the cool-off when the system clock is set back instead of waiting for it to catch up", () => {
    const timeout = new Error("spawnSync powershell.exe ETIMEDOUT");
    const { calls, childProcess } = countingChildProcess(timeout, installLocation);
    const fs = storeFs();

    expect(resolveWindowsStorePwshAlias(alias, fs, childProcess)).toBe(alias);
    vi.setSystemTime(new Date("2026-10-22T10:00:00Z"));
    expect(resolveWindowsStorePwshAlias(alias, fs, childProcess)).toBe(installed);
    expect(calls).toEqual(["powershell.exe", "powershell.exe"]);
  });

  it("returns the alias, not the stale exe, when a Store update removed it and the lookup then fails", () => {
    const timeout = new Error("spawnSync powershell.exe ETIMEDOUT");
    const { calls, childProcess } = countingChildProcess(installLocation, timeout);

    expect(resolveWindowsStorePwshAlias(alias, storeFs([installed]), childProcess)).toBe(installed);
    // Update removes the old folder; the re-lookup fails and starts the cool-off.
    expect(resolveWindowsStorePwshAlias(alias, storeFs([]), childProcess)).toBe(alias);
    vi.advanceTimersByTime(STORE_RETRY_MS - 1);
    expect(resolveWindowsStorePwshAlias(alias, storeFs([]), childProcess)).toBe(alias);
    expect(calls).toEqual(["powershell.exe", "powershell.exe"]);
  });

  it("forgets the cool-off when the cache is cleared", () => {
    const timeout = new Error("spawnSync powershell.exe ETIMEDOUT");
    const { calls, childProcess } = countingChildProcess(timeout, installLocation);
    const fs = storeFs();

    resolveWindowsStorePwshAlias(alias, fs, childProcess);
    clearStorePwshCache();
    expect(resolveWindowsStorePwshAlias(alias, fs, childProcess)).toBe(installed);
    expect(calls).toEqual(["powershell.exe", "powershell.exe"]);
  });

  it("does not cache a registered package whose pwsh.exe is missing (update in flight)", () => {
    const { calls, childProcess } = countingChildProcess(installLocation);

    expect(resolveWindowsStorePwshAlias(alias, storeFs([]), childProcess)).toBe(alias);
    vi.advanceTimersByTime(STORE_RETRY_MS + 1);
    expect(resolveWindowsStorePwshAlias(alias, storeFs([installed]), childProcess)).toBe(installed);
    expect(calls).toEqual(["powershell.exe", "powershell.exe"]);
  });

  it("treats a package path that exists but is not a file as a failed lookup", () => {
    const { calls, childProcess } = countingChildProcess(installLocation);
    const notAFile = {
      existsSync: () => true,
      statSync: () => ({ isFile: () => false }),
    } as unknown as FsApi;

    expect(resolveWindowsStorePwshAlias(alias, notAFile, childProcess)).toBe(alias);
    // Not cached as a clean answer: after the cool-off it is looked up again.
    vi.advanceTimersByTime(STORE_RETRY_MS + 1);
    expect(resolveWindowsStorePwshAlias(alias, storeFs(), childProcess)).toBe(installed);
    expect(calls).toEqual(["powershell.exe", "powershell.exe"]);
  });

  it("does not spawn anything when the alias does not exist", () => {
    const calls: string[] = [];
    const fs = { existsSync: () => false } as unknown as FsApi;
    const childProcess = {
      execFileSync: (file: string) => {
        calls.push(file);
        return "";
      },
    } as unknown as ChildProcessApi;

    expect(resolveWindowsStorePwshAlias(alias, fs, childProcess)).toBe(alias);
    expect(calls).toEqual([]);
  });

  it("does not change a normal PowerShell path", () => {
    const fs = {} as FsApi;
    const childProcess = {} as ChildProcessApi;
    const normalPath = "C:\\Program Files\\PowerShell\\7\\pwsh.exe";

    expect(resolveWindowsStorePwshAlias(normalPath, fs, childProcess)).toBe(normalPath);
  });

  it("leaves the alias unchanged when no usable package executable is found", () => {
    const fs = {
      existsSync: () => true,
      statSync: () => {
        throw Object.assign(new Error("Access denied"), { code: "EACCES" });
      },
    } as unknown as FsApi;
    const childProcess = {
      execFileSync: () => installLocation,
    } as unknown as ChildProcessApi;

    expect(resolveWindowsStorePwshAlias(alias, fs, childProcess)).toBe(alias);
  });
});

describe("pickWindowsDefaultShell", () => {
  const standard = "C:\\Program Files\\PowerShell\\7\\pwsh.exe";
  const alias = "C:\\Users\\Test\\AppData\\Local\\Microsoft\\WindowsApps\\pwsh.exe";
  const installed = "C:\\Program Files\\WindowsApps\\Microsoft.PowerShell_7.6.6.0_x64__8wekyb3d8bbwe\\pwsh.exe";
  const env = {
    ProgramFiles: "C:\\Program Files",
    LOCALAPPDATA: "C:\\Users\\Test\\AppData\\Local",
    COMSPEC: "C:\\Windows\\System32\\cmd.exe",
  };

  beforeEach(() => {
    clearStorePwshCache();
  });

  function spawnCounter(output = "") {
    const calls: string[] = [];
    const childProcess = {
      execFileSync: (file: string) => {
        calls.push(file);
        return output;
      },
    } as unknown as ChildProcessApi;
    return { calls, childProcess };
  }

  function fsWith(files: string[]): FsApi {
    return {
      existsSync: (path: string) => files.includes(path),
      statSync: (path: string) => ({ isFile: () => files.includes(path) }),
    } as unknown as FsApi;
  }

  it("prefers the standard installer path without spawning anything", () => {
    const { calls, childProcess } = spawnCounter();
    expect(pickWindowsDefaultShell(env, fsWith([standard, alias]), childProcess)).toBe(standard);
    expect(calls).toEqual([]);
  });

  it("falls back to COMSPEC without spawning when neither PowerShell 7 path exists", () => {
    const { calls, childProcess } = spawnCounter();
    expect(pickWindowsDefaultShell(env, fsWith([]), childProcess)).toBe(env.COMSPEC);
    expect(calls).toEqual([]);
  });

  it("resolves the Store alias to the installed package when the alias exists", () => {
    const installLocation = installed.slice(0, -"\\pwsh.exe".length);
    const { calls, childProcess } = spawnCounter(`${installLocation}\r\n`);
    expect(pickWindowsDefaultShell(env, fsWith([alias, installed]), childProcess)).toBe(installed);
    expect(calls).toEqual(["powershell.exe"]);
  });

  it("keeps the alias when it exists but cannot be resolved (previous behaviour)", () => {
    const { childProcess } = spawnCounter("");
    expect(pickWindowsDefaultShell(env, fsWith([alias]), childProcess)).toBe(alias);
  });
});
