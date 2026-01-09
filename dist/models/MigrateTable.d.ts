export declare class MigrateTable {
    protected readonly migrateSql: string;
    protected readonly rollbackSql: string;
    protected readonly addGrantTables: Array<string>;
    protected readonly user: string;
    protected readonly schema: string;
    get Schema(): string;
    get MigrateSql(): string;
    get RollbackSql(): string;
    get AddGrantSql(): string | null;
    constructor();
    constructor(user: string);
    private trimSpaceLineSql;
}
//# sourceMappingURL=MigrateTable.d.ts.map