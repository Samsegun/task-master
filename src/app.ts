import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { setupSwagger } from "./config/swagger";
import errorHandler from "./middleware/errorHandler";
import appRouter from "./routes";

const app = express();

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [];

app.disable("x-powered-by");
app.use(helmet());
app.use(
    cors({
        origin: (origin, callback) => {
            // requests with no origin (like mobile apps or curl requests)
            if (!origin) return callback(null, true);

            if (allowedOrigins.indexOf(origin) === -1) {
                const msg =
                    "The CORS policy for this site does not allow access from the specified Origin.";
                return callback(new Error(msg), false);
            }
            return callback(null, true);
        },
        credentials: true,
    }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("combined"));
app.use(cookieParser());

app.set("trust proxy", 1);
app.use("/api", appRouter);

setupSwagger(app);

app.use(errorHandler);

export default app;
