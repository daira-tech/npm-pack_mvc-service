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
    all<T = Record<string, unknown>>(): Promise<{ results?: T[]; meta?: { changes?: number } }>;
    run(): Promise<{ meta?: { changes?: number } }>;
}

/**
 * D1のクエリ結果をPgConnectionFactory互換の形式（rows, rowCount, fields）に正規化する
 */
async function executeD1Query(d1: ID1Database, sql: string, vars?: any[]): Promise<any> {
    const stmt = d1.prepare(sql);
    const bound = vars?.length ? stmt.bind(...vars) : stmt;
    const result = await bound.all();
    const rows = (result.results ?? []) as any[];
    const changes = result.meta?.changes ?? 0;
    return {
        rows,
        rowCount: changes > 0 ? changes : rows.length,
        fields: rows.length > 0 ? Object.keys(rows[0]).map(name => ({ name })) : [],
    };
}

/**
 * D1用のIDbConnection実装。
 * D1はBEGIN/COMMIT/ROLLBACKに対応しないため、トランザクション操作はno-op。
 */
class D1Connection implements IDbConnection {
    constructor(private d1: ID1Database) {}

    async query(sql: string, vars?: any[]): Promise<any> {
        return executeD1Query(this.d1, sql, vars);
    }

    async begin(): Promise<void> { /* D1はトランザクション非対応 */ }
    async commit(): Promise<void> { /* no-op */ }
    async rollback(): Promise<void> { /* no-op */ }
    async release(): Promise<void> { /* no-op */ }
}

/**
 * Cloudflare D1用のIDbConnectionFactory実装。
 * D1Databaseバインディングをラップし、IDbClient互換のquery結果を返す。
 */
export class D1ConnectionFactory implements IDbConnectionFactory {
    constructor(private d1: ID1Database) {}

    /** 単発クエリを実行する */
    async query(sql: string, vars?: any[]): Promise<any> {
        return executeD1Query(this.d1, sql, vars);
    }

    /** IDbConnectionを返す（D1ではトランザクション操作がno-opになる） */
    async connect(): Promise<IDbConnection> {
        return new D1Connection(this.d1);
    }

    /** D1は明示的なクローズ不要 */
    async close(): Promise<void> { /* no-op */ }
}
