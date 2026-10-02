import { readFileSync } from "node:fs";
import { SummarySchema, TranscriptLineSchema } from "./src/arena/results-schema.js";
for (const dir of process.argv.slice(2)) {
  const s = SummarySchema.safeParse(JSON.parse(readFileSync(`${dir}/summary.json`, "utf8")));
  const lines = readFileSync(`${dir}/transcripts.jsonl`, "utf8").trim().split("\n");
  const bad = lines.filter((l) => !TranscriptLineSchema.safeParse(JSON.parse(l)).success).length;
  console.log(dir, "summary", s.success, s.success ? s.data.schemaVersion : s.error.issues.slice(0, 2), "lines", lines.length, "bad", bad);
}
