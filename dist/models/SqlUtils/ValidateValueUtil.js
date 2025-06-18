"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const DateTimeUtil_1 = __importDefault(require("../Utils/DateTimeUtil"));
const StringUtil_1 = __importDefault(require("../Utils/StringUtil"));
class ValidateValueUtil {
    static validateId(columns, id) {
        if ('id' in columns === false) {
            throw new Error("The 'id' is not set in Columns.");
        }
        const pkColumnsArray = Object.entries(columns).filter(([key, column]) => column.attribute === 'primary');
        const pkColumns = Object.fromEntries(pkColumnsArray);
        if ('id' in pkColumns === false) {
            throw new Error("The 'id' is not set as a Primary Key.");
        }
        if (Object.keys(pkColumns).length > 1) {
            throw new Error("This method cannot be used because there are other Primary Keys set besides 'id'.");
        }
        ValidateValueUtil.validateValue(pkColumns['id'], id);
    }
    static validateValue(column, value) {
        if (value === undefined) {
            throw new Error(`The value is undefined.`);
        }
        if (value === null) {
            if (column.attribute === 'nullable') {
                return null;
            }
            throw new Error(`The specified column does not allow null values. (${column.attribute})`);
        }
        // // 配列のチェック
        // if (column.type.endsWith("[]")) {
        //     if (Array.isArray(value) === false) {
        //         throw new Error('The value must be an array.');
        //     }
        //     for (const v of value) {
        //         switch (column.type) {
        //             case "string[]":
        //                 if (this.isErrorString(v)) {
        //                     throw new Error('Please enter a value of type string.');
        //                 }
        //                 break;
        //             case "uuid[]":
        //                 if (this.isErrorUUID(v)) {
        //                     throw new Error('Please enter a value in UUID string format.');
        //                 }
        //                 break;
        //             case "date[]":
        //                 if (this.isErrorDate(v)) {
        //                     throw new Error('Please enter a valid date in "YYYY-MM-DD" or "YYYY-MM-DD hh:mi:ss" format or as a Date type.');
        //                 }
        //                 break;
        //             case "time[]":
        //                 if (this.isErrorTime(v)) {
        //                     throw new Error('Please enter a valid time in "hh:mi" or "hh:mi:ss" format.');
        //                 }
        //                 break;
        //             case "timestamp[]":
        //                 if (this.isErrorTimestamp(v)) {
        //                     throw new Error('Please enter a valid timestamp in "YYYY-MM-DD", "YYYY-MM-DD hh:mi:ss", or "YYYY-MM-DDThh:mi:ss" format or as a Date type.');
        //                 }
        //                 break;
        //             case "number[]":
        //                 if (this.isErrorNumber(v)) {
        //                     throw new Error('Please enter a value of type number or a string of half-width digits.');
        //                 }
        //                 break;
        //             case "bool[]":
        //                 if (this.isErrorBool(v)) {
        //                     throw new Error('Please enter a value of type bool, or a string "true" or "false", or a number 0 or 1.');
        //                 }
        //                 break;
        //             default:
        //                 throw new Error(`The specified ColumnTypeEnum does not exist. (${column.type})`);
        //         }
        //         if (v === true) {
        //             return true;
        //         }
        //     }
        //     return false;
        // }
        switch (column.type) {
            case "string":
                if (this.isErrorString(value)) {
                    throw new Error('Please enter a value of type string or number.');
                }
                break;
            case "uuid":
                if (this.isErrorUUID(value)) {
                    throw new Error('Please enter a value in UUID string format.');
                }
                break;
            case "date":
                if (this.isErrorDate(value)) {
                    throw new Error('Please enter a valid date in "YYYY-MM-DD" or "YYYY-MM-DD hh:mi:ss" format or as a Date type.');
                }
                break;
            case "time":
                if (this.isErrorTime(value)) {
                    throw new Error('Please enter a valid time in "hh:mi" or "hh:mi:ss" format.');
                }
                break;
            case "timestamp":
                if (this.isErrorTimestamp(value)) {
                    throw new Error('Please enter a valid timestamp in "YYYY-MM-DD", "YYYY-MM-DD hh:mi:ss", or "YYYY-MM-DDThh:mi:ss" format or as a Date type.');
                }
                break;
            case "number":
                if (this.isErrorNumber(value)) {
                    throw new Error('Please enter a value of type number or a string of half-width digits.');
                }
                break;
            case "bool":
                if (this.isErrorBool(value)) {
                    throw new Error('Please enter a value of type bool, or a string "true" or "false", or a number 0 or 1.');
                }
                break;
        }
    }
    static isErrorValue(columnType, value) {
        // 配列のチェック
        if (columnType.endsWith("[]")) {
            if (Array.isArray(value) === false) {
                return true;
            }
            for (const v of value) {
                let isError = false;
                switch (columnType) {
                    case "string[]":
                        isError = this.isErrorString(v);
                        break;
                    case "uuid[]":
                        isError = this.isErrorUUID(v);
                        break;
                    case "date[]":
                        isError = this.isErrorDate(v);
                        break;
                    case "time[]":
                        isError = this.isErrorTime(v);
                        break;
                    case "timestamp[]":
                        isError = this.isErrorTimestamp(v);
                        break;
                    case "number[]":
                        isError = this.isErrorNumber(v);
                        break;
                    case "bool[]":
                        isError = this.isErrorBool(v);
                        break;
                    default:
                        throw new Error(`The specified ColumnTypeEnum does not exist. (${columnType})`);
                }
                if (isError) {
                    return true;
                }
            }
            return false;
        }
        switch (columnType) {
            case "string":
                return this.isErrorString(value);
            case "uuid":
                return this.isErrorUUID(value);
            case "date":
                return this.isErrorDate(value);
            case "time":
                return this.isErrorTime(value);
            case "timestamp":
                return this.isErrorTimestamp(value);
            case "number":
                return this.isErrorNumber(value);
            case "bool":
                return this.isErrorBool(value);
            default:
                throw new Error(`The specified ColumnTypeEnum does not exist. (${columnType})`);
        }
    }
    static isErrorString(value) {
        if (typeof (value) == 'string' || typeof (value) == 'number') {
            return false;
        }
        return true;
    }
    static isErrorNumber(value) {
        if (typeof value === 'string') {
            if (value.trim() === "" || isNaN(Number(value))) {
                return true;
            }
            return false;
        }
        else if (typeof value === 'number') {
            return false;
        }
        return true;
    }
    static isErrorBool(value) {
        switch (typeof (value)) {
            case 'string':
                return value !== 'true' && value !== 'false';
            case 'number':
                return value !== 0 && value !== 1;
            case 'boolean':
                return false;
            default:
                return true;
        }
    }
    static isErrorUUID(value) {
        return StringUtil_1.default.isUUID(value) === false;
    }
    static isErrorDate(value) {
        if (value instanceof Date) {
            return false;
        }
        else if (DateTimeUtil_1.default.isYYYYMMDD(value)) {
            return false;
        }
        else if (DateTimeUtil_1.default.isYYYYMMDDhhmiss(value)) {
            return false;
        }
        return true;
    }
    static isErrorTimestamp(value) {
        if (value instanceof Date) {
            return false;
        }
        else if (DateTimeUtil_1.default.isYYYYMMDD(`${value}`)) {
            return false;
        }
        else if (DateTimeUtil_1.default.isYYYYMMDDhhmiss(value)) {
            return false;
        }
        return true;
    }
    static isErrorTime(value) {
        if (value instanceof Date) {
            return false;
        }
        if (DateTimeUtil_1.default.isHHMMSS(value)) {
            return false;
        }
        else if (DateTimeUtil_1.default.isHHMM(value)) {
            return false;
        }
        return true;
    }
}
exports.default = ValidateValueUtil;
