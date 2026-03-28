import { BaseTableModel } from "../BaseTableModel";
import { TAggregateFuncType, TColumnInfo, TKeyFormat } from "../Type";
import StringUtil from "../../Utils/StringUtil";

/**
 * D1/SQLite用のSELECT句生成ユーティリティ。
 * PostgreSQLの to_char() の代わりに strftime() を使用する。
 */
export class D1SelectExpression {

    /**
     * カラム情報から SELECT 句の式を生成する。
     * 集約関数やエイリアス、日付フォーマット変換を含む。
     */
    static create(columnInfo: TColumnInfo, func: TAggregateFuncType | null = null, alias: string | null = null, keyFormat: TKeyFormat = 'snake') : string {

        const column = columnInfo.model.getColumn(columnInfo.name);
        let select = ''
        switch (column.type) {
            case 'date':
                select = this.createDateTime(columnInfo, 'date');
                break;
            case 'time':
                select = this.createDateTime(columnInfo, 'time');
                break;
            case 'timestamp':
                select = this.createDateTime(columnInfo, 'datetime');
                break;
            default:
                select = column.expression;
                break;
        }

        let aliasName = alias ?? '';
        if (func !== null) {
            if (aliasName.trim() === '') {
                const snakeAlias = func + '_' + columnInfo.name;
                aliasName = keyFormat === 'snake' ? snakeAlias : StringUtil.formatFromSnakeToCamel(snakeAlias);
            }
            select = `${func}(${select})`;
            switch (func) {
                case 'sum':
                case 'max':
                case 'min':
                case 'avg':
                case 'count':
                    select = `CAST(${select} as INTEGER)`;
                    break;
                default:
                    break;
            }
        }

        if (aliasName.trim() === '') {
            aliasName = keyFormat === 'snake' ? columnInfo.name : StringUtil.formatFromSnakeToCamel(columnInfo.name);
        }

        return `${select} as "${aliasName}"`;
    }

    /** モデルの全カラムからSELECT句を生成する */
    static createFromModel(model: BaseTableModel) {
        const queries: Array<string> = [];
        for (const key of Object.keys(model.Columns)) {
            queries.push(this.create({model: model, name: key}));
        }

        return queries.join(',');
    }

    /**
     * 日付カラムをstrftime()で文字列に変換するSQL式を返す。
     * PostgreSQLの to_char() に相当。
     */
    public static createDateTime(column: TColumnInfo, to: 'date' | 'time' | 'datetime') {
        const columnInfo = column.model.getColumn(column.name);

        if (['date', 'time', 'timestamp'].includes(columnInfo.type) === false) {
            return '';
        }

        switch (to) {
            case 'date':
                return `strftime('%Y-%m-%d', ${columnInfo.expression})`;
            case 'datetime':
                return `strftime('%Y-%m-%d %H:%M:%S', ${columnInfo.expression})`;
            case 'time':
                return `strftime('%H:%M:%S', ${columnInfo.expression})`;
        }
    }

    /** NULLを空文字に変換するCOALESCE式を返す */
    public static nullToEmptyString(column: TColumnInfo) {
        const columnInfo = column.model.getColumn(column.name);
        return `COALESCE(${columnInfo.expression}, '')`;
    }
}
