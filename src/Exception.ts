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

    private errorLog: string = "";
    get ErrorLog(): string {
        return this.errorLog;
    }

    constructor(errorId: string, message: string = "", errorLog: string = "") {
        super(message);
        this.errorId = errorId;
        this.errorLog = errorLog;
    }
}

export class MaintenanceException extends Error {

    constructor(message: string = "") {
        super(message);
    }
}