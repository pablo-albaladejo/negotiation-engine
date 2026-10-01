import { describe, expect, it } from "vitest";
import { runBoxCli } from "../../src/dev/box.js";

function capture() {
  const out: string[] = [];
  const err: string[] = [];
  return { io: { out: (l: string) => out.push(l), err: (l: string) => err.push(l) }, out, err };
}

describe("pnpm box", () => {
  it("caja echo con fixture válido ⇒ salida validada y código 0", async () => {
    const c = capture();
    expect(await runBoxCli(["echo", "test/fixtures/box/echo-valid.json"], c.io)).toBe(0);
    expect(JSON.parse(c.out.join("\n"))).toEqual({ message: "hola ring" });
    expect(c.err).toEqual([]);
  });

  it("caja echo con fixture inválido ⇒ código 1 y el error señala el campo", async () => {
    const c = capture();
    expect(await runBoxCli(["echo", "test/fixtures/box/echo-invalid.json"], c.io)).toBe(1);
    expect(c.err.join("\n")).toMatch(/entrada inválida → message:/);
    expect(c.err).toContain("campo: message");
    expect(c.out).toEqual([]);
  });

  it("el motor también se ejecuta aislado sobre sus fixtures", async () => {
    const c = capture();
    expect(await runBoxCli(["engine", "test/fixtures/engine/opening.json"], c.io)).toBe(0);
    expect(JSON.parse(c.out.join("\n"))).toMatchObject({ action: "counter" });
  });

  it("caja desconocida o uso incorrecto ⇒ código 2 con las cajas disponibles", async () => {
    const c = capture();
    expect(await runBoxCli(["nope", "x.json"], c.io)).toBe(2);
    expect(c.err.join("\n")).toMatch(/disponibles: .*echo.*engine/);
    expect(await runBoxCli(["echo"], capture().io)).toBe(2);
  });
});
