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
exports.Controller = void 0;
const axios_1 = __importDefault(require("axios"));
const pg_1 = require("pg");
const Exception_1 = require("./exceptions/Exception");
const RequestType_1 = require("./reqestResponse/RequestType");
const ResponseType_1 = require("./reqestResponse/ResponseType");
const StringClient_1 = require("./clients/StringClient");
const EncryptClient_1 = require("./clients/EncryptClient");
const PoolManager_1 = __importDefault(require("./PoolManager"));
const DateTimeUtil_1 = __importDefault(require("./Utils/DateTimeUtil"));
class Controller {
    constructor() {
        this.method = 'GET';
        this.endpoint = '';
        this.apiCode = '';
        this.summary = '';
        this.apiUserAvailable = '';
        this.request = new RequestType_1.RequestType();
        this.response = new ResponseType_1.ResponseType();
        this.tags = [];
        this.errorList = [];
        this.isSetDbConnection = true;
        this.isExecuteRollback = false;
    }
    get Method() { return this.method; }
    get Endpoint() { return this.endpoint + this.request.paramPath; }
    get ApiCode() { return this.apiCode; }
    get Summary() { return `${this.ApiCode !== '' ? `[${this.apiCode}]` : ''}${this.summary}`; }
    get ApiUserAvailable() { return this.apiUserAvailable; }
    get Request() { return this.request; }
    ; // swaggerで必要なので、ここだけ宣言
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
    main() {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    middleware() {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    outputSuccessLog() {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    outputErrorLog(ex) {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    get usePoolManager() { return true; }
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.initializeRequest();
                if (this.isSetDbConnection) {
                    this.client = yield this.Pool.connect();
                    yield this.Client.query('BEGIN');
                    this.isExecuteRollback = true;
                }
                yield this.middleware();
                yield this.main();
                if (this.isSetDbConnection) {
                    yield this.Client.query('COMMIT');
                    this.isExecuteRollback = false;
                }
                this.outputSuccessLog().catch((ex) => {
                    console.error(ex);
                });
                return this.returnSuccessResponse();
            }
            catch (ex) {
                this.outputErrorLog(ex).catch((ex) => {
                    console.error(ex);
                });
                return this.returnErrorResponse(ex);
            }
            finally {
                if (this.isExecuteRollback) {
                    yield this.Client.query('ROLLBACK');
                }
                this.isExecuteRollback = false;
                if (this.client !== undefined) {
                    yield this.client.release();
                }
                if (!this.usePoolManager && this.pool !== undefined) {
                    yield this.pool.end();
                }
            }
        });
    }
    getErrorResponse(ex) {
        if (ex instanceof Exception_1.AuthException) {
            return { status: 401, body: { message: "Authentication expired. Please login again." } };
        }
        else if (ex instanceof Exception_1.ForbiddenException) {
            return { status: 403, body: { message: 'Forbidden error' } };
        }
        else if (ex instanceof Exception_1.InputErrorException) {
            return { status: 400, body: { errorCode: `${this.apiCode}-${ex.ErrorId}`, errorMessage: ex.message } };
        }
        else if (ex instanceof Exception_1.DbConflictException) {
            return { status: 409, body: { errorCode: `${this.apiCode}-${ex.ErrorId}`, errorMessage: ex.message } };
        }
        else if (ex instanceof Exception_1.UnprocessableException) {
            return { status: 422, body: { errorCode: `${this.apiCode}-${ex.ErrorId}`, errorMessage: ex.message } };
        }
        else if (ex instanceof Exception_1.TooManyRequestsException) {
            return { status: 429, body: { errorCode: `${this.apiCode}-${ex.ErrorId}`, errorMessage: ex.message } };
        }
        else if (ex instanceof Exception_1.MaintenanceException) {
            return { status: 503, body: { errorMessage: ex.message } };
        }
        else if (ex instanceof Exception_1.NotFoundException) {
            return { status: 404, body: { errorCode: `${this.apiCode}-${ex.ErrorId}`, errorMessage: ex.message } };
        }
        return { status: 500, body: { message: 'Internal server error' } };
    }
    static set Now(value) {
        this.now = value;
    }
    static get Now() {
        var _a;
        return (_a = this.now) !== null && _a !== void 0 ? _a : new Date();
    }
    static get NowString() {
        return DateTimeUtil_1.default.toStringFromDate(this.Now, 'datetime');
    }
    static get Today() {
        const now = this.Now;
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }
    static get TodayString() {
        return DateTimeUtil_1.default.toStringFromDate(this.Now, 'date');
    }
    // DB接続
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
            if (!this.usePoolManager) {
                return new pg_1.Pool({
                    user: this.DbUser,
                    host: this.DbHost,
                    database: this.DbName,
                    password: this.DbPassword,
                    port: Number(this.DbPort),
                    ssl: this.DbIsSslConnect ? {
                        rejectUnauthorized: false
                    } : false
                });
            }
            return PoolManager_1.default.getPool(this.DbUser, this.DbHost, this.DbName, this.DbPassword, this.DbPort, this.DbIsSslConnect);
        }
        catch (ex) {
            throw new Error("Failed to connect to the database. Please check the connection settings.");
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
        if (this.isSetDbConnection) {
            if (this.client === undefined) {
                throw new Error("Please call this.PoolClient after using the startConnect method.");
            }
            return this.client;
        }
        return this.Pool;
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
exports.Controller = Controller;
// 日時ユーティリティ（static）
Controller.now = null;
