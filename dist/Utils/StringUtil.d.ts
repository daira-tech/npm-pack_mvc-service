export default class StringUtil {
    /**
     * Validates if the given value is a valid UUID
     * 与えられた値が有効なUUIDであるかどうかを検証します
     * @param value - The value to be validated, 検証する値
     * @returns {boolean} - Whether the value is a valid UUID, 値が有効なUUIDであるかどうか
     */
    static isUUID(value: any): boolean;
    /**
     * 小文字スネークからキャピタルケースに変換
     * @param {string} value スネーク文字列
     * @returns キャピタル文字列
     */
    static formatFromSnakeToCamel(value: string): string;
}
//# sourceMappingURL=StringUtil.d.ts.map