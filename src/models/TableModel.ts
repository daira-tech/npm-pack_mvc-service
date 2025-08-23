import { Pool, PoolClient } from 'pg';
import { TAggregateFuncType, TColumn, TColumnArrayType, TColumnDetail, TColumnInfo, TColumnType, TKeyFormat, TNestedCondition, TOperator, TQuery, TSelectExpression, TSortKeyword } from "./Type";
import ValidateValueUtil from './SqlUtils/ValidateValueUtil';
import SelectExpression from './SqlUtils/SelectExpression';
import WhereExpression from './SqlUtils/WhereExpression';
import ValidateClient from './ValidateClient';
import { DbConflictException, UnprocessableException } from '../exceptions/Exception';
import ExpressionClient from './ExpressionClient';
import UpdateExpression from './SqlUtils/UpdateExpression';
import MessageUtil, { TOptionErrorMessage } from './Utils/MessageUtil';

export class TableModel {

    protected readonly dbName: string = "default";
    get DbName(): string { return this.dbName; }
    protected readonly tableName: string = "";
    get TableName(): string { 
        if (this.tableName === "") {
            throw new Error("Please set the tableName for TableModel.");
        }
        return this.tableName;
    }
    protected readonly tableDescription: string = "";
    get TableDescription(): string { return this.tableDescription; }
    protected readonly comment: string = "";
    get Comment(): string { return this.comment; }
    protected readonly columns: { [key: string]: TColumn } = {};
    get Columns(): { [key: string]: TColumn } { 
        if (Object.keys(this.columns).length === 0) {
            throw new Error("Please set the columns for TableModel.");
        }
        return this.columns; 
    }
    public getColumn(key: string): TColumnDetail {
        if (key in this.Columns === false) {
            throw new Error(`${this.TableName} does not contain ${key}.`);
        }

        return { 
            ...this.Columns[key],
            columnName: key,
            tableName: this.TableName,
            expression: `"${this.TableAlias}".${key}`
        };
    }
    protected readonly references: Array<{table: string, columns: Array<{target: string, ref: string}>}> = [];
    get References(): Array<{table: string, columns: Array<{target: string, ref: string}>}> { return this.references; }
    public GetReferences(columnName: string): Array<{table: string, columns: Array<{target: string, ref: string}>}> {
        const _ = this.getColumn(columnName); // 存在チェック用
        const references: Array<{table: string, columns: Array<{target: string, ref: string}>}> = [];
        for (const ref of this.References) {
            if (ref.columns.filter(col => col.target === columnName).length > 0) {
                references.push(ref);
            }
        }

        return references;
    }

    protected readonly tableAlias?: string;
    get TableAlias(): string {
        return this.tableAlias === undefined ? this.TableName : this.tableAlias;
    }

    public IsOutputLog: boolean = false;
    public SortKeyword: TSortKeyword = 'asc';
    public Offset?: number;
    public Limit?: number;

    private selectExpressions: Array<string> = [];
    private joinConditions: Array<{
        type: 'inner' | 'left' | 'full',
        model: TableModel,
        conditions: Array<TNestedCondition>
    }> = [];
    private whereExpressions: Array<string> = [];
    private groupExpression: Array<string> = [];
    private sortExpression: Array<string> = [];
    private vars: Array<any> = [];

