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

/** Cliente mínimo de `/api/*`: siempre devuelve `{ data, errors }`, nunca lanza por un 4xx. */
export async function fetchApi<T>(path: string): Promise<ApiEnvelope<T>> {
  const res = await fetch(`/api/${path}`);
  const body = (await res.json()) as ApiEnvelope<T>;
  return body;
}
