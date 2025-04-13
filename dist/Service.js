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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Service = exports.ServiceRequestType = void 0;
const pg_1 = require("pg");
const Exception_1 = require("./Exception");
const api_interface_type_1 = require("api-interface-type");
class ServiceRequestType extends api_interface_type_1.RequestType {
    constructor() {
        super(...arguments);
        this.INVALID_PATH_PARAM_UUID_ERROR_MESSAGE = 'urlの{property}はUUIDを受け付けています。({value})';
        this.REQUIRED_ERROR_MESSAGE = '{property}は必須です。';
        this.UNNECESSARY_INPUT_ERROR_MESSAGE = "{property} : {value}は不要なINPUTです。`";
        this.INVALID_OBJECT_ERROR_MESSAGE = '{property}はObject型を受け付けています。({value})';
        this.INVALID_ARRAY_ERROR_MESSAGE = "{property}はArray型を受け付けています。({value})";
        this.INVALID_NUMBER_ERROR_MESSAGE = '{property}はnumber型を受け付けています。({value})';
        this.INVALID_BOOL_ERROR_MESSAGE = '{property}はbool型または文字列でtrue,falseまたは数値で0,1のみを受け付けています。({value})';
        this.INVALID_STRING_ERROR_MESSAGE = '{property}はstring型を受け付けています。({value})';
        this.INVALID_UUID_ERROR_MESSAGE = '{property}はUUIDを受け付けています。({value})';
        this.INVALID_MAIL_ERROR_MESSAGE = '{property}はメールを受け付けています。({value})';
        this.INVALID_DATE_ERROR_MESSAGE = '{property}は"YYYY-MM-DD"の文字列かつ存在する日付のみ受け付けています。({value})';
        this.INVALID_TIME_ERROR_MESSAGE = '{property}は"hh:mi"の文字列かつ存在する時間のみ受け付けています。({value})';
        this.INVALID_DATETIME_ERROR_MESSAGE = '{property}は"YYYY-MM-DD hh:mi:ss"または"YYYY-MM-DDThh:mi:ss"かつ存在する日時、時間のみ受け付けています。({value})';
    }
    throwException(code, message) {
        throw new Exception_1.InputErrorException(code, message);
    }
}
exports.ServiceRequestType = ServiceRequestType;
class Service {
    get Method() { return this.method; }
    get Endpoint() { return this.endpoint; }
    get ApiCode() { return this.apiCode; }
    get Summary() { return `${this.ApiCode !== '' ? this.apiCode + ': ' : ''}${this.summary}`; }
    get ApiUserAvailable() { return this.apiUserAvailable; }
    get Request() { return this.request; }
    ;
    get AuthToken() { var _a; return (_a = this.request.Authorization) !== null && _a !== void 0 ? _a : ''; }
    get Response() { return this.response; }
    ;
    constructor(response) {
        this.method = 'GET';
        this.endpoint = '';
        this.apiCode = '';
        this.summary = '';
        this.apiUserAvailable = '';
        this.request = new ServiceRequestType();
        this.response = new api_interface_type_1.ResponseType();
        this.isTest = process.env.NODE_ENV === 'test';
        this.isExecuteRollback = false;
        this.pool = this.setPool();
        this.res = response;
    }
    inintialize(request) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            this.request.setRequest(request);
            yield this.checkMaintenance();
            this.pool.query(`SET TIME ZONE '${(_a = process.env.TZ) !== null && _a !== void 0 ? _a : 'Asia/Tokyo'}';`);
            yield this.middleware();
        });
    }
    setPool() {
        return new pg_1.Pool({
            user: this.isTest ? process.env.TEST_DB_USER : process.env.DB_USER,
            host: this.isTest ? process.env.TEST_DB_HOST : process.env.DB_HOST,
            database: this.isTest ? process.env.TEST_DB_DATABASE : process.env.DB_DATABASE,
            password: this.isTest ? process.env.TEST_DB_PASSWORD : process.env.DB_PASSWORD,
            port: this.isTest ? Number(process.env.TEST_DB_PORT) : Number(process.env.DB_PORT),
            ssl: (this.isTest ? process.env.TEST_DB_IS_SSL : process.env.DB_IS_SSL) === 'true' ? {
                rejectUnauthorized: false
            } : false
        });
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
    get Pool() { return this.pool; }
    get Client() {
        if (this.client === undefined) {
            throw new Error("Please call this after using the startConnect method.");
        }
        return this.client;
    }
    startConnect() {
        return __awaiter(this, void 0, void 0, function* () {
            this.client = yield this.pool.connect();
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
                yield this.pool.end();
            }
        });
    }
}
exports.Service = Service;