    private get createSqlFromJoinWhere(): string {
        let sql = ` FROM ${this.TableName} as "${this.TableAlias}"`;

        for (const join of this.joinConditions) {
            const joins = {
                inner: ' INNER JOIN',
                left: ' LEFT OUTER JOIN',
                full: ' FULL OUTER JOIN',
            }
            sql += joins[join.type];
            sql += ` ${join.model.TableName} as "${join.model.TableAlias}" ON `;
            const query = WhereExpression.createCondition(join.conditions, this, this.vars.length + 1);
            sql += query.expression;
            if (query.vars !== undefined) {
                this.vars = [...this.vars, ...query.vars]
            }
        }

        if (this.whereExpressions.length > 0) {
            sql += " WHERE " + this.whereExpressions.join(" AND ");
        }

        if (this.groupExpression.length > 0) {
            sql += ` GROUP BY ${this.groupExpression.join(',')}`;
        }

        return sql;
    }
    private get createSqlFromJoinWhereSortLimit(): string {
        let sql = this.createSqlFromJoinWhere;

        if (this.sortExpression.length > 0) {
            sql += ` ORDER BY ${this.sortExpression.join(",")}`;
        }

        if (this.Limit !== undefined) {
            sql += ` LIMIT ${this.Limit}`;
        }
        if (this.Offset !== undefined) {
            sql += ` OFFSET ${this.Offset}`;
        }
        return sql;
    }

    private client: PoolClient | Pool;
    get Client(): PoolClient | Pool {
        return this.client;
    }
    constructor(client: Pool);
    constructor(client: Pool, tableAlias: string);
    constructor(client: PoolClient);
    constructor(client: PoolClient, tableAlias: string);
    constructor(client: Pool | PoolClient, tableAlias?: string) {
        this.client = client;
        if (tableAlias !== undefined && tableAlias.trim() !== '') {
            this.tableAlias = tableAlias;
        }
    }

    public find<T = {[key: string]: any}>(pk: {[key: string]: any}): Promise<T | null>;
    public find<T = {[key: string]: any}>(id: string | number | boolean): Promise<T | null>;
    public find<T = {[key: string]: any}>(pk: {[key: string]: any}, selectColumns: Array<string> | "*" | null): Promise<T | null>;
    public find<T = {[key: string]: any}>(id: string | number | boolean, selectColumns: Array<string> | "*" | null): Promise<T | null>;
    public find<T = {[key: string]: any}>(pk: {[key: string]: any}, selectColumns: Array<string> | "*" | null, selectExpressions: Array<TSelectExpression> | null): Promise<T | null>;
    public find<T = {[key: string]: any}>(id: string | number | boolean, selectColumns: Array<string> | "*" | null, selectExpressions: Array<TSelectExpression> | null): Promise<T | null>;
    public find<T = {[key: string]: any}>(pk: {[key: string]: any}, selectColumns: Array<string> | "*" | null, selectExpressions: Array<TSelectExpression> | null, keyFormat: TKeyFormat): Promise<T | null>;
    public find<T = {[key: string]: any}>(id: string | number | boolean, selectColumns: Array<string> | "*" | null, selectExpressions: Array<TSelectExpression> | null, keyFormat: TKeyFormat): Promise<T | null>;
    public async find<T = {[key: string]: any}>(
        pkOrId: string | number | boolean | {[key: string]: any}, 
        selectColumns: Array<string> | "*" | null = "*", 
        selectExpressions: Array<TSelectExpression> | null = null, 
        keyFormat: TKeyFormat = 'snake'): Promise<T | null> {

        let selects: Array<string> = [];
        if (selectColumns == "*") {
            for (const key of Object.keys(this.Columns)) {
                selects.push(SelectExpression.create({model: this, name: key}, null, null, keyFormat));
            }
        } else if (selectColumns != null) {
            for (const key of selectColumns) {
                selects.push(SelectExpression.create({model: this, name: key}, null, null, keyFormat));
            }
        }

        if (selectExpressions != null) {
            for (const expression of selectExpressions) {
                selects.push(`${expression.expression} as "${expression.alias}"`);
            }
        }

        let query: TQuery;
        if (typeof pkOrId === 'string' || typeof pkOrId === 'number' || typeof pkOrId === 'boolean') {
            ValidateValueUtil.validateId(this.Columns, pkOrId);
            query = WhereExpression.createConditionPk(this, {id: pkOrId});    
        } else {
            query = WhereExpression.createConditionPk(this, pkOrId);
        }
 
        const sql = `SELECT ${selects.join(',')} FROM ${this.TableName} WHERE ${query.expression}`;
        let datas = await this.executeQuery(sql, query.vars);

        return datas.rowCount == 0 ? null : datas.rows[0] as T;
    }

