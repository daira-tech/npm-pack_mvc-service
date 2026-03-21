import { IDbConnection, IDbConnectionFactory } from './models/IDbClient';
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
 * PostgreSQL用のIDbConnectionFactory実装
 * Poolの生成方式をusePoolManagerフラグで切り替える
 * - usePoolManager=true:  PoolManagerで共有Pool（Express向け、close()はno-op）
 * - usePoolManager=false: リクエスト単位でPool生成・破棄（Hono向け）
 */
export declare class PgConnectionFactory implements IDbConnectionFactory {
    private pool;
    private readonly shouldClosePool;
    constructor(config: PgConnectionConfig);
    /** トランザクション不要の単発クエリ用（Pool経由で直接実行） */
    query(sql: string, vars?: any[]): Promise<any>;
    /** Poolからクライアント接続を取得し、IDbConnectionとして返す */
    connect(): Promise<IDbConnection>;
    /** usePoolManager=falseの場合のみPoolを破棄する */
    close(): Promise<void>;
}
//# sourceMappingURL=PgConnectionFactory.d.ts.map