import { _Object } from '@aws-sdk/client-s3';
type IUploadResponse = {
    url: string;
    fileName: string;
};
export declare class AwsS3Client {
    private client;
    private readonly bucketName;
    private readonly region;
    get UrlPrefix(): string;
    constructor(params: {
        bucketName?: string;
        region?: string;
        accessKeyId?: string;
        secretAccessKey?: string;
    });
    private makeKey;
    url(path: string, fileName?: string): string;
    uploadJson(path: string, fileName: string, data: {
        [key: string]: any;
    }): Promise<void>;
    uploadText(path: string, fileName: string, text: string): Promise<void>;
    uploadBase64Data(path: string, fileName: string, base64Data: string): Promise<IUploadResponse>;
    uploadFromUrl(path: string, fileName: string, url: string): Promise<IUploadResponse>;
    uploadStackText(path: string, fileName: string, text: string): Promise<void>;
    getText(path: string, fileName: string): Promise<string | null>;
    getFilesInDir(path: string): Promise<Array<_Object>>;
    getDataFronJson<T = any>(path: string, fileName: string): Promise<T>;
    deleteFile(path: string, fileName: string): Promise<void>;
    deleteDir(path: string): Promise<void>;
    deleteFromUrl(url: string, isFileUrl?: boolean): Promise<void>;
}
export {};
//# sourceMappingURL=AwsS3Client.d.ts.map