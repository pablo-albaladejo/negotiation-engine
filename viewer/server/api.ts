import type { ReadError } from "./read.js";

/** Respuesta de `/api/*`: siempre `{ data, errors }` con el código HTTP aparte. */
export interface ApiResponse {
  status: number;
  body: { data: unknown; errors: ReadError[] };
}
