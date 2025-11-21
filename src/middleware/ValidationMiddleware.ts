import { NextFunction, Request, Response } from "express";
import { z, ZodError } from "zod";

class ValidationMiddleware {
    static validateBodyData(schema: z.ZodObject<any, any>) {
        return (req: Request, res: Response, next: NextFunction) => {
            try {
                schema.parse(req.body);
                next();
            } catch (error) {
                if (error instanceof ZodError) {
                    const formattedErrors: Record<string, string[]> = {};

                    error.issues.forEach(err => {
                        const field = err.path.join(".");
                        if (!formattedErrors[field]) {
                            formattedErrors[field] = [];
                        }
                        formattedErrors[field].push(err.message);
                    });

                    res.status(422).json({
                        success: false,
                        error: "Input Validation failed.",
                        details: formattedErrors,
                    });
                } else {
                    res.status(500).json({
                        success: false,
                        error: "Internal Server Error",
                    });
                }
            }
        };
    }

    static validateRequestQuery(schema: z.ZodObject<any, any>) {
        return (req: Request, res: Response, next: NextFunction) => {
            try {
                schema.parse(req.query);
                next();
            } catch (error) {
                if (error instanceof ZodError) {
                    const formattedErrors: Record<string, string[]> = {};

                    error.issues.forEach(err => {
                        const field = err.path.join(".");
                        if (!formattedErrors[field]) {
                            formattedErrors[field] = [];
                        }
                        formattedErrors[field].push(err.message);
                    });

                    res.status(422).json({
                        success: false,
                        error: "Request query Validation failed.",
                        details: formattedErrors,
                    });
                } else {
                    res.status(500).json({
                        success: false,
                        error: "Internal Server Error",
                    });
                }
            }
        };
    }
}

export default ValidationMiddleware;
