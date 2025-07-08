import { TColumnArrayType, TColumnType } from "../Type"

export type TOptionErrorMessage = Record<TColumnType | TColumnArrayType | 'length' | 'null' | 'notInput' | 'fk' | 'find', string>;

export default class MessageUtil {
    public static readonly optionErrorMessageEnglish: TOptionErrorMessage = {
        'string': '{name} should be entered as a string or number type.',
        'string[]': '{name} should be entered as an array of string or number types.',
        'uuid': '{name} should be entered as a UUID.',
        'uuid[]': '{name} should be entered as an array of UUIDs.',
        'integer': '{name} should be entered as a number.',
        'integer[]': '{name} should be entered as an array of numbers.',
        'real': '{name} should be entered as a number.',
        'real[]': '{name} should be entered as an array of numbers.',
        'bool': '{name} should be entered as a bool type, "true", "false", 0, or 1.',
        'bool[]': '{name} should be entered as an array of bool types, "true", "false", 0, or 1.',
        'date': '{name} should be entered in "YYYY-MM-DD" or "YYYY-MM-DD hh:mi:ss" format or as a Date type.',
        'date[]': '{name} should be entered as an array of dates in "YYYY-MM-DD" or "YYYY-MM-DD hh:mi:ss" format or as Date types.',
        'time': '{name} should be entered in "hh:mi" format or "hh:mi:ss" format.',
        'time[]': '{name} should be entered as an array of times in "hh:mi" format or "hh:mi:ss" format.',
        'timestamp': '{name} should be entered in "YYYY-MM-DD" format, "YYYY-MM-DD hh:mi:ss" format, "YYYY-MM-DDThh:mi:ss" format, or as a Date type.',
        'timestamp[]': '{name} should be entered as an array of timestamps in "YYYY-MM-DD" format, "YYYY-MM-DD hh:mi:ss" format, "YYYY-MM-DDThh:mi:ss" format, or as Date types.',
        'json': '{name} should be entered as an Object or JSON string.',
        'json[]': '{name} should be entered as an array of Objects or JSON strings.',
        'jsonb': '{name} should be entered as an Object or JSON string.',
        'jsonb[]': '{name} should be entered as an array of Objects or JSON strings.',
        'length': '{name} should be entered within {length} characters.',
        'null': '{name} is not allowed to be null.',
        'notInput': 'Please enter {name}.',
        'fk': 'The value of {name} does not exist in the table.',
        'find': 'The specified data does not exist in the table. ({pks})'
    }
    public static readonly optionErrorMessageJapan: TOptionErrorMessage = {
        'string': '{name}はstringかnumberで入力してください。',
        'string[]': '{name}はstringかnumberの配列で入力してください。',
        'uuid': '{name}はuuidで入力してください。',
        'uuid[]': '{name}はuuidの配列で入力してください。',
        'integer': '{name}はnumberか半角数字のstring型で入力してください。',
        'integer[]': '{name}はnumberか半角数字のstring型の配列で入力してください。',
        'real': '{name}はnumberか半角数字のstring型で入力してください。',
        'real[]': '{name}はnumberか半角数字のstring型の配列で入力してください。',
        'bool': '{name}はbool型、"true"、"false"、0、または1で入力してください。',
        'bool[]': '{name}はbool型、"true"、"false"、0、または1の配列で入力してください。',
        'date': '{name}は"YYYY-MM-DD"形式、"YYYY-MM-DD hh:mi:ss"形式、またはDate型で入力してください。',
        'date[]': '{name}は"YYYY-MM-DD"形式、"YYYY-MM-DD hh:mi:ss"形式、またはDate型の配列で入力してください。',
        'time': '{name}は"hh:mi"形式または"hh:mi:ss"形式で入力してください。',
        'time[]': '{name}は"hh:mi"形式または"hh:mi:ss"形式の配列で入力してください。',
        'timestamp': '{name}は"YYYY-MM-DD"形式、"YYYY-MM-DD hh:mi:ss"形式、"YYYY-MM-DDThh:mi:ss"形式、またはDate型で入力してください。',
        'timestamp[]': '{name}は"YYYY-MM-DD"形式、"YYYY-MM-DD hh:mi:ss"形式、"YYYY-MM-DDThh:mi:ss"形式、またはDate型の配列で入力してください。',
        'json': '{name}はObject形またはJSON文字列で入力してください。',
        'json[]': '{name}はObject形またはJSON文字列の配列で入力してください。',
        'jsonb': '{name}はObject形またはJSON文字列で入力してください。',
        'jsonb[]': '{name}はObject形またはJSON文字列の配列で入力してください。',
        'length': '{name}は{length}文字以内で入力してください。',
        'null': '{name}はnullを許可されていません。',
        'notInput': '{name}を入力してください。',
        'fk': '{name}の値がテーブルに存在しません。',
        'find': '指定されたデータはテーブルに存在しません。({pks})'
    }
}