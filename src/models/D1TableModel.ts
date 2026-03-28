import { TAggregateFuncType, TColumnInfo, TKeyFormat, TD1Column, TD1NestedCondition, TD1Operator, TQuery, TSelectExpression, TSortKeyword } from "./Type";
import ValidateValueUtil from './ValidateValueUtil';
import { D1SelectExpression } from './D1SqlUtils/D1SelectExpression';
import { D1WhereExpression } from './D1SqlUtils/D1WhereExpression';
import D1UpdateExpression from './D1SqlUtils/D1UpdateExpression';
import { BaseTableModel } from './BaseTableModel';

/**
 * Cloudflare D1（SQLite）用のテーブルモデル。
 * BaseTableModelを継承し、SQLite互換のSQL生成を行う。
 *
 * PostgreSQL版（PgTableModel）との主な違い:
 * - プレースホルダ: ? （$N ではない）
 * - 日付フォーマット: strftime() （to_char() ではない）
 * - 配列型: 非対応
 * - スキーマ: 非対応
 * - ILIKE: LIKE にマッピング
 * - h2f_like/h2f_ilike: 非対応（NORMALIZE/TRANSLATE がない）
 * - UPDATE FROM / DELETE USING: 非対応（JOINを使ったUPDATE/DELETEは不可）
 * - トランザクション: D1ConnectionFactory側でno-op
 */
export class D1TableModel extends BaseTableModel {

    /** D1では配列型カラムを使用不可。TD1Columnに制限される */
    declare protected readonly columns: { [key: string]: TD1Column };

    protected placeholder(index: number): string {
        return '?';
    }

    /** D1ではスキーマ非対応。schemaNameが設定されていたらエラー */
    get SchemaTableName(): string {
        if (this.tableName === "") {
            throw new Error("Please set the tableName for TableModel.");
        }
        if (this.schemaName !== "") {
            throw new Error("D1 does not support schemas. Do not set schemaName.");
        }
        return this.tableName;
    }

    /** D1用のjoin。条件にTD1NestedConditionのみ許可（配列演算子等は使用不可） */
    public join(joinType: 'left' | 'inner' | 'full', joinModel: BaseTableModel, conditions: Array<TD1NestedCondition>): void {
        this.joinConditions.push({type: joinType, model: joinModel, conditions: conditions});
    }

    private get createSqlFromJoinWhere(): string {
        let sql = ` FROM ${this.SchemaTableName} as "${this.TableAlias}"`;

        for (const join of this.joinConditions) {
            const joins = {
                inner: ' INNER JOIN',
                left: ' LEFT OUTER JOIN',
                full: ' FULL OUTER JOIN',
            }
            sql += joins[join.type];
            sql += ` ${join.model.SchemaTableName} as "${join.model.TableAlias}" ON `;
            const query = D1WhereExpression.createCondition(join.conditions, this, this.vars.length + 1);
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
                selects.push(D1SelectExpression.create({model: this, name: key}, null, null, keyFormat));
            }
        } else if (selectColumns != null) {
            for (const key of selectColumns) {
                selects.push(D1SelectExpression.create({model: this, name: key}, null, null, keyFormat));
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
            query = D1WhereExpression.createConditionPk(this, {id: pkOrId});    
        } else {
            query = D1WhereExpression.createConditionPk(this, pkOrId);
        }
 
        const sql = `SELECT ${selects.join(',')} FROM ${this.SchemaTableName} WHERE ${query.expression}`;
        let datas = await this.executeQuery(sql, query.vars);

        return datas.rowCount == 0 ? null : datas.rows[0] as T;
    }

