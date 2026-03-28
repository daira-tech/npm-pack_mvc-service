import { BaseTableModel } from "../BaseTableModel";
import { TAggregateFuncType, TColumnInfo, TKeyFormat } from "../Type";
/**
 * D1/SQLite用のSELECT句生成ユーティリティ。
 * PostgreSQLの to_char() の代わりに strftime() を使用する。
 */
export declare class D1SelectExpression {
    /**
     * カラム情報から SELECT 句の式を生成する。
     * 集約関数やエイリアス、日付フォーマット変換を含む。
     */
    static create(columnInfo: TColumnInfo, func?: TAggregateFuncType | null, alias?: string | null, keyFormat?: TKeyFormat): string;
    /** モデルの全カラムからSELECT句を生成する */
    static createFromModel(model: BaseTableModel): string;
    /**
     * 日付カラムをstrftime()で文字列に変換するSQL式を返す。
     * PostgreSQLの to_char() に相当。
     */
    static createDateTime(column: TColumnInfo, to: 'date' | 'time' | 'datetime'): string;
    /** NULLを空文字に変換するCOALESCE式を返す */
    static nullToEmptyString(column: TColumnInfo): string;
}
//# sourceMappingURL=D1SelectExpression.d.ts.map