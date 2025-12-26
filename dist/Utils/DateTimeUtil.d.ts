export default class DateTimeUtil {
    /**
     * Checks if the value is a valid date-time format
     * 値が有効な日付時間形式かどうかを確認します
     * @param value - 検証する値, The value to be validated
     * @returns {boolean} - 値が有効な日付時間形式であるかどうか, Whether the value is a valid date-time format
     */
    private static isErrorDateTime;
    /**
     * Generates a Date object from a string.
     * 文字列からDateオブジェクトを生成します。
     * @param dateString A string representing the date and time (e.g., "2023-10-05 14:30:00")
     * 日付と時間を表す文字列（例: "2023-10-05 14:30:00"）
     * @returns Date object
     * Dateオブジェクト
     */
    static toDateFromString(dateString: string): Date;
    /**
     * Formats the specified date.
     * 指定された日付をフォーマットします。
     * @param date The date object to be formatted.
     * フォーマットする対象の日付オブジェクト
     * @param type A string specifying the type of format.
     * フォーマットの種類を指定する文字列
     * @returns A formatted date string.
     * フォーマットされた日付文字列
     */
    static toStringFromDate(date: Date, type: 'datetime' | 'date' | 'time'): string;
    /**
     * Validates if the given value is in the format YYYY-MM-DD
     * 与えられた値がYYYY-MM-DD形式であるかどうかを検証します
     * @param value - The value to be validated, 検証する値
     * @returns {boolean} - Whether the value is in the format YYYY-MM-DD, 値がYYYY-MM-DD形式であるかどうか
     */
    static isYYYYMMDD(value: any): boolean;
    /**
     * Validates if the given value is in the format YYYY-MM-DD hh:mm:ss
     * 与えられた値がYYYY-MM-DD hh:mm:ss形式であるかどうかを検証します
     * @param value - The value to be validated, 検証する値
     * @returns {boolean} - Whether the value is in the format YYYY-MM-DD hh:mm:ss, 値がYYYY-MM-DD hh:mm:ss形式であるかどうか
     */
    static isYYYYMMDDhhmiss(value: any): boolean;
    /**
     * Validates if the given value is in the format YYYY-MM-DD hh:mm:ss
     * 与えられた値がYYYY-MM-DD hh:mm:ss形式であるかどうかを検証します
     * @param value - The value to be validated, 検証する値
     * @returns {boolean} - Whether the value is in the format YYYY-MM-DD hh:mm:ss, 値がYYYY-MM-DD hh:mm:ss形式であるかどうか
     */
    static isHHMM(value: any): boolean;
    /**
     * Validates if the given value is in the format HH:MM:SS
     * 与えられた値がHH:MM:SS形式であるかどうかを検証します
     * @param value - The value to be validated, 検証する値
     * @returns {boolean} - Whether the value is in the format HH:MM:SS, 値がHH:MM:SS形式であるかどうか
     */
    static isHHMMSS(value: any): boolean;
}
//# sourceMappingURL=DateTimeUtil.d.ts.map