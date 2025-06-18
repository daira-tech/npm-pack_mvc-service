"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EncryptClient = void 0;
const crypto_1 = __importDefault(require("crypto"));
class EncryptClient {
    get SecretKey() {
        if (this.secretKeyHex === undefined) {
            throw new Error("Please set the secret key.");
        }
        return Buffer.from(this.secretKeyHex, 'hex');
    }
    get HmacKey() {
        if (this.hmacKeyBase64 === undefined) {
            throw new Error("Please set the hmac key.");
        }
        return Buffer.from(this.hmacKeyBase64, 'base64');
    }
    constructor(params) {
        this.secretKeyHex = params === null || params === void 0 ? void 0 : params.secretKeyHex;
        this.hmacKeyBase64 = params === null || params === void 0 ? void 0 : params.hmacKeyBase64;
    }
    encryptAndSign(data) {
        const iv = crypto_1.default.randomBytes(12);
        const cipher = crypto_1.default.createCipheriv('aes-256-gcm', this.SecretKey, iv);
        const plaintext = typeof data === 'string' ? data : JSON.stringify(data);
        const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
        const authTag = cipher.getAuthTag();
        const combined = Buffer.concat([iv, authTag, encrypted]);
        const payload = this.base64urlEncode(combined);
        const hmac = crypto_1.default.createHmac('sha256', this.HmacKey).update(payload).digest();
        const signature = this.base64urlEncode(hmac);
        return `${payload}.${signature}`;
    }
    isValidToken(token) {
        // 形式チェック、.で区切られているか？
        const [payload, signature] = token.split('.');
        if (!payload || !signature) {
            return false;
        }
        // 改竄チェック
        const expectedSig = crypto_1.default.createHmac('sha256', this.HmacKey).update(payload).digest();
        const expectedSigStr = this.base64urlEncode(expectedSig);
        if (signature !== expectedSigStr) {
            return false;
        }
        return true;
    }
    decrypt(token) {
        // 形式チェック、.で区切られているか？
        const [payload, signature] = token.split('.');
        if (!payload || !signature) {
            throw new Error('Invalid token format');
        }
        // 改竄チェック
        const expectedSig = crypto_1.default.createHmac('sha256', this.HmacKey).update(payload).digest();
        const expectedSigStr = this.base64urlEncode(expectedSig);
        if (signature !== expectedSigStr) {
            throw new Error('The token appears to have been tampered with');
        }
        const combined = this.base64urlDecode(payload);
        const iv = combined.subarray(0, 12);
        const authTag = combined.subarray(12, 28);
        const encrypted = combined.subarray(28);
        const decipher = crypto_1.default.createDecipheriv('aes-256-gcm', this.SecretKey, iv);
        decipher.setAuthTag(authTag);
        const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
        return JSON.parse(decrypted.toString('utf8'));
    }
    base64urlEncode(buffer) {
        return buffer.toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');
    }
    base64urlDecode(str) {
        str = str.replace(/-/g, '+').replace(/_/g, '/');
        while (str.length % 4 !== 0) {
            str += '=';
        }
        return Buffer.from(str, 'base64');
    }
}
exports.EncryptClient = EncryptClient;
