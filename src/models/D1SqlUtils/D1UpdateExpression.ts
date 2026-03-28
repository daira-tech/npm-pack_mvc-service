import { BaseTableModel } from "../BaseTableModel";
import { TQuery } from "../Type";

/**
 * D1/SQLite用のUPDATE SET句生成ユーティリティ。
 * プレースホルダに ? を使用する。
 */
export default class D1UpdateExpression {

    /** UPDATE SET句を生成する。プライマリキーの変更は禁止 */
    static createUpdateSet(model: BaseTableModel, options: {[key: string]: any}): TQuery {
        const expressions = [];
        const vars = [];
        for (const [key, value] of Object.entries(options)) {
            if (value === undefined) {
                throw new Error(`The update option ${key} is undefined.`);
            }

            const column = model.getColumn(key);
            if (column.attribute === 'primary') {
                throw new Error(`The primary key ${model.TableName}.${key} cannot be changed.`);
            }

            vars.push(value);
            expressions.push(`${key} = ?`);
        }

        return {
            expression: `UPDATE ${model.SchemaTableName} SET ${expressions.join(',')}`,
            vars: vars
        }
    }

}
