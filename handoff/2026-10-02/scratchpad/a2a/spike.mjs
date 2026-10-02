import { AgentEvent, DefaultRequestHandler, InMemoryTaskStore, JsonRpcTransportHandler, ServerCallContext } from "@a2a-js/sdk/server";
import { randomUUID } from "node:crypto";

const card = {
  name: "negotiation-ring agent", description: "spike", version: "0.1.0",
  supportedInterfaces: [{ url: "http://localhost:8787/a2a", protocolBinding: "JSONRPC", protocolVersion: "1.0" }],
  capabilities: { streaming: false, pushNotifications: false }, defaultInputModes: ["application/json", "text/plain"], defaultOutputModes: ["application/json"],
  skills: [{ id: "negotiate_turn", name: "negotiate turn", description: "one turn", tags: ["negotiation"] }],
  securitySchemes: {}, securityRequirements: [],
};
const executor = {
  async execute(ctx, bus) {
    const part = ctx.userMessage.parts.find((p) => p.content?.$case === "data");
    const turn = part?.content.value;
    const out = { sessionId: turn.sessionId, round: turn.round, action: "counter", offer: { pct: 9 }, text: "Te propongo un 9 %." };
    bus.publish(AgentEvent.message({ messageId: randomUUID(), contextId: ctx.contextId, role: 2, parts: [{ content: { $case: "data", value: out } }] }));
    bus.finished();
  },
  async cancelTask() {},
};
const handler = new DefaultRequestHandler(card, new InMemoryTaskStore(), executor);
const rpc = new JsonRpcTransportHandler(handler);
const body = { jsonrpc: "2.0", id: 1, method: "SendMessage", params: { message: { messageId: "m1", role: "ROLE_USER", parts: [{ data: { sessionId: "s", round: 1, rivalAction: "message" } }] } } };
try {
  const res = await rpc.handle(body, new ServerCallContext());
  console.log(JSON.stringify(res).slice(0, 600));
} catch (e) { console.error("ERR", e); }
