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
exports.Service = void 0;
const axios_1 = __importDefault(require("axios"));
const Exception_1 = require("./exceptions/Exception");
const RequestType_1 = require("./reqestResponse/RequestType");
const ResponseType_1 = require("./reqestResponse/ResponseType");
const AwsS3Client_1 = require("./clients/AwsS3Client");
const StringClient_1 = require("./clients/StringClient");
const EncryptClient_1 = require("./clients/EncryptClient");
const PoolManager_1 = __importDefault(require("./PoolManager"));
class Service {
    get Method() { return this.method; }
    get Endpoint() { return this.endpoint + this.request.paramPath; }
    get ApiCode() { return this.apiCode; }
    get Summary() { return `${this.ApiCode !== '' ? this.apiCode + ': ' : ''}${this.summary}`; }
    get ApiUserAvailable() { return this.apiUserAvailable; }
    get Request() { return this.request; }
    ; // swaggerで必要なので、ここだけ宣言
    get AuthToken() { var _a; return (_a = this.request.Authorization) !== null && _a !== void 0 ? _a : ''; }
    get Response() { return this.response; }
    ; // swaggerで必要なので、ここだけ宣言
    get Tags() { return this.tags; }
    get ErrorList() {
        return [...this.errorList, {
                status: 500,
                code: '',
                description: 'サーバー内部エラー（予期せぬエラー）'
            }];
    }
    get Req() {
        if (this.req === undefined) {
            throw new Error('This method can only be used when module is "express".');
        }
        return this.req;
    }
    get Res() {
        if (this.res === undefined) {
            throw new Error('This method can only be used when module is "express".');
        }
        return this.res;
    }
    get C() {
        if (this.c === undefined) {
            throw new Error('This method can only be used when module is "hono".');
        }
        return this.c;
    }
    get Module() {
        if (this.c !== undefined) {
            return 'hono';
        }
        else if (this.req !== undefined && this.res !== undefined) {
            return 'express';
        }
        throw new Error('Failed to determine whether the module is "express" or "hono".');
    }
    ;
    get Env() {
        if (this.Module === 'express') {
            return process.env;
        }
        else {
            return this.C.env;
        }
    }
    constructor(param1, param2) {
        this.method = 'GET';
        this.endpoint = '';
        this.apiCode = '';
        this.summary = '';
        this.apiUserAvailable = '';
        this.request = new RequestType_1.RequestType();
        this.response = new ResponseType_1.ResponseType();
        this.tags = [];
        this.errorList = [];
        this.isExecuteRollback = false;
        if (param2 !== undefined) {
            // Express の場合: (request, response)
            this.req = param1;
            this.res = param2;
        }
        else {
            // Hono の場合: (c)
            this.c = param1;
        }
    }
    inintialize() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.Module === "express") {
                yield this.request.setRequest(this.Module, this.Req);
            }
            else {
                yield this.request.setRequest(this.Module, this.C);
            }
            yield this.checkMaintenance();
            yield this.middleware();
        });
    }
    get DbUser() { return this.Env.DB_USER; }
    get DbHost() { return this.Env.DB_HOST; }
    get DbName() { return this.Env.DB_DATABASE; }
    get DbPassword() { return this.Env.DB_PASSWORD; }
    get DbPort() { return this.Env.DB_PORT; }
    get DbIsSslConnect() { return this.Env.DB_IS_SSL === 'true'; }
    setPool() {
        if (this.DbUser === undefined) {
            throw new Error("Database user is not configured");
        }
        if (this.DbHost === undefined) {
            throw new Error("Database host is not configured");
        }
        if (this.DbName === undefined) {
            throw new Error("Database name is not configured");
        }
        if (this.DbPassword === undefined) {
            throw new Error("Database password is not configured");
        }
        if (this.DbPort === undefined) {
            throw new Error("Database port is not configured");
        }
        try {
            return PoolManager_1.default.getPool(this.DbUser, this.DbHost, this.DbName, this.DbPassword, this.DbPort, this.DbIsSslConnect);
        }
        catch (ex) {
            throw new Error("Failed to connect to the database. Please check the connection settings.");
        }
    }
    checkMaintenance() {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    middleware() {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    resSuccessExpress() {
        this.Res.status(200).json(this.response.ResponseData);
    }
    resSuccessHono() {
        return this.C.json(this.response.ResponseData, 200);
    }
    outputErrorLog(ex) {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    handleExceptionExpress(ex) {
        // To avoid slowing down the response, make this asynchronous
        this.outputErrorLog(ex).catch((ex) => {
            console.error(ex);
        });
        if (ex instanceof Exception_1.AuthException) {
            this.Res.status(401).json({
                message: "Authentication expired. Please login again."
            });
        }
        else if (ex instanceof Exception_1.ForbiddenException) {
            this.Res.status(403).json({
                message: 'Forbidden error'
            });
        }
        else if (ex instanceof Exception_1.InputErrorException) {
            this.Res.status(400).json({
                errorCode: `${this.apiCode}-${ex.ErrorId}`,
                errorMessage: ex.message
            });
            return;
        }
        else if (ex instanceof Exception_1.DbConflictException) {
            this.Res.status(409).json({
                errorCode: `${this.apiCode}-${ex.ErrorId}`,
                errorMessage: ex.message
            });
        }
        else if (ex instanceof Exception_1.UnprocessableException) {
            this.Res.status(422).json({
                errorCode: `${this.apiCode}-${ex.ErrorId}`,
                errorMessage: ex.message
            });
        }
        else if (ex instanceof Exception_1.MaintenanceException) {
            this.Res.status(503).json({
                errorMessage: ex.message
            });
        }
        else if (ex instanceof Exception_1.NotFoundException) {
            this.Res.status(404).json({
                errorCode: `${this.apiCode}-${ex.ErrorId}`,
                errorMessage: ex.message
            });
        }
        else {
            this.Res.status(500).json({
                message: 'Internal server error'
            });
        }
    }
    handleExceptionHono(ex) {
        // To avoid slowing down the response, make this asynchronous
        this.outputErrorLog(ex).catch((ex) => {
            console.error(ex);
        });
        if (ex instanceof Exception_1.AuthException) {
            return this.C.json({
                message: "Authentication expired. Please login again."
            }, 401);
        }
        else if (ex instanceof Exception_1.ForbiddenException) {
            return this.C.json({
                message: 'Forbidden error'
            }, 403);
        }
        else if (ex instanceof Exception_1.InputErrorException) {
            return this.C.json({
                errorCode: `${this.apiCode}-${ex.ErrorId}`,
                errorMessage: ex.message
            }, 400);
        }
        else if (ex instanceof Exception_1.DbConflictException) {
            return this.C.json({
                errorCode: `${this.apiCode}-${ex.ErrorId}`,
                errorMessage: ex.message
            }, 409);
        }
        else if (ex instanceof Exception_1.UnprocessableException) {
            return this.C.json({
                errorCode: `${this.apiCode}-${ex.ErrorId}`,
                errorMessage: ex.message
            }, 422);
        }
        else if (ex instanceof Exception_1.MaintenanceException) {
            return this.C.json({
                errorMessage: ex.message
            }, 503);
        }
        else if (ex instanceof Exception_1.NotFoundException) {
            return this.C.json({
                errorCode: `${this.apiCode}-${ex.ErrorId}`,
                errorMessage: ex.message
            }, 404);
        }
        else {
            return this.C.json({
                message: 'Internal server error'
            }, 500);
        }
    }
    get Pool() {
        var _a;
        if (this.pool === undefined) {
            this.pool = this.setPool();
            this.pool.query(`SET TIME ZONE '${(_a = this.Env.TZ) !== null && _a !== void 0 ? _a : 'Asia/Tokyo'}';`);
        }
        return this.pool;
    }
    get Client() {
        if (this.client === undefined) {
            throw new Error("Please call this.PoolClient after using the startConnect method.");
        }
        return this.client;
    }
    startConnect() {
        return __awaiter(this, void 0, void 0, function* () {
            this.client = yield this.Pool.connect();
            yield this.Client.query('BEGIN');
            this.isExecuteRollback = true;
        });
    }
    commit() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.Client.query('COMMIT');
            this.isExecuteRollback = false;
        });
    }
    rollback() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isExecuteRollback) {
                yield this.Client.query('ROLLBACK');
            }
            this.isExecuteRollback = false;
        });
    }
    release() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.rollback();
            if (this.client !== undefined) {
                yield this.client.release();
            }
        });
    }
    get S3Client() {
        if (this.s3Client === undefined) {
            this.s3Client = new AwsS3Client_1.AwsS3Client({
                bucketName: this.Env.S3_BUCKET_NAME,
                region: this.Env.S3_REGION,
                accessKeyId: this.Env.S3_ACCESS_KEY_ID,
                secretAccessKey: this.Env.S3_SECRET_ACCESS_KEY
            });
        }
        return this.s3Client;
    }
    get StringClient() {
        if (this.stringClient === undefined) {
            this.stringClient = new StringClient_1.StringClient();
        }
        return this.stringClient;
    }
    get EncryptClient() {
        if (this.encryptClient === undefined) {
            this.encryptClient = new EncryptClient_1.EncryptClient({
                secretKeyHex: this.Env.SECRET_KEY_HEX,
                hmacKeyBase64: this.Env.HMAC_KEY_BASE64
            });
        }
        return this.encryptClient;
    }
    requestApi(method, url, params, header) {
        return __awaiter(this, void 0, void 0, function* () {
            // GET,DELETEのparamをURLクエリに
            if (method === 'GET' || method === 'DELETE') {
                for (const [key, value] of Object.entries(params)) {
                    if (value === undefined || value === null) {
                        continue;
                    }
                    if (Array.isArray(value)) {
                        for (const arrayValue of value) {
                            url += url.includes('?') ? '&' : '?';
                            url += `${key}=${arrayValue.toString()}`;
                        }
                    }
                    else {
                        url += url.includes('?') ? '&' : '?';
                        url += `${key}=${value.toString()}`;
                    }
                }
            }
            try {
                switch (method) {
                    case 'GET':
                        return yield axios_1.default.get(url, header === undefined ? {} : { headers: header });
                    case 'POST':
                        return yield axios_1.default.post(url, params, header === undefined ? {} : { headers: header });
                    case 'PUT':
                        return yield axios_1.default.put(url, params, header === undefined ? {} : { headers: header });
                    case 'DELETE':
                        return yield axios_1.default.delete(url, header === undefined ? {} : { headers: header });
                    case 'PATCH':
                        return yield axios_1.default.patch(url, params, header === undefined ? {} : { headers: header });
                }
            }
            catch (ex) {
                let response = ex.response;
                if (response && [400, 401, 403, 404, 409, 422].includes(response.status)) {
                    return response;
                }
                throw ex;
            }
        });
    }
}
exports.Service = Service;
