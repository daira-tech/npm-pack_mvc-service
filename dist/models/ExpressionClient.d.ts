import { BaseTableModel } from "./BaseTableModel";
import { TColumnInfo } from "./Type";
export default class ExpressionClient {
    private model;
    constructor(model: BaseTableModel);
    toSqlStringValue(value: any): string;
    toSqlNumberValue(value: any): string;
    createCaseFromObject(column: string | TColumnInfo, obj: {
        [key: string | number]: string | number | boolean | null;
    }, elseValue: string | number | boolean | null): string;
}
//# sourceMappingURL=ExpressionClient.d.ts.map