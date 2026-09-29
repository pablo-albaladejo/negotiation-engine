import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  BoxContractError,
  createContext,
  defineBox,
  echoBox,
  getBox,
  listBoxes,
  MemoryTrace,
  registerBox,
  runBox,
} from "../../src/pipeline/box.js";

describe("contrato Box<I,O>", () => {
  it("la caja echo devuelve su entrada validada", async () => {
    await expect(runBox(echoBox, { message: "hola" }, createContext())).resolves.toEqual({ message: "hola" });
  });

  it("entrada inválida ⇒ error tipado que señala el campo", async () => {
    const error = await runBox(echoBox, { message: 3 }, createContext()).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(BoxContractError);
    expect((error as BoxContractError).stage).toBe("input");
    expect((error as BoxContractError).paths).toEqual(["message"]);
    expect((error as Error).message).toMatch(/message/);
  });

  it("salida inválida ⇒ error tipado de salida", async () => {
    const broken = defineBox({
      name: "broken",
      input: z.object({}),
      output: z.object({ n: z.number() }),
      run: () => ({ n: "x" }) as unknown as { n: number },
    });
    const error = await runBox(broken, {}, createContext()).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(BoxContractError);
    expect((error as BoxContractError).stage).toBe("output");
    expect((error as BoxContractError).paths).toEqual(["n"]);
  });

  it("ctx aporta rng sembrado, reloj inyectado, logger y traza", async () => {
    const trace = new MemoryTrace();
    const ctx = createContext({ now: () => 42, trace });
    const probe = defineBox({
      name: "probe",
      input: z.object({}),
      output: z.object({ t: z.number(), r: z.number() }),
      run: (_input, c) => {
        c.logger.info("probe");
        c.trace.write({ sessionId: "s", round: 1, box: "probe", input: {}, output: {}, result: "ok", latencyMs: 0 });
        return { t: c.now(), r: c.rng.float() };
      },
    });
    const a = await runBox(probe, {}, ctx);
    const b = await runBox(probe, {}, createContext({ now: () => 42 }));
    expect(a.t).toBe(42);
    expect(a.r).toBe(b.r);
    expect(trace.records).toHaveLength(1);
  });

  it("registro de cajas", () => {
    expect(getBox("echo")).toBe(echoBox);
    expect(listBoxes()).toContain("echo");
    expect(() => registerBox({ ...echoBox })).toThrow(/ya registrada/);
  });
});