    public select(): void;
    public select(columls: Array<string | {name: string, alias?: string, func?: TAggregateFuncType}> | '*'): void;
    public select(columls: Array<string | {name: string, alias?: string, func?: TAggregateFuncType}> | '*', model: TableModel): void;
    public select(columls: Array<string | {name: string, alias?: string, func?: TAggregateFuncType}> | '*', keyFormat: TKeyFormat): void;
    public select(columls: Array<string | {name: string, alias?: string, func?: TAggregateFuncType}> | '*', model: TableModel, keyFormat: TKeyFormat): void;
    public select(expression: string, alias: string): void;
    public select(param1: Array<string | {name: string, alias?: string, func?: TAggregateFuncType}> | "*" | string = "*", param2?: TableModel | string | TKeyFormat, param3?: TKeyFormat) {
        if (param1 === "*") {
            let model: TableModel = this;
            let keyFormat: TKeyFormat = 'snake';
            if (param2 instanceof TableModel) {
                model = param2;
                if (param3 === 'snake' || param3 === 'lowerCamel') {
                    keyFormat = param3;
                }
            } else if (param2 === 'snake' || param2 === 'lowerCamel') {
                keyFormat = param2;
            }

            for (const key of Object.keys(model.Columns)) {
                this.selectExpressions.push(SelectExpression.create({model: model, name: key}, null, null, keyFormat));
            }
            return;
        }

        if (Array.isArray(param1)) {
            let model: TableModel = this;
            let keyFormat: TKeyFormat = 'snake';
            if (param2 instanceof TableModel) {
                model = param2;
                if (param3 === 'snake' || param3 === 'lowerCamel') {
                    keyFormat = param3;
                }
            } else if (param2 === 'snake' || param2 === 'lowerCamel') {
                keyFormat = param2;
            }

            for (const key of param1) {
                if (typeof key === 'string') {
                    this.selectExpressions.push(SelectExpression.create({model: model, name: key}, null, null, keyFormat));
                } else {
                    this.selectExpressions.push(SelectExpression.create({model: model, name: key.name}, key.func ?? null, key.alias ?? null, keyFormat));
                }
            }
            return;
        }

        if (typeof param1 === 'string') {
            const expression = param1;
            if (typeof param2 !== 'string' || param2.trim() === '') {
                throw new Error('If the first argument is a string, the second argument must be a non-empty string.');
            }
            const alias = param2;
            this.selectExpressions.push(`(${expression}) as "${alias}"`);
            return;
        }
    }

    /**
     * 指定された条件に基づいてテーブルを結合します。
     * @param joinType 結合の種類を指定します
     * @param joinBaseModel 結合する対象のBaseModelインスタンスを指定します。
     * @param conditions 結合条件を指定します。条件はオブジェクトまたは文字列で指定できます。
     */
    public join(joinType: 'left' | 'inner' | 'full', joinModel: TableModel, conditions: Array<TNestedCondition>): void {
        this.joinConditions.push({type: joinType, model: joinModel, conditions: conditions});
    }

