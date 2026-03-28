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
const Exception_1 = require("./exceptions/Exception");
const RequestType_1 = require("./reqestResponse/RequestType");
const ResponseType_1 = require("./reqestResponse/ResponseType");
const EncryptClient_1 = require("./clients/EncryptClient");
const DateTimeUtil_1 = __importDefault(require("./Utils/DateTimeUtil"));
const PgConnectionFactory_1 = require("./PgConnectionFactory");
const D1ConnectionFactory_1 = require("./D1ConnectionFactory");
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
        /** DB種別。'pg' で PostgreSQL、'd1' で Cloudflare D1 に自動接続。'none' は DB 未使用 */
        this.db = 'none';
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
    /** db = 'pg' の場合に設定する PostgreSQL 接続設定 */
    get pgConfig() { return undefined; }
    /** db = 'd1' の場合に設定する D1 データベースバインディング */
    get d1Database() { return undefined; }
    createConnectionFactory() {
        switch (this.db) {
            case 'pg':
                if (!this.pgConfig) {
                    throw new Error("pgConfig is required when db = 'pg'.");
                }
                return new PgConnectionFactory_1.PgConnectionFactory(this.pgConfig);
            case 'd1':
                if (!this.d1Database) {
                    throw new Error("d1Database is required when db = 'd1'.");
                }
                return new D1ConnectionFactory_1.D1ConnectionFactory(this.d1Database);
            case 'none':
                throw new Error("Controller.db is 'none'. Set db = 'pg' or 'd1'.");
        }
    }
    get Client() {
        if (this.isSetDbConnection) {
            if (this.connection === undefined) {
                throw new Error("Please call this.Client after the connection is established in run().");
            }
            return this.connection;
        }
        if (this.factory === undefined) {
            this.factory = this.createConnectionFactory();
        }
        return this.factory;
    }
    commit() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.connection) {
                throw new Error("Cannot commit: no active database connection.");
            }
            yield this.connection.commit();
        });
    }
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.initializeRequest();
                if (this.isSetDbConnection) {
                    this.factory = this.createConnectionFactory();
                    this.connection = yield this.factory.connect();
                    yield this.connection.begin();
                }
                yield this.middleware();
                yield this.main();
                if (this.isSetDbConnection) {
                    yield this.commit();
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
                if (this.connection) {
                    try {
                        yield this.connection.rollback();
                    }
                    catch (_) { }
                    try {
                        yield this.connection.release();
                    }
                    catch (_) { }
                }
                if (this.factory) {
                    try {
                        yield this.factory.close();
                    }
                    catch (_) { }
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
