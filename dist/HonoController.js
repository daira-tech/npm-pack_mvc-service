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
exports.HonoController = void 0;
const cookie_1 = require("hono/cookie");
const Controller_1 = require("./Controller");
class HonoController extends Controller_1.Controller {
    get usePoolManager() { return false; }
    constructor(C) {
        super();
        this.C = C;
    }
    get Env() {
        return this.C.env;
    }
    initializeRequest() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.request.setRequest('hono', this.C);
        });
    }
    returnSuccessResponse() {
        return this.C.json(this.response.ResponseData, 200);
    }
    returnErrorResponse(ex) {
        const { status, body } = this.getErrorResponse(ex);
        return this.C.json(body, status);
    }
    get Headers() {
        return this.C.req.header();
    }
    getHeader(key) {
        return this.C.req.header(key);
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
        this.C.header(key, formattedValue);
    }
    setCookie(key, value, options) {
        var _a, _b, _c, _d;
        const config = {
            httpOnly: (_a = options === null || options === void 0 ? void 0 : options.httpOnly) !== null && _a !== void 0 ? _a : true,
            secure: (_b = options === null || options === void 0 ? void 0 : options.secure) !== null && _b !== void 0 ? _b : true,
            sameSite: (_c = options === null || options === void 0 ? void 0 : options.sameSite) !== null && _c !== void 0 ? _c : 'strict',
            path: (_d = options === null || options === void 0 ? void 0 : options.path) !== null && _d !== void 0 ? _d : '/',
            domain: options === null || options === void 0 ? void 0 : options.domain,
            expires: options === null || options === void 0 ? void 0 : options.expires
        };
        (0, cookie_1.setCookie)(this.C, key, value, Object.assign(Object.assign({}, config), { maxAge: options === null || options === void 0 ? void 0 : options.maxAgeSec, sameSite: (config.sameSite.charAt(0).toUpperCase() + config.sameSite.slice(1)) }));
    }
    getCookie(key) {
        return (0, cookie_1.getCookie)(this.C, key);
    }
    removeCookie(key, options) {
        (0, cookie_1.deleteCookie)(this.C, key, options);
    }
}
exports.HonoController = HonoController;
