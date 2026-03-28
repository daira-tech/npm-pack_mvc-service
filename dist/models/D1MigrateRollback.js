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
exports.d1Rollback = exports.d1Migrate = void 0;
/**
 * D1（SQLite）用のマイグレーション実行。
 * PG版との違い:
 * - pg.Pool ではなく ID1Database を使用
 * - sqlite_master で migrations テーブルの存在を確認
 * - ? プレースホルダ
 * - トランザクションなし（D1非対応のため逐次実行）
 * - スキーマなし
 * - TIMESTAMP WITH TIME ZONE → TEXT（SQLiteに日付型がない）
 */
const d1Migrate = (migrates, d1) => __awaiter(void 0, void 0, void 0, function* () {
    if ((yield isExistMigrationTable(d1)) === false) {
        yield executeD1(d1, `
            CREATE TABLE migrations (
                migration_number INTEGER,
                script_file TEXT,
                rollback_script TEXT,
                create_at TEXT DEFAULT (datetime('now'))
            );
        `);
    }
    const datas = yield getMigrations(d1);
    let maxNumber = datas.maxNumber;
    for (const migrate of migrates) {
        const className = migrate.constructor.name;
        if (datas.datas.some(data => data.script_file === className)) {
            console.log(`Already executed: ${className}`);
            continue;
        }
        yield executeD1(d1, migrate.MigrateSql);
        yield executeD1(d1, `INSERT INTO migrations (migration_number, script_file, rollback_script) VALUES (?, ?, ?);`, [maxNumber + 1, className, migrate.RollbackSql]);
        maxNumber++;
        console.log(`Execution completed: ${className}`);
    }
    console.log('Migration completed');
});
exports.d1Migrate = d1Migrate;
const d1Rollback = (toNumber, d1) => __awaiter(void 0, void 0, void 0, function* () {
    if ((yield isExistMigrationTable(d1)) === false) {
        return;
    }
    const datas = yield getMigrations(d1);
    for (const data of datas.datas) {
        if (data.migration_number < toNumber) {
            break;
        }
        yield executeD1(d1, data.rollback_script);
        yield executeD1(d1, `DELETE FROM migrations WHERE migration_number = ?;`, [data.migration_number]);
        console.log(`Execution completed: ${data.script_file}`);
    }
    console.log('Rollback completed');
});
exports.d1Rollback = d1Rollback;
function executeD1(d1, sql, vars) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const stmt = d1.prepare(sql);
        const bound = (vars === null || vars === void 0 ? void 0 : vars.length) ? stmt.bind(...vars) : stmt;
        const result = yield bound.all();
        return ((_a = result.results) !== null && _a !== void 0 ? _a : []);
    });
}
const isExistMigrationTable = (d1) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const rows = yield executeD1(d1, `SELECT count(*) as cnt FROM sqlite_master WHERE type = 'table' AND name = ?;`, ['migrations']);
    return ((_a = rows[0]) === null || _a === void 0 ? void 0 : _a.cnt) > 0;
});
const getMigrations = (d1) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const rows = yield executeD1(d1, `SELECT * FROM migrations ORDER BY migration_number DESC;`);
    const datas = rows;
    return {
        maxNumber: ((_a = datas[0]) === null || _a === void 0 ? void 0 : _a.migration_number) || 0,
        datas,
    };
});
