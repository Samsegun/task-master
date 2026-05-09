import { NextFunction, Request, Response } from "express";

// 1. Remove the rigid AsyncRequestHandler type.
// 2. Make the function generic using <T>
const asyncHandler = <T extends Request<any, any, any, any>>(
    fn: (req: T, res: Response, next: NextFunction) => Promise<any>,
) => {
    // We return a standard Express handler
    return (req: Request, res: Response, next: NextFunction) => {
        // We cast 'req' to 'any' or 'T' here just to bridge the
        // gap between Express's internal types and your specific T
        Promise.resolve(fn(req as T, res, next)).catch(next);
    };
};

export default asyncHandler;
