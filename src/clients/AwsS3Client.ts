import { _Object, DeleteObjectsCommand, GetObjectCommand, ListObjectsV2Command, PutObjectCommand, S3Client, ScanRange } from '@aws-sdk/client-s3';
import { UnprocessableException } from '../exceptions/Exception';
import axios from 'axios';

type IUploadResponse = {
    url: string;
    fileName: string;
}

export class AwsS3Client {
    private client: S3Client;

    private readonly bucketName;
    private readonly region;
    get UrlPrefix(): string {
        return `https://${this.bucketName}.s3.${this.region}.amazonaws.com`;
    }

    constructor(params: {bucketName?: string, region?: string; accessKeyId?: string, secretAccessKey?: string}) {
        if (params.bucketName === undefined) {
            throw new Error("Please specify the bucketName.");
        }

        if (params.region === undefined) {
            throw new Error("Please specify the region.");
        }

        if (params.accessKeyId === undefined) {
            throw new Error("Please specify the accessKeyId.");
        }

        if (params.secretAccessKey === undefined) {
            throw new Error("Please specify the secretAccessKey.");
        }

        this.client = new S3Client({
            region: params.region,
            credentials: {
                accessKeyId: params.accessKeyId,
                secretAccessKey: params.secretAccessKey
            }
        });

        this.region = params.region;
        this.bucketName = params.bucketName;
    }

    private makeKey(path: string, fileName?: string): string {
        path = path.replace(/^\/|\/$/g, '');
        if ((fileName ?? '').trim().length > 0) {
            path += '/' + fileName;
        }
        return path;
    }

    public url(path: string, fileName: string = '') {
        path = path.replace(/^\/|\/$/g, '');
        let url = `${this.UrlPrefix}`;
        if (path !== '') {
            url += '/' + path;
        }

        if (fileName.trim().length > 0) {
            url += '/' + fileName;
        }
        return url;
    }

    public async uploadJson(path: string, fileName: string, data: {[key: string]: any}) {
        const command = new PutObjectCommand({
            Bucket: this.bucketName,
            Key: this.makeKey(path, fileName),
            Body: JSON.stringify(data),
            ContentType: 'text/plain; charset=utf-8'
        });
        await this.client.send(command);
    }

    // public async uploadToPdf(path: string, fileName: string, base64Datas: Array<string>) {
    //     const base64Client = new Base64Client();
    //     const mergedPdfBase64 = await base64Client.mergeToPdfBase64(base64Datas);

    //     const command = new PutObjectCommand({
    //         Bucket: this.bucketName,
    //         Key: this.makeKey(path, fileName),
    //         Body: Buffer.from(mergedPdfBase64, 'base64'),
    //         ContentEncoding: 'base64',
    //         ContentType: 'application/pdf'
    //     });
    //     await this.client.send(command);
    // }

    public async uploadText(path: string, fileName: string, text: string) {
        const command = new PutObjectCommand({
            Bucket: this.bucketName,
            Key: this.makeKey(path, fileName),
            Body: text,
            ContentType: 'text/plain; charset=utf-8'
        });
        await this.client.send(command);
    }

    public async uploadBase64Data(path: string, fileName: string, base64Data: string) : Promise<IUploadResponse> {
        const key = this.makeKey(path, fileName);
        const command = new PutObjectCommand({
            Bucket: this.bucketName,
            Key: key,
            Body: Buffer.from(base64Data, 'base64'),
            ContentEncoding: 'base64'
        });
        await this.client.send(command);
        
        return {
            url: `${this.UrlPrefix}/${key}`,
            fileName: fileName
        }
    }

