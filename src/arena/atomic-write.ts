import { randomUUID } from "node:crypto";
import { rename, rm, writeFile } from "node:fs/promises";

/**
 * Escribe `content` en `path` sin que un lector vea nunca un fichero a medias: escribe en un
 * temporal hermano (mismo directorio, mismo sistema de ficheros) y lo renombra encima. Si algo
 * falla, borra el temporal y relanza el error.
 */
export async function writeFileAtomic(path: string, content: string): Promise<void> {
  const tmp = `${path}.${process.pid}.${randomUUID()}.tmp`;
  try {
    await writeFile(tmp, content, "utf8");
    await rename(tmp, path);
  } catch (error) {
    await rm(tmp, { force: true });
    throw error;
  }
}
