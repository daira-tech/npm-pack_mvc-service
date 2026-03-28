import { BaseTableModel } from "../BaseTableModel";
import { TColumnInfo, TNestedCondition, TOperator, TQuery } from "../Type";
/**
 * D1/SQLite用のWHERE句生成ユーティリティ。
 * PostgreSQL版との主な違い:
 * - プレースホルダ: ? (位置パラメータ)
 * - IN/NOT IN: IN (?, ?, ?) 構文（PGの = ANY($N) ではない）
 * - 配列型・配列演算子: 非対応
 * - ILIKE: LIKE にマッピング（SQLiteのLIKEはASCII大文字小文字非区別）
 * - h2f_like/h2f_ilike (NORMALIZE/TRANSLATE): 非対応
 */
export declare class D1WhereExpression {
    /** 主キー条件を生成する。? プレースホルダを使用 */
    static createConditionPk(model: BaseTableModel, pk: {
        [key: string]: any;
    }, vars?: Array<any> | null, isSetAlias?: boolean): TQuery;
    /** ネストされた条件をAND/ORで結合して再帰的に生成する */
    static createCondition(conditions: Array<TNestedCondition>, model: BaseTableModel, varLength: number): TQuery;
    /** 単一の条件式を生成する */
    static create(left: TColumnInfo, operator: TOperator, right: TColumnInfo | any, varLength: number): TQuery;
    private static createExpression;
}
//# sourceMappingURL=D1WhereExpression.d.ts.map