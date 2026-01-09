import { TableModel } from "../TableModel";
import { TQuery } from "../Type";

export default class UpdateExpression {

    static createUpdateSet(model: TableModel, options: {[key: string]: any}): TQuery {
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
            expressions.push(`${key} = $${vars.length}`);
        }

        return {
            expression: `UPDATE ${model.SchemaTableName} SET ${expressions.join(',')}`,
            vars: vars
        }
    }

}