import type { SpanExporter } from "@opentelemetry/sdk-trace-base";
import type { TraceRecord, TraceSink } from "./box.js";
import { REDACT_PATHS } from "./log.js";

/** Claves que nunca salen en un span: las mismas que censura el logger (mandato, reserva, config). */
const REDACT_KEYS = new Set(REDACT_PATHS.map((p) => p.split(".").at(-1)!));

export function redactForExport(value: unknown, depth = 0): unknown {
  if (depth > 8 || value === null) return value;
  if (typeof value === "string") {
    // Strings largos (probables textos de LLM) se reemplazan con la longitud.
    // Los atributos numéricos (cifras en texto) se mantienen si son cortos.
    if (value.length > 100) return `[text:${value.length}]`;
    return value;
  }
  if (typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map((v) => redactForExport(v, depth + 1));
  return Object.fromEntries(Object.entries(value).filter(([k]) => !REDACT_KEYS.has(k)).map(([k, v]) => [k, redactForExport(v, depth + 1)]));
}

export interface OtelOptions {
  env?: NodeJS.ProcessEnv;
  /** Exportador inyectado (tests: en memoria); por defecto consola u OTLP/HTTP (Langfuse) según el entorno. */
  exporter?: SpanExporter;
}

export interface OtelSink extends TraceSink {
  shutdown(): Promise<void>;
}

export const otelEnabled = (env: NodeJS.ProcessEnv = process.env) => env.TRACE_EXPORT === "otel";

/**
 * Exportación de la traza de cajas a OpenTelemetry tras el flag `TRACE_EXPORT=otel`. Con el flag
 * apagado devuelve `undefined` sin cargar el SDK ni crear exportadores (ninguna conexión).
 * Con él: un span por caja (`box.<nombre>`) con sesión, ronda, resultado y latencia, y la
 * entrada/salida en JSON sin las claves censuradas. `OTEL_EXPORTER=console` imprime los spans;
 * si no, OTLP/HTTP a `OTEL_EXPORTER_OTLP_ENDPOINT` (Langfuse: su endpoint OTLP con las claves
 * en `LANGFUSE_PUBLIC_KEY`/`LANGFUSE_SECRET_KEY`, solo en el entorno).
 */
export async function createOtelSink(options: OtelOptions = {}): Promise<OtelSink | undefined> {
  const env = options.env ?? process.env;
  if (!otelEnabled(env)) return undefined;
  const { BasicTracerProvider, SimpleSpanProcessor, ConsoleSpanExporter } = await import("@opentelemetry/sdk-trace-base");
  let exporter = options.exporter;
  if (!exporter && env.OTEL_EXPORTER === "console") exporter = new ConsoleSpanExporter();
  if (!exporter) {
    const { OTLPTraceExporter } = await import("@opentelemetry/exporter-trace-otlp-http");
    const headers: Record<string, string> = {};
    if (env.LANGFUSE_PUBLIC_KEY && env.LANGFUSE_SECRET_KEY) headers.authorization = `Basic ${Buffer.from(`${env.LANGFUSE_PUBLIC_KEY}:${env.LANGFUSE_SECRET_KEY}`).toString("base64")}`;
    exporter = new OTLPTraceExporter({ ...(env.OTEL_EXPORTER_OTLP_ENDPOINT ? { url: env.OTEL_EXPORTER_OTLP_ENDPOINT } : {}), headers });
  }
  const provider = new BasicTracerProvider({ spanProcessors: [new SimpleSpanProcessor(exporter)] });
  const tracer = provider.getTracer("negotiation-ring");
  return {
    write(record: TraceRecord) {
      const end = Date.now();
      const span = tracer.startSpan(`box.${record.box}`, { startTime: end - record.latencyMs });
      span.setAttributes({
        "session.id": record.sessionId,
        "langfuse.session.id": record.sessionId,
        round: record.round,
        box: record.box,
        result: record.result,
        latency_ms: record.latencyMs,
        ...(record.configVersion !== undefined ? { config_version: record.configVersion } : {}),
        ...(record.provider ? { provider: record.provider } : {}),
        ...(record.error ? { error: record.error } : {}),
        input: JSON.stringify(redactForExport(record.input)) ?? "null",
        output: JSON.stringify(redactForExport(record.output)) ?? "null",
      });
      span.end(end);
    },
    shutdown: () => provider.shutdown(),
  };
}

/** Varias trazas a la vez (JSONL local + OpenTelemetry). */
export function teeTrace(...sinks: (TraceSink | undefined)[]): TraceSink | undefined {
  const active = sinks.filter((s): s is TraceSink => s !== undefined);
  if (active.length <= 1) return active[0];
  return { write: (record) => active.forEach((s) => s.write(record)) };
}
