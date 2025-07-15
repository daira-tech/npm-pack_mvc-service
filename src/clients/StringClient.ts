import { randomBytes } from 'crypto';
import StringUtil from '../Utils/StringUtil';

export class StringClient {
    constructor() { }

    public generateUUIDv7(): string {
        const timestamp = BigInt(Date.now()) * BigInt(10000) + BigInt(process.hrtime.bigint() % BigInt(10000));
        const timeHex = timestamp.toString(16).padStart(16, '0');
    
        const randomHex = randomBytes(8).toString('hex');
    
        return `${timeHex.slice(0, 8)}-${timeHex.slice(8, 12)}-7${timeHex.slice(13, 16)}-${randomHex.slice(0, 4)}-${randomHex.slice(4)}`;
    }

    public isUUID(value: any) {
        return StringUtil.isUUID(value);
    }
}