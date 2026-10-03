import type { ReadError } from "./read.js";

/** Response of `/api/*`: always `{ data, errors }` with the HTTP code kept separate. */
export interface ApiResponse {
  status: number;
  body: { data: unknown; errors: ReadError[] };
}
