/**
 * D1（SQLite）用マイグレーション定義の基底クラス。
 * PG版（MigrateTable）との違い:
 * - スキーマなし（D1にスキーマ概念がない）
 * - GRANT文なし（D1に権限管理がない）
 */
export declare class D1MigrateTable {
    protected readonly migrateSql: string;
    protected readonly rollbackSql: string;
    get MigrateSql(): string;
    get RollbackSql(): string;
    private trimSpaceLineSql;
}
//# sourceMappingURL=D1MigrateTable.d.ts.map