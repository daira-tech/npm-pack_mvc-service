"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
exports.default = InputErrorException;
