"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnprocessableException = exports.DbConflictException = exports.NotFoundException = exports.MaintenanceException = exports.InputErrorException = exports.ForbiddenException = exports.AuthException = void 0;
class AuthException extends Error {
    get Id() {
        return this.id;
    }
    constructor(id, message = "") {
        super(message);
        this.id = "";
        this.id = id;
    }
}
exports.AuthException = AuthException;
class ForbiddenException extends Error {
}
exports.ForbiddenException = ForbiddenException;
class InputErrorException extends Error {
    get ErrorId() {
        return this.errorId;
    }
    constructor(errorId, message = "") {
        super(message);
        this.errorId = "";
        this.errorId = errorId;
    }
}
exports.InputErrorException = InputErrorException;
class MaintenanceException extends Error {
    constructor(message = "") {
        super(message);
    }
}
exports.MaintenanceException = MaintenanceException;
class NotFoundException extends Error {
    get ErrorId() {
        return this.errorId;
    }
    constructor(errorId, message = "") {
        super(message);
        // for 404 Not Found
        this.errorId = "";
        this.errorId = errorId;
    }
}
exports.NotFoundException = NotFoundException;
class DbConflictException extends Error {
    get ErrorId() {
        return this.errorId;
    }
    constructor(errorId, message = "") {
        super(message);
        // for 409 Conflict
        this.errorId = "";
        this.errorId = errorId;
    }
}
exports.DbConflictException = DbConflictException;
class UnprocessableException extends Error {
    get ErrorId() {
        return this.errorId;
    }
    constructor(errorId, message = "") {
        super(message);
        // for 422 Unprocessable Entity
        this.errorId = "";
        this.errorId = errorId;
    }
}
exports.UnprocessableException = UnprocessableException;
