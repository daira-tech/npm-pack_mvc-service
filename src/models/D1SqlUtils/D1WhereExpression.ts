import { BaseTableModel } from "../BaseTableModel";
import { TColumnDetail, TColumnInfo, TColumnType, TColumnArrayType, TNestedCondition, TOperator, TQuery } from "../Type";
import ValidateValueUtil from "../ValidateValueUtil";

/**
 * D1/SQLite用のWHERE句生成ユーティリティ。
 * PostgreSQL版との主な違い:
 * - プレースホルダ: ? (位置パラメータ)
 * - IN/NOT IN: IN (?, ?, ?) 構文（PGの = ANY($N) ではない）
 * - 配列型・配列演算子: 非対応
 * - ILIKE: LIKE にマッピング（SQLiteのLIKEはASCII大文字小文字非区別）
 * - h2f_like/h2f_ilike (NORMALIZE/TRANSLATE): 非対応
 */
export class D1WhereExpression {

    /** 主キー条件を生成する。? プレースホルダを使用 */
    public static createConditionPk(model: BaseTableModel, pk: {[key: string]: any}, vars: Array<any> | null = null, isSetAlias: boolean = false): TQuery {
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
            conditions.push(`${isSetAlias ? `"${model.TableAlias}".` : ''}${keyColumn} = ?`);
        }

        return {
            expression: conditions.join(' AND '), 
            vars: newVars
        }
    }

    /** ネストされた条件をAND/ORで結合して再帰的に生成する */
    public static createCondition(conditions: Array<TNestedCondition>, model: BaseTableModel, varLength: number): TQuery {
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
                const query = this.createCondition(condition, model, varLength + vars.length);
                expression.push(query.expression);
                if (query.vars !== undefined) {
                    vars = [...vars, ...query.vars];
                }
                continue;
            }

            if (typeof condition === 'string') {
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

    /** 単一の条件式を生成する */
    public static create(left: TColumnInfo, operator: TOperator, right: TColumnInfo | any, varLength: number) : TQuery {

        const leftColumn = left.model.getColumn(left.name);

        // D1で使用可能な演算子（配列型・配列演算子は非対応）
        const useableOperator: { [key in TColumnType | TColumnArrayType]: TOperator[] } = {
            integer: ["=", "!=", ">", ">=", "<", "<=", "in", "not in"],
            'integer[]': [],
            real: ["=", "!=", ">", ">=", "<", "<="],
            'real[]': [],
            string: ["=", "!=", "like", "ilike", "in", "not in"],
            'string[]': [],
            uuid: ["=", "!=", "in", "not in"],
            'uuid[]': [],
            bool: ["=", "!=", "in", "not in"],
            'bool[]': [],
            date: ["=", "!=", ">", ">=", "<", "<="],
            'date[]': [],
            time: ["=", "!=", ">", ">=", "<", "<="],
            'time[]': [],
            timestamp: ["=", "!=", ">", ">=", "<", "<="],
            'timestamp[]': [],
            json: [],
            'json[]': [],
            jsonb: [],
            'jsonb[]': []
        };

        if (leftColumn.type.endsWith('[]')) {
            throw new Error(`D1 does not support array column types. (${leftColumn.tableName}.${leftColumn.columnName}: ${leftColumn.type})`);
        }

        if (operator === 'h2f_like' || operator === 'h2f_ilike') {
            throw new Error(`D1 does not support h2f_like/h2f_ilike operators (requires NORMALIZE/TRANSLATE).`);
        }

        if (operator === 'any' || operator === '@>' || operator === '&&') {
            throw new Error(`D1 does not support array operators: ${operator}`);
        }

        if (useableOperator[leftColumn.type].includes(operator) == false) {
            throw new Error(`The ${operator} operator cannot be used for ${leftColumn.tableName}.${leftColumn.columnName}. (${leftColumn.type})`);
        }

        if (right === null) {
            if (leftColumn.attribute !== "nullable") {
                throw new Error(`You cannot use conditions with null values unless the attribute is nullable.`);
            }

            if (operator == "=") {
                return { expression: `${leftColumn.expression} is null` }
            } else if (operator == "!=") {
                return { expression: `${leftColumn.expression} is not null` }
            } else {
                throw new Error(`When comparing with null, operators other than =, != cannot be used. (${operator})`);
            }
        }

        return this.createExpression(leftColumn, operator, right, varLength);
    }

    private static createExpression(leftColumn: TColumnDetail, operator: TOperator, right: TColumnInfo | any, varLength: number) : TQuery {
        // IN / NOT IN: IN (?, ?, ?) 構文
        if (["in", "not in"].includes(operator)) {
            if (Array.isArray(right) == false) {
                throw new Error(`For the 'in' operator, you cannot input anything other than an array on the right side.`);
            }

            if (right.length == 0) {
                return { expression: '' };
            }
            
            for (const value of right) {
                ValidateValueUtil.validateValue(leftColumn, value);
            }

            const placeholders = right.map(() => '?').join(', ');
            return {
                expression: `${leftColumn.expression} ${operator} (${placeholders})`,
                vars: [...right]
            }
        } else if (Array.isArray(right)) {
            throw new Error(`For operators other than 'in', you cannot input an array on the right side.`);
        }

        // カラム同士の比較
        if (right !== null && typeof right === 'object' && 'model' in right && 'name' in right) {
            const rightColumn = right.model.getColumn(right.name);

            if (leftColumn.type !== rightColumn.type) {
                throw new Error(`Type mismatch: column [${leftColumn.tableName}].[${leftColumn.columnName}] (${leftColumn.type}) and [${rightColumn.tableName}].[${rightColumn.columnName}] (${rightColumn.type}) must be the same type.`);
            }

            // ilike → LIKE（SQLiteのLIKEはASCII大文字小文字非区別）
            const sqlOperator = operator === 'ilike' ? 'LIKE' : operator;

            if (sqlOperator === 'like' || sqlOperator === 'LIKE') {
                return {
                    expression: `${leftColumn.expression} LIKE '%' || ${rightColumn.expression} || '%'`
                }
            }

            return {
                expression: `${leftColumn.expression} ${sqlOperator} ${rightColumn.expression}`
            }
        }

        ValidateValueUtil.validateValue(leftColumn, right);

        // ilike → LIKE
        const sqlOperator = operator === 'ilike' ? 'LIKE' : operator;

        if (sqlOperator === 'like' || sqlOperator === 'LIKE') {
            return {
                expression: `${leftColumn.expression} LIKE ?`,
                vars: [`%${right}%`]
            }
        }

        return {
            expression: `${leftColumn.expression} ${sqlOperator} ?`,
            vars: [right]
        }
    }
}
