type PrimitiveKeyType = 
'string' | 'number' | 'boolean' | 'date' | 'datetime' | 'time' | 'uuid' | 'mail' | 'https' | 'base64' |
'string?' | 'number?' | 'boolean?' | 'date?' | 'datetime?' | 'time?' | 'uuid?' | 'mail?' | 'https?' | 'base64?';

export type PrimitiveType = {
    type: PrimitiveKeyType;
    description?: string;
};
export type ObjectType = {
    type: 'object' | 'object?';
    description?: string;
    properties: {
        [key: string]: PropertyType;
    };
};
export type ArrayType = {
    type: 'array' | 'array?';
    description?: string;
    properties: PropertyType;
};
export type DictionaryType = {
    type: 'dictionary' | 'dictionary?';
    description?: string;
    dictionaryType: 'string' | 'number' | 'string?' | 'number?';
};
export type EnumType = {
    type: 'enum' | 'enum?';
    description?: string;
    enumType: 'string' | 'number' | 'string?' | 'number?';
    enums: {[key: string | number]: string};
};

export type PropertyType = PrimitiveType | ObjectType | ArrayType | EnumType | DictionaryType;

export default class ReqResType {

    protected properties: { [key: string]: PropertyType; } = {};

    /**
     * Checks if the value is a valid date-time format
     * 値が有効な日付時間形式かどうかを確認します
     * @param value - 検証する値, The value to be validated
     * @returns {boolean} - 値が有効な日付時間形式であるかどうか, Whether the value is a valid date-time format
     */
    protected isErrorDateTime(value: string): boolean {
        try {
            const [datePart, timePart] = value.split(/[ T]/);
            const [year, month, day] = datePart.split('-').map(Number);
            let [hour, minute, sec] = [0, 0, 0];
            if (timePart !== undefined) {
                [hour, minute, sec] = timePart.split(':').map(Number);
            }
            
            const date = new Date(year, month - 1, day, hour, minute, sec);
            return year !== date.getFullYear() || 
                   month !== date.getMonth() + 1 || 
                   day !== date.getDate() ||
                   hour !== date.getHours() ||
                   minute !== date.getMinutes() ||
                   sec !== date.getSeconds()
        } catch (error) {
            return true;
        }
    }

    /**
     * Validates if the given value is in the format YYYY-MM-DD
     * 与えられた値がYYYY-MM-DD形式であるかどうかを検証します
     * @param value - The value to be validated, 検証する値
     * @returns {boolean} - Whether the value is in the format YYYY-MM-DD, 値がYYYY-MM-DD形式であるかどうか
     */
    protected isYYYYMMDD(value: any) {
        if (typeof value !== 'string') {
            return false;
        }

        const pattern = new RegExp('^\\d{4}-\\d{2}-\\d{2}$');
        return pattern.test(value);
    }

    /**
     * Validates if the given value is in the format YYYY-MM-DD hh:mm:ss
     * 与えられた値がYYYY-MM-DD hh:mm:ss形式であるかどうかを検証します
     * @param value - The value to be validated, 検証する値
     * @returns {boolean} - Whether the value is in the format YYYY-MM-DD hh:mm:ss, 値がYYYY-MM-DD hh:mm:ss形式であるかどうか
     */
    protected isYYYYMMDDhhmiss(value: any) {
        if (typeof value !== 'string') {
            return false;
        }

        const pattern = new RegExp('^\\d{4}-\\d{2}-\\d{2}[ T]\\d{2}:\\d{2}:\\d{2}$');
        return pattern.test(value);
    }

    /**
     * Validates if the given value is in the format YYYY-MM-DD hh:mm
     * 与えられた値がYYYY-MM-DD hh:mm形式であるかどうかを検証します
     * @param value - The value to be validated, 検証する値
     * @returns {boolean} - Whether the value is in the format YYYY-MM-DD hh:mm, 値がYYYY-MM-DD hh:mm形式であるかどうか
     */
    protected isYYYYMMDDhhmi(value: any) {
        if (typeof value !== 'string') {
            return false;
        }

        const pattern = new RegExp('^\\d{4}-\\d{2}-\\d{2}[ T]\\d{2}:\\d{2}$');
        return pattern.test(value);
    }

    /**
     * Validates if the given value is in the format YYYY-MM-DD hh:mm:ss
     * 与えられた値がYYYY-MM-DD hh:mm:ss形式であるかどうかを検証します
     * @param value - The value to be validated, 検証する値
     * @returns {boolean} - Whether the value is in the format YYYY-MM-DD hh:mm:ss, 値がYYYY-MM-DD hh:mm:ss形式であるかどうか
     */
    protected isHHMM(value: any) {
        if (typeof value !== 'string') {
            return false;
        }

        const pattern = new RegExp('^(?:[01]\\d|2[0-3]):[0-5]\\d$');
        return pattern.test(value);
    }

    /**
     * Validates if the given value is in the format HH:MM:SS
     * 与えられた値がHH:MM:SS形式であるかどうかを検証します
     * @param value - The value to be validated, 検証する値
     * @returns {boolean} - Whether the value is in the format HH:MM:SS, 値がHH:MM:SS形式であるかどうか
     */
    protected isHHMMSS(value: any) {
        if (typeof value !== 'string') {
            return false;
        }

        const pattern = new RegExp('^(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d$');
        return pattern.test(value);
    }

    /**
     * Validates if the given value is a number
     * 与えられた値が数値であるかどうかを検証します
     * @param value - The value to be validated, 検証する値
     * @returns {boolean} - Whether the value is a number, 値が数値であるかどうか
     */
    protected isNumber(value: any) {
        switch (typeof value) {
            case 'string':
                if (value == "") {
                    return false;
                }
                return isNaN(Number(value)) == false;
            case 'number':
                return true;
            default:
                return false;
        }
    }

    /**
     * プロパティの型をSwagger形式に変換します
     * Converts the property type to Swagger format
     * @param {string} value - 変換する値, The value to be converted
     * @returns {string} - Swagger形式の値, The value in Swagger format
     */
    protected replaceFromPropertyTypeToSwagger(property: PropertyType): string {
        let propertyType: string = property.type;
        if (property.type === 'enum' || property.type === 'enum?') {
            propertyType = property.enumType;
        } else if (property.type === 'dictionary' || property.type === 'dictionary?') {
            propertyType = property.dictionaryType;
        }
        propertyType = propertyType.replace('?', '');
        propertyType = propertyType.replace('number', 'integer');
        propertyType = propertyType.replace(/datetime|date|time|uuid|mail|https|base64/g, 'string');
        return propertyType;
    }
}