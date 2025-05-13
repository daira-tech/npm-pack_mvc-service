import AWS from 'aws-sdk';
import Base64Client from './Base64Client';

export default class S3Client {
    private client: AWS.S3;
    private readonly bucketName = process.env.S3_BUCKET_NAME as string;

    constructor() {
        this.client = this.setClient();
    }

    private setClient(): AWS.S3 {
        return new AWS.S3({
            accessKeyId: process.env.S3_ACCESS_KEY_ID,
            secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
            region: process.env.S3_REGION
        });
    }

    public async uploadJson(path: string, fileName: string, data: {[key: string]: any}) {
        path = path.replace(/^\/|\/$/g, '');
        await this.client.putObject({
            Bucket: this.bucketName,
            Key: `${path}/${fileName}`,
            Body: JSON.stringify(data),
            ContentType: 'application/json',
        }).promise();
    }

    public async uploadToPdf(path: string, fileName: string, base64Datas: Array<string>) {
        const base64Client = new Base64Client();
        const mergedPdfBase64 = await base64Client.mergeToPdfBase64(base64Datas);

        path = path.replace(/^\/|\/$/g, '');
        await this.client.putObject({
            Bucket: this.bucketName,
            Key: `${path}/${fileName}`,
            Body: Buffer.from(mergedPdfBase64, 'base64'),
            ContentType: 'application/pdf',
        }).promise();
    }
}