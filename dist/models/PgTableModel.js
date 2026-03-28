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
exports.PgTableModel = void 0;
const ValidateValueUtil_1 = __importDefault(require("./ValidateValueUtil"));
const PgSelectExpression_1 = require("./PgSqlUtils/PgSelectExpression");
const PgWhereExpression_1 = require("./PgSqlUtils/PgWhereExpression");
const PgUpdateExpression_1 = __importDefault(require("./PgSqlUtils/PgUpdateExpression"));
const BaseTableModel_1 = require("./BaseTableModel");
class PgTableModel extends BaseTableModel_1.BaseTableModel {
    placeholder(index) {
        return `$${index}`;
    }
    get createSqlFromJoinWhere() {
        let sql = ` FROM ${this.SchemaTableName} as "${this.TableAlias}"`;
        for (const join of this.joinConditions) {
            const joins = {
                inner: ' INNER JOIN',
                left: ' LEFT OUTER JOIN',
                full: ' FULL OUTER JOIN',
            };
            sql += joins[join.type];
            sql += ` ${join.model.SchemaTableName} as "${join.model.TableAlias}" ON `;
            const query = PgWhereExpression_1.PgWhereExpression.createCondition(join.conditions, this, this.vars.length + 1);
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
    find(pkOrId_1) {
        return __awaiter(this, arguments, void 0, function* (pkOrId, selectColumns = "*", selectExpressions = null, keyFormat = 'snake') {
            let selects = [];
            if (selectColumns == "*") {
                for (const key of Object.keys(this.Columns)) {
                    selects.push(PgSelectExpression_1.PgSelectExpression.create({ model: this, name: key }, null, null, keyFormat));
                }
            }
            else if (selectColumns != null) {
                for (const key of selectColumns) {
                    selects.push(PgSelectExpression_1.PgSelectExpression.create({ model: this, name: key }, null, null, keyFormat));
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
                query = PgWhereExpression_1.PgWhereExpression.createConditionPk(this, { id: pkOrId });
            }
            else {
                query = PgWhereExpression_1.PgWhereExpression.createConditionPk(this, pkOrId);
            }
            const sql = `SELECT ${selects.join(',')} FROM ${this.SchemaTableName} WHERE ${query.expression}`;
            let datas = yield this.executeQuery(sql, query.vars);
            return datas.rowCount == 0 ? null : datas.rows[0];
        });
    }
    select(param1 = "*", param2, param3) {
        var _a, _b;
        if (param1 === "*") {
            let model = this;
            let keyFormat = 'snake';
            if (param2 instanceof BaseTableModel_1.BaseTableModel) {
                model = param2;
                if (param3 === 'snake' || param3 === 'lowerCamel') {
                    keyFormat = param3;
                }
            }
            else if (param2 === 'snake' || param2 === 'lowerCamel') {
                keyFormat = param2;
            }
            for (const key of Object.keys(model.Columns)) {
                this.selectExpressions.push(PgSelectExpression_1.PgSelectExpression.create({ model: model, name: key }, null, null, keyFormat));
            }
            return;
        }
        if (Array.isArray(param1)) {
            let model = this;
            let keyFormat = 'snake';
            if (param2 instanceof BaseTableModel_1.BaseTableModel) {
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
                    this.selectExpressions.push(PgSelectExpression_1.PgSelectExpression.create({ model: model, name: key }, null, null, keyFormat));
                }
                else {
                    this.selectExpressions.push(PgSelectExpression_1.PgSelectExpression.create({ model: model, name: key.name }, (_a = key.func) !== null && _a !== void 0 ? _a : null, (_b = key.alias) !== null && _b !== void 0 ? _b : null, keyFormat));
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
    selectNullToValue(columnInfo, toValue, alias) {
        this.vars.push(toValue);
        if (typeof columnInfo === 'string') {
            columnInfo = { name: columnInfo, model: this };
        }
        const column = columnInfo.model.getColumn(columnInfo.name);
        this.selectExpressions.push(`COALESCE(${column.expression}, $${this.vars.length}) as "${alias}"`);
    }
    selectNullToEmptyString(column, alias) {
        column = typeof column === 'string' ? { name: column, model: this } : column;
        const columnInfo = column.model.getColumn(column.name);
        this.selectExpressions.push(`${PgSelectExpression_1.PgSelectExpression.nullToEmptyString(column)} as "${alias}"`);
    }
    selectDateAsFormat(column, to, alias) {
        column = typeof column === 'string' ? { name: column, model: this } : column;
        const columnInfo = column.model.getColumn(column.name);
        if (['date', 'time', 'timestamp'].includes(columnInfo.type) === false) {
            throw new Error('The first argument of the selectDateAsFormat method must specify a column of type date, time, or timestamp.');
        }
        this.selectExpressions.push(`${PgSelectExpression_1.PgSelectExpression.createDateTime(column, to)} as "${alias}"`);
    }
    where(param1, param2, right) {
        if (typeof param1 === 'string') {
            if (param2 === undefined || right === undefined || Array.isArray(param2)) {
                if (Array.isArray(param2)) {
                    let expression = param1;
                    const startIndex = this.vars.length + 1;
                    expression = expression.replace(/\$(\d+)/g, (match, num) => {
                        const originalNum = parseInt(num, 10);
                        return `$${startIndex + originalNum - 1}`;
                    });
                    this.vars = [...this.vars, ...param2];
                    this.whereExpressions.push(expression);
                }
                else {
                    this.whereExpressions.push(param1);
                }
            }
            else {
                const query = PgWhereExpression_1.PgWhereExpression.create({ model: this, name: param1 }, param2, right, this.vars.length + 1);
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
            }
            else {
                const query = PgWhereExpression_1.PgWhereExpression.create(param1, param2, right, this.vars.length + 1);
                this.whereExpressions.push(query.expression);
                if (query.vars !== undefined) {
                    this.vars = [...this.vars, ...query.vars];
                }
            }
            return;
        }
        if (Array.isArray(param1)) {
            const query = PgWhereExpression_1.PgWhereExpression.createCondition(param1, this, this.vars.length + 1);
            this.whereExpressions.push(query.expression);
            if (query.vars !== undefined) {
                this.vars = [...this.vars, ...query.vars];
            }
        }
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
                throw new Error(`${this.SchemaTableName}.${columnInfo.columnName} is a non-nullable column.`);
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
            const sql = `INSERT INTO ${this.SchemaTableName} (${columns.join(",")}) VALUES (${params.join(",")});`;
            yield this.executeQuery(sql, vars);
        });
    }
    update(pkOrId, options) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.validateOptions(options, false, pkOrId);
            const updateSetQuery = PgUpdateExpression_1.default.createUpdateSet(this, options);
            let whereQuery;
            if (typeof pkOrId === 'string' || typeof pkOrId === 'number' || typeof pkOrId === 'boolean') {
                ValidateValueUtil_1.default.validateId(this.Columns, pkOrId);
                whereQuery = PgWhereExpression_1.PgWhereExpression.createConditionPk(this, { id: pkOrId }, updateSetQuery.vars);
            }
            else {
                whereQuery = PgWhereExpression_1.PgWhereExpression.createConditionPk(this, pkOrId, updateSetQuery.vars);
            }
            const sql = updateSetQuery.expression + ' WHERE ' + whereQuery.expression;
            const data = yield this.executeQuery(sql, whereQuery.vars);
            if (data.rowCount !== 1) {
                let pkValues;
                if (typeof pkOrId === 'string' || typeof pkOrId === 'number' || typeof pkOrId === 'boolean') {
                    pkValues = pkOrId.toString();
                }
                else {
                    pkValues = Object.values(pkOrId).map((d) => d.toString()).join(',');
                }
                this.throwUnprocessableException("201", this.errorMessages.find.replace('{pks}', pkValues));
            }
        });
    }
    delete(pkOrId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            let whereQuery;
            if (typeof pkOrId === 'string' || typeof pkOrId === 'number' || typeof pkOrId === 'boolean') {
                ValidateValueUtil_1.default.validateId(this.Columns, pkOrId);
                whereQuery = PgWhereExpression_1.PgWhereExpression.createConditionPk(this, { id: pkOrId });
            }
            else {
                whereQuery = PgWhereExpression_1.PgWhereExpression.createConditionPk(this, pkOrId);
            }
            const sql = `DELETE FROM ${this.SchemaTableName} WHERE ${whereQuery.expression}`;
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
            let sql = `UPDATE ${this.SchemaTableName} "${this.TableAlias}" SET ${updateExpressions.join(',')} `;
            if (this.joinConditions.length > 0) {
                const tables = [];
                for (const join of this.joinConditions) {
                    tables.push(`${join.model.SchemaTableName} as "${join.model.TableAlias}"`);
                    const query = PgWhereExpression_1.PgWhereExpression.createCondition(join.conditions, this, this.vars.length + 1);
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
            let sql = `DELETE FROM ${this.SchemaTableName} "${this.TableAlias}" `;
            if (this.joinConditions.length > 0) {
                const tables = [];
                for (const join of this.joinConditions) {
                    tables.push(`${join.model.SchemaTableName} as "${join.model.TableAlias}"`);
                    const query = PgWhereExpression_1.PgWhereExpression.createCondition(join.conditions, this, this.vars.length + 1);
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
}
exports.PgTableModel = PgTableModel;
