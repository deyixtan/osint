import { stalk } from "../stalk.js";

export let canStalk = true;
export const registerHandlers = async (wss) => {
  wss.on("connection", async (ws) => {
    console.log("connected to backend");

    ws.on("message", async (data) => {
      const { topic, obj } = JSON.parse(data);
      if (topic === "stalk") {
        canStalk = true;
        const { username } = obj;
        await stalk(ws, username);
      } else if (topic === "cancelStalk") canStalk = false;
    });
  });
};
