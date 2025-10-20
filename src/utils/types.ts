interface ValidationError extends Error {
    statusCode?: number;
    data?: { field: string; message: string }[];
}

type ValidatedAuthRequest = {
    email: string;
    password: string;
};

export { ValidatedAuthRequest, ValidationError };
