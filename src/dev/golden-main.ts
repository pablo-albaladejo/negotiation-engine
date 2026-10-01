import { loadConfig } from "../engine/config.js";
import { writeGoldens } from "./golden.js";

// Regenera test/golden/ con la campeona: solo tras un cambio de comportamiento deliberado y revisado.
writeGoldens(loadConfig(process.env.AGENT_CONFIG ?? "config/champion.json"))
  .then((files) => console.log(files.join("\n")))
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
