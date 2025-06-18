"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BusinessLogicException = exports.DbConflictException = exports.MaintenanceException = exports.InputErrorException = exports.ForbiddenException = exports.AuthException = void 0;
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
    get ErrorLog() {
        return this.errorLog;
    }
    constructor(errorId, message = "", errorLog = "") {
        super(message);
        this.errorId = "";
        this.errorLog = "";
        this.errorId = errorId;
        this.errorLog = errorLog;
    }
}
exports.InputErrorException = InputErrorException;
class MaintenanceException extends Error {
    constructor(message = "") {
        super(message);
    }
}
exports.MaintenanceException = MaintenanceException;
class DbConflictException extends Error {
    // for 409 Conflict
    constructor(message = "") {
        super(message);
    }
}
exports.DbConflictException = DbConflictException;
class BusinessLogicException extends Error {
    // for 422 Unprocessable Entity
    constructor(message = "") {
        super(message);
    }
}
exports.BusinessLogicException = BusinessLogicException;
