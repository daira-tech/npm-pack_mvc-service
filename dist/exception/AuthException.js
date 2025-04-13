"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
exports.default = AuthException;
