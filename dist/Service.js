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
const Exception_1 = require("./Exception");
const RequestType_1 = require("./RequestType");
const ResponseType_1 = require("./ResponseType");
const S3Client_1 = __importDefault(require("./S3Client"));
const Base64Client_1 = __importDefault(require("./Base64Client"));
const StringClient_1 = __importDefault(require("./StringClient"));
const EncryptClient_1 = __importDefault(require("./EncryptClient"));
const PoolManager_1 = __importDefault(require("./PoolManager"));
class Service {
    get Method() { return this.method; }
    get Endpoint() { return this.endpoint; }
    get ApiCode() { return this.apiCode; }
    get Summary() { return `${this.ApiCode !== '' ? this.apiCode + ': ' : ''}${this.summary}`; }
    get ApiUserAvailable() { return this.apiUserAvailable; }
    get Request() { return this.request; }
    ; // swaggerで必要なので、ここだけ宣言
    get AuthToken() { var _a; return (_a = this.request.Authorization) !== null && _a !== void 0 ? _a : ''; }
    get Response() { return this.response; }
    ; // swaggerで必要なので、ここだけ宣言
    get Tags() { return this.tags; }
    constructor(request, response) {
        this.method = 'GET';
        this.endpoint = '';
        this.apiCode = '';
        this.summary = '';
        this.apiUserAvailable = '';
        this.request = new RequestType_1.RequestType();
        this.response = new ResponseType_1.ResponseType();
        this.isTest = process.env.NODE_ENV === 'test';
        this.tags = [];
        this.dbUser = this.isTest ? process.env.TEST_DB_USER : process.env.DB_USER;
        this.dbHost = this.isTest ? process.env.TEST_DB_HOST : process.env.DB_HOST;
        this.dbName = this.isTest ? process.env.TEST_DB_DATABASE : process.env.DB_DATABASE;
        this.dbPassword = this.isTest ? process.env.TEST_DB_PASSWORD : process.env.DB_PASSWORD;
        this.dbPort = this.isTest ? process.env.TEST_DB_PORT : process.env.DB_PORT;
        this.dbIsSslConnect = (this.isTest ? process.env.TEST_DB_IS_SSL : process.env.DB_IS_SSL) === 'true';
        this.isExecuteRollback = false;
        this.req = request;
        this.res = response;
    }
    inintialize() {
        return __awaiter(this, void 0, void 0, function* () {
            this.request.setRequest(this.req);
            yield this.checkMaintenance();
            yield this.middleware();
        });
    }
    setPool() {
        if (this.dbUser === undefined) {
            throw new Error("Database user is not configured");
        }
        if (this.dbHost === undefined) {
            throw new Error("Database host is not configured");
        }
        if (this.dbName === undefined) {
            throw new Error("Database name is not configured");
        }
        if (this.dbPassword === undefined) {
            throw new Error("Database password is not configured");
        }
        if (this.dbPort === undefined) {
            throw new Error("Database port is not configured");
        }
        try {
            return PoolManager_1.default.getPool(this.dbUser, this.dbHost, this.dbName, this.dbPassword, this.dbPort, this.dbIsSslConnect);
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
    resSuccess() {
        this.res.status(200).json(this.response.ResponseData);
    }
    outputErrorLog(ex) {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    handleException(ex) {
        // To avoid slowing down the response, make this asynchronous
        this.outputErrorLog(ex).catch((ex) => {
            console.error(ex);
        });
        if (ex instanceof Exception_1.AuthException) {
            this.res.status(401).json({
                message: "Authentication expired. Please login again."
            });
            return;
        }
        else if (ex instanceof Exception_1.ForbiddenException) {
            this.res.status(403).json({
                message: 'Forbidden error'
            });
            return;
        }
        else if (ex instanceof Exception_1.InputErrorException) {
            this.res.status(400).json({
                errorCode: `${this.apiCode}-${ex.ErrorId}`,
                errorMessage: ex.message
            });
            return;
        }
        else if (ex instanceof Exception_1.MaintenanceException) {
            this.res.status(503).json({
                errorMessage: ex.message
            });
            return;
        }
        this.res.status(500).json({
            message: 'Internal server error'
        });
        return;
    }
    get Pool() {
        var _a;
        if (this.pool === undefined) {
            this.pool = this.setPool();
            this.pool.query(`SET TIME ZONE '${(_a = process.env.TZ) !== null && _a !== void 0 ? _a : 'Asia/Tokyo'}';`);
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
            if (this.isTest) {
                // In tests, the connection is terminated because it is shut down every time
                yield this.Pool.end();
            }
        });
    }
    get S3Client() {
        if (this.s3Client === undefined) {
            this.s3Client = new S3Client_1.default({
                bucketName: process.env.S3_BUCKET_NAME,
                region: process.env.S3_REGION,
                accessKeyId: process.env.S3_ACCESS_KEY_ID,
                secretAccessKey: process.env.S3_SECRET_ACCESS_KEY
            });
        }
        return this.s3Client;
    }
    get Base64Client() {
        if (this.base64Client === undefined) {
            this.base64Client = new Base64Client_1.default();
        }
        return this.base64Client;
    }
    get StringClient() {
        if (this.stringClient === undefined) {
            this.stringClient = new StringClient_1.default();
        }
        return this.stringClient;
    }
    get EncryptClient() {
        if (this.encryptClient === undefined) {
            this.encryptClient = new EncryptClient_1.default({
                secretKeyHex: process.env.SECRET_KEY_HEX,
                hmacKeyBase64: process.env.HMAC_KEY_BASE64
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
                if (response && response.status >= 400 && response.status < 500) {
                    return response;
                }
                throw ex;
            }
        });
    }
}
exports.Service = Service;
