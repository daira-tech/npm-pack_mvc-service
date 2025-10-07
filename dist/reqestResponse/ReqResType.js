"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ReqResType {
    constructor() {
        this.properties = {};
    }
    /**
     * Retrieve the property definition corresponding to the specified key path.
     * 指定されたキーパスに対応するプロパティ定義を取得します。
     * @param {Array<string | number>} keys - Access path to the property (array of strings or index numbers)
     * プロパティへのアクセスパス（文字列またはインデックス番号の配列）
     * @returns {BaseType} Property definition object
     * プロパティ定義オブジェクト
     */
    // protected getProperty(keys: Array<string | number>) {
    //     let property: any = this.properties;
    //     for (let i = 0;i < keys.length;i++) {
    //         const key = keys[i];
    //         if (typeof key === 'number') {
    //             property = property.properties;
    //             continue;
    //         }
    //         if (i === 0) {
    //             property = property[key];
    //         } else {
    //             property = property.properties[key];
    //         }
    //     }
    //     return property;
    // }
    /**
     * Retrieve property type data
     * プロパティ型のデータを取得
     * @param {Array.<string|number>} keys - Path to the property, プロパティへのパス
     * @returns {any} Retrieved property data, 取得されたプロパティデータ
     */
    getProperty(keys) {
        if (keys.length === 0) {
            throw new Error(`getPropertyメソッドでは1以上のkeysからしか入力を受け付けない。`);
        }
        const firstKey = keys[0];
        let property = this.properties[firstKey];
        for (let i = 1; i < keys.length; i++) {
            const key = keys[i];
            if (typeof key === 'number') {
                if (property.type === 'array' || property.type === 'array?') {
                    property = property.item;
                    continue;
                }
                else {
                    throw new Error(`getPropertyでnumber型のINPUTにも関わらず、array以外のtypeの場合のエラー\nキー一覧：${keys.join(',')} エラーキー：${key}`);
                }
            }
            switch (property.type) {
                case 'array':
                case 'array?':
                    if (typeof key !== 'number') {
                        throw new Error(`getPropertyでnumber型のINPUTで、array以外の場合はエラー\nキー一覧：${keys.join(',')} エラーキー：${key}`);
                    }
                    property = property.item;
                    continue;
                case 'object':
                case 'object?':
                    if (typeof key !== 'string') {
                        throw new Error(`getPropertyでnumber型のINPUTで、arrayの場合はエラー\nキー一覧：${keys.join(',')} エラーキー：${key}`);
                    }
                    property = property.properties[key];
                    continue;
                default:
                    throw new Error(`getPropertyでarray,object以外のtypeを読み込もうとしている。\nキー一覧：${keys.join(',')} エラーキー：${key}`);
                // property = property[key];
                // continue;
            }
        }
        return property;
    }
    /**
     * Checks if the value is a valid date-time format
     * 値が有効な日付時間形式かどうかを確認します
     * @param value - 検証する値, The value to be validated
     * @returns {boolean} - 値が有効な日付時間形式であるかどうか, Whether the value is a valid date-time format
     */
    isErrorDateTime(value) {
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
                sec !== date.getSeconds();
        }
        catch (error) {
            return true;
        }
    }
    /**
     * Validates if the given value is in the format YYYY-MM-DD
     * 与えられた値がYYYY-MM-DD形式であるかどうかを検証します
     * @param value - The value to be validated, 検証する値
     * @returns {boolean} - Whether the value is in the format YYYY-MM-DD, 値がYYYY-MM-DD形式であるかどうか
     */
    isYYYYMMDD(value) {
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
    isYYYYMMDDhhmiss(value) {
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
    isYYYYMMDDhhmi(value) {
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
    isHHMM(value) {
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
    isHHMMSS(value) {
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
    isNumber(value) {
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
    replaceFromPropertyTypeToSwagger(property) {
        let propertyType = property.type;
        if (property.type === 'enum' || property.type === 'enum?') {
            propertyType = property.enumType;
        }
        else if (property.type === 'map' || property.type === 'map?') {
            propertyType = property.mapType;
        }
        propertyType = propertyType.replace('?', '');
        propertyType = propertyType.replace('number', 'integer');
        propertyType = propertyType.replace(/datetime|date|time|uuid|mail|https|base64/g, 'string');
        return propertyType;
    }
}
exports.default = ReqResType;
