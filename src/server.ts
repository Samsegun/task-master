import dotenv from "dotenv";
const environment = process.env.NODE_ENV || "development";
dotenv.config({ path: `.env.${environment}` });

import http from "http";
import app from "./app";
import config from "./config/appConfig";

const server = http.createServer(app);

server.listen(config.port, () => {
    console.log(
        `Server running in ${environment} mode on http://localhost:${config.port}`
    );
});