    public async uploadFromUrl(path: string, fileName: string, url: string): Promise<IUploadResponse> {
        try {
            // URLからデータを取得
            const response = await axios.get(url, {
                responseType: 'arraybuffer',
                timeout: 30000,
            });

            // Content-Typeを取得
            const contentType = response.headers['content-type'] || 'application/octet-stream';
            
            const key = this.makeKey(path, fileName);
            const command = new PutObjectCommand({
                Bucket: this.bucketName,
                Key: key,
                Body: Buffer.from(response.data),
                ContentType: contentType,
                ContentLength: response.data.length
            });
            
            await this.client.send(command);
            
            // アップロードされたファイルのURLを返す
            return {
                url: this.url(path, fileName),
                fileName: fileName
            }
        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.response) {
                    throw new UnprocessableException(`Failed to download from URL. HTTP ${error.response.status}: ${error.response.statusText}`);
                } else if (error.request) {
                    throw new UnprocessableException('Failed to connect to the URL. Please check if the URL is accessible.');
                } else {
                    throw new UnprocessableException('Invalid URL format.');
                }
            }
            throw new UnprocessableException('Failed to upload from URL.');
        }
    }

    public async uploadStackText(path: string, fileName: string, text: string) {
        let preText = await this.getText(path, fileName);
        if (typeof preText === 'string') {
            text = preText + '\n' + text;
        }

        await this.uploadText(path, fileName, text);
    }

    public async getText(path: string, fileName: string) : Promise<string | null> {
        try {
            const command = new GetObjectCommand({
                Bucket: this.bucketName,
                Key: this.makeKey(path, fileName),
            });
            const res = await this.client.send(command);

            if (res.Body === undefined) {
                throw new Error(`Failed to get text data. Response body is undefined.`);
            }

            if (res.ContentType?.startsWith('text/') === false) {
                throw new Error(`Cannot get text data from non-text file. ContentType: ${res.ContentType}`);
            }

            // v3ではBodyがReadableStreamなので、変換が必要
            const chunks: Uint8Array[] = [];
            if (res.Body && typeof res.Body === 'object' && 'getReader' in res.Body) {
                // ReadableStreamの場合
                const stream = res.Body as ReadableStream;
                const reader = stream.getReader();
                
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    chunks.push(value);
                }
            } else {
                // Node.js Readableの場合
                for await (const chunk of res.Body as any) {
                    chunks.push(chunk);
                }
            }
            
            const buffer = Buffer.concat(chunks);
            return buffer.toString('utf-8');
        } catch (ex: unknown) {
            if (ex instanceof Error && ex.name === 'NoSuchKey') {
                return null;
            }
            throw ex;
        }
    }

    public async getFilesInDir(path: string): Promise<Array<_Object>> {
        const listCommand = new ListObjectsV2Command({
            Bucket: this.bucketName,
            Prefix: this.makeKey(path),
        });

        const data = await this.client.send(listCommand);
        return data.Contents ?? [];
    }

    public async getDataFronJson<T = any>(path: string, fileName: string): Promise<T> {
        const command = new GetObjectCommand({
            Bucket: this.bucketName,
            Key: this.makeKey(path, fileName),
        });
        const res = await this.client.send(command);

        if (res.Body === undefined) {
            throw new Error(`Failed to get JSON data. Response body is undefined.`);
        }

        if (res.ContentType !== 'application/json') {
            throw new Error(`Cannot get JSON data from non-JSON file. ContentType: ${res.ContentType}`);
        }

        // v3ではBodyがReadableなので、変換が必要
        const chunks: Uint8Array[] = [];
        for await (const chunk of res.Body as any) {
            chunks.push(chunk);
        }
        
        const buffer = Buffer.concat(chunks);
        const jsonString = buffer.toString('utf-8');
        return JSON.parse(jsonString) as T;
    }

    public async deleteFile(path: string, fileName: string): Promise<void> {
        const key = this.makeKey(path, fileName);
        const command = new DeleteObjectsCommand({
            Bucket: this.bucketName,
            Delete: {
                Objects: [{ Key: key }]
            }
        });
        await this.client.send(command);
    }

    public async deleteDir(path: string): Promise<void> {
        const files = await this.getFilesInDir(path);
        if (files.length > 0) {
            const deleteCommand = new DeleteObjectsCommand({
                Bucket: this.bucketName,
                Delete: {
                    Objects: files.map((file) => ({ Key: file.Key })),
                },
            });
            await this.client.send(deleteCommand);
        }
    }

    public async deleteFromUrl(url: string, isFileUrl: boolean = true): Promise<void> {
        const path = url.replace(this.UrlPrefix + '/', '');
        if (url === path) {
            throw new UnprocessableException('The specified URL cannot be deleted because the bucket and region do not match.');
        }

        if (path.trim() === "") {
            throw new UnprocessableException('This URL is invalid.');
        }

        if (isFileUrl) {
            const pathSplits = path.split('/');
            const file = pathSplits.pop();
            if (file === undefined) {
                throw new UnprocessableException('This URL is invalid.');
            }
            await this.deleteFile(pathSplits.join('/'), file);
        } else {
            await this.deleteDir(path);
        }
    }
}