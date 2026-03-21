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
exports.PgConnectionFactory = void 0;
const pg_1 = require("pg");
const PoolManager_1 = __importDefault(require("./PoolManager"));
/**
 * PostgreSQLの接続（PoolClient）をIDbConnectionとしてラップする
 * トランザクション状態を内部で管理し、commit済みの場合rollback()はno-opになる
 */
class PgConnection {
    constructor(client) {
        this.client = client;
        this.inTransaction = false;
    }
    query(sql, vars) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.client.query(sql, vars !== null && vars !== void 0 ? vars : []);
        });
    }
    begin() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.client.query('BEGIN');
            this.inTransaction = true;
        });
    }
    commit() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.client.query('COMMIT');
            this.inTransaction = false;
        });
    }
    rollback() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.inTransaction) {
                yield this.client.query('ROLLBACK');
                this.inTransaction = false;
            }
        });
    }
    release() {
        return __awaiter(this, void 0, void 0, function* () {
            this.client.release();
        });
    }
}
/**
 * PostgreSQL用のIDbConnectionFactory実装
 * Poolの生成方式をusePoolManagerフラグで切り替える
 * - usePoolManager=true:  PoolManagerで共有Pool（Express向け、close()はno-op）
 * - usePoolManager=false: リクエスト単位でPool生成・破棄（Hono向け）
 */
class PgConnectionFactory {
    constructor(config) {
        var _a;
        try {
            if (config.usePoolManager) {
                this.pool = PoolManager_1.default.getPool(config.user, config.host, config.database, config.password, config.port, config.ssl);
                this.shouldClosePool = false;
            }
            else {
                this.pool = new pg_1.Pool({
                    user: config.user,
                    host: config.host,
                    database: config.database,
                    password: config.password,
                    port: config.port,
                    ssl: config.ssl ? { rejectUnauthorized: false } : false,
                });
                this.shouldClosePool = true;
            }
            this.pool.query(`SET TIME ZONE '${(_a = config.timezone) !== null && _a !== void 0 ? _a : 'Asia/Tokyo'}';`);
        }
        catch (ex) {
            throw new Error("Failed to connect to the database. Please check the connection settings.");
        }
    }
    /** トランザクション不要の単発クエリ用（Pool経由で直接実行） */
    query(sql, vars) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.pool.query(sql, vars !== null && vars !== void 0 ? vars : []);
        });
    }
    /** Poolからクライアント接続を取得し、IDbConnectionとして返す */
    connect() {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield this.pool.connect();
            return new PgConnection(client);
        });
    }
    /** usePoolManager=falseの場合のみPoolを破棄する */
    close() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.shouldClosePool) {
                yield this.pool.end();
            }
        });
    }
}
exports.PgConnectionFactory = PgConnectionFactory;
