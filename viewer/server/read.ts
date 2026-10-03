import { createReadStream } from "node:fs";
import { readFile } from "node:fs/promises";
import { createInterface } from "node:readline";
import type { z } from "zod";

/** A skipped record: file relative to its root, 1-based line (`null` for a whole JSON) and field. */
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
 * In a union, the branch that came closest to validating: drops those failing on the discriminator,
 * picks the one with the fewest errors and, on a tie, the deepest field.
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

/** No absolute paths in the response: only the I/O error code. */
function ioError(file: string, error: unknown): ReadError {
  const code = (error as NodeJS.ErrnoException | null)?.code ?? "EIO";
  return { file, line: null, path: "", message: `cannot read file (${code})` };
}

/** A JSONL line validated against the writer's schema, or its error (file, line, field). Never throws. */
export function parseLine<S extends z.ZodType>(
  text: string,
  file: string,
  line: number,
  schema: S,
): { ok: true; data: z.infer<S> } | { ok: false; error: ReadError } {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: { file, line, path: "", message: "invalid JSON (truncated or malformed line)" } };
  }
  const parsed = schema.safeParse(raw);
  return parsed.success ? { ok: true, data: parsed.data } : { ok: false, error: schemaError(file, line, parsed.error) };
}

/**
 * Streams a JSONL and validates each line against the writer's schema. An invalid line
 * (truncated JSON or bad field) is skipped and goes to `errors`; the rest keeps loading. Never throws.
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
      const parsed = parseLine(text, file, lineNo, schema);
      if (parsed.ok) data.push(parsed.data);
      else errors.push(parsed.error);
    }
  } catch (error) {
    errors.push(ioError(file, error));
  }
  return { data, errors };
}

/** A whole validated JSON; `data: null` if it can't be read or doesn't validate. Never throws. */
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
