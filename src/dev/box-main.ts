import { runBoxCli } from "./box.js";

runBoxCli(process.argv.slice(2)).then((code) => process.exit(code));
