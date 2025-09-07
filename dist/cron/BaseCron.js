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
exports.BaseCron = void 0;
const PoolManager_1 = __importDefault(require("../PoolManager"));
class BaseCron {
    constructor() {
        this.isTest = process.env.NODE_ENV === 'test';
        this.dbUser = this.isTest ? process.env.TEST_DB_USER : process.env.DB_USER;
        this.dbHost = this.isTest ? process.env.TEST_DB_HOST : process.env.DB_HOST;
        this.dbName = this.isTest ? process.env.TEST_DB_DATABASE : process.env.DB_DATABASE;
        this.dbPassword = this.isTest ? process.env.TEST_DB_PASSWORD : process.env.DB_PASSWORD;
        this.dbPort = this.isTest ? process.env.TEST_DB_PORT : process.env.DB_PORT;
        this.dbIsSslConnect = (this.isTest ? process.env.TEST_DB_IS_SSL : process.env.DB_IS_SSL) === 'true';
        this.isExecuteRollback = false;
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
    get Client() {
        if (this.client === undefined) {
            throw new Error("Please call this.PoolClient after using the setClient method.");
        }
        return this.client;
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
    setUp() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
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
            this.pool = PoolManager_1.default.getPool(this.dbUser, this.dbHost, this.dbName, this.dbPassword, this.dbPort, this.dbIsSslConnect);
            this.pool.query(`SET TIME ZONE '${(_a = process.env.TZ) !== null && _a !== void 0 ? _a : 'Asia/Tokyo'}';`);
            this.client = yield this.pool.connect();
            yield this.Client.query('BEGIN');
            this.isExecuteRollback = true;
        });
    }
    tearDown() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isExecuteRollback === false) {
                this.rollback();
            }
        });
    }
}
exports.BaseCron = BaseCron;
