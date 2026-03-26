// PoolManager.ts
import { Pool } from 'pg';

export default class PoolManager {
    private static poolMap: Record<string, Pool> = {};

    static getPool(user: string, host: string, database: string, password: string, port: number | string, isSslConnect: boolean): Pool {
        const key = `${user}@${host}/${database}`;
        if (!this.poolMap[key]) {
            this.poolMap[key] = new Pool({
                user: user,
                host: host,
                database: database,
                password: password,
                port: Number(port),
                ssl: isSslConnect ? {
                    rejectUnauthorized: false
                    } : false
            });
            this.poolMap[key].on('error', (err) => {
                console.error(`Idle client error on pool [${key}]:`, err.message);
            });
        }
    
        return this.poolMap[key];
    }

    static async shutdownAll(): Promise<void> {
        for (const [key, pool] of Object.entries(this.poolMap)) {
            try {
                await pool.end();
                console.log(`Closed pool: ${key}`);
            } catch (e) {
                console.error(`Error closing pool ${key}`, e);
            }
        }

        this.poolMap = {};
    }
}
  
// ✅ 自動実行されるシャットダウン登録
process.on('SIGINT', async () => {
    console.log('🔌 SIGINT received. Closing all pools...');
    await PoolManager.shutdownAll();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('🔌 SIGTERM received. Closing all pools...');
    await PoolManager.shutdownAll();
    process.exit(0);
});