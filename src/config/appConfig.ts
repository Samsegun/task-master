const config = {
    env: process.env.NODE_ENV || "development",
    port: parseInt(process.env.PORT || "3001"),
    debug: process.env.APP_DEBUG === "true",
    serverUrl: process.env.PRODUCTION_URL || "http://localhost:7000",
};

export default config;
