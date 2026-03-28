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
exports.D1ConnectionFactory = void 0;
/**
 * D1のクエリ結果をPgConnectionFactory互換の形式（rows, rowCount, fields）に正規化する
 */
function executeD1Query(d1, sql, vars) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c;
        const stmt = d1.prepare(sql);
        const bound = (vars === null || vars === void 0 ? void 0 : vars.length) ? stmt.bind(...vars) : stmt;
        const result = yield bound.all();
        const rows = ((_a = result.results) !== null && _a !== void 0 ? _a : []);
        const changes = (_c = (_b = result.meta) === null || _b === void 0 ? void 0 : _b.changes) !== null && _c !== void 0 ? _c : 0;
        return {
            rows,
            rowCount: changes > 0 ? changes : rows.length,
            fields: rows.length > 0 ? Object.keys(rows[0]).map(name => ({ name })) : [],
        };
    });
}
/**
 * D1用のIDbConnection実装。
 * D1はBEGIN/COMMIT/ROLLBACKに対応しないため、トランザクション操作はno-op。
 */
class D1Connection {
    constructor(d1) {
        this.d1 = d1;
    }
    query(sql, vars) {
        return __awaiter(this, void 0, void 0, function* () {
            return executeD1Query(this.d1, sql, vars);
        });
    }
    begin() {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    commit() {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    rollback() {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    release() {
        return __awaiter(this, void 0, void 0, function* () { });
    }
}
/**
 * Cloudflare D1用のIDbConnectionFactory実装。
 * D1Databaseバインディングをラップし、IDbClient互換のquery結果を返す。
 */
class D1ConnectionFactory {
    constructor(d1) {
        this.d1 = d1;
    }
    /** 単発クエリを実行する */
    query(sql, vars) {
        return __awaiter(this, void 0, void 0, function* () {
            return executeD1Query(this.d1, sql, vars);
        });
    }
    /** IDbConnectionを返す（D1ではトランザクション操作がno-opになる） */
    connect() {
        return __awaiter(this, void 0, void 0, function* () {
            return new D1Connection(this.d1);
        });
    }
    /** D1は明示的なクローズ不要 */
    close() {
        return __awaiter(this, void 0, void 0, function* () { });
    }
}
exports.D1ConnectionFactory = D1ConnectionFactory;
