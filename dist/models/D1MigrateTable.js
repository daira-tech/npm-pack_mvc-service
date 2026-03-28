"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.D1MigrateTable = void 0;
/**
 * D1（SQLite）用マイグレーション定義の基底クラス。
 * PG版（MigrateTable）との違い:
 * - スキーマなし（D1にスキーマ概念がない）
 * - GRANT文なし（D1に権限管理がない）
 */
class D1MigrateTable {
    constructor() {
        this.migrateSql = '';
        this.rollbackSql = '';
    }
    get MigrateSql() { return this.trimSpaceLineSql(this.migrateSql); }
    get RollbackSql() { return this.trimSpaceLineSql(this.rollbackSql); }
    trimSpaceLineSql(str) {
        const splitLines = str.split('\n');
        let sql = '';
        for (let line of splitLines) {
            line = line.replace(/\s+/g, ' ').trim();
            if (line.startsWith('--') && sql[sql.length - 1] != '\n') {
                line = '\n' + line;
            }
            if (line.length > 0) {
                if (line.includes('--') === false) {
                    sql += line + ' ';
                }
                else {
                    sql += line + '\n';
                }
            }
        }
        return sql;
    }
}
exports.D1MigrateTable = D1MigrateTable;
