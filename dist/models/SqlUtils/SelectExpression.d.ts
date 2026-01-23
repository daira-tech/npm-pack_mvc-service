import { TableModel } from "../TableModel";
import { TAggregateFuncType, TColumnInfo, TKeyFormat } from "../Type";
export declare class SelectExpression {
    /**
     * 指定されたカラム情報と関数を使用して、SQLのSELECT文を作成します。
     * @param columnInfoType カラム情報を含むオブジェクト。
     * @param func カラムに適用する関数名。nullの場合は関数を適用しません。
     * @returns SQLのSELECT文の文字列。
     */
    static create(columnInfo: TColumnInfo, func?: TAggregateFuncType | null, alias?: string | null, keyFormat?: TKeyFormat): string;
    /**
     * BaseModelからSELECTクエリを作成します。
     * @param baseModel クエリを作成するためのBaseModelオブジェクト。
     * @param isExcludeId trueの場合、idカラムを除外します。
     * @param isExcludeSystemTime trueの場合、システム時間のカラムを除外します。
     * @returns 作成されたSELECTクエリの文字列。
     */
    static createFromModel(model: TableModel): string;
    /**
     * Converts the specified column to a SQL string format.
     * 指定されたカラムをSQLの文字列形式に変換します。
     * @param column - The column information or a string containing the column name.
     *                 変換するカラム情報またはカラム名を含む文字列。
     * @param to - Specifies the target format. Either 'date', 'time', or 'datetime'.
     *             変換先の形式を指定します。'date'、'time'、または'datetime'のいずれか。
     * @returns The SQL string converted to the specified format.
     *          指定された形式に変換されたSQLの文字列。
     */
    static createDateTime(column: TColumnInfo, to: 'date' | 'time' | 'datetime'): string;
    static nullToEmptyString(column: TColumnInfo): string;
}
//# sourceMappingURL=SelectExpression.d.ts.map