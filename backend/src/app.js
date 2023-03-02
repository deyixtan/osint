import { createServer } from "http";
import { WebSocketServer } from "ws";
import { registerHandlers } from "./events/handlers.js";

const server = createServer();
const wss = new WebSocketServer({ server: server });
registerHandlers(wss);

export { server };
