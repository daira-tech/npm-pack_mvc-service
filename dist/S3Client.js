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
    constructor() {
        this.bucketName = process.env.S3_BUCKET_NAME;
        this.client = this.setClient();
    }
    setClient() {
        return new aws_sdk_1.default.S3({
            accessKeyId: process.env.S3_ACCESS_KEY_ID,
            secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
            region: process.env.S3_REGION
        });
    }
    uploadJson(path, fileName, data) {
        return __awaiter(this, void 0, void 0, function* () {
            path = path.replace(/^\/|\/$/g, '');
            yield this.client.putObject({
                Bucket: this.bucketName,
                Key: `${path}/${fileName}`,
                Body: JSON.stringify(data),
                ContentType: 'application/json',
            }).promise();
        });
    }
    uploadToPdf(path, fileName, datas) {
        return __awaiter(this, void 0, void 0, function* () {
            const base64Client = new Base64Client_1.default();
            const mergedPdfBase64 = yield base64Client.mergeToPdfBase64(datas);
            path = path.replace(/^\/|\/$/g, '');
            yield this.client.putObject({
                Bucket: this.bucketName,
                Key: `${path}/${fileName}`,
                Body: Buffer.from(mergedPdfBase64, 'base64'),
                ContentType: 'application/pdf',
            }).promise();
        });
    }
}
exports.default = S3Client;
