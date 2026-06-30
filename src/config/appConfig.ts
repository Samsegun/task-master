const config = {
    env: process.env.NODE_ENV || "development",
    port: parseInt(process.env.PORT || "3001"),
    debug: process.env.APP_DEBUG === "true",
    serverUrl:
        process.env.PRODUCTION_URL || `http://localhost:${process.env.PORT}`,
};

export default config;
