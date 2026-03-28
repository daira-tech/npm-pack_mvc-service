import { ID1Database } from "../D1ConnectionFactory";
import { D1MigrateTable } from "./D1MigrateTable";
/**
 * D1（SQLite）用のマイグレーション実行。
 * PG版との違い:
 * - pg.Pool ではなく ID1Database を使用
 * - sqlite_master で migrations テーブルの存在を確認
 * - ? プレースホルダ
 * - トランザクションなし（D1非対応のため逐次実行）
 * - スキーマなし
 * - TIMESTAMP WITH TIME ZONE → TEXT（SQLiteに日付型がない）
 */
export declare const d1Migrate: (migrates: Array<D1MigrateTable>, d1: ID1Database) => Promise<void>;
export declare const d1Rollback: (toNumber: number, d1: ID1Database) => Promise<void>;
//# sourceMappingURL=D1MigrateRollback.d.ts.map