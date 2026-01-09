export class MigrateTable {

    protected readonly migrateSql: string = '';
    protected readonly rollbackSql: string = '';
    protected readonly addGrantTables: Array<string> = [];
    protected readonly user: string = '';
    protected readonly schema: string = 'public';

    get Schema(): string { return this.schema; }
    get MigrateSql(): string { return this.trimSpaceLineSql(this.migrateSql); }
    get RollbackSql(): string { return this.trimSpaceLineSql(this.rollbackSql); }
    get AddGrantSql(): string | null {
        if ((this.user ?? "").trim() === "") {
            return null;
        }

        const tables = this.addGrantTables.filter(table => table.trim() !== '');
        if (tables.length === 0) {
            return null;
        }

        let sql = "";
        for (const table of tables) {
            sql += `GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE ${this.schema}.${table} TO ${this.user};`;
        }
        return sql;
    }

    constructor();
    constructor(user: string);
    constructor(user?: string) {
        if (user !== undefined) {
            this.user = user;
        }
    }

    private trimSpaceLineSql(str: string) {
        const splitLines = str.split('\n');
        let sql = '';
        for (let line of splitLines) {
            line = line.replace(/\s+/g, ' ').trim(); // 複数のスペースを一つに置き換え

            if (line.startsWith('--') && sql[sql.length - 1] != '\n') {
                line = '\n' + line;
            }

            if (line.length > 0) {
                if (line.includes('--') === false) {
                    sql += line + ' ';
                } else {
                    sql += line + '\n';
                }
            }
        }

        return sql;
    }
}