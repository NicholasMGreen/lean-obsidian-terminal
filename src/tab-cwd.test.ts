import { describe, it, expect, vi } from "vitest";
import { planTabCwd } from "./tab-cwd";

describe("planTabCwd", () => {
  const vault = "C:\\vault";
  const exists = () => true;

  it("spawns and stores the requested cwd when it is an existing directory", () => {
    expect(planTabCwd("C:\\other", vault, exists)).toEqual({
      spawn: "C:\\other",
      stored: "C:\\other",
      fellBack: false,
    });
  });

  it("falls back to the vault root when the cwd is undefined", () => {
    expect(planTabCwd(undefined, vault, exists).spawn).toBe(vault);
  });

  it("falls back to the vault root when the cwd is an empty string", () => {
    expect(planTabCwd("", vault, exists).spawn).toBe(vault);
  });

  it("falls back to the vault root when the cwd is only whitespace", () => {
    expect(planTabCwd("  ", vault, exists).spawn).toBe(vault);
  });

  it("stores the fallback and reports no fallback for an empty or missing cwd", () => {
    const plan = { spawn: vault, stored: vault, fellBack: false };
    expect(planTabCwd(undefined, vault, () => false)).toEqual(plan);
    expect(planTabCwd("", vault, () => false)).toEqual(plan);
    expect(planTabCwd("  ", vault, () => false)).toEqual(plan);
  });

  it("spawns in the fallback but keeps the requested cwd stored when the folder is missing", () => {
    expect(planTabCwd("E:\\usb\\proj", vault, () => false)).toEqual({
      spawn: vault,
      stored: "E:\\usb\\proj",
      fellBack: true,
    });
  });

  it("keeps the requested cwd stored when the check throws", () => {
    const isDir = () => {
      throw new Error("EACCES");
    };
    expect(planTabCwd("\\\\nas\\share", vault, isDir)).toEqual({
      spawn: vault,
      stored: "\\\\nas\\share",
      fellBack: true,
    });
  });

  it("passes the requested path to the check unchanged", () => {
    const isDir = vi.fn(() => true);
    planTabCwd("C:\\other", vault, isDir);
    expect(isDir).toHaveBeenCalledWith("C:\\other");
  });

  it("does not run the check for an empty or missing cwd", () => {
    const isDir = vi.fn(() => true);
    planTabCwd(undefined, vault, isDir);
    planTabCwd("", vault, isDir);
    planTabCwd("  ", vault, isDir);
    expect(isDir).not.toHaveBeenCalled();
  });

  it("passes a padded cwd to the check untrimmed and stores it as given", () => {
    const isDir = vi.fn(() => true);
    expect(planTabCwd(" C:\\x ", vault, isDir)).toEqual({
      spawn: " C:\\x ",
      stored: " C:\\x ",
      fellBack: false,
    });
    expect(isDir).toHaveBeenCalledWith(" C:\\x ");
  });
});
