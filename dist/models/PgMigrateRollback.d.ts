import { PgMigrateTable } from "./PgMigrateTable";
export declare const pgMigrate: (migrates: Array<PgMigrateTable>, poolParam: {
    host: string;
    user: string;
    dbName: string;
    password: string;
    port?: number;
    isSsl?: boolean;
}) => Promise<void>;
export declare const pgRollback: (toNumber: number, schemaName: string, poolParam: {
    host: string;
    user: string;
    dbName: string;
    password: string;
    port?: number;
    isSsl?: boolean;
}) => Promise<void>;
//# sourceMappingURL=PgMigrateRollback.d.ts.map