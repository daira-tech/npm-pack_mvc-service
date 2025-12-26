import { TColumn, TColumnArrayType, TColumnType } from "../Type";
export default class ValidateValueUtil {
    static validateId(columns: {
        [key: string]: TColumn;
    }, id: any): void;
    static validateValue(column: TColumn, value: any): null | undefined;
    static isErrorValue(columnType: TColumnType | TColumnArrayType, value: any): boolean;
    static isErrorString(value: any): boolean;
    static isErrorInteger(value: any): boolean;
    static isErrorReal(value: any): boolean;
    static isErrorNumber(value: any): boolean;
    static isErrorBool(value: any): boolean;
    static isErrorUUID(value: any): boolean;
    static isErrorDate(value: any): boolean;
    static isErrorTimestamp(value: any): boolean;
    static isErrorTime(value: any): boolean;
    static isErrorJson(value: any): boolean;
}
//# sourceMappingURL=ValidateValueUtil.d.ts.map