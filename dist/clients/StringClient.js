"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StringClient = void 0;
const crypto_1 = require("crypto");
const StringUtil_1 = __importDefault(require("../Utils/StringUtil"));
class StringClient {
    constructor() { }
    generateUUIDv7() {
        const timestamp = BigInt(Date.now()) * BigInt(10000) + BigInt(process.hrtime.bigint() % BigInt(10000));
        const timeHex = timestamp.toString(16).padStart(16, '0');
        const randomHex = (0, crypto_1.randomBytes)(8).toString('hex');
        return `${timeHex.slice(0, 8)}-${timeHex.slice(8, 12)}-7${timeHex.slice(13, 16)}-${randomHex.slice(0, 4)}-${randomHex.slice(4)}`;
    }
    isUUID(value) {
        return StringUtil_1.default.isUUID(value);
    }
}
exports.StringClient = StringClient;
