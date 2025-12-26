import { TableModel } from "../TableModel";
import { TColumnInfo, TNestedCondition, TOperator, TQuery } from "../Type";
export declare class WhereExpression {
    static createConditionPk(model: TableModel, pk: {
        [key: string]: any;
    }, vars?: Array<any> | null, isSetAlias?: boolean): TQuery;
    /**
     * Helper method to create OR conditions
     * @param conditions Array of conditions that make up the OR condition
     * @returns SQL query string representing the OR condition
     */
    static createCondition(conditions: Array<TNestedCondition>, model: TableModel, varLength: number): TQuery;
    static create(left: TColumnInfo, operator: TOperator, right: TColumnInfo | any, varLength: number): TQuery;
    private static createExpression;
    private static createExpressionArrayValue;
    private static createExpressionArrayColumn;
    /**
     * SQL statement to convert half-width characters to full-width
     * @param {string} columnName Column name
     * @returns SQL statement
     */
    static makeSqlNormalizeCharVariants(expression: string, replaceOption?: true | {
        halfToFull?: boolean;
        hiraganaToKatakana?: boolean;
        numeric?: true | {
            japanese?: boolean;
        };
    }): string;
}
//# sourceMappingURL=WhereExpression.d.ts.map