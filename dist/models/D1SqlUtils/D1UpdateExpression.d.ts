import { BaseTableModel } from "../BaseTableModel";
import { TQuery } from "../Type";
/**
 * D1/SQLite用のUPDATE SET句生成ユーティリティ。
 * プレースホルダに ? を使用する。
 */
export default class D1UpdateExpression {
    /** UPDATE SET句を生成する。プライマリキーの変更は禁止 */
    static createUpdateSet(model: BaseTableModel, options: {
        [key: string]: any;
    }): TQuery;
}
//# sourceMappingURL=D1UpdateExpression.d.ts.map