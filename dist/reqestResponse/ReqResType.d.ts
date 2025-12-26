type PrimitiveKeyType = 'boolean' | 'date' | 'datetime' | 'time' | 'uuid' | 'mail' | 'https' | 'base64' | 'boolean?' | 'date?' | 'datetime?' | 'time?' | 'uuid?' | 'mail?' | 'https?' | 'base64?';
export type PrimitiveType = {
    type: PrimitiveKeyType;
    description?: string;
};
export type StringType = {
    type: 'string' | 'string?';
    description?: string;
    maxLength?: number;
    regExp?: RegExp;
};
export type NumberType = {
    type: 'number' | 'number?';
    description?: string;
    max?: number;
    min?: number;
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
    item: PropertyType;
};
export type MapType = {
    type: 'map' | 'map?';
    description?: string;
    mapType: 'string' | 'number' | 'bool';
};
export type EnumType = {
    type: 'enum' | 'enum?';
    description?: string;
    enumType: 'string' | 'number' | 'string?' | 'number?';
    enums: {
        [key: string | number]: string;
    };
};
export type PropertyType = PrimitiveType | StringType | NumberType | ObjectType | ArrayType | EnumType | MapType;
export default class ReqResType {
    protected properties: {
        [key: string]: PropertyType;
    };
    /**
     * Retrieve property type data
     * プロパティ型のデータを取得
     * @param {Array.<string|number>} keys - Path to the property, プロパティへのパス
     * @returns {any} Retrieved property data, 取得されたプロパティデータ
     */
    protected getProperty(keys: Array<string | number>): PropertyType;
    /**
     * Checks if the value is a valid date-time format
     * 値が有効な日付時間形式かどうかを確認します
     * @param value - 検証する値, The value to be validated
     * @returns {boolean} - 値が有効な日付時間形式であるかどうか, Whether the value is a valid date-time format
     */
    protected isErrorDateTime(value: string): boolean;
    /**
     * Validates if the given value is in the format YYYY-MM-DD
     * 与えられた値がYYYY-MM-DD形式であるかどうかを検証します
     * @param value - The value to be validated, 検証する値
     * @returns {boolean} - Whether the value is in the format YYYY-MM-DD, 値がYYYY-MM-DD形式であるかどうか
     */
    protected isYYYYMMDD(value: any): boolean;
    /**
     * Validates if the given value is in the format YYYY-MM-DD hh:mm:ss
     * 与えられた値がYYYY-MM-DD hh:mm:ss形式であるかどうかを検証します
     * @param value - The value to be validated, 検証する値
     * @returns {boolean} - Whether the value is in the format YYYY-MM-DD hh:mm:ss, 値がYYYY-MM-DD hh:mm:ss形式であるかどうか
     */
    protected isYYYYMMDDhhmiss(value: any): boolean;
    /**
     * Validates if the given value is in the format YYYY-MM-DD hh:mm
     * 与えられた値がYYYY-MM-DD hh:mm形式であるかどうかを検証します
     * @param value - The value to be validated, 検証する値
     * @returns {boolean} - Whether the value is in the format YYYY-MM-DD hh:mm, 値がYYYY-MM-DD hh:mm形式であるかどうか
     */
    protected isYYYYMMDDhhmi(value: any): boolean;
    /**
     * Validates if the given value is in the format YYYY-MM-DD hh:mm:ss
     * 与えられた値がYYYY-MM-DD hh:mm:ss形式であるかどうかを検証します
     * @param value - The value to be validated, 検証する値
     * @returns {boolean} - Whether the value is in the format YYYY-MM-DD hh:mm:ss, 値がYYYY-MM-DD hh:mm:ss形式であるかどうか
     */
    protected isHHMM(value: any): boolean;
    /**
     * Validates if the given value is in the format HH:MM:SS
     * 与えられた値がHH:MM:SS形式であるかどうかを検証します
     * @param value - The value to be validated, 検証する値
     * @returns {boolean} - Whether the value is in the format HH:MM:SS, 値がHH:MM:SS形式であるかどうか
     */
    protected isHHMMSS(value: any): boolean;
    /**
     * Validates if the given value is a number
     * 与えられた値が数値であるかどうかを検証します
     * @param value - The value to be validated, 検証する値
     * @returns {boolean} - Whether the value is a number, 値が数値であるかどうか
     */
    protected isNumber(value: any): boolean;
    /**
     * プロパティの型をSwagger形式に変換します
     * Converts the property type to Swagger format
     * @param {string} value - 変換する値, The value to be converted
     * @returns {string} - Swagger形式の値, The value in Swagger format
     */
    protected replaceFromPropertyTypeToSwagger(property: PropertyType): string;
}
export {};
//# sourceMappingURL=ReqResType.d.ts.map