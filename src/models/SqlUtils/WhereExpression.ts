import { TableModel } from "../TableModel";
import { TColumnArrayType, TColumnDetail, TColumnInfo, TColumnType, TNestedCondition, TOperator, TQuery } from "../Type";
import ValidateValueUtil from "./ValidateValueUtil";

export class WhereExpression {

    public static createConditionPk(model: TableModel, pk: {[key: string]: any}, vars: Array<any> | null = null, isSetAlias: boolean = false): TQuery {
        const conditions = [];
        const newVars = vars === null ? [] : [...vars];

        for (const [keyColumn, column] of Object.entries(model.Columns)) {
            if (column.attribute !== 'primary') {
                continue;
            }

            if (pk[keyColumn] === undefined || pk[keyColumn] === null) {
                throw new Error(`No value is set for the primary key "${model.SchemaTableName}".${keyColumn}.`);
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
                    expression: `${this.makeSqlNormalizeCharVariants(leftColumn.expression, {halfToFull: true})} ${operator.replace("h2f_", "")} ${this.makeSqlNormalizeCharVariants(`'%' || ${rightColumn.expression} || '%'`, {halfToFull: true})}`
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
                    expression: `${this.makeSqlNormalizeCharVariants(leftColumn.expression, {halfToFull: true})} ${operator.replace("h2f_", "")} ${this.makeSqlNormalizeCharVariants(`$${varLength}`, {halfToFull: true})}`,
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
                // =で検索すると順番まで一致させないといけないので、順番不一致でも中身があってれば一致とするようにする
                return {
                    expression: `(${leftColumn.expression} @> $${varLength} AND $${varLength} @> ${leftColumn.expression})`,
                    vars: [right]
                }
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
                // =で検索すると順番まで一致させないといけないので、順番不一致でも中身があってれば一致とするようにする
                return {
                    expression: `(${leftColumn.expression} @> ${rightColumn.expression} AND ${rightColumn.expression} @> ${leftColumn.expression})`,
                    vars: []
                }
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
    public static makeSqlNormalizeCharVariants(expression: string, replaceOption?: true | {
        halfToFull?: boolean; hiraganaToKatakana?: boolean; 
        numeric?: true | { japanese?: boolean; }
    }) {
        if (replaceOption === true) {
            replaceOption = {
                halfToFull: true,
                hiraganaToKatakana: true,
                numeric: true
            }
        }

        if (replaceOption?.numeric === true) {
            replaceOption.numeric = {
                japanese: true
            }
        }

        let sql = expression;
        // 1. ひらがな → カタカナ (TRANSLATEを使用)
        // NORMALIZEはひらがなをカタカナにはしないので、これは残します
        if (replaceOption?.hiraganaToKatakana === true) {
            const from = 'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをんゔがぎぐげござじずぜぞだぢづでどばびぶべぼぱぴぷぺぽぁぃぅぇぉゃゅょっー、。・「」゛゜';
            const to   = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲンヴガギグゲゴザジズゼゾダヂヅデドバビブベボパピプペポァィゥェォャュョッー、。・「」゛゜';
            sql = `TRANSLATE(${sql}, '${from}', '${to}')`;
        }

        // 2. 漢数字 → 算用数字 (TRANSLATEを使用)
        // これもNORMALIZEの管轄外なので残しますが、1つのTRANSLATEにまとめます（SQLが速くなります）
        if (replaceOption?.numeric?.japanese === true) {
            const from = '零〇一壱弌二弐三参四肆五伍六陸七漆八捌九玖';
            const to   = '001112233445566778899';
            sql = `TRANSLATE(${sql}, '${from}', '${to}')`;
        }

        // 3. 全角半角の統一 (ここを NORMALIZE に変更！)
        // 元の halfToFull ブロックを削除し、この処理に置き換えます
        if (replaceOption?.halfToFull === true) {
            // NORMALIZE(..., NFKC) は以下の処理を自動で行います
            // - 全角英数字 → 半角英数字 (例: Ａ → A)
            // - 半角カナ → 全角カナ (例: ｱ → ア)
            // - 濁点の結合 (例: ｶ + ﾞ → ガ)
            sql = `NORMALIZE(${sql}, NFKC)`;
        }

        return sql;
    }
}