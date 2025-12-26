import { Pool } from "pg";
export declare class MigrateDatabase {
    private dbName;
    get DbName(): string;
    private userName;
    get UserName(): string;
    private password;
    get Password(): string | null;
    private pool;
    constructor(dbName: string, userName: string, pool: Pool);
    IsExistUser(): Promise<boolean>;
    CreateUser(password?: string): Promise<void>;
    IsExistDb(): Promise<boolean>;
    CreateDb(collateType?: string): Promise<void>;
    RollbackDbSql(): string;
    RollbackUserSql(otherUserName: string): string;
    private trimSpaceLineSql;
}
//# sourceMappingURL=MigrateDatabase.d.ts.map