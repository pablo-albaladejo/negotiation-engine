import { runArenaCli } from "./cli.js";

// Arena local de self-play: nuestro agente contra los bots de src/bots en los escenarios del catálogo.
runArenaCli(process.argv.slice(2)).catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
