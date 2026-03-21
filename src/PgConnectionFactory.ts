import { Pool, type PoolClient } from 'pg';
import { IDbConnection, IDbConnectionFactory } from './models/IDbClient';
import PoolManager from './PoolManager';

export interface PgConnectionConfig {
    user: string;
    host: string;
    database: string;
    password: string;
    port: number;
    ssl: boolean;
    timezone?: string;
    /**
     * true: PoolManagerで接続を使い回す（Express等の常駐プロセス向け）
     * false: リクエストごとにPoolを生成・破棄する（Hono/Cloudflare Workers向け）
     */
    usePoolManager?: boolean;
}

/**
 * PostgreSQLの接続（PoolClient）をIDbConnectionとしてラップする
 * トランザクション状態を内部で管理し、commit済みの場合rollback()はno-opになる
 */
class PgConnection implements IDbConnection {
    private inTransaction = false;

    constructor(private client: PoolClient) {}

    async query(sql: string, vars?: any[]): Promise<any> {
        return await this.client.query(sql, vars ?? []);
    }

    async begin(): Promise<void> {
        await this.client.query('BEGIN');
        this.inTransaction = true;
    }

    async commit(): Promise<void> {
        await this.client.query('COMMIT');
        this.inTransaction = false;
    }

    async rollback(): Promise<void> {
        if (this.inTransaction) {
            await this.client.query('ROLLBACK');
            this.inTransaction = false;
        }
    }

    async release(): Promise<void> {
        this.client.release();
    }
}

/**
 * PostgreSQL用のIDbConnectionFactory実装
 * Poolの生成方式をusePoolManagerフラグで切り替える
 * - usePoolManager=true:  PoolManagerで共有Pool（Express向け、close()はno-op）
 * - usePoolManager=false: リクエスト単位でPool生成・破棄（Hono向け）
 */
export class PgConnectionFactory implements IDbConnectionFactory {
    private pool: Pool;
    private readonly shouldClosePool: boolean;

    constructor(config: PgConnectionConfig) {
        try {
            if (config.usePoolManager) {
                this.pool = PoolManager.getPool(config.user, config.host, config.database, config.password, config.port, config.ssl);
                this.shouldClosePool = false;
            } else {
                this.pool = new Pool({
                    user: config.user,
                    host: config.host,
                    database: config.database,
                    password: config.password,
                    port: config.port,
                    ssl: config.ssl ? { rejectUnauthorized: false } : false,
                });
                this.shouldClosePool = true;
            }
            this.pool.query(`SET TIME ZONE '${config.timezone ?? 'Asia/Tokyo'}';`);
        } catch (ex) {
            throw new Error("Failed to connect to the database. Please check the connection settings.");
        }
    }

    /** トランザクション不要の単発クエリ用（Pool経由で直接実行） */
    async query(sql: string, vars?: any[]): Promise<any> {
        return await this.pool.query(sql, vars ?? []);
    }

    /** Poolからクライアント接続を取得し、IDbConnectionとして返す */
    async connect(): Promise<IDbConnection> {
        const client = await this.pool.connect();
        return new PgConnection(client);
    }

    /** usePoolManager=falseの場合のみPoolを破棄する */
    async close(): Promise<void> {
        if (this.shouldClosePool) {
            await this.pool.end();
        }
    }
}
