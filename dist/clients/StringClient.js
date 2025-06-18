"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("crypto");
class StringClient {
    constructor() { }
    generateUUIDv7() {
        const timestamp = BigInt(Date.now()) * BigInt(10000) + BigInt(process.hrtime.bigint() % BigInt(10000));
        const timeHex = timestamp.toString(16).padStart(16, '0');
        const randomHex = (0, crypto_1.randomBytes)(8).toString('hex');
        return `${timeHex.slice(0, 8)}-${timeHex.slice(8, 12)}-7${timeHex.slice(13, 16)}-${randomHex.slice(0, 4)}-${randomHex.slice(4)}`;
    }
}
exports.default = StringClient;
