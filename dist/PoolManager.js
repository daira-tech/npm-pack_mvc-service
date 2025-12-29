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
// PoolManager.ts
const pg_1 = require("pg");
class PoolManager {
    static getPool(user, host, database, password, port, isSslConnect) {
        const key = `${user}@${host}/${database}`;
        if (!this.poolMap[key]) {
            this.poolMap[key] = new pg_1.Pool({
                user: user,
                host: host,
                database: database,
                password: password,
                port: Number(port),
                ssl: isSslConnect ? {
                    rejectUnauthorized: false
                } : false
            });
        }
        return this.poolMap[key];
    }
    static shutdownAll() {
        return __awaiter(this, void 0, void 0, function* () {
            for (const [key, pool] of Object.entries(this.poolMap)) {
                try {
                    yield pool.end();
                    console.log(`Closed pool: ${key}`);
                }
                catch (e) {
                    console.error(`Error closing pool ${key}`, e);
                }
            }
            this.poolMap = {};
        });
    }
}
PoolManager.poolMap = {};
exports.default = PoolManager;
// ✅ 自動実行されるシャットダウン登録
process.on('SIGINT', () => __awaiter(void 0, void 0, void 0, function* () {
    console.log('🔌 SIGINT received. Closing all pools...');
    yield PoolManager.shutdownAll();
    process.exit(0);
}));
process.on('SIGTERM', () => __awaiter(void 0, void 0, void 0, function* () {
    console.log('🔌 SIGTERM received. Closing all pools...');
    yield PoolManager.shutdownAll();
    process.exit(0);
}));