    public where(expression: string): void;
    public where(conditions: Array<TNestedCondition>): void;
    public where(left: string, operator: TOperator, right: TColumnInfo | any): void;
    public where(left: TColumnInfo, operator: TOperator, right: TColumnInfo | any): void;
    public where(left: string | TColumnInfo | Array<TNestedCondition>, operator?: TOperator, right?: TColumnInfo | any): void {
        if (typeof left === 'string') {
            if (operator === undefined || right === undefined) {
                this.whereExpressions.push(left);
            } else {
                const query = WhereExpression.create({model: this, name: left}, operator, right, this.vars.length + 1);
                this.whereExpressions.push(query.expression);
                if (query.vars !== undefined) {
                    this.vars = [...this.vars, ...query.vars];
                }
            }
            return;
        }

        if ('model' in left && 'name' in left) {
            if (operator === undefined || right === undefined) {
                throw new Error(`If left is TColumnInfo, please set operator and right.`);
            } else {
                const query = WhereExpression.create(left, operator, right, this.vars.length + 1);
                this.whereExpressions.push(query.expression);
                if (query.vars !== undefined) {
                    this.vars = [...this.vars, ...query.vars];
                }
            }
            return;
        }

        if (Array.isArray(left)) {
            const query = WhereExpression.createCondition(left, this, this.vars.length + 1);
            this.whereExpressions.push(query.expression);
            if (query.vars !== undefined) {
                this.vars = [...this.vars, ...query.vars];
            }
        }
    }

    public groupBy(column: string | TColumnInfo): void {
        if (typeof column === 'string') {
            column = {model: this, name: column};
        }
        this.groupExpression.push(column.model.getColumn(column.name).expression);
    }

    public orderBy(column: string | TColumnInfo, sortKeyword: TSortKeyword) {
        if (typeof column === 'string') {
            column = { model: this, name: column };
        }
        this.sortExpression.push(`${column.model.getColumn(column.name).expression} ${sortKeyword}`);
    }

    public orderByList(column: string | TColumnInfo, list: Array<string | number | boolean | null>, sortKeyword: TSortKeyword): void {
        if (list.length === 0) {
            return;
        }

        if (typeof(column) == 'string') {
            column = {model: this, name: column};;
        }
        const columnInfo = column.model.getColumn(column.name);

        const orderConditions: Array<string> = [];
        for (let i = 0;i < list.length;i++) {
            const value = list[i];
            if (value === null) {
                if (columnInfo.attribute === 'nullable') {
                    orderConditions.push(`WHEN ${columnInfo.expression} is null THEN ${i}`);
                    continue;
                }
                throw new Error(`${this.TableName}.${columnInfo.columnName} is a non-nullable column.`);
            }

            ValidateValueUtil.validateValue(columnInfo, value);
            switch (columnInfo.type) {
                case 'integer':
                    orderConditions.push(`WHEN ${columnInfo.expression} = ${value} THEN ${i}`);
                    break;
                case 'uuid':
                case 'string':
                    orderConditions.push(`WHEN ${columnInfo.expression} = '${value}' THEN ${i}`);
                    break;
                case 'bool':
                    const boolValue = value === true || value === 'true' || value === 1;
                    orderConditions.push(`WHEN ${columnInfo.expression} = ${boolValue} THEN ${i}`);
                    break;
            }            
        }

        if (orderConditions.length === 0) {
            return;
        }

        this.sortExpression.push(`CASE ${orderConditions.join(' ')} ELSE ${list.length} END ${sortKeyword}`);
    }

    public orderBySentence(query: string, sortKeyword: TSortKeyword): void {
        this.sortExpression.push(`${query} ${sortKeyword}`);
    }

    public async executeSelect<T = {[key: string]: any}>(): Promise<Array<T>> {
        if (this.selectExpressions.length === 0) {
            this.select();
        }

        let sql = ` SELECT ${this.selectExpressions.join(",")} ${this.createSqlFromJoinWhereSortLimit}`;
        let data = await this.executeQuery(sql, this.vars);
        return data.rows as Array<T>;
    }

