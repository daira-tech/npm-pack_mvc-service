export declare class AuthException extends Error {
    private id;
    get Id(): string;
    constructor(id: string, message?: string);
}
export declare class ForbiddenException extends Error {
}
export declare class InputErrorException extends Error {
    private errorId;
    get ErrorId(): string;
    constructor(errorId: string, message?: string);
}
export declare class MaintenanceException extends Error {
    constructor(message?: string);
}
export declare class NotFoundException extends Error {
    private errorId;
    get ErrorId(): string;
    constructor(errorId: string, message?: string);
}
export declare class DbConflictException extends Error {
    private errorId;
    get ErrorId(): string;
    constructor(errorId: string, message?: string);
}
export declare class UnprocessableException extends Error {
    private errorId;
    get ErrorId(): string;
    constructor(errorId: string, message?: string);
}
//# sourceMappingURL=Exception.d.ts.map