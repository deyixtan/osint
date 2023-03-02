import { server } from "./app.js";
import { PORT } from "./configs.js";

server.listen(PORT, async () => {
  console.log(`backend listening at port ${PORT}`);
});
