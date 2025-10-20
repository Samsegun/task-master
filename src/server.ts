import dotenv from "dotenv";
dotenv.config();

import http from "http";
import app from "./app";
import config from "./config/appConfig";

const server = http.createServer(app);

server.listen(config.port, () => {
    console.log(`server running on http://localhost:${config.port}`);
});
