import { runReplayCli } from "./replay.js";

runReplayCli(process.argv.slice(2)).then((code) => process.exit(code));
