import { loadConfig } from "../engine/config.js";
import { currentProvider } from "../llm/provider.js";

// Servidor que habla con el ring. El protocolo (A2A, HTTP JSON o MCP) está por confirmar;
// cuando se conozca, se implementan los adaptadores en src/protocol.
const config = loadConfig();
console.log(`agent: config v${config.version}, LLM=${currentProvider()}; protocolo del ring pendiente`);
