/**
 * D1（SQLite）用マイグレーション定義の基底クラス。
 * PG版（PgMigrateTable）との違い:
 * - スキーマなし（D1にスキーマ概念がない）
 * - GRANT文なし（D1に権限管理がない）
 */
export class D1MigrateTable {

    protected readonly migrateSql: string = '';
    protected readonly rollbackSql: string = '';

    get MigrateSql(): string { return this.trimSpaceLineSql(this.migrateSql); }
    get RollbackSql(): string { return this.trimSpaceLineSql(this.rollbackSql); }

    private trimSpaceLineSql(str: string) {
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
                } else {
                    sql += line + '\n';
                }
            }
        }

        return sql;
    }
}
