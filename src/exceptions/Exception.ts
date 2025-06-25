export class AuthException extends Error {
    private id: string = "";
    get Id(): string {
        return this.id;
    }

    constructor(id: string, message: string = "") {
        super(message);
        this.id = id;
    }
}

export class ForbiddenException extends Error {
}

export class InputErrorException extends Error {
    private errorId: string = "";
    get ErrorId(): string {
        return this.errorId;
    }

    constructor(errorId: string, message: string = "") {
        super(message);
        this.errorId = errorId;
    }
}

export class MaintenanceException extends Error {

    constructor(message: string = "") {
        super(message);
    }
}

export class NotFoundException extends Error {
    // for 404 Not Found
    private errorId: string = "";
    get ErrorId(): string {
        return this.errorId;
    }

    constructor(errorId: string, message: string = "") {
        super(message);
        this.errorId = errorId;
    }
}

export class DbConflictException extends Error {
    // for 409 Conflict
    private errorId: string = "";
    get ErrorId(): string {
        return this.errorId;
    }

    constructor(errorId: string, message: string = "") {
        super(message);
        this.errorId = errorId;
    }
}

export class UnprocessableException extends Error {
    // for 422 Unprocessable Entity
    private errorId: string = "";
    get ErrorId(): string {
        return this.errorId;
    }

    constructor(errorId: string, message: string = "") {
        super(message);
        this.errorId = errorId;
    }
}