import { TableModel } from "./TableModel";
type TError = {
    code?: string;
    message?: string;
};
export default class ValidateClient {
    private model;
    constructor(model: TableModel);
    tryDate(value: any, isExcludeTime?: boolean): Date | false;
    validateInList(options: {
        [key: string]: any;
    }, key: string, list: Array<number | string | boolean>, error?: TError): void;
    validateUnderNow(options: {
        [key: string]: any;
    }, key: string, error?: TError): void;
    validateUnderToday(options: {
        [key: string]: any;
    }, key: string, isErrorToday: boolean, error?: TError): void;
    validateRegExp(options: {
        [key: string]: any;
    }, key: string, regExp: RegExp | string, error?: TError): void;
    validatePositiveNumber(options: {
        [key: string]: any;
    }, key: string, error?: TError): void;
}
export {};
//# sourceMappingURL=ValidateClient.d.ts.map