    public async executeSelectForPage<T = any>(pageCount: number, currentPage: number): Promise<{ datas: Array<T>, totalCount: number, lastPage: number, isLastData: boolean}> {
        if (this.selectExpressions.length == 0) {
            this.select();
        }

        this.Limit = pageCount;
        this.Offset = (currentPage - 1) * pageCount;


        const tempVars = [...this.vars];
        const tempWhereExpression = [...this.whereExpressions];
        const tempJoinConditions = [...this.joinConditions];

        let sql = ` SELECT ${this.selectExpressions.join(",")} ${this.createSqlFromJoinWhereSortLimit}`;
        const data = await this.executeQuery(sql, this.vars);

        this.vars = tempVars;
        this.whereExpressions = tempWhereExpression;
        this.joinConditions = tempJoinConditions;
        let countSql = ` SELECT COUNT(*) as "count" ${this.createSqlFromJoinWhere}`;

        const countData = await this.executeQuery(countSql, this.vars);

        const totalCount = Number(countData.rows[0].count);
        const lastPage = Math.ceil(Number(countData.rows[0].count) / pageCount);
        return { 
            datas: data.rows as Array<T>, 
            totalCount: totalCount, 
            lastPage: lastPage,
            isLastData: currentPage >= lastPage
        };
    }

    protected readonly errorMessages: TOptionErrorMessage = 
        process.env.TZ === 'Asia/Tokyo' ? MessageUtil.optionErrorMessageJapan : MessageUtil.optionErrorMessageEnglish;

    private throwException(code: string, type: TColumnType | TColumnArrayType | 'length' | 'null' | 'notInput' | 'fk', columnName: string, value: any): never {
        const column = this.getColumn(columnName);
        
        let message = this.errorMessages[type];

        const name = (column.alias === undefined || column.alias === '') ? columnName : column.alias;
        message = message.replace('{name}', name);
        if (message.includes("{length}") && (column.type === 'string' || column.type === 'string[]')) {
            message = message.replace('{length}', (column.length ?? '未設定').toString());
        } 

        throw new UnprocessableException(code, message);
    }

    protected async validateOptions(options: {[key: string]: any}, isInsert: boolean, pkOrId?: string | number | boolean | {[key: string]: any}): Promise<void> {
        if (Object.keys(options).length === 0) {
            throw new Error('At least one key-value pair is required in options.');
        }

        for (const [key, value] of Object.entries(options)) {
            const column = this.getColumn(key);
            if (isInsert === false && column.attribute === 'primary') {
                throw new Error(`${this.TableName}.${key} cannot be modified because it is a primary key.`);
            }

            if (value === null) {
                if (column.attribute === 'nullable') {
                    continue;
                }
                this.throwException("001", "null", key, value);
            }

            if (ValidateValueUtil.isErrorValue(column.type, value)) {
                this.throwException("002", column.type, key, value);
            }

            if (column.type === 'string') {
                if (Number.isInteger(column.length) === false) {
                    throw new Error(`For strings, please specify the length of the column.(column: ${column.columnName})`);
                }

                if (value.toString().length > column.length) {
                    this.throwException("003", "length", key, value);
                }
            } else if (column.type === 'string[]') {
                if (Number.isInteger(column.length) === false) {
                    throw new Error(`For strings, please specify the length of the column.(column: ${column.columnName})`);
                }

                // ValidateValueUtil.isErrorValue(column.type, value)で型チェックしてるのでas []にしている
                for (const v of value as Array<string | number | boolean>) {
                    if (v.toString().length > column.length) {
                        this.throwException("004", "length", key, value);
                    }
                }
            }
        }

        // 外部キー制約チェック
        if (isInsert) {
            for (const key in this.Columns) {
                const column = this.getColumn(key);
                const name = (column.alias === undefined || column.alias === '') ? key : column.alias;
                if (options[key] === undefined || options[key] === null) {
                    // Null許容されていないカラムにNULLを入れようとしているか？
                    if (column.attribute === "primary" || column.attribute === "noDefault") {
                        this.throwException("005", "notInput", key, options[key]);
                    }
                }
            }

            for (const ref of this.References) {
                const refValues = ref.columns.map(col => options[col.target]);
                // 全ての値がnullの場合はスキップ
                if (refValues.every(value => value === null || value === undefined)) {
                    continue;
                }

                // 一部の値がnullの場合はエラー
                if (refValues.some(value => value === null || value === undefined)) {
                    const name = ref.columns.map(col => this.getColumn(col.target).alias ?? this.getColumn(col.target).columnName).join(',');
                    throw new UnprocessableException("006", this.errorMessages.null.replace('{name}', name));
                }

                let refIndex = 1;
                const sql = `SELECT COUNT(*) as count FROM ${ref.table} WHERE ${ref.columns.map(col => `${col.ref} = $${refIndex++}`).join(" AND ")}`;
                const datas = await this.clientQuery(sql, refValues);
                if (datas.rows[0].count == "0") {
                    const name = ref.columns.map(col => this.getColumn(col.target).alias ?? this.getColumn(col.target).columnName).join(',');
                    throw new DbConflictException("007", this.errorMessages.fk.replace('{name}', name));
                }
            }
        }
    }