    public select(): void;
    public select(columls: Array<string | {name: string, alias?: string, func?: TAggregateFuncType}> | '*'): void;
    public select(columls: Array<string | {name: string, alias?: string, func?: TAggregateFuncType}> | '*', model: BaseTableModel): void;
    public select(columls: Array<string | {name: string, alias?: string, func?: TAggregateFuncType}> | '*', keyFormat: TKeyFormat): void;
    public select(columls: Array<string | {name: string, alias?: string, func?: TAggregateFuncType}> | '*', model: BaseTableModel, keyFormat: TKeyFormat): void;
    public select(expression: string, alias: string): void;
    public select(param1: Array<string | {name: string, alias?: string, func?: TAggregateFuncType}> | "*" | string = "*", param2?: BaseTableModel | string | TKeyFormat, param3?: TKeyFormat) {
        if (param1 === "*") {
            let model: BaseTableModel = this;
            let keyFormat: TKeyFormat = 'snake';
            if (param2 instanceof BaseTableModel) {
                model = param2;
                if (param3 === 'snake' || param3 === 'lowerCamel') {
                    keyFormat = param3;
                }
            } else if (param2 === 'snake' || param2 === 'lowerCamel') {
                keyFormat = param2;
            }

            for (const key of Object.keys(model.Columns)) {
                this.selectExpressions.push(D1SelectExpression.create({model: model, name: key}, null, null, keyFormat));
            }
            return;
        }

        if (Array.isArray(param1)) {
            let model: BaseTableModel = this;
            let keyFormat: TKeyFormat = 'snake';
            if (param2 instanceof BaseTableModel) {
                model = param2;
                if (param3 === 'snake' || param3 === 'lowerCamel') {
                    keyFormat = param3;
                }
            } else if (param2 === 'snake' || param2 === 'lowerCamel') {
                keyFormat = param2;
            }

            for (const key of param1) {
                if (typeof key === 'string') {
                    this.selectExpressions.push(D1SelectExpression.create({model: model, name: key}, null, null, keyFormat));
                } else {
                    this.selectExpressions.push(D1SelectExpression.create({model: model, name: key.name}, key.func ?? null, key.alias ?? null, keyFormat));
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

    public selectNullToValue(columnInfo: string | {name: string, model: BaseTableModel}, toValue: any, alias: string) {
        this.vars.push(toValue);

        if (typeof columnInfo === 'string') {
            columnInfo = {name: columnInfo, model: this}
        }

        const column = columnInfo.model.getColumn(columnInfo.name);
        this.selectExpressions.push(`COALESCE(${column.expression}, ?) as "${alias}"`)
    }

    public selectNullToEmptyString(column: string | {name: string, model: BaseTableModel}, alias: string) {
        column = typeof column === 'string' ? {name: column, model: this} : column;

        this.selectExpressions.push(`${D1SelectExpression.nullToEmptyString(column)} as "${alias}"`);
    }

    public selectDateAsFormat(column: string | {name: string, model: BaseTableModel}, to: 'date' | 'time' | 'datetime', alias: string) {
        column = typeof column === 'string' ? {name: column, model: this} : column;
        const columnInfo = column.model.getColumn(column.name);

        if (['date', 'time', 'timestamp'].includes(columnInfo.type) === false) {
            throw new Error('The first argument of the selectDateAsFormat method must specify a column of type date, time, or timestamp.');
        }
        this.selectExpressions.push(`${D1SelectExpression.createDateTime(column, to)} as "${alias}"`);
    }

    public where(expression: string): void;
    public where(expression: string, vars: Array<any>): void;
    public where(conditions: Array<TD1NestedCondition>): void;
    public where(left: string, operator: TD1Operator, right: TColumnInfo | any): void;
    public where(left: TColumnInfo, operator: TD1Operator, right: TColumnInfo | any): void;
    public where(param1: string | TColumnInfo | Array<TD1NestedCondition>, param2?: Array<any> | TD1Operator, right?: TColumnInfo | any): void {
        if (typeof param1 === 'string') {
            if (param2 === undefined || right === undefined || Array.isArray(param2)) {
                if (Array.isArray(param2)) {
                    // D1: ? は位置パラメータなのでリインデックス不要
                    this.vars = [...this.vars, ...param2];
                    this.whereExpressions.push(param1);
                } else {
                    this.whereExpressions.push(param1);
                }
            } else {
                const query = D1WhereExpression.create({model: this, name: param1}, param2, right, this.vars.length + 1);
                this.whereExpressions.push(query.expression);
                if (query.vars !== undefined) {
                    this.vars = [...this.vars, ...query.vars];
                }
            }
            return;
        }

        if ('model' in param1 && 'name' in param1) {
            if (param2 === undefined || right === undefined || Array.isArray(param2)) {
                throw new Error(`If left is TColumnInfo, please set operator and right. Do not pass an array to operator.`);
            } else {
                const query = D1WhereExpression.create(param1, param2, right, this.vars.length + 1);
                this.whereExpressions.push(query.expression);
                if (query.vars !== undefined) {
                    this.vars = [...this.vars, ...query.vars];
                }
            }
            return;
        }

        if (Array.isArray(param1)) {
            const query = D1WhereExpression.createCondition(param1, this, this.vars.length + 1);
            this.whereExpressions.push(query.expression);
            if (query.vars !== undefined) {
                this.vars = [...this.vars, ...query.vars];
            }
        }
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
                throw new Error(`${this.SchemaTableName}.${columnInfo.columnName} is a non-nullable column.`);
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

        const params = vars.map(() => '?');
        const sql = `INSERT INTO ${this.SchemaTableName} (${columns.join(",")}) VALUES (${params.join(",")});`;
        await this.executeQuery(sql, vars);
    }

    public async update(pkOrId: string | number | boolean | {[key: string]: string | number | boolean}, options: {[key: string]: any}) : Promise<void> {
        await this.validateOptions(options, false, pkOrId);

        const updateSetQuery = D1UpdateExpression.createUpdateSet(this, options);
        let whereQuery: TQuery;
        if (typeof pkOrId === 'string' || typeof pkOrId === 'number' || typeof pkOrId === 'boolean') {
            ValidateValueUtil.validateId(this.Columns, pkOrId);
            whereQuery = D1WhereExpression.createConditionPk(this, {id: pkOrId}, updateSetQuery.vars);    
        } else {
            whereQuery = D1WhereExpression.createConditionPk(this, pkOrId, updateSetQuery.vars);
        }

        const sql = updateSetQuery.expression + ' WHERE ' + whereQuery.expression;
        const data = await this.executeQuery(sql, whereQuery.vars);
        if (data.rowCount !== 1) {
            let pkValues;
            if (typeof pkOrId === 'string' || typeof pkOrId === 'number' || typeof pkOrId === 'boolean') {
                pkValues = pkOrId.toString();
            } else {
                pkValues = Object.values(pkOrId).map((d) => d.toString()).join(',');
            }
            this.throwUnprocessableException("201", this.errorMessages.find.replace('{pks}', pkValues));
        }
    }

    public async delete(pkOrId: string | number | boolean | {[key: string]: any}) : Promise<void> {
        let whereQuery: TQuery;
        if (typeof pkOrId === 'string' || typeof pkOrId === 'number' || typeof pkOrId === 'boolean') {
            ValidateValueUtil.validateId(this.Columns, pkOrId);
            whereQuery = D1WhereExpression.createConditionPk(this, {id: pkOrId});    
        } else {
            whereQuery = D1WhereExpression.createConditionPk(this, pkOrId);
        }

        const sql = `DELETE FROM ${this.SchemaTableName} WHERE ${whereQuery.expression}`;
        const data = await this.executeQuery(sql, whereQuery.vars);
        if (data.rowCount !== 1) {
            this.throwUnprocessableException("301", this.errorMessages.find.replace('{pks}', (whereQuery.vars ?? []).join(',')));
        }
    }

    public async executeUpdate(options: {[key: string]: any}) : Promise<number> {
        if (this.joinConditions.length > 0) {
            throw new Error("D1 does not support UPDATE with JOIN. Use subqueries instead.");
        }

        await this.validateOptions(options, false);

        const updateExpressions: Array<string> = [];
        for (const [key, value] of Object.entries(options)) {
            const column = this.getColumn(key);
            ValidateValueUtil.validateValue(column, value);
            this.vars.push(value);
            updateExpressions.push(`${key} = ?`)
        }

        let sql = `UPDATE ${this.SchemaTableName} SET ${updateExpressions.join(',')} `;

        if (this.whereExpressions.length > 0) {
            sql += "WHERE " + this.whereExpressions.join(" AND ");
        }

        const data = await this.executeQuery(sql, this.vars);
        return data.rowCount;
    }

    public async executeDelete() : Promise<number> {
        if (this.joinConditions.length > 0) {
            throw new Error("D1 does not support DELETE with JOIN. Use subqueries instead.");
        }

        let sql = `DELETE FROM ${this.SchemaTableName} `;

        if (this.whereExpressions.length > 0) {
            sql += "WHERE " + this.whereExpressions.join(" AND ");
        }

        const datas = await this.executeQuery(sql, this.vars);
        return datas.rowCount;
    }
}
