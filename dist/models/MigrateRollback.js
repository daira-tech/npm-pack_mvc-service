"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rollback = exports.migrate = void 0;
const pg_1 = require("pg");
const migrate = (migrates, poolParam) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const migratesBySchema = {};
    for (const migrate of migrates) {
        if (migrate.Schema in migratesBySchema === false) {
            migratesBySchema[migrate.Schema] = [];
        }
        migratesBySchema[migrate.Schema].push(migrate);
    }
    const pool = new pg_1.Pool({
        user: poolParam.user,
        password: poolParam.password,
        host: poolParam.host,
        database: poolParam.dbName,
        port: (_a = poolParam.port) !== null && _a !== void 0 ? _a : 5432,
        ssl: poolParam.isSsl === true ? {
            rejectUnauthorized: false
        } : false
    });
    // create migration table
    try {
        for (const keySchema of Object.keys(migratesBySchema)) {
            if ((yield isExistMigrationTable(pool, keySchema)) == false) {
                const tableName = keySchema === '' ? 'migrations' : `"${keySchema}".migrations`;
                const sql = `
                    CREATE TABLE ${tableName} (
                        migration_number int,
                        script_file VARCHAR(50),
                        rollback_script VARCHAR(5000),
                        create_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                    );`;
                yield pool.query(sql);
            }
        }
    }
    catch (ex) {
        console.error('An error occurred related to the Migrate table:', ex);
        yield pool.end();
        throw ex;
    }
    const client = yield pool.connect();
    try {
        client.query('BEGIN');
        for (const [keySchema, migrates] of Object.entries(migratesBySchema)) {
            const datas = yield getMigrations(pool, keySchema);
            let maxNumber = datas.maxNumber;
            for (const migrate of migrates) {
                const className = migrate.constructor.name;
                if (datas.datas.filter(data => data.script_file === className).length > 0) {
                    console.log(`Already executed: ${className}`);
                    continue;
                }
                yield client.query(migrate.MigrateSql);
                const grantSql = migrate.AddGrantSql;
                if (grantSql !== null) {
                    yield client.query(grantSql);
                }
                const tableName = keySchema === '' ? 'migrations' : `"${keySchema}".migrations`;
                const migrateInsertSql = `
                    INSERT INTO ${tableName}
                    (migration_number, script_file, rollback_script)
                    VALUES (${maxNumber + 1}, '${className}', '${migrate.RollbackSql}');
                `;
                maxNumber++;
                yield client.query(migrateInsertSql);
                console.log(`Execution completed: ${className}`);
            }
        }
        yield client.query('COMMIT');
        console.log('Migration completed');
    }
    catch (ex) {
        yield client.query('ROLLBACK');
        console.log('Migration failed.', ex);
    }
    finally {
        client.release();
        yield pool.end();
    }
});
exports.migrate = migrate;
const rollback = (toNumber, schemaName, poolParam) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const pool = new pg_1.Pool({
        user: poolParam.user,
        password: poolParam.password,
        host: poolParam.host,
        database: poolParam.dbName,
        port: (_a = poolParam.port) !== null && _a !== void 0 ? _a : 5432,
        ssl: poolParam.isSsl === true ? {
            rejectUnauthorized: false
        } : false
    });
    try {
        // If the migration table does not exist, there is no target for rollback, so do not perform it
        if ((yield isExistMigrationTable(pool, schemaName)) == false) {
            return;
        }
    }
    catch (ex) {
        console.error('An error occurred related to the Migrate table:', ex);
        yield pool.end();
        return;
    }
    const client = yield pool.connect();
    try {
        yield client.query('BEGIN');
        const datas = yield getMigrations(pool, schemaName);
        for (const data of datas.datas) {
            if (data.migration_number < toNumber) {
                break;
            }
            yield client.query(data.rollback_script);
            const tableName = schemaName === '' ? 'migrations' : `"${schemaName}".migrations`;
            yield client.query(`DELETE FROM ${tableName} WHERE migration_number = ${data.migration_number}`);
            console.log(`Execution completed: ${data.script_file}`);
        }
        yield client.query('COMMIT');
        console.log('Rollback completed');
    }
    catch (ex) {
        yield client.query('ROLLBACK');
        console.error('Rollback failed', ex);
    }
    finally {
        client.release();
        yield pool.end();
    }
});
exports.rollback = rollback;
const isExistMigrationTable = (pool, schemaName) => __awaiter(void 0, void 0, void 0, function* () {
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
    const res = yield pool.query(sql, values);
    return res.rows[0].exists;
});
const getMigrations = (pool, schemaName) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const tableName = schemaName === '' ? 'migrations' : `"${schemaName}".migrations`;
    const datas = yield pool.query(`
        SELECT 
            * 
        FROM 
            ${tableName} 
        ORDER BY 
            migration_number DESC;
    `);
    return {
        // すでに降順ソートされているので、最初の1件が最大値
        maxNumber: ((_a = datas.rows[0]) === null || _a === void 0 ? void 0 : _a.migration_number) || 0,
        datas: datas.rows
    };
});
