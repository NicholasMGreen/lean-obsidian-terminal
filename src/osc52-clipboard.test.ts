import { describe, it, expect, vi } from "vitest";
import { Terminal } from "@xterm/xterm";
import { registerOsc52, OSC52_MAX_WRITE_CHARS } from "./osc52-clipboard";

const ESC = "\u001b";
const BEL = "\u0007";

function osc52(payload: string): string {
  return `${ESC}]52;${payload}${BEL}`;
}

function b64(text: string): string {
  return Buffer.from(text, "utf8").toString("base64");
}

// Drives a real xterm parser so the test fails if the handler is wired wrongly
// (the #103 addon bug was a constructor-order mistake no unit test of the
// provider alone could see).
async function setup(write: (text: string) => Promise<void> = () => Promise.resolve()) {
  const terminal = new Terminal();
  const writer = vi.fn(write);
  const replies: string[] = [];
  terminal.onData((d) => replies.push(d));
  const disposable = registerOsc52(terminal.parser, writer);
  const send = async (data: string): Promise<void> => {
    await new Promise<void>((resolve) => terminal.write(data, resolve));
    await Promise.resolve();
  };
  return { terminal, writer, replies, disposable, send };
}

describe("registerOsc52", () => {
  it("sets the clipboard from an OSC 52 write to the c selection", async () => {
    const { writer, send } = await setup();

    await send(osc52(`c;${b64("hello")}`));

    expect(writer).toHaveBeenCalledTimes(1);
    expect(writer).toHaveBeenCalledWith("hello");
  });

  it("accepts an empty selection parameter", async () => {
    const { writer, send } = await setup();

    await send(osc52(`;${b64("hello")}`));

    expect(writer).toHaveBeenCalledWith("hello");
  });

  it("decodes UTF-8 text", async () => {
    const { writer, send } = await setup();

    await send(osc52(`c;${b64("héllo ✓")}`));

    expect(writer).toHaveBeenCalledWith("héllo ✓");
  });

  it("ignores writes aimed at other selections such as primary", async () => {
    const { writer, send } = await setup();

    await send(osc52(`p;${b64("hello")}`));
    await send(osc52(`s;${b64("hello")}`));

    expect(writer).not.toHaveBeenCalled();
  });

  it("answers a read query with nothing and never touches the clipboard", async () => {
    const { writer, replies, send } = await setup();

    await send(osc52("c;?"));

    expect(writer).not.toHaveBeenCalled();
    expect(replies).toEqual([]);
  });

  it("ignores invalid base64 instead of clearing the clipboard", async () => {
    const { writer, send } = await setup();

    await send(osc52("c;not*base64!"));
    await send(osc52("c;aGVsbG8"));

    expect(writer).not.toHaveBeenCalled();
  });

  it("ignores an empty payload instead of clearing the clipboard", async () => {
    const { writer, send } = await setup();

    await send(osc52("c;"));
    await send(osc52("c"));

    expect(writer).not.toHaveBeenCalled();
  });

  it("ignores bytes that are not valid UTF-8", async () => {
    const { writer, send } = await setup();

    await send(osc52(`c;${Buffer.from([0xff, 0xfe, 0xfd]).toString("base64")}`));

    expect(writer).not.toHaveBeenCalled();
  });

  it("ignores writes larger than the size cap", async () => {
    const { writer, send } = await setup();

    await send(osc52(`c;${b64("x".repeat(OSC52_MAX_WRITE_CHARS + 1))}`));

    expect(writer).not.toHaveBeenCalled();
  });

  it("keeps parsing later output after a payload far over the size cap", async () => {
    const { writer, send } = await setup();

    await send(osc52(`c;${"A".repeat(6_000_000)}`));
    await send(osc52(`c;${b64("after")}`));

    expect(writer).toHaveBeenCalledWith("after");
    expect(writer).toHaveBeenCalledTimes(1);
  }, 15_000);

  it("keeps parsing later output when the writer throws synchronously", async () => {
    const terminal = new Terminal();
    const calls: string[] = [];
    registerOsc52(terminal.parser, ((text: string) => {
      calls.push(text);
      if (calls.length === 1) throw new TypeError("clipboard undefined");
      return undefined as unknown as Promise<void>;
    }));
    const send = (data: string): Promise<void> =>
      new Promise<void>((resolve) => terminal.write(data, resolve));

    await send(osc52(`c;${b64("first")}`));
    await send(osc52(`c;${b64("second")}`));

    expect(calls).toEqual(["first", "second"]);
  }, 15_000);

  it("swallows a rejected clipboard write", async () => {
    const unhandled = vi.fn();
    process.on("unhandledRejection", unhandled);
    const { writer, send } = await setup(() => Promise.reject(new Error("denied")));

    await send(osc52(`c;${b64("hello")}`));
    await new Promise((resolve) => setImmediate(resolve));
    process.off("unhandledRejection", unhandled);

    expect(writer).toHaveBeenCalledTimes(1);
    expect(unhandled).not.toHaveBeenCalled();
  });

  it("stops handling OSC 52 once disposed", async () => {
    const { writer, disposable, send } = await setup();

    disposable.dispose();
    await send(osc52(`c;${b64("hello")}`));

    expect(writer).not.toHaveBeenCalled();
  });
});
