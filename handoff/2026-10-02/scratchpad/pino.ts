import { Writable } from "node:stream";
import { createPinoLogger } from "/Users/pablo/development/hackathon/negotiation-ring.worktrees/arena-viewer/src/pipeline/log.ts";
const out: string[] = [];
const dest = new Writable({ write(c, _e, cb) { out.push(String(c)); cb(); } }) as any;
const log = createPinoLogger({ level: "trace", destination: dest });
log.trace!("box_record", { box: "engine", output: { action: "counter", offer: { price: 1 }, explain: { target: 0.42 } } });
log.trace!("box_record", { box: "x", data: { output: { explain: { target: 0.42 } } } });
setTimeout(() => console.log(out.join("")), 50);
