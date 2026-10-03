export interface ApiError {
  file: string | null;
  line: number | null;
  path: string;
  message: string;
}

export interface ApiEnvelope<T> {
  data: T;
  errors: ApiError[];
}

/** Minimal `/api/*` client: always returns `{ data, errors }`, never throws on a 4xx. */
export async function fetchApi<T>(path: string): Promise<ApiEnvelope<T>> {
  const res = await fetch(`/api/${path}`);
  const body = (await res.json()) as ApiEnvelope<T>;
  return body;
}
