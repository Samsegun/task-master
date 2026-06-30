import dotenv from "dotenv";
const environment = process.env.NODE_ENV || "development";
let envPath: string;

if (environment === "production") {
    envPath = ".env";
} else if (environment === "docker") {
    envPath = ".env.docker";
} else {
    envPath = `.env.${environment}`;
}

dotenv.config({ path: envPath });

import http from "http";
import app from "./app";
import config from "./config/appConfig";

const server = http.createServer(app);

server.listen(config.port, () => {
    console.log(
        `Server running in ${environment} mode on ${config.serverUrl}/api`,
    );
});
