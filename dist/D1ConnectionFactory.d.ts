import { IDbConnection, IDbConnectionFactory } from './models/IDbClient';
/**
 * Cloudflare D1Database互換のインターフェース。
 * Cloudflare Workersの実際のD1Databaseバインディングはこのインターフェースを満たす。
 */
export interface ID1Database {
    prepare(query: string): ID1PreparedStatement;
}
export interface ID1PreparedStatement {
    bind(...values: any[]): ID1PreparedStatement;
    all<T = Record<string, unknown>>(): Promise<{
        results?: T[];
        meta?: {
            changes?: number;
        };
    }>;
    run(): Promise<{
        meta?: {
            changes?: number;
        };
    }>;
}
/**
 * Cloudflare D1用のIDbConnectionFactory実装。
 * D1Databaseバインディングをラップし、IDbClient互換のquery結果を返す。
 */
export declare class D1ConnectionFactory implements IDbConnectionFactory {
    private d1;
    constructor(d1: ID1Database);
    /** 単発クエリを実行する */
    query(sql: string, vars?: any[]): Promise<any>;
    /** IDbConnectionを返す（D1ではトランザクション操作がno-opになる） */
    connect(): Promise<IDbConnection>;
    /** D1は明示的なクローズ不要 */
    close(): Promise<void>;
}
//# sourceMappingURL=D1ConnectionFactory.d.ts.map