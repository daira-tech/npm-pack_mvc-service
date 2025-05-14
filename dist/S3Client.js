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
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const Base64Client_1 = __importDefault(require("./Base64Client"));
class S3Client {
    get urlPrefix() {
        return `https://${this.bucketName}.s3.${this.region}.amazonaws.com`;
    }
    constructor() {
        this.bucketName = process.env.S3_BUCKET_NAME;
        this.region = process.env.S3_REGION;
        this.client = this.setClient();
    }
    setClient() {
        return new aws_sdk_1.default.S3({
            accessKeyId: process.env.S3_ACCESS_KEY_ID,
            secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
            region: this.region
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
            yield this.client.putObject({
                Bucket: this.bucketName,
                Key: this.makeKey(path, fileName),
                Body: JSON.stringify(data),
                ContentType: 'application/json',
            }).promise();
        });
    }
    uploadToPdf(path, fileName, base64Datas) {
        return __awaiter(this, void 0, void 0, function* () {
            const base64Client = new Base64Client_1.default();
            const mergedPdfBase64 = yield base64Client.mergeToPdfBase64(base64Datas);
            yield this.client.putObject({
                Bucket: this.bucketName,
                Key: this.makeKey(path, fileName),
                Body: Buffer.from(mergedPdfBase64, 'base64'),
                ContentType: 'application/pdf',
            }).promise();
        });
    }
    uploadText(path, fileName, text) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.client.putObject({
                Bucket: this.bucketName,
                Key: this.makeKey(path, fileName),
                Body: text,
                ContentType: 'text/plain',
            }).promise();
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
                const res = yield this.client.getObject({
                    Bucket: this.bucketName,
                    Key: this.makeKey(path, fileName),
                }).promise();
                if (res.Body === undefined) {
                    throw new Error(`Failed to get text data. Response body is undefined.`);
                }
                if (((_a = res.ContentType) === null || _a === void 0 ? void 0 : _a.startsWith('text/')) === false) {
                    throw new Error(`Cannot get text data from non-text file. ContentType: ${res.ContentType}`);
                }
                return res.Body.toString('utf-8');
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
exports.default = S3Client;
