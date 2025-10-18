// interface ValidatedRequest<T = unknown> extends Request {
//     validatedData: T;
// }

interface ValidationError extends Error {
    statusCode?: number;
    data?: { field: string; message: string }[];
}

export { ValidationError };
