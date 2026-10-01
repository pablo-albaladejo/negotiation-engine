import { createReadStream } from "node:fs";
import { readFile } from "node:fs/promises";
import { createInterface } from "node:readline";
import type { z } from "zod";

/** Un registro omitido: fichero relativo a su raíz, línea desde 1 (`null` en un JSON entero) y campo. */
export interface ReadError {
  file: string | null;
  line: number | null;
  path: string;
  message: string;
}

export interface Read<T> {
  data: T;
  errors: ReadError[];
}

type Issue = z.core.$ZodIssue;

const isDiscriminatorMiss = (branch: readonly Issue[]) =>
  branch.length === 1 && branch[0]?.code === "invalid_union" && branch[0].errors.length === 0;

/**
 * En una unión, la rama que más se acercó a validar: descarta las que fallan por discriminante,
 * elige la de menos errores y, a igualdad, el campo más profundo.
 */
function locateIssue(issue: Issue, prefix: readonly PropertyKey[] = []): { path: PropertyKey[]; message: string } {
  const path = [...prefix, ...issue.path];
  if (issue.code !== "invalid_union") return { path, message: issue.message };
  let best: { size: number; found: { path: PropertyKey[]; message: string } } | null = null;
  for (const branch of issue.errors) {
    const first = branch[0];
    if (!first || isDiscriminatorMiss(branch)) continue;
    const found = locateIssue(first, path);
    if (!best || branch.length < best.size || (branch.length === best.size && found.path.length > best.found.path.length)) {
      best = { size: branch.length, found };
    }
  }
  return best?.found ?? { path, message: issue.message };
}

function schemaError(file: string, line: number | null, error: z.ZodError): ReadError {
  const first = error.issues[0];
  if (!first) return { file, line, path: "", message: "invalid record" };
  const { path, message } = locateIssue(first);
  return { file, line, path: path.map(String).join("."), message };
}

/** Sin rutas absolutas en la respuesta: solo el código del error de E/S. */
function ioError(file: string, error: unknown): ReadError {
  const code = (error as NodeJS.ErrnoException | null)?.code ?? "EIO";
  return { file, line: null, path: "", message: `cannot read file (${code})` };
}

/**
 * Lee un JSONL en streaming y valida cada línea con el esquema del escritor. Una línea inválida
 * (JSON truncado o campo erróneo) se omite y va a `errors`; el resto se sigue cargando. Nunca lanza.
 */
export async function readJsonl<S extends z.ZodType>(absPath: string, file: string, schema: S): Promise<Read<z.infer<S>[]>> {
  const data: z.infer<S>[] = [];
  const errors: ReadError[] = [];
  let lineNo = 0;
  try {
    const lines = createInterface({ input: createReadStream(absPath, { encoding: "utf8" }), crlfDelay: Infinity });
    for await (const text of lines) {
      lineNo += 1;
      if (text.trim() === "") continue;
      let raw: unknown;
      try {
        raw = JSON.parse(text);
      } catch {
        errors.push({ file, line: lineNo, path: "", message: "invalid JSON (truncated or malformed line)" });
        continue;
      }
      const parsed = schema.safeParse(raw);
      if (parsed.success) data.push(parsed.data);
      else errors.push(schemaError(file, lineNo, parsed.error));
    }
  } catch (error) {
    errors.push(ioError(file, error));
  }
  return { data, errors };
}

/** Un JSON entero validado; `data: null` si no se puede leer o no valida. Nunca lanza. */
export async function readJson<S extends z.ZodType>(absPath: string, file: string, schema: S): Promise<Read<z.infer<S> | null>> {
  let text: string;
  try {
    text = await readFile(absPath, "utf8");
  } catch (error) {
    return { data: null, errors: [ioError(file, error)] };
  }
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { data: null, errors: [{ file, line: null, path: "", message: "invalid JSON (truncated or malformed file)" }] };
  }
  const parsed = schema.safeParse(raw);
  return parsed.success ? { data: parsed.data, errors: [] } : { data: null, errors: [schemaError(file, null, parsed.error)] };
}
