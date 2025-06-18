import crypto from 'crypto';

export default class EncryptClient {
    private secretKeyHex?: string;
    get SecretKey(): Buffer<ArrayBuffer> { 
        if (this.secretKeyHex === undefined) {
            throw new Error("Please set the secret key.");
        }
        return Buffer.from(this.secretKeyHex, 'hex');
    }
    private hmacKeyBase64?: string;
    get HmacKey(): Buffer<ArrayBuffer> { 
        if (this.hmacKeyBase64 === undefined) {
            throw new Error("Please set the hmac key.");
        }
        return Buffer.from(this.hmacKeyBase64, 'base64');
    }

    constructor(params: {secretKeyHex?: string, hmacKeyBase64?: string}) {
        this.secretKeyHex = params?.secretKeyHex;
        this.hmacKeyBase64 = params?.hmacKeyBase64;
    }

    public encryptAndSign(data: string | {[key: string]: any}): string {
        const iv = crypto.randomBytes(12);
        const cipher = crypto.createCipheriv('aes-256-gcm', this.SecretKey, iv);
        
        const plaintext = typeof data === 'string' ? data : JSON.stringify(data);
        const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
        const authTag = cipher.getAuthTag();
        
        const combined = Buffer.concat([iv, authTag, encrypted]);
        const payload = this.base64urlEncode(combined);
        
        const hmac = crypto.createHmac('sha256', this.HmacKey).update(payload).digest();
        const signature = this.base64urlEncode(hmac);
        
        return `${payload}.${signature}`;
    }

    public isValidToken(token: string): boolean {
        // 形式チェック、.で区切られているか？
        const [payload, signature] = token.split('.');
        if (!payload || !signature) {
            return false;
        }

        // 改竄チェック
        const expectedSig = crypto.createHmac('sha256', this.HmacKey).update(payload).digest();
        const expectedSigStr = this.base64urlEncode(expectedSig);

        if (signature !== expectedSigStr) {
            return false;
        }

        return true;
    }

    public decrypt<T>(token: string): T {
        // 形式チェック、.で区切られているか？
        const [payload, signature] = token.split('.');
        if (!payload || !signature) {
            throw new Error('Invalid token format');
        }

        // 改竄チェック
        const expectedSig = crypto.createHmac('sha256', this.HmacKey).update(payload).digest();
        const expectedSigStr = this.base64urlEncode(expectedSig);
        if (signature !== expectedSigStr){
            throw new Error('The token appears to have been tampered with');
        }

        const combined = this.base64urlDecode(payload);
        const iv = combined.subarray(0, 12);
        const authTag = combined.subarray(12, 28);
        const encrypted = combined.subarray(28);
        
        const decipher = crypto.createDecipheriv('aes-256-gcm', this.SecretKey, iv);
        decipher.setAuthTag(authTag);
        
        const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
        return JSON.parse(decrypted.toString('utf8')) as T;
    }


    private base64urlEncode(buffer: Buffer): string {
        return buffer.toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');
    }
    
    private base64urlDecode(str: string): Buffer {
        str = str.replace(/-/g, '+').replace(/_/g, '/');
        while (str.length % 4 !== 0) {
            str += '=';
        }
        return Buffer.from(str, 'base64');
    }
}