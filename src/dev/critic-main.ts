import { createProviderClient, currentProvider } from "../llm/provider.js";
import { runCritic } from "./critic.js";

// `pnpm critic <results/run>`: necesita LLM_PROVIDER distinto de none.
const runDir = process.argv[2];
const client = createProviderClient(currentProvider());
if (!runDir || !client) {
  console.error("uso: LLM_PROVIDER=claude-cli pnpm critic <results/run>");
  process.exit(2);
}
runCritic({ runDir, client })
  .then(({ reportPath, losses }) => console.log(`${losses} derrotas · informe: ${reportPath}`))
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
