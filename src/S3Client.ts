import AWS from 'aws-sdk';
import Base64Client from './Base64Client';
import { error } from 'pdf-lib';

export default class S3Client {
    private client: AWS.S3;
    private readonly bucketName = process.env.S3_BUCKET_NAME as string;
    private readonly region = process.env.S3_REGION as string;
    get urlPrefix(): string {
        return `https://${this.bucketName}.s3.${this.region}.amazonaws.com`;
    }

    constructor() {
        this.client = this.setClient();
    }

    private setClient(): AWS.S3 {
        return new AWS.S3({
            accessKeyId: process.env.S3_ACCESS_KEY_ID,
            secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
            region: this.region
        });
    }

    private makeKey(path: string, fileName: string): string {
        return `${path.replace(/^\/|\/$/g, '')}/${fileName}`;
    }

    public url(path: string, fileName: string = '') {
        path = path.replace(/^\/|\/$/g, '');
        let url = `${this.urlPrefix}`;
        if (path !== '') {
            url += '/' + path;
        }

        if (fileName !== '') {
            url += '/' + fileName;
        }
        return url;
    }

    public async uploadJson(path: string, fileName: string, data: {[key: string]: any}) {
        await this.client.putObject({
            Bucket: this.bucketName,
            Key: this.makeKey(path, fileName),
            Body: JSON.stringify(data),
            ContentType: 'application/json',
        }).promise();
    }

    public async uploadToPdf(path: string, fileName: string, base64Datas: Array<string>) {
        const base64Client = new Base64Client();
        const mergedPdfBase64 = await base64Client.mergeToPdfBase64(base64Datas);

        await this.client.putObject({
            Bucket: this.bucketName,
            Key: this.makeKey(path, fileName),
            Body: Buffer.from(mergedPdfBase64, 'base64'),
            ContentType: 'application/pdf',
        }).promise();
    }

    public async uploadText(path: string, fileName: string, text: string) {
        await this.client.putObject({
            Bucket: this.bucketName,
            Key: this.makeKey(path, fileName),
            Body: text,
            ContentType: 'text/plain',
        }).promise();
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
            const res = await this.client.getObject({
                Bucket: this.bucketName,
                Key: this.makeKey(path, fileName),
            }).promise();

            if (res.Body === undefined) {
                throw new Error(`Failed to get text data. Response body is undefined.`);
            }

            if (res.ContentType?.startsWith('text/') === false) {
                throw new Error(`Cannot get text data from non-text file. ContentType: ${res.ContentType}`);
            }
            return res.Body.toString('utf-8');
        } catch (ex: unknown) {
            if (ex instanceof Error && ex.name === 'NoSuchKey') {
                return null;
            }
            throw ex;
        }
    }
}