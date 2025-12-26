import { Pool } from 'pg';
export default class PoolManager {
    private static poolMap;
    static getPool(user: string, host: string, database: string, password: string, port: number | string, isSslConnect: boolean): Pool;
    static shutdownAll(): Promise<void>;
}
//# sourceMappingURL=PoolManager.d.ts.map