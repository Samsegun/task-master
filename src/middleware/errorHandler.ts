import { NextFunction, Request, Response } from "express";
import config from "../config/appConfig";
import CustomError from "../errors/CustomError";
import { getErrorMessage } from "../utils/getErrorMessage";

export default function errorHandler(
    error: unknown,
    req: Request,
    res: Response,
    next: NextFunction
) {
    console.error(error);

    if (res.headersSent || config.debug) {
        next(error);
        return;
    }

    if (error instanceof CustomError) {
        res.status(error.statusCode).json({
            error: {
                message: error.message,
                code: error.code,
            },
        });
        return;
    }

    // server error handling
    let responseMessage =
        "An internal server error occurred. Please try again later.";
    if (process.env.NODE_ENV !== "production")
        responseMessage = getErrorMessage(error);

    res.status(500).json({
        error: {
            message: responseMessage,
        },
    });
}