    public async insert(options: {[key: string]: any}) : Promise<void> {
        await this.validateOptions(options, true);

        const columns: Array<string> = [];
        const vars: Array<any> = [];

        for (const [key, value] of Object.entries(options)) {
            if (value === undefined) {
                throw new Error(`The insert option ${key} is undefined.`);
            }

            columns.push(key);
            vars.push(value)
        }

        const params = vars.map((_, index) => `$${index + 1}`);
        const sql = `INSERT INTO ${this.TableName} (${columns.join(",")}) VALUES (${params.join(",")});`;
        await this.executeQuery(sql, vars);
    }

    public async update(pkOrId: string | number | boolean | {[key: string]: any}, options: {[key: string]: any}) : Promise<void> {
        await this.validateOptions(options, false, pkOrId);

        const updateSetQuery = UpdateExpression.createUpdateSet(this, options);
        let whereQuery: TQuery;
        if (typeof pkOrId === 'string' || typeof pkOrId === 'number' || typeof pkOrId === 'boolean') {
            ValidateValueUtil.validateId(this.Columns, pkOrId);
            whereQuery = WhereExpression.createConditionPk(this, {id: pkOrId}, updateSetQuery.vars);    
        } else {
            whereQuery = WhereExpression.createConditionPk(this, pkOrId, updateSetQuery.vars);
        }

        const sql = updateSetQuery.expression + ' WHERE ' + whereQuery.expression;
        const data = await this.executeQuery(sql, whereQuery.vars);
        if (data.rowCount !== 1) {
            throw new UnprocessableException("201", this.errorMessages.find.replace('{pks}', (whereQuery.vars ?? []).join(',')));
        }
    }

    public async delete(pkOrId: string | number | boolean | {[key: string]: any}) : Promise<void> {
        let whereQuery: TQuery;
        if (typeof pkOrId === 'string' || typeof pkOrId === 'number' || typeof pkOrId === 'boolean') {
            ValidateValueUtil.validateId(this.Columns, pkOrId);
            whereQuery = WhereExpression.createConditionPk(this, {id: pkOrId});    
        } else {
            whereQuery = WhereExpression.createConditionPk(this, pkOrId);
        }

        const sql = `DELETE FROM ${this.TableName} WHERE ${whereQuery.expression}`;
        const data = await this.executeQuery(sql, whereQuery.vars);
        if (data.rowCount !== 1) {
            throw new UnprocessableException("301", this.errorMessages.find.replace('{pks}', (whereQuery.vars ?? []).join(',')));
        }
    }

