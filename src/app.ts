import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import morgan from "morgan";
import appRouter from "./routes";

const app = express();

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [];

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
    })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("combined"));
app.use(cookieParser());

app.use("/api", appRouter);

// app.use(
//     (
//         err: ErrorWithStatusCode,
//         req: express.Request,
//         res: express.Response,
//         next: express.NextFunction
//     ) => {
//         if (process.env.NODE_ENV === "production") {
//             console.error("❌ Internal error occurred:", err.name);
//         } else {
//             console.error("❌ Error:", err);
//         }

//         let code = err.statusCode || 500;
//         let message = err.message;
//         const data = err.data || null;

//         // db specific handling
//         const DBErrorHandled = handlePrismaError(err);
//         if (DBErrorHandled) {
//             code = DBErrorHandled.code;
//             message = DBErrorHandled.message;
//         }

//         res.status(code).json({ message, data });
//     }
// );

export default app;
