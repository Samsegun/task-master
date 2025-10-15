import express from "express";

const app = express();

app.use("/", (req, res) => {
    res.send("welcome to task-master api");
});

export default app;