    public async executeUpdate(options: {[key: string]: any}) : Promise<number> {
        await this.validateOptions(options, false);

        const updateExpressions: Array<string> = [];
        for (const [key, value] of Object.entries(options)) {
            const column = this.getColumn(key);
            ValidateValueUtil.validateValue(column, value);
            this.vars.push(value);
            updateExpressions.push(`${key} = $${this.vars.length}`)
        }

        let sql = `UPDATE ${this.TableName} "${this.TableAlias}" SET ${updateExpressions.join(',')} `;

        if (this.joinConditions.length > 0) {
            const tables: Array<string> = [];
            for (const join of this.joinConditions) {
                tables.push(`${join.model.TableName} as "${join.model.TableAlias}"`);

                const query = WhereExpression.createCondition(join.conditions, this, this.vars.length);
                this.whereExpressions.push(query.expression);
                if (query.vars !== undefined) {
                    this.vars = [...this.vars, ...query.vars]
                }
            }
            sql += `FROM ${tables.join(',')} `;
        }

        if (this.whereExpressions.length > 0) {
            sql += "WHERE " + this.whereExpressions.join(" AND ");
        }

        const data = await this.executeQuery(sql, this.vars);
        return data.rowCount;
    }

    public async executeDelete() : Promise<number> {
        let sql = `DELETE FROM ${this.TableName} "${this.TableAlias}" `;

        if (this.joinConditions.length > 0) {
            const tables: Array<string> = [];
            for (const join of this.joinConditions) {
                tables.push(`${join.model.TableName} as "${join.model.TableAlias}"`);

                const query = WhereExpression.createCondition(join.conditions, this, this.vars.length);
                this.whereExpressions.push(query.expression);
                if (query.vars !== undefined) {
                    this.vars = [...this.vars, ...query.vars]
                }
                sql += ` USING ${tables.join(',')} `;
            }
        }

        if (this.whereExpressions.length > 0) {
            sql += "WHERE " + this.whereExpressions.join(" AND ");
        }

        const datas = await this.executeQuery(sql, this.vars);
        return datas.rowCount;
    }

    protected executeQuery(param1: string, vars?: Array<any>) : Promise<any>;
    protected executeQuery(param1: TQuery) : Promise<any>;
    protected async executeQuery(param1: string | TQuery, vars?: Array<any>) : Promise<any> {

        // 初期化項目
        this.selectExpressions = [];
        this.whereExpressions = [];
        this.joinConditions = [];
        this.sortExpression = [];
        this.SortKeyword = 'asc';
        this.groupExpression = [];
        this.vars = [];
        this.Offset = undefined;
        this.Limit = undefined;

        let sql = '';
        if (typeof param1 === 'string') {
            sql = param1;
        } else {
            sql = param1.expression;
            vars = param1.vars;
        }


        return await this.clientQuery(sql, vars);
    }

    private async clientQuery(sql: string, vars?: Array<any>) {
        if (this.IsOutputLog) {
            console.log("--- Debug Sql ----------");
            console.log(sql);
            console.log(vars);
        }

        const data = await this.client.query(sql, vars ?? []);
        if (this.IsOutputLog) {
            console.log("- 実行結果");
            if (data.rowCount == 0) {
                console.log("データなし");
            } else {
                let log = "";
                for (let i = 0;i < data.fields.length;i++) {
                    log += i == 0 ? "" : ",";
                    log += data.fields[i].name;
                }
                console.log(log);
        
                for (let i = 0;i < data.rows.length;i++) {
                    log = "";
                    for (let j = 0;j < data.fields.length;j++) {
                        let key = data.fields[j].name;
                        log += j == 0 ? "" : ",";
                        log += data.rows[i][key];
                    }
                    console.log(log);
                }
            }
        }

        return data;
    }

    private validateClient?: ValidateClient;
    get ValidateClient(): ValidateClient {
        if (this.validateClient === undefined) {
            this.validateClient = new ValidateClient(this);
        }

        return this.validateClient;
    }

    private expressionClient?: ExpressionClient;
    get ExpressionClient(): ExpressionClient {
        if (this.expressionClient === undefined) {
            this.expressionClient = new ExpressionClient(this);
        }

        return this.expressionClient;
    }
}