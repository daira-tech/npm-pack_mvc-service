export declare class EncryptClient {
    private secretKeyHex?;
    get SecretKey(): Buffer<ArrayBuffer>;
    private hmacKeyBase64?;
    get HmacKey(): Buffer<ArrayBuffer>;
    constructor(params: {
        secretKeyHex?: string;
        hmacKeyBase64?: string;
    });
    encryptAndSign(data: string | {
        [key: string]: any;
    }): string;
    isValidToken(token: string): boolean;
    decrypt<T>(token: string): T;
    private base64urlEncode;
    private base64urlDecode;
}
//# sourceMappingURL=EncryptClient.d.ts.map