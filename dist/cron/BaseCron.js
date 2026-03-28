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
exports.BaseCron = void 0;
const PgConnectionFactory_1 = require("../PgConnectionFactory");
const D1ConnectionFactory_1 = require("../D1ConnectionFactory");
class BaseCron {
    constructor() {
        /** DB種別。'pg' で PostgreSQL、'd1' で Cloudflare D1。'none' は DB 未使用 */
        this.db = 'none';
        // **********************************************************************
        // こちらのメソッド、プロパティを各サブクラスで設定してください
        // **********************************************************************
        this.cronCode = '';
        this.minute = '*';
        this.hour = '*';
        this.date = '*';
        this.month = '*';
        this.day = '*';
    }
    /** db = 'pg' の場合に設定する PostgreSQL 接続設定 */
    get pgConfig() { return undefined; }
    /** db = 'd1' の場合に設定する D1 データベースバインディング */
    get d1Database() { return undefined; }
    get Client() {
        if (this.connection) {
            return this.connection;
        }
        if (this.factory) {
            return this.factory;
        }
        throw new Error("Please call setUp() before accessing Client.");
    }
    commit() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.connection) {
                yield this.connection.commit();
            }
        });
    }
    rollback() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.connection) {
                yield this.connection.rollback();
            }
        });
    }
    run() {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    // **********************************************************************
    // ベースクラスで設定
    // **********************************************************************
    get CronSchedule() {
        let schedule = '';
        schedule += this.minute.toString() + ' ';
        schedule += this.hour.toString() + ' ';
        schedule += this.date.toString() + ' ';
        schedule += this.month.toString() + ' ';
        schedule += this.day.toString();
        return schedule;
    }
    get CronCode() { return this.cronCode; }
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
                throw new Error("BaseCron.db is 'none'. Set db = 'pg' or 'd1'.");
        }
    }
    setUp() {
        return __awaiter(this, void 0, void 0, function* () {
            this.factory = this.createConnectionFactory();
            this.connection = yield this.factory.connect();
            yield this.connection.begin();
        });
    }
    tearDown() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.rollback();
            }
            finally {
                if (this.connection) {
                    try {
                        yield this.connection.release();
                    }
                    catch (_) { }
                    this.connection = undefined;
                }
                if (this.factory) {
                    try {
                        yield this.factory.close();
                    }
                    catch (_) { }
                    this.factory = undefined;
                }
            }
        });
    }
}
exports.BaseCron = BaseCron;
