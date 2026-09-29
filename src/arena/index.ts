import { loadConfig } from "../engine/config.js";

// Arena local de self-play: nuestro agente contra cada bot de src/bots, en los dos roles
// y en varios escenarios. Pendiente de implementar.
const config = loadConfig();
console.log(`arena: config v${config.version} cargada; aún no hay partidas implementadas`);
