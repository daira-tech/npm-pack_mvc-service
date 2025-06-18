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
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AwsS3Client = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const Base64Client_1 = require("./Base64Client");
class AwsS3Client {
    get urlPrefix() {
        return `https://${this.bucketName}.s3.${this.region}.amazonaws.com`;
    }
    constructor(params) {
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
        this.client = new client_s3_1.S3Client({
            region: params.region,
            credentials: {
                accessKeyId: params.accessKeyId,
                secretAccessKey: params.secretAccessKey
            }
        });
        this.region = params.region;
        this.bucketName = params.bucketName;
    }
    makeKey(path, fileName) {
        path = path.replace(/^\/|\/$/g, '');
        if ((fileName !== null && fileName !== void 0 ? fileName : '').trim().length > 0) {
            path += '/' + fileName;
        }
        return path;
    }
    url(path, fileName = '') {
        path = path.replace(/^\/|\/$/g, '');
        let url = `${this.urlPrefix}`;
        if (path !== '') {
            url += '/' + path;
        }
        if (fileName.trim().length > 0) {
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
            const base64Client = new Base64Client_1.Base64Client();
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
            const base64Client = new Base64Client_1.Base64Client();
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
    getFilesInDir(path) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const listCommand = new client_s3_1.ListObjectsV2Command({
                Bucket: this.bucketName,
                Prefix: this.makeKey(path),
            });
            const data = yield this.client.send(listCommand);
            return (_a = data.Contents) !== null && _a !== void 0 ? _a : [];
        });
    }
    getDataFronJson(path, fileName) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, e_1, _b, _c;
            const command = new client_s3_1.GetObjectCommand({
                Bucket: this.bucketName,
                Key: this.makeKey(path, fileName),
            });
            const res = yield this.client.send(command);
            if (res.Body === undefined) {
                throw new Error(`Failed to get JSON data. Response body is undefined.`);
            }
            if (res.ContentType !== 'application/json') {
                throw new Error(`Cannot get JSON data from non-JSON file. ContentType: ${res.ContentType}`);
            }
            // v3ではBodyがReadableなので、変換が必要
            const chunks = [];
            try {
                for (var _d = true, _e = __asyncValues(res.Body), _f; _f = yield _e.next(), _a = _f.done, !_a; _d = true) {
                    _c = _f.value;
                    _d = false;
                    const chunk = _c;
                    chunks.push(chunk);
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (!_d && !_a && (_b = _e.return)) yield _b.call(_e);
                }
                finally { if (e_1) throw e_1.error; }
            }
            const buffer = Buffer.concat(chunks);
            const jsonString = buffer.toString('utf-8');
            return JSON.parse(jsonString);
        });
    }
    deleteFile(path, fileName) {
        return __awaiter(this, void 0, void 0, function* () {
            const key = this.makeKey(path, fileName);
            const command = new client_s3_1.DeleteObjectsCommand({
                Bucket: this.bucketName,
                Delete: {
                    Objects: [{ Key: key }]
                }
            });
            yield this.client.send(command);
        });
    }
    deleteDir(path) {
        return __awaiter(this, void 0, void 0, function* () {
            const files = yield this.getFilesInDir(path);
            if (files.length > 0) {
                const deleteCommand = new client_s3_1.DeleteObjectsCommand({
                    Bucket: this.bucketName,
                    Delete: {
                        Objects: files.map((file) => ({ Key: file.Key })),
                    },
                });
                yield this.client.send(deleteCommand);
            }
        });
    }
}
exports.AwsS3Client = AwsS3Client;
