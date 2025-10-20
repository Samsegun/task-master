import CustomError from "./CustomError";

export class EntityNotFound extends CustomError<ErrorCode> {
    constructor(message: string, code: ErrorCode = "ERR_NF") {
        super({ message, statusCode: 404, code });
    }
}

export class ValidationError extends CustomError<ErrorCode> {
    constructor(message: string, code: ErrorCode = "ERR_VALID") {
        super({ message, statusCode: 400, code });
    }
}

export class UnauthorizedError extends CustomError<ErrorCode> {
    constructor(message: string, code: ErrorCode = "ERR_UNAUTH") {
        super({ message, statusCode: 401, code });
    }
}

export class ForbiddenError extends CustomError<ErrorCode> {
    constructor(message: string, code: ErrorCode = "ERR_FORBIDDEN") {
        super({ message, statusCode: 403, code });
    }
}
