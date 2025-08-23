"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ValidateValueUtil_1 = __importDefault(require("./ValidateValueUtil"));
class WhereExpression {
    static createConditionPk(model, pk, vars = null, isSetAlias = false) {
        const conditions = [];
        const newVars = vars === null ? [] : [...vars];
        for (const [keyColumn, column] of Object.entries(model.Columns)) {
            if (column.attribute !== 'primary') {
                continue;
            }
            if (pk[keyColumn] === undefined || pk[keyColumn] === null) {
                throw new Error(`No value is set for the primary key "${model.TableName}".${keyColumn}.`);
            }
            ValidateValueUtil_1.default.validateValue(column, pk[keyColumn]);
            newVars.push(pk[keyColumn]);
            conditions.push(`${isSetAlias ? `"${model.TableAlias}".` : ''}${keyColumn} = $${newVars.length}`);
        }
        return {
            expression: conditions.join(' AND '),
            vars: newVars
        };
    }
    /**
     * Helper method to create OR conditions
     * @param conditions Array of conditions that make up the OR condition
     * @returns SQL query string representing the OR condition
     */
    static createCondition(conditions, model, varLength) {
        if (conditions.length === 0) {
            return { expression: '' };
        }
        let logicalOperator = 'AND';
        if (conditions[0] === 'AND' || conditions[0] === 'OR') {
            if (conditions.length === 1) {
                return { expression: '' };
            }
            logicalOperator = conditions[0];
            conditions.shift();
        }
        const expression = [];
        let vars = [];
        for (let condition of conditions) {
            if (Array.isArray(condition)) {
                // If it's an array, it's a nested condition, so call this function recursively
                const query = this.createCondition(condition, model, varLength + vars.length);
                expression.push(query.expression);
                if (query.vars !== undefined) {
                    vars = [...vars, ...query.vars];
                }
                continue;
            }
            if (typeof condition === 'string') {
                // If specified directly as a string, it becomes a query, so insert as is
                expression.push(condition);
                continue;
            }
            if (typeof condition.l === 'string') {
                const query = this.create({ model: model, name: condition.l }, condition.o, condition.r, varLength + vars.length);
                expression.push(query.expression);
                if (query.vars !== undefined) {
                    vars = [...vars, ...query.vars];
                }
                continue;
            }
            const query = this.create(condition.l, condition.o, condition.r, varLength + vars.length);
            expression.push(query.expression);
            if (query.vars !== undefined) {
                vars = [...vars, ...query.vars];
            }
        }
        return {
            expression: `(${expression.filter(condition => condition !== null && condition !== void 0 ? condition : '' !== '').join(` ${logicalOperator} `)})`,
            vars: vars
        };
    }
    static create(left, operator, right, varLength) {
        // Check if the specified ColumnInfo exists
        const leftColumn = left.model.getColumn(left.name);
        // Are the operators correct?
        const useableOperator = {
            integer: ["=", "!=", ">", ">=", "<", "<=", "in", "not in"],
            'integer[]': ["=", "any", "@>", "&&"],
            real: ["=", "!=", ">", ">=", "<", "<="],
            'real[]': ["=", "any", "@>", "&&"],
            string: ["=", "!=", "like", "ilike", "h2f_like", "h2f_ilike", "in", "not in"],
            'string[]': ["=", "any", "@>", "&&"],
            uuid: ["=", "!=", "in", "not in"],
            'uuid[]': ["=", "any", "@>", "&&"],
            bool: ["=", "!=", "in", "not in"],
            'bool[]': ["=", "any", "@>", "&&"],
            date: ["=", "!=", ">", ">=", "<", "<="],
            'date[]': ["=", "any", "@>", "&&"],
            time: ["=", "!=", ">", ">=", "<", "<="],
            'time[]': ["=", "any", "@>", "&&"],
            timestamp: ["=", "!=", ">", ">=", "<", "<="],
            'timestamp[]': ["=", "any", "@>", "&&"],
            json: [],
            'json[]': [],
            jsonb: [],
            'jsonb[]': []
        };
        if (useableOperator[leftColumn.type].includes(operator) == false) {
            throw new Error(`The ${operator} operator cannot be used for ${leftColumn.tableName}.${leftColumn.columnName}. (${leftColumn.type})`);
        }
        if (right === null) {
            if (leftColumn.attribute !== "nullable") {
                throw new Error(`You cannot use conditions with null values unless the attribute is nullable.`);
            }
            if (operator == "=") {
                return {
                    expression: `${leftColumn.expression} is null`
                };
            }
            else if (operator == "!=") {
                return {
                    expression: `${leftColumn.expression} is not null`
                };
            }
            else {
                throw new Error(`When comparing with null, operators other than =, != cannot be used. (${operator})`);
            }
        }
        const isColumnRight = right !== null && typeof right === 'object' && 'model' in right && 'name' in right;
        const isArrayColumnLeft = leftColumn.type.endsWith("[]");
        if (isArrayColumnLeft) {
            if (isColumnRight) {
                return this.createExpressionArrayColumn(leftColumn, operator, right, varLength);
            }
            else {
                return this.createExpressionArrayValue(leftColumn, operator, right, varLength);
            }
        }
        else {
            return this.createExpression(leftColumn, operator, right, varLength);
        }
    }
    static createExpression(leftColumn, operator, right, varLength) {
        // IN NOT IN clause
        if (["in", "not in"].includes(operator)) {
            if (Array.isArray(right) == false) {
                throw new Error(`For the 'in' operator, you cannot input anything other than an array on the right side.`);
            }
            if (right.length == 0) {
                // Creating in, not in with 0 elements will cause an error, but since the data to be passed is correct and the expected return value does not change, do not search if there are 0 elements
                return { expression: '' };
            }
            // Validate values
            for (const value of right) {
                ValidateValueUtil_1.default.validateValue(leftColumn, value);
            }
            return {
                expression: `${leftColumn.expression} ${operator === 'in' ? '=' : '!='} ANY($${varLength})`,
                vars: [right]
            };
        }
        else if (Array.isArray(right)) {
            throw new Error(`For operators other than 'in', you cannot input an array on the right side.`);
        }
        // If the right side value is a column specification
        if (right !== null && typeof right === 'object' && 'model' in right && 'name' in right) {
            const rightColumn = right.model.getColumn(right.name);
            // 型の不一致エラーメッセージを改善
            if (leftColumn.type !== rightColumn.type) {
                throw new Error(`Type mismatch: column [${leftColumn.tableName}].[${leftColumn.columnName}] (${leftColumn.type}) and [${rightColumn.tableName}].[${rightColumn.columnName}] (${rightColumn.type}) must be the same type.`);
            }
            // LIKE operators are different, so handle separately
            switch (operator) {
                case 'like':
                case 'ilike':
                    return {
                        expression: `${leftColumn.expression} ${operator} '%' || ${rightColumn.expression} || '%'`
                    };
                case 'h2f_like': // half to full like
                case 'h2f_ilike': // half to full ilike
                    return {
                        expression: `${this.makeSqlReplaceHalfToFull(leftColumn.expression)} ${operator.replace("h2f_", "")} ${this.makeSqlReplaceHalfToFull(`'%' || ${rightColumn.expression} || '%'`)}`
                    };
            }
            return {
                expression: `${leftColumn.expression} ${operator} ${rightColumn.expression}`
            };
        }
        ValidateValueUtil_1.default.validateValue(leftColumn, right);
        // LIKE operators are different, so handle separately
        switch (operator) {
            case 'like':
            case 'ilike':
                return {
                    expression: `${leftColumn.expression} ${operator} $${varLength}`,
                    vars: [`%${right}%`]
                };
            case 'h2f_like': // half to full like
            case 'h2f_ilike': // half to full ilike
                return {
                    expression: `${this.makeSqlReplaceHalfToFull(leftColumn.expression)} ${operator.replace("h2f_", "")} ${this.makeSqlReplaceHalfToFull(`$${varLength}`)}`,
                    vars: [`%${right}%`]
                };
        }
        return {
            expression: `${leftColumn.expression} ${operator} $${varLength}`,
            vars: [right]
        };
    }
    static createExpressionArrayValue(leftColumn, operator, right, varLength) {
        // バリデーションチェック
        switch (operator) {
            case 'any':
                switch (leftColumn.type) {
                    case 'integer[]':
                        if (ValidateValueUtil_1.default.isErrorInteger(right)) {
                            throw new Error(`Expected integer value for array column (${leftColumn.type}), but received: ${JSON.stringify(right)}`);
                        }
                        break;
                    case 'real[]':
                        if (ValidateValueUtil_1.default.isErrorReal(right)) {
                            throw new Error(`Expected numeric value for array column (${leftColumn.type}), but received: ${JSON.stringify(right)}`);
                        }
                        break;
                    case 'string[]':
                        if (ValidateValueUtil_1.default.isErrorString(right)) {
                            throw new Error(`Expected string value for array column (${leftColumn.type}), but received: ${JSON.stringify(right)}`);
                        }
                        break;
                    case 'uuid[]':
                        if (ValidateValueUtil_1.default.isErrorUUID(right)) {
                            throw new Error(`Expected UUID value for array column (${leftColumn.type}), but received: ${JSON.stringify(right)}`);
                        }
                        break;
                    case 'bool[]':
                        if (ValidateValueUtil_1.default.isErrorBool(right)) {
                            throw new Error(`Expected boolean value for array column (${leftColumn.type}), but received: ${JSON.stringify(right)}`);
                        }
                        break;
                    case 'date[]':
                        if (ValidateValueUtil_1.default.isErrorDate(right)) {
                            throw new Error(`Expected date value for array column (${leftColumn.type}), but received: ${JSON.stringify(right)}`);
                        }
                        break;
                    case 'time[]':
                        if (ValidateValueUtil_1.default.isErrorTime(right)) {
                            throw new Error(`Expected time value for array column (${leftColumn.type}), but received: ${JSON.stringify(right)}`);
                        }
                        break;
                    case 'timestamp[]':
                        if (ValidateValueUtil_1.default.isErrorTimestamp(right)) {
                            throw new Error(`Expected timestamp value for array column (${leftColumn.type}), but received: ${JSON.stringify(right)}`);
                        }
                        break;
                }
                break;
            case '=':
            case '@>':
            case '&&':
                if (Array.isArray(right) === false) {
                    throw new Error(`Expected array format for array column (${leftColumn.type}), but received: ${JSON.stringify(right)}`);
                }
                for (const value of right) {
                    switch (leftColumn.type) {
                        case 'integer[]':
                            if (ValidateValueUtil_1.default.isErrorInteger(value)) {
                                throw new Error(`Expected integer value in array element, but received: ${JSON.stringify(value)}`);
                            }
                            break;
                        case 'real[]':
                            if (ValidateValueUtil_1.default.isErrorReal(value)) {
                                throw new Error(`Expected numeric value in array element, but received: ${JSON.stringify(value)}`);
                            }
                            break;
                        case 'string[]':
                            if (ValidateValueUtil_1.default.isErrorString(value)) {
                                throw new Error(`Expected string value in array element, but received: ${JSON.stringify(value)}`);
                            }
                            break;
                        case 'uuid[]':
                            if (ValidateValueUtil_1.default.isErrorUUID(value)) {
                                throw new Error(`Expected UUID value in array element, but received: ${JSON.stringify(value)}`);
                            }
                            break;
                        case 'bool[]':
                            if (ValidateValueUtil_1.default.isErrorBool(value)) {
                                throw new Error(`Expected boolean value in array element, but received: ${JSON.stringify(value)}`);
                            }
                            break;
                        case 'date[]':
                            if (ValidateValueUtil_1.default.isErrorDate(value)) {
                                throw new Error(`Expected date value in array element, but received: ${JSON.stringify(value)}`);
                            }
                            break;
                        case 'time[]':
                            if (ValidateValueUtil_1.default.isErrorTime(value)) {
                                throw new Error(`Expected time value in array element, but received: ${JSON.stringify(value)}`);
                            }
                            break;
                        case 'timestamp[]':
                            if (ValidateValueUtil_1.default.isErrorTimestamp(value)) {
                                throw new Error(`Expected timestamp value in array element, but received: ${JSON.stringify(value)}`);
                            }
                            break;
                    }
                }
                break;
            default:
                throw new Error(`Unsupported operator '${operator}' for array column operations.`);
        }
        switch (operator) {
            case '=':
                // =で検索すると順番まで一致させないといけないので、順番不一致でも中身があってれば一致とするようにする
                return {
                    expression: `(${leftColumn.expression} @> $${varLength} AND $${varLength} @> ${leftColumn.expression})`,
                    vars: [right]
                };
            case '@>':
            case '&&':
                return {
                    expression: `${leftColumn.expression} ${operator} $${varLength}`,
                    vars: [right]
                };
            case 'any':
                return {
                    expression: `$${varLength} = ANY(${leftColumn.expression})`,
                    vars: [right]
                };
        }
    }
    static createExpressionArrayColumn(leftColumn, operator, right, varLength) {
        const rightColumn = right.model.getColumn(right.name);
        // バリデーションチェック
        switch (operator) {
            case 'any':
                // any演算子の場合
                if (leftColumn.type !== rightColumn.type.replace('[]', '')) {
                    throw new Error(`Type mismatch: array column [${leftColumn.tableName}].[${leftColumn.columnName}] (${leftColumn.type}) and scalar column [${rightColumn.tableName}].[${rightColumn.columnName}] (${rightColumn.type}) are incompatible for ANY operation.`);
                }
                break;
            case '=':
            case '@>':
            case '&&':
                // 配列演算子の場合
                if (leftColumn.type !== rightColumn.type) {
                    throw new Error(`Type mismatch: array columns [${leftColumn.tableName}].[${leftColumn.columnName}] (${leftColumn.type}) and [${rightColumn.tableName}].[${rightColumn.columnName}] (${rightColumn.type}) must be the same type.`);
                }
                break;
            default:
                // サポートされていない演算子
                throw new Error(`Operator '${operator}' is not supported for array column operations. Supported operators: =, @>, &&, ANY`);
        }
        switch (operator) {
            case '=':
                // =で検索すると順番まで一致させないといけないので、順番不一致でも中身があってれば一致とするようにする
                return {
                    expression: `(${leftColumn.expression} @> ${rightColumn.expression} AND ${rightColumn.expression} @> ${leftColumn.expression})`,
                    vars: []
                };
            case '@>':
            case '&&':
                return {
                    expression: `${leftColumn.expression} ${operator} $${rightColumn.expression}`,
                    vars: []
                };
            case 'any':
                return {
                    expression: `$${rightColumn.expression} = ANY(${leftColumn.expression})`,
                    vars: []
                };
        }
    }
    /**
     * SQL statement to convert half-width characters to full-width
     * @param {string} columnName Column name
     * @returns SQL statement
     */
    static makeSqlReplaceHalfToFull(columnNameOrValue) {
        let objs = {
            '０１２３４５６７８９': '0123456789',
            'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲンヴガギグゲゴザジズゼゾダヂヅデドバビブベボパピプペポァィゥェォャュョッー、。・「」゛゜': 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜｦﾝｳﾞｶﾞｷﾞｸﾞｹﾞｺﾞｻﾞｼﾞｽﾞｾﾞｿﾞﾀﾞﾁﾞﾂﾞﾃﾞﾄﾞﾊﾊﾋﾞﾌﾞﾍﾞﾎﾞﾊﾟﾋﾟﾌﾟﾍﾟﾎﾟｧｨｩｪｫｬｭｮｯｰ､｡･｢｣ ﾞ ﾟ',
            'ＡＢＣＤＥＦＧＨＩＪＫＬＭＮＯＰＱＲＳＴＵＶＷＸＹＺ': 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
            'ａｂｃｄｅｆｇｈｉｊｋｌｍｎｏｐｑｒｓｔｕｖｗｘｙｚ': 'abcdefghijklmnopqrstuvwxyz'
        };
        let sql = columnNameOrValue;
        Object.keys(objs).forEach(key => sql = `TRANSLATE(${sql} ,'${key}','${objs[key]}')`);
        return sql;
    }
}
exports.default = WhereExpression;
