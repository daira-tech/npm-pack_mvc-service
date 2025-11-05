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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TableModel = void 0;
const ValidateValueUtil_1 = __importDefault(require("./SqlUtils/ValidateValueUtil"));
const SelectExpression_1 = __importDefault(require("./SqlUtils/SelectExpression"));
const WhereExpression_1 = __importDefault(require("./SqlUtils/WhereExpression"));
const ValidateClient_1 = __importDefault(require("./ValidateClient"));
const Exception_1 = require("../exceptions/Exception");
const ExpressionClient_1 = __importDefault(require("./ExpressionClient"));
const UpdateExpression_1 = __importDefault(require("./SqlUtils/UpdateExpression"));
const MessageUtil_1 = __importDefault(require("./Utils/MessageUtil"));
class TableModel {
    get Id() { return this.id; }
    get DbName() { return this.dbName; }
    get TableName() {
        if (this.tableName === "") {
            throw new Error("Please set the tableName for TableModel.");
        }
        return this.tableName;
    }
    get TableDescription() { return this.tableDescription; }
    get Comment() { return this.comment; }
    get Columns() {
        if (Object.keys(this.columns).length === 0) {
            throw new Error("Please set the columns for TableModel.");
        }
        return this.columns;
    }
    getColumn(key) {
        if (key in this.Columns === false) {
            throw new Error(`${this.TableName} does not contain ${key}.`);
        }
        return Object.assign(Object.assign({}, this.Columns[key]), { columnName: key, tableName: this.TableName, expression: `"${this.TableAlias}".${key}` });
    }
    get References() { return this.references; }
    GetReferences(columnName) {
        const _ = this.getColumn(columnName); // 存在チェック用
        const references = [];
        for (const ref of this.References) {
            if (ref.columns.filter(col => col.target === columnName).length > 0) {
                references.push(ref);
            }
        }
        return references;
    }
    get TableAlias() {
        return this.tableAlias === undefined ? this.TableName : this.tableAlias;
    }
    get createSqlFromJoinWhere() {
        let sql = ` FROM ${this.TableName} as "${this.TableAlias}"`;
        for (const join of this.joinConditions) {
            const joins = {
                inner: ' INNER JOIN',
                left: ' LEFT OUTER JOIN',
                full: ' FULL OUTER JOIN',
            };
            sql += joins[join.type];
            sql += ` ${join.model.TableName} as "${join.model.TableAlias}" ON `;
            const query = WhereExpression_1.default.createCondition(join.conditions, this, this.vars.length + 1);
            sql += query.expression;
            if (query.vars !== undefined) {
                this.vars = [...this.vars, ...query.vars];
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
    get createSqlFromJoinWhereSortLimit() {
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
    get Client() {
        return this.client;
    }
    constructor(client, tableAlias) {
        this.id = "";
        this.dbName = "default";
        this.tableName = "";
        this.tableDescription = "";
        this.comment = "";
        this.columns = {};
        this.references = [];
        this.IsOutputLog = false;
        this.SortKeyword = 'asc';
        this.selectExpressions = [];
        this.joinConditions = [];
        this.whereExpressions = [];
        this.groupExpression = [];
        this.sortExpression = [];
        this.vars = [];
        this.errorMessages = process.env.TZ === 'Asia/Tokyo' ? MessageUtil_1.default.optionErrorMessageJapan : MessageUtil_1.default.optionErrorMessageEnglish;
        this.client = client;
        if (tableAlias !== undefined && tableAlias.trim() !== '') {
            this.tableAlias = tableAlias;
        }
    }
    find(pkOrId_1) {
        return __awaiter(this, arguments, void 0, function* (pkOrId, selectColumns = "*", selectExpressions = null, keyFormat = 'snake') {
            let selects = [];
            if (selectColumns == "*") {
                for (const key of Object.keys(this.Columns)) {
                    selects.push(SelectExpression_1.default.create({ model: this, name: key }, null, null, keyFormat));
                }
            }
            else if (selectColumns != null) {
                for (const key of selectColumns) {
                    selects.push(SelectExpression_1.default.create({ model: this, name: key }, null, null, keyFormat));
                }
            }
            if (selectExpressions != null) {
                for (const expression of selectExpressions) {
                    selects.push(`${expression.expression} as "${expression.alias}"`);
                }
            }
            let query;
            if (typeof pkOrId === 'string' || typeof pkOrId === 'number' || typeof pkOrId === 'boolean') {
                ValidateValueUtil_1.default.validateId(this.Columns, pkOrId);
                query = WhereExpression_1.default.createConditionPk(this, { id: pkOrId });
            }
            else {
                query = WhereExpression_1.default.createConditionPk(this, pkOrId);
            }
            const sql = `SELECT ${selects.join(',')} FROM ${this.TableName} WHERE ${query.expression}`;
            let datas = yield this.executeQuery(sql, query.vars);
            return datas.rowCount == 0 ? null : datas.rows[0];
        });
    }
    select(param1 = "*", param2, param3) {
        var _a, _b;
        if (param1 === "*") {
            let model = this;
            let keyFormat = 'snake';
            if (param2 instanceof TableModel) {
                model = param2;
                if (param3 === 'snake' || param3 === 'lowerCamel') {
                    keyFormat = param3;
                }
            }
            else if (param2 === 'snake' || param2 === 'lowerCamel') {
                keyFormat = param2;
            }
            for (const key of Object.keys(model.Columns)) {
                this.selectExpressions.push(SelectExpression_1.default.create({ model: model, name: key }, null, null, keyFormat));
            }
            return;
        }
        if (Array.isArray(param1)) {
            let model = this;
            let keyFormat = 'snake';
            if (param2 instanceof TableModel) {
                model = param2;
                if (param3 === 'snake' || param3 === 'lowerCamel') {
                    keyFormat = param3;
                }
            }
            else if (param2 === 'snake' || param2 === 'lowerCamel') {
                keyFormat = param2;
            }
            for (const key of param1) {
                if (typeof key === 'string') {
                    this.selectExpressions.push(SelectExpression_1.default.create({ model: model, name: key }, null, null, keyFormat));
                }
                else {
                    this.selectExpressions.push(SelectExpression_1.default.create({ model: model, name: key.name }, (_a = key.func) !== null && _a !== void 0 ? _a : null, (_b = key.alias) !== null && _b !== void 0 ? _b : null, keyFormat));
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
     * 指定されたカラム情報がNULLの場合に、指定された値に変換して選択します。
     *
     * @param columnInfo カラム情報。文字列または{name: string, model: TableModel}のオブジェクト。
     * @param toValue NULLの場合に変換する値。
     * @param alias 結果セットで使用するエイリアス名。
     */
    selectNullToValue(columnInfo, toValue, alias) {
        this.vars.push(toValue);
        if (typeof columnInfo === 'string') {
            columnInfo = { name: columnInfo, model: this };
        }
        const column = columnInfo.model.getColumn(columnInfo.name);
        this.selectExpressions.push(`COALESCE(${column.expression}, $${this.vars.length}) as "${alias}"`);
    }
    /**
     * 指定されたカラムを特定のフォーマットの日付情報に変換し、SELECT句で使用します。
     *
     * @param column カラム情報。文字列または{name: string, model: TableModel}のオブジェクト。
     * @param to 変換先のフォーマットを指定します。'date'、'time'、'datetime'のいずれか。
     * @param alias 結果セットで使用するエイリアス名。
     */
    selectDateAsFormat(column, to, alias) {
        column = typeof column === 'string' ? { name: column, model: this } : column;
        const columnInfo = column.model.getColumn(column.name);
        if (['date', 'time', 'timestamp'].includes(columnInfo.type) === false) {
            throw new Error('The first argument of the selectDateAsFormat method must specify a column of type date, time, or timestamp.');
        }
        this.selectExpressions.push(`${SelectExpression_1.default.createDateTime(column, to)} as "${alias}"`);
    }
    /**
     * 指定された条件に基づいてテーブルを結合します。
     * @param joinType 結合の種類を指定します
     * @param joinBaseModel 結合する対象のBaseModelインスタンスを指定します。
     * @param conditions 結合条件を指定します。条件はオブジェクトまたは文字列で指定できます。
     */
    join(joinType, joinModel, conditions) {
        this.joinConditions.push({ type: joinType, model: joinModel, conditions: conditions });
    }
    where(left, operator, right) {
        if (typeof left === 'string') {
            if (operator === undefined || right === undefined) {
                this.whereExpressions.push(left);
            }
            else {
                const query = WhereExpression_1.default.create({ model: this, name: left }, operator, right, this.vars.length + 1);
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
            }
            else {
                const query = WhereExpression_1.default.create(left, operator, right, this.vars.length + 1);
                this.whereExpressions.push(query.expression);
                if (query.vars !== undefined) {
                    this.vars = [...this.vars, ...query.vars];
                }
            }
            return;
        }
        if (Array.isArray(left)) {
            const query = WhereExpression_1.default.createCondition(left, this, this.vars.length + 1);
            this.whereExpressions.push(query.expression);
            if (query.vars !== undefined) {
                this.vars = [...this.vars, ...query.vars];
            }
        }
    }
    groupBy(column) {
        if (typeof column === 'string') {
            column = { model: this, name: column };
        }
        this.groupExpression.push(column.model.getColumn(column.name).expression);
    }
    orderBy(column, sortKeyword) {
        if (typeof column === 'string') {
            column = { model: this, name: column };
        }
        this.sortExpression.push(`${column.model.getColumn(column.name).expression} ${sortKeyword}`);
    }
    orderByList(column, list, sortKeyword) {
        if (list.length === 0) {
            return;
        }
        if (typeof (column) == 'string') {
            column = { model: this, name: column };
            ;
        }
        const columnInfo = column.model.getColumn(column.name);
        const orderConditions = [];
        for (let i = 0; i < list.length; i++) {
            const value = list[i];
            if (value === null) {
                if (columnInfo.attribute === 'nullable') {
                    orderConditions.push(`WHEN ${columnInfo.expression} is null THEN ${i}`);
                    continue;
                }
                throw new Error(`${this.TableName}.${columnInfo.columnName} is a non-nullable column.`);
            }
            ValidateValueUtil_1.default.validateValue(columnInfo, value);
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
    orderBySentence(query, sortKeyword) {
        this.sortExpression.push(`${query} ${sortKeyword}`);
    }
    executeSelect() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.selectExpressions.length === 0) {
                this.select();
            }
            let sql = ` SELECT ${this.selectExpressions.join(",")} ${this.createSqlFromJoinWhereSortLimit}`;
            let data = yield this.executeQuery(sql, this.vars);
            return data.rows;
        });
    }
    executeSelectForPage(pageCount, currentPage) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.selectExpressions.length == 0) {
                this.select();
            }
            this.Limit = pageCount;
            this.Offset = (currentPage - 1) * pageCount;
            const tempVars = [...this.vars];
            const tempWhereExpression = [...this.whereExpressions];
            const tempJoinConditions = [...this.joinConditions];
            let sql = ` SELECT ${this.selectExpressions.join(",")} ${this.createSqlFromJoinWhereSortLimit}`;
            const data = yield this.executeQuery(sql, this.vars);
            this.vars = tempVars;
            this.whereExpressions = tempWhereExpression;
            this.joinConditions = tempJoinConditions;
            let countSql = ` SELECT COUNT(*) as "count" ${this.createSqlFromJoinWhere}`;
            const countData = yield this.executeQuery(countSql, this.vars);
            const totalCount = Number(countData.rows[0].count);
            const lastPage = Math.ceil(Number(countData.rows[0].count) / pageCount);
            return {
                datas: data.rows,
                totalCount: totalCount,
                lastPage: lastPage,
                isLastData: currentPage >= lastPage
            };
        });
    }
    throwException(code, type, columnName, value) {
        var _a;
        const column = this.getColumn(columnName);
        let message = this.errorMessages[type];
        const name = (column.alias === undefined || column.alias === '') ? columnName : column.alias;
        message = message.replace('{name}', name);
        if (message.includes("{length}") && (column.type === 'string' || column.type === 'string[]')) {
            message = message.replace('{length}', ((_a = column.length) !== null && _a !== void 0 ? _a : '未設定').toString());
        }
        this.throwUnprocessableException(code, message);
    }
    throwDbCoflictException(code, message) {
        throw new Exception_1.DbConflictException(`${this.id}-${code}`, message);
    }
    throwUnprocessableException(code, message) {
        throw new Exception_1.UnprocessableException(`${this.id}-${code}`, message);
    }
    throwNotFoundException(code, message) {
        throw new Exception_1.NotFoundException(`${this.id}-${code}`, message);
    }
    validateOptions(options, isInsert, pkOrId) {
        return __awaiter(this, void 0, void 0, function* () {
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
                if (ValidateValueUtil_1.default.isErrorValue(column.type, value)) {
                    this.throwException("002", column.type, key, value);
                }
                if (column.type === 'string') {
                    if (Number.isInteger(column.length) === false) {
                        throw new Error(`For strings, please specify the length of the column.(column: ${column.columnName})`);
                    }
                    if (value.toString().length > column.length) {
                        this.throwException("003", "length", key, value);
                    }
                }
                else if (column.type === 'string[]') {
                    if (Number.isInteger(column.length) === false) {
                        throw new Error(`For strings, please specify the length of the column.(column: ${column.columnName})`);
                    }
                    // ValidateValueUtil.isErrorValue(column.type, value)で型チェックしてるのでas []にしている
                    for (const v of value) {
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
                        const name = ref.columns.map(col => { var _a; return (_a = this.getColumn(col.target).alias) !== null && _a !== void 0 ? _a : this.getColumn(col.target).columnName; }).join(',');
                        this.throwUnprocessableException("006", this.errorMessages.null.replace('{name}', name));
                    }
                    let refIndex = 1;
                    const sql = `SELECT COUNT(*) as count FROM ${ref.table} WHERE ${ref.columns.map(col => `${col.ref} = $${refIndex++}`).join(" AND ")}`;
                    const datas = yield this.clientQuery(sql, refValues);
                    if (datas.rows[0].count == "0") {
                        const name = ref.columns.map(col => { var _a; return (_a = this.getColumn(col.target).alias) !== null && _a !== void 0 ? _a : this.getColumn(col.target).columnName; }).join(',');
                        this.throwUnprocessableException("007", this.errorMessages.fk.replace('{name}', name));
                    }
                }
            }
        });
    }
    insert(options) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.validateOptions(options, true);
            const columns = [];
            const vars = [];
            for (const [key, value] of Object.entries(options)) {
                if (value === undefined) {
                    throw new Error(`The insert option ${key} is undefined.`);
                }
                columns.push(key);
                vars.push(value);
            }
            const params = vars.map((_, index) => `$${index + 1}`);
            const sql = `INSERT INTO ${this.TableName} (${columns.join(",")}) VALUES (${params.join(",")});`;
            yield this.executeQuery(sql, vars);
        });
    }
    update(pkOrId, options) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            yield this.validateOptions(options, false, pkOrId);
            const updateSetQuery = UpdateExpression_1.default.createUpdateSet(this, options);
            let whereQuery;
            if (typeof pkOrId === 'string' || typeof pkOrId === 'number' || typeof pkOrId === 'boolean') {
                ValidateValueUtil_1.default.validateId(this.Columns, pkOrId);
                whereQuery = WhereExpression_1.default.createConditionPk(this, { id: pkOrId }, updateSetQuery.vars);
            }
            else {
                whereQuery = WhereExpression_1.default.createConditionPk(this, pkOrId, updateSetQuery.vars);
            }
            const sql = updateSetQuery.expression + ' WHERE ' + whereQuery.expression;
            const data = yield this.executeQuery(sql, whereQuery.vars);
            if (data.rowCount !== 1) {
                this.throwUnprocessableException("201", this.errorMessages.find.replace('{pks}', ((_a = whereQuery.vars) !== null && _a !== void 0 ? _a : []).join(',')));
            }
        });
    }
    delete(pkOrId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            let whereQuery;
            if (typeof pkOrId === 'string' || typeof pkOrId === 'number' || typeof pkOrId === 'boolean') {
                ValidateValueUtil_1.default.validateId(this.Columns, pkOrId);
                whereQuery = WhereExpression_1.default.createConditionPk(this, { id: pkOrId });
            }
            else {
                whereQuery = WhereExpression_1.default.createConditionPk(this, pkOrId);
            }
            const sql = `DELETE FROM ${this.TableName} WHERE ${whereQuery.expression}`;
            const data = yield this.executeQuery(sql, whereQuery.vars);
            if (data.rowCount !== 1) {
                this.throwUnprocessableException("301", this.errorMessages.find.replace('{pks}', ((_a = whereQuery.vars) !== null && _a !== void 0 ? _a : []).join(',')));
            }
        });
    }
    executeUpdate(options) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.validateOptions(options, false);
            const updateExpressions = [];
            for (const [key, value] of Object.entries(options)) {
                const column = this.getColumn(key);
                ValidateValueUtil_1.default.validateValue(column, value);
                this.vars.push(value);
                updateExpressions.push(`${key} = $${this.vars.length}`);
            }
            let sql = `UPDATE ${this.TableName} "${this.TableAlias}" SET ${updateExpressions.join(',')} `;
            if (this.joinConditions.length > 0) {
                const tables = [];
                for (const join of this.joinConditions) {
                    tables.push(`${join.model.TableName} as "${join.model.TableAlias}"`);
                    const query = WhereExpression_1.default.createCondition(join.conditions, this, this.vars.length + 1);
                    this.whereExpressions.push(query.expression);
                    if (query.vars !== undefined) {
                        this.vars = [...this.vars, ...query.vars];
                    }
                }
                sql += `FROM ${tables.join(',')} `;
            }
            if (this.whereExpressions.length > 0) {
                sql += "WHERE " + this.whereExpressions.join(" AND ");
            }
            const data = yield this.executeQuery(sql, this.vars);
            return data.rowCount;
        });
    }
    executeDelete() {
        return __awaiter(this, void 0, void 0, function* () {
            let sql = `DELETE FROM ${this.TableName} "${this.TableAlias}" `;
            if (this.joinConditions.length > 0) {
                const tables = [];
                for (const join of this.joinConditions) {
                    tables.push(`${join.model.TableName} as "${join.model.TableAlias}"`);
                    const query = WhereExpression_1.default.createCondition(join.conditions, this, this.vars.length + 1);
                    this.whereExpressions.push(query.expression);
                    if (query.vars !== undefined) {
                        this.vars = [...this.vars, ...query.vars];
                    }
                    sql += ` USING ${tables.join(',')} `;
                }
            }
            if (this.whereExpressions.length > 0) {
                sql += "WHERE " + this.whereExpressions.join(" AND ");
            }
            const datas = yield this.executeQuery(sql, this.vars);
            return datas.rowCount;
        });
    }
    executeQuery(param1, vars) {
        return __awaiter(this, void 0, void 0, function* () {
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
            }
            else {
                sql = param1.expression;
                vars = param1.vars;
            }
            return yield this.clientQuery(sql, vars);
        });
    }
    clientQuery(sql, vars) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.IsOutputLog) {
                console.log("--- Debug Sql ----------");
                console.log(sql);
                console.log(vars);
            }
            const data = yield this.client.query(sql, vars !== null && vars !== void 0 ? vars : []);
            if (this.IsOutputLog) {
                console.log("- 実行結果");
                if (data.rowCount == 0) {
                    console.log("データなし");
                }
                else {
                    let log = "";
                    for (let i = 0; i < data.fields.length; i++) {
                        log += i == 0 ? "" : ",";
                        log += data.fields[i].name;
                    }
                    console.log(log);
                    for (let i = 0; i < data.rows.length; i++) {
                        log = "";
                        for (let j = 0; j < data.fields.length; j++) {
                            let key = data.fields[j].name;
                            log += j == 0 ? "" : ",";
                            log += data.rows[i][key];
                        }
                        console.log(log);
                    }
                }
            }
            return data;
        });
    }
    get ValidateClient() {
        if (this.validateClient === undefined) {
            this.validateClient = new ValidateClient_1.default(this);
        }
        return this.validateClient;
    }
    get ExpressionClient() {
        if (this.expressionClient === undefined) {
            this.expressionClient = new ExpressionClient_1.default(this);
        }
        return this.expressionClient;
    }
}
exports.TableModel = TableModel;
