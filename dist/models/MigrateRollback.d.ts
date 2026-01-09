import { MigrateTable } from "./MigrateTable";
export declare const migrate: (migrates: Array<MigrateTable>, poolParam: {
    host: string;
    user: string;
    dbName: string;
    password: string;
    port?: number;
    isSsl?: boolean;
}) => Promise<void>;
export declare const rollback: (toNumber: number, schemaName: string, poolParam: {
    host: string;
    user: string;
    dbName: string;
    password: string;
    port?: number;
    isSsl?: boolean;
}) => Promise<void>;
//# sourceMappingURL=MigrateRollback.d.ts.map