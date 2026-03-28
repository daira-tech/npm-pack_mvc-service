import { BaseTableModel } from "../BaseTableModel";
import { TQuery } from "../Type";
export default class PgUpdateExpression {
    static createUpdateSet(model: BaseTableModel, options: {
        [key: string]: any;
    }): TQuery;
}
//# sourceMappingURL=PgUpdateExpression.d.ts.map