"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_s3_1 = require("@aws-sdk/client-s3");
const Base64Client_1 = __importDefault(require("./Base64Client"));
class S3Clienta {
    get urlPrefix() {
        return `https://${this.bucketName}.s3.${this.region}.amazonaws.com`;
    }
    constructor() {
        this.bucketName = process.env.S3_BUCKET_NAME;
        this.region = process.env.S3_REGION;
        this.client = new client_s3_1.S3Client({
            region: this.region,
            credentials: {
                accessKeyId: process.env.S3_ACCESS_KEY_ID,
                secretAccessKey: process.env.S3_SECRET_ACCESS_KEY
            }
        });
    }
    makeKey(path, fileName) {
        return `${path.replace(/^\/|\/$/g, '')}/${fileName}`;
    }
    url(path, fileName = '') {
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
    uploadJson(path, fileName, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const command = new client_s3_1.PutObjectCommand({
                Bucket: this.bucketName,
                Key: this.makeKey(path, fileName),
                Body: JSON.stringify(data),
                ContentType: 'text/plain; charset=utf-8'
            });
            yield this.client.send(command);
        });
    }
    uploadToPdf(path, fileName, base64Datas) {
        return __awaiter(this, void 0, void 0, function* () {
            const base64Client = new Base64Client_1.default();
            const mergedPdfBase64 = yield base64Client.mergeToPdfBase64(base64Datas);
            const command = new client_s3_1.PutObjectCommand({
                Bucket: this.bucketName,
                Key: this.makeKey(path, fileName),
                Body: Buffer.from(mergedPdfBase64, 'base64'),
                ContentEncoding: 'base64',
                ContentType: 'application/pdf'
            });
            yield this.client.send(command);
        });
    }
    uploadText(path, fileName, text) {
        return __awaiter(this, void 0, void 0, function* () {
            const command = new client_s3_1.PutObjectCommand({
                Bucket: this.bucketName,
                Key: this.makeKey(path, fileName),
                Body: text,
                ContentType: 'text/plain; charset=utf-8'
            });
            yield this.client.send(command);
        });
    }
    uploadBase64Data(path, fileName, base64Data) {
        return __awaiter(this, void 0, void 0, function* () {
            const base64Client = new Base64Client_1.default();
            const type = base64Client.getMimeType(base64Data);
            const extension = {
                'image/png': '.png',
                'image/jpeg': '.jpeg',
                'image/gif': '.gif',
                'application/pdf': '.pdf'
            }[type];
            if (fileName.endsWith(extension) === false) {
                fileName += extension;
            }
            const key = this.makeKey(path, fileName);
            const command = new client_s3_1.PutObjectCommand({
                Bucket: this.bucketName,
                Key: key,
                Body: Buffer.from(base64Data, 'base64'),
                ContentEncoding: 'base64',
                ContentType: type
            });
            yield this.client.send(command);
            return `${this.urlPrefix}/${key}`;
        });
    }
    uploadStackText(path, fileName, text) {
        return __awaiter(this, void 0, void 0, function* () {
            let preText = yield this.getText(path, fileName);
            if (typeof preText === 'string') {
                text = preText + '\n' + text;
            }
            yield this.uploadText(path, fileName, text);
        });
    }
    getText(path, fileName) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const command = new client_s3_1.GetObjectCommand({
                    Bucket: this.bucketName,
                    Key: this.makeKey(path, fileName),
                });
                const res = yield this.client.send(command);
                if (res.Body === undefined) {
                    throw new Error(`Failed to get text data. Response body is undefined.`);
                }
                if (((_a = res.ContentType) === null || _a === void 0 ? void 0 : _a.startsWith('text/')) === false) {
                    throw new Error(`Cannot get text data from non-text file. ContentType: ${res.ContentType}`);
                }
                // v3ではBodyがReadableStreamなので、変換が必要
                const stream = res.Body;
                const reader = stream.getReader();
                const chunks = [];
                while (true) {
                    const { done, value } = yield reader.read();
                    if (done)
                        break;
                    chunks.push(value);
                }
                const buffer = Buffer.concat(chunks);
                return buffer.toString('utf-8');
            }
            catch (ex) {
                if (ex instanceof Error && ex.name === 'NoSuchKey') {
                    return null;
                }
                throw ex;
            }
        });
    }
}
exports.default = S3Clienta;
