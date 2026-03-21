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
exports.ExpressController = void 0;
const Controller_1 = require("./Controller");
const PgConnectionFactory_1 = require("./PgConnectionFactory");
class ExpressController extends Controller_1.Controller {
    constructor(Req, Res) {
        super();
        this.Req = Req;
        this.Res = Res;
    }
    get Env() {
        return process.env;
    }
    createConnectionFactory() {
        const config = this.validateDbConfig();
        return new PgConnectionFactory_1.PgConnectionFactory(Object.assign(Object.assign({}, config), { usePoolManager: true }));
    }
    initializeRequest() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.request.setRequest('express', this.Req);
        });
    }
    returnSuccessResponse() {
        return this.Res.status(200).json(this.response.ResponseData);
    }
    returnErrorResponse(ex) {
        const { status, body } = this.getErrorResponse(ex);
        this.Res.status(status).json(body);
    }
    get Headers() {
        return this.Req.headers;
    }
    getHeader(key) {
        const value = this.Req.header(key);
        return Array.isArray(value) ? value[0] : value;
    }
    setResponseHeader(key, value) {
        let formattedValue;
        if (typeof value === 'string') {
            formattedValue = value;
        }
        else {
            if (Array.isArray(value)) {
                throw new Error('Arrays are not allowed in setResponseHeader. Please use string or object.');
            }
            formattedValue = JSON.stringify(value);
        }
        this.Res.setHeader(key, formattedValue);
    }
    setCookie(key, value, options) {
        var _a, _b, _c, _d;
        this.Res.cookie(key, value, {
            httpOnly: (_a = options === null || options === void 0 ? void 0 : options.httpOnly) !== null && _a !== void 0 ? _a : true,
            secure: (_b = options === null || options === void 0 ? void 0 : options.secure) !== null && _b !== void 0 ? _b : true,
            sameSite: (_c = options === null || options === void 0 ? void 0 : options.sameSite) !== null && _c !== void 0 ? _c : 'strict',
            path: (_d = options === null || options === void 0 ? void 0 : options.path) !== null && _d !== void 0 ? _d : '/',
            domain: options === null || options === void 0 ? void 0 : options.domain,
            expires: options === null || options === void 0 ? void 0 : options.expires,
            maxAge: (options === null || options === void 0 ? void 0 : options.maxAgeSec) !== undefined ? options.maxAgeSec * 1000 : undefined,
        });
    }
    getCookie(key) {
        return this.Req.cookies[key];
    }
    removeCookie(key, options) {
        this.Res.clearCookie(key, options);
    }
}
exports.ExpressController = ExpressController;
