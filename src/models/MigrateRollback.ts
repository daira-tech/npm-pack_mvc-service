import { Pool } from "pg";
import { MigrateTable } from "./MigrateTable";

export const migrate = async (migrates: Array<MigrateTable>, poolParam: {
    host: string, user: string, dbName: string, password: string, port?: number, isSsl?: boolean
}): Promise<void> => {

    const migratesBySchema: {[key: string]: Array<MigrateTable>} = {};
    for (const migrate of migrates) {
        if (migrate.Schema in migratesBySchema === false) {
            migratesBySchema[migrate.Schema] = [];
        }

        migratesBySchema[migrate.Schema].push(migrate);
    }

    const pool = new Pool({
        user: poolParam.user,
        password: poolParam.password,
        host: poolParam.host,
        database: poolParam.dbName,
        port: poolParam.port ?? 5432,
        ssl: poolParam.isSsl === true ? {
            rejectUnauthorized: false
        } : false
    });

    const client = await pool.connect();
    try {
        client.query('BEGIN');

        for (const [keySchema, migrates] of Object.entries(migratesBySchema)) {
            if (await isExistMigrationTable(pool, keySchema) == false) {
                const tableName = keySchema === '' ? 'migrations' : `"${keySchema}".migrations`;
                const sql = `
                    CREATE TABLE ${tableName} (
                        migration_number int,
                        script_file VARCHAR(50),
                        rollback_script VARCHAR(5000),
                        create_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                    );`;
                await pool.query(sql);
            }

            const datas = await getMigrations(pool, keySchema);
            let maxNumber = datas.maxNumber;
            for (const migrate of migrates) {
                const className = migrate.constructor.name;
                if (datas.datas.filter(data => data.script_file === className).length > 0) {
                    console.log(`Already executed: ${className}`);
                    continue;
                }
    
                await client.query(migrate.MigrateSql);
    
                const grantSql = migrate.AddGrantSql;
                if (grantSql !== null) {
                    await client.query(grantSql);
                }
        
                const tableName = keySchema === '' ? 'migrations' : `"${keySchema}".migrations`;
                const migrateInsertSql = `
                    INSERT INTO ${tableName}
                    (migration_number, script_file, rollback_script)
                    VALUES (${maxNumber + 1}, '${className}', '${migrate.RollbackSql}');
                `;
                maxNumber++;
        
                await client.query(migrateInsertSql);
                await client.query('COMMIT');

                console.log(`Execution completed: ${className}`);
            }
        }
        
        console.log('Migration completed');
    } catch (ex) {
        await client.query('ROLLBACK');
        console.log('Migration failed.', ex);
    } finally {
        client.release();
        await pool.end();
    }
}

export const rollback = async (toNumber: number, schemaName: string, poolParam: {
    host: string, user: string, dbName: string, password: string, port?: number, isSsl?: boolean
}): Promise<void> => {

    const pool = new Pool({
        user: poolParam.user,
        password: poolParam.password,
        host: poolParam.host,
        database: poolParam.dbName,
        port: poolParam.port ?? 5432,
        ssl: poolParam.isSsl === true ? {
            rejectUnauthorized: false
        } : false
    });

    try {
        // If the migration table does not exist, there is no target for rollback, so do not perform it
        if (await isExistMigrationTable(pool, schemaName) == false) {
          return;
        }
    } catch (ex) {
        console.error('An error occurred related to the Migrate table:', ex);
        await pool.end();
        return;
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const datas = await getMigrations(pool, schemaName);
        for (const data of datas.datas) {
            if (data.migration_number < toNumber) {
                break;
            }
            await client.query(data.rollback_script);

            const tableName = schemaName === '' ? 'migrations' : `"${schemaName}".migrations`;
            await client.query(`DELETE FROM ${tableName} WHERE migration_number = ${data.migration_number}`);
  
            console.log(`Execution completed: ${data.script_file}`);
        }
  
        await client.query('COMMIT');

        console.log('Rollback completed');
    } catch (ex) {
        await client.query('ROLLBACK');
        console.error('Rollback failed', ex);
    } finally {
        client.release();
        await pool.end();
    }
}

const isExistMigrationTable = async (pool: Pool, schemaName: string) => {
    const values = ['migrations'];
    let sql = `
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = $1
    `;

    if (schemaName !== "") {
        sql += ` AND table_schema = $2`;
        values.push(schemaName);
    }

    sql += `);`;

    const res = await pool.query(sql, values);
    return res.rows[0].exists;
}

const getMigrations = async (pool: Pool, schemaName: string): Promise<{datas: Array<{migration_number: number, script_file: string, rollback_script: string}>, maxNumber: number}> => {
    const tableName = schemaName === '' ? 'migrations' : `"${schemaName}".migrations`;
    const datas = await pool.query(`
        SELECT 
            * 
        FROM 
            ${tableName} 
        ORDER BY 
            migration_number DESC;
    `);

    return {
        // すでに降順ソートされているので、最初の1件が最大値
        maxNumber: datas.rows[0]?.migration_number || 0,
        datas: datas.rows
    };
}