import { TableModel } from "../TableModel";
import { TColumnArrayType, TColumnDetail, TColumnInfo, TColumnType, TNestedCondition, TOperator, TQuery } from "../Type";
import ValidateValueUtil from "./ValidateValueUtil";

export default class WhereExpression {

    public static createConditionPk(model: TableModel, pk: {[key: string]: any}, vars: Array<any> | null = null, isSetAlias: boolean = false): TQuery {
        const conditions = [];
        const newVars = vars === null ? [] : [...vars];

        for (const [keyColumn, column] of Object.entries(model.Columns)) {
            if (column.attribute !== 'primary') {
                continue;
            }

            if (pk[keyColumn] === undefined || pk[keyColumn] === null) {
                throw new Error(`No value is set for the primary key "${model.TableName}".${keyColumn}.`);
            }

            ValidateValueUtil.validateValue(column, pk[keyColumn]);
            newVars.push(pk[keyColumn]);
            conditions.push(`${isSetAlias ? `"${model.TableAlias}".` : ''}${keyColumn} = $${newVars.length}`);
        }

        return {
            expression: conditions.join(' AND '), 
            vars: newVars
        }
    }

    /**
     * Helper method to create OR conditions
     * @param conditions Array of conditions that make up the OR condition
     * @returns SQL query string representing the OR condition
     */
    public static createCondition(conditions: Array<TNestedCondition>, model: TableModel, varLength: number): TQuery {

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

        const expression: string[] = [];
        let vars: any[] = []
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
                const query = this.create({ model: model, name: condition.l}, condition.o, condition.r, varLength + vars.length);
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
            expression: `(${expression.filter(condition => condition ?? '' !== '').join(` ${logicalOperator} `)})`,
            vars: vars
        }
    }

    public static create(left: TColumnInfo, operator: TOperator, right: TColumnInfo | any, varLength: number) : TQuery {

        // Check if the specified ColumnInfo exists
        const leftColumn = left.model.getColumn(left.name);

        // Are the operators correct?
        const useableOperator: { [key in TColumnType | TColumnArrayType]: TOperator[] } = {
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
                }
            } else if (operator == "!=") {
                return {
                    expression: `${leftColumn.expression} is not null`
                }
            } else {
                throw new Error(`When comparing with null, operators other than =, != cannot be used. (${operator})`);
            }
        }

        const isColumnRight = right !== null && typeof right === 'object' && 'model' in right && 'name' in right;
        const isArrayColumnLeft = leftColumn.type.endsWith("[]");
        if (isArrayColumnLeft) {
            if (isColumnRight) {
                return this.createExpressionArrayColumn(leftColumn, operator, right, varLength);
            } else {
                return this.createExpressionArrayValue(leftColumn, operator, right, varLength);
            }
        } else {
            return this.createExpression(leftColumn, operator, right, varLength);
        }
    }

    private static createExpression(leftColumn: TColumnDetail, operator: TOperator, right: TColumnInfo | any, varLength: number) : TQuery {
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
                ValidateValueUtil.validateValue(leftColumn, value);
            }
            return {
                expression: `${leftColumn.expression} ${operator === 'in' ? '=' : '!='} ANY($${varLength})`,
                vars: [right]
            }
        } else if (Array.isArray(right)) {
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
                    }
                case 'h2f_like': // half to full like
                case 'h2f_ilike': // half to full ilike
                return {
                    expression: `${this.makeSqlReplaceHalfToFull(leftColumn.expression)} ${operator.replace("h2f_", "")} ${this.makeSqlReplaceHalfToFull(`'%' || ${rightColumn.expression} || '%'`)}`
                }
            }

            return {
                expression: `${leftColumn.expression} ${operator} ${rightColumn.expression}`
            }
        }

        ValidateValueUtil.validateValue(leftColumn, right);
        // LIKE operators are different, so handle separately
        switch (operator) {
            case 'like':
            case 'ilike':
                return {
                    expression: `${leftColumn.expression} ${operator} $${varLength}`,
                    vars: [`%${right}%`]
                }
            case 'h2f_like': // half to full like
            case 'h2f_ilike': // half to full ilike
                return {
                    expression: `${this.makeSqlReplaceHalfToFull(leftColumn.expression)} ${operator.replace("h2f_", "")} ${this.makeSqlReplaceHalfToFull(`$${varLength}`)}`,
                    vars: [`%${right}%`]
                }
        }

        return {
            expression: `${leftColumn.expression} ${operator} $${varLength}`,
            vars: [right]
        }
    }

    private static createExpressionArrayValue(leftColumn: TColumnDetail, operator: TOperator, right: any, varLength: number) : TQuery {

        // バリデーションチェック
        switch (operator) {
            case 'any':
                switch (leftColumn.type) {
                    case 'integer[]':
                        if (ValidateValueUtil.isErrorInteger(right)) {
                            throw new Error(`Expected integer value for array column (${leftColumn.type}), but received: ${JSON.stringify(right)}`);
                        }
                        break;
                    case 'real[]':
                        if (ValidateValueUtil.isErrorReal(right)) {
                            throw new Error(`Expected numeric value for array column (${leftColumn.type}), but received: ${JSON.stringify(right)}`);
                        }
                        break;
                    case 'string[]':
                        if (ValidateValueUtil.isErrorString(right)) {
                            throw new Error(`Expected string value for array column (${leftColumn.type}), but received: ${JSON.stringify(right)}`);
                        }
                        break;
                    case 'uuid[]':
                        if (ValidateValueUtil.isErrorUUID(right)) {
                            throw new Error(`Expected UUID value for array column (${leftColumn.type}), but received: ${JSON.stringify(right)}`);
                        }
                        break;
                    case 'bool[]':
                        if (ValidateValueUtil.isErrorBool(right)) {
                            throw new Error(`Expected boolean value for array column (${leftColumn.type}), but received: ${JSON.stringify(right)}`);
                        }
                        break;
                    case 'date[]':
                        if (ValidateValueUtil.isErrorDate(right)) {
                            throw new Error(`Expected date value for array column (${leftColumn.type}), but received: ${JSON.stringify(right)}`);
                        }
                        break;
                    case 'time[]':
                        if (ValidateValueUtil.isErrorTime(right)) {
                            throw new Error(`Expected time value for array column (${leftColumn.type}), but received: ${JSON.stringify(right)}`);
                        }
                        break;
                    case 'timestamp[]':
                        if (ValidateValueUtil.isErrorTimestamp(right)) {
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
                            if (ValidateValueUtil.isErrorInteger(value)) {
                                throw new Error(`Expected integer value in array element, but received: ${JSON.stringify(value)}`);
                            }
                            break;
                        case 'real[]':
                            if (ValidateValueUtil.isErrorReal(value)) {
                                throw new Error(`Expected numeric value in array element, but received: ${JSON.stringify(value)}`);
                            }
                            break;
                        case 'string[]':
                            if (ValidateValueUtil.isErrorString(value)) {
                                throw new Error(`Expected string value in array element, but received: ${JSON.stringify(value)}`);
                            }
                            break;
                        case 'uuid[]':
                            if (ValidateValueUtil.isErrorUUID(value)) {
                                throw new Error(`Expected UUID value in array element, but received: ${JSON.stringify(value)}`);
                            }
                            break;
                        case 'bool[]':
                            if (ValidateValueUtil.isErrorBool(value)) {
                                throw new Error(`Expected boolean value in array element, but received: ${JSON.stringify(value)}`);
                            }
                            break;
                        case 'date[]':
                            if (ValidateValueUtil.isErrorDate(value)) {
                                throw new Error(`Expected date value in array element, but received: ${JSON.stringify(value)}`);
                            }
                            break;
                        case 'time[]':
                            if (ValidateValueUtil.isErrorTime(value)) {
                                throw new Error(`Expected time value in array element, but received: ${JSON.stringify(value)}`);
                            }
                            break;
                        case 'timestamp[]':
                            if (ValidateValueUtil.isErrorTimestamp(value)) {
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
            case '@>':
            case '&&':
                return {
                    expression: `${leftColumn.expression} ${operator} $${varLength}`,
                    vars: [right]
                }
            case 'any':
                return {
                    expression: `$${varLength} = ANY(${leftColumn.expression})`,
                    vars: [right]
                }
        }
    }

    private static createExpressionArrayColumn(leftColumn: TColumnDetail, operator: TOperator, right: TColumnInfo, varLength: number) : TQuery {

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
            case '@>':
            case '&&':
                return {
                    expression: `${leftColumn.expression} ${operator} $${rightColumn.expression}`,
                    vars: []
                }
            case 'any':
                return {
                    expression: `$${rightColumn.expression} = ANY(${leftColumn.expression})`,
                    vars: []
                }
        }
    }

    /**
     * SQL statement to convert half-width characters to full-width
     * @param {string} columnName Column name
     * @returns SQL statement
     */
    private static makeSqlReplaceHalfToFull(columnNameOrValue: string) {
        const num = {
            '０' : '0', '１' : '1', '２' : '2', '３' : '3', '４' : '4',
            '５' : '5', '６' : '6', '７' : '7', '８' : '8', '９' : '9'
        };

        const kana = {
            'ア' : 'ｱ', 'イ' : 'ｲ', 'ウ' : 'ｳ', 'エ' : 'ｴ', 'オ' : 'ｵ',
            'カ' : 'ｶ', 'キ' : 'ｷ', 'ク' : 'ｸ', 'ケ' : 'ｹ', 'コ' : 'ｺ',
            'サ' : 'ｻ', 'シ' : 'ｼ', 'ス' : 'ｽ', 'セ' : 'ｾ', 'ソ' : 'ｿ',
            'タ' : 'ﾀ', 'チ' : 'ﾁ', 'ツ' : 'ﾂ', 'テ' : 'ﾃ', 'ト' : 'ﾄ',
            'ナ' : 'ﾅ', 'ニ' : 'ﾆ', 'ヌ' : 'ﾇ', 'ネ' : 'ﾈ', 'ノ' : 'ﾉ',
            'ハ' : 'ﾊ', 'ヒ' : 'ﾋ', 'フ' : 'ﾌ', 'ヘ' : 'ﾍ', 'ホ' : 'ﾎ',
            'マ' : 'ﾏ', 'ミ' : 'ﾐ', 'ム' : 'ﾑ', 'メ' : 'ﾒ', 'モ' : 'ﾓ',
            'ヤ' : 'ﾔ', 'ユ' : 'ﾕ', 'ヨ' : 'ﾖ',
            'ラ' : 'ﾗ', 'リ' : 'ﾘ', 'ル' : 'ﾙ', 'レ' : 'ﾚ', 'ロ' : 'ﾛ',
            'ワ' : 'ﾜ', 'ヲ' : 'ｦ', 'ン' : 'ﾝ',
            'ヴ' : 'ｳﾞ',
            'ガ' : 'ｶﾞ', 'ギ' : 'ｷﾞ', 'グ' : 'ｸﾞ', 'ゲ' : 'ｹﾞ', 'ゴ' : 'ｺﾞ',
            'ザ' : 'ｻﾞ', 'ジ' : 'ｼﾞ', 'ズ' : 'ｽﾞ', 'ゼ' : 'ｾﾞ', 'ゾ' : 'ｿﾞ',
            'ダ' : 'ﾀﾞ', 'ヂ' : 'ﾁﾞ', 'ヅ' : 'ﾂﾞ', 'デ' : 'ﾃﾞ', 'ド' : 'ﾄﾞ',
            'バ' : 'ﾊ', 'ビ' : 'ﾋﾞ', 'ブ' : 'ﾌﾞ', 'ベ' : 'ﾍﾞ', 'ボ' : 'ﾎﾞ',
            'パ' : 'ﾊﾟ', 'ピ' : 'ﾋﾟ', 'プ' : 'ﾌﾟ', 'ペ' : 'ﾍﾟ', 'ポ' : 'ﾎﾟ',
            'ァ' : 'ｧ', 'ィ' : 'ｨ', 'ゥ' : 'ｩ', 'ェ' : 'ｪ', 'ォ' : 'ｫ',
            'ャ' : 'ｬ', 'ュ' : 'ｭ', 'ョ' : 'ｮ',
            'ッ' : 'ｯ',
            'ー' : 'ｰ', '、' : '､', '。' : '｡', '・' : '･', '「' : '｢', '」' : '｣', '゛' : ' ﾞ', '゜' : ' ﾟ'
        };

        const alpha = {
            'Ａ' : 'A', 'Ｂ' : 'B', 'Ｃ' : 'C', 'Ｄ' : 'D', 'Ｅ' : 'E', 'Ｆ' : 'F', 'Ｇ' : 'G',
            'Ｈ' : 'H', 'Ｉ' : 'I', 'Ｊ' : 'J', 'Ｋ' : 'K', 'Ｌ' : 'L', 'Ｍ' : 'M', 'Ｎ' : 'N',
            'Ｏ' : 'O', 'Ｐ' : 'P', 'Ｑ' : 'Q', 'Ｒ' : 'R', 'Ｓ' : 'S', 'Ｔ' : 'T', 'Ｕ' : 'U',
            'Ｖ' : 'V', 'Ｗ' : 'W', 'Ｘ' : 'X', 'Ｙ' : 'Y', 'Ｚ' : 'Z',
            'ａ' : 'a', 'ｂ' : 'b', 'ｃ' : 'c', 'ｄ' : 'd', 'ｅ' : 'e', 'ｆ' : 'f', 'ｇ' : 'g',
            'ｈ' : 'h', 'ｉ' : 'i', 'ｊ' : 'j', 'ｋ' : 'k', 'ｌ' : 'l', 'ｍ' : 'm', 'ｎ' : 'n',
            'ｏ' : 'o', 'ｐ' : 'p', 'ｑ' : 'q', 'ｒ' : 'r', 'ｓ' : 's', 'ｔ' : 't', 'ｕ' : 'u',
            'ｖ' : 'v', 'ｗ' : 'w', 'ｘ' : 'x', 'ｙ' : 'y', 'ｚ' : 'z',
        };

        let objs: { [key: string]: string } = {};
        Object.assign(objs, num);
        Object.assign(objs, kana);
        Object.assign(objs, alpha);

        let sql = columnNameOrValue;
        Object.keys(objs).forEach(key => sql = `TRANSLATE(${sql} ,'${key}','${objs[key]}')`);

        return sql;
    }
}