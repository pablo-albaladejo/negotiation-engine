// Importa los módulos que registran cajas, para que las herramientas de desarrollo las encuentren.
import "../pipeline/box.js";
import "../engine/engine.js";
import "../llm/template.js";
import "../llm/validator.js";

export { getBox, listBoxes } from "../pipeline/box.js";
