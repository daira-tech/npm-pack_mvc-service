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
export const d1Migrate = async (migrates: Array<D1MigrateTable>, d1: ID1Database): Promise<void> => {

    if (await isExistMigrationTable(d1) === false) {
        await executeD1(d1, `
            CREATE TABLE migrations (
                migration_number INTEGER,
                script_file TEXT,
                rollback_script TEXT,
                create_at TEXT DEFAULT (datetime('now'))
            );
        `);
    }

    const datas = await getMigrations(d1);
    let maxNumber = datas.maxNumber;

    for (const migrate of migrates) {
        const className = migrate.constructor.name;
        if (datas.datas.some(data => data.script_file === className)) {
            console.log(`Already executed: ${className}`);
            continue;
        }

        await executeD1(d1, migrate.MigrateSql);

        await executeD1(d1,
            `INSERT INTO migrations (migration_number, script_file, rollback_script) VALUES (?, ?, ?);`,
            [maxNumber + 1, className, migrate.RollbackSql]
        );
        maxNumber++;

        console.log(`Execution completed: ${className}`);
    }

    console.log('Migration completed');
};

export const d1Rollback = async (toNumber: number, d1: ID1Database): Promise<void> => {

    if (await isExistMigrationTable(d1) === false) {
        return;
    }

    const datas = await getMigrations(d1);
    for (const data of datas.datas) {
        if (data.migration_number < toNumber) {
            break;
        }
        await executeD1(d1, data.rollback_script);
        await executeD1(d1, `DELETE FROM migrations WHERE migration_number = ?;`, [data.migration_number]);

        console.log(`Execution completed: ${data.script_file}`);
    }

    console.log('Rollback completed');
};

async function executeD1(d1: ID1Database, sql: string, vars?: any[]): Promise<any[]> {
    const stmt = d1.prepare(sql);
    const bound = vars?.length ? stmt.bind(...vars) : stmt;
    const result = await bound.all();
    return (result.results ?? []) as any[];
}

const isExistMigrationTable = async (d1: ID1Database): Promise<boolean> => {
    const rows = await executeD1(d1,
        `SELECT count(*) as cnt FROM sqlite_master WHERE type = 'table' AND name = ?;`,
        ['migrations']
    );
    return (rows[0] as any)?.cnt > 0;
};

const getMigrations = async (d1: ID1Database): Promise<{
    datas: Array<{ migration_number: number; script_file: string; rollback_script: string }>;
    maxNumber: number;
}> => {
    const rows = await executeD1(d1, `SELECT * FROM migrations ORDER BY migration_number DESC;`);
    const datas = rows as Array<{ migration_number: number; script_file: string; rollback_script: string }>;
    return {
        maxNumber: datas[0]?.migration_number || 0,
        datas,
    };
};
