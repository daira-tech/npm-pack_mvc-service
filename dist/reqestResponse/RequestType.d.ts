import { Request } from 'express';
import ReqResType, { EnumType, NumberType, PrimitiveType, StringType } from "./ReqResType";
import { IError } from '../Service';
import { Context } from 'hono';
export interface ErrorMessageType {
    REQUIRED: string;
    UNNECESSARY: string;
    INVALID_OBJECT: string;
    INVALID_ARRAY: string;
    INVALID_NUMBER: string;
    INVALID_NUMBER_MIN: string;
    INVALID_NUMBER_MAX: string;
    INVALID_BOOL: string;
    INVALID_STRING: string;
    INVALID_STRING_MAX_LENGTH: string;
    INVALID_STRING_REG_EXP: string;
    INVALID_UUID: string;
    INVALID_MAIL: string;
    INVALID_HTTPS: string;
    INVALID_DATE: string;
    INVALID_TIME: string;
    INVALID_DATETIME: string;
    INVALID_BASE64: string;
    INVALID_ENUM: string;
    INVALID_MAP_NUMBER: string;
    INVALID_MAP_STRING: string;
    INVALID_MAP_BOOL: string;
}
export declare class RequestType extends ReqResType {
    protected readonly language: "ja" | "en";
    private readonly ERROR_MESSAGE_ENGLISH;
    private readonly ERROR_MESSAGE_JAPAN;
    protected readonly ERROR_MESSAGE: ErrorMessageType;
    protected paramProperties: Array<(PrimitiveType | StringType | NumberType | EnumType) & {
        key: string;
    }>;
    get paramPath(): string;
    private params?;
    get Params(): {
        [key: string]: any;
    };
    private data?;
    get Data(): {
        [key: string]: any;
    };
    setRequest(module: 'express' | 'hono', request: Request | Context): Promise<void>;
    private createErrorMessage;
    /**
     * Generates an error message based on the provided code, keys, and value.
     * 指定されたコード、キー、および値に基づいてエラーメッセージを生成します。
     * @param {string} code - The error code. エラーコード
     * @param {Array<string | number>} keys - The keys indicating the property path. プロパティパスを示すキー
     * @param {any} value - The value that caused the error. エラーを引き起こした値
     * @returns {string} The generated error message. 生成されたエラーメッセージ
     */
    private throwInputError;
    /**
     * Sets the values of the request body to the class properties.
     * リクエストボディの値をクラスのプロパティにセットします。
     *
     * Note: This method is implemented as a separate method rather than in the constructor.
     * This is because if executed in the constructor, the properties of the inheriting class
     * are not yet initialized, and the values cannot be set correctly.
     * 注意: このメソッドはコンストラクタではなく別メソッドとして実装されています。
     * これは、コンストラクタ内で実行すると継承先のクラスのプロパティが
     * まだ初期化されていないため、正しく値をセットできないためです。
     *
     * @param {Object} body - Request body object, リクエストボディオブジェクト
     * @throws {InputErrorException} Thrown when the input value is invalid, 入力値が不正な場合にスローされます
     */
    private createBody;
    /**
     * Sets the value for an enum type based on the specified keys.
     * 指定されたキーに基づいて列挙型の値を設定します。
     * @param {Array<string | number>} keys - Path to the target (array of strings or index numbers)
     * 処理対象のパス（文字列またはインデックス番号の配列）
     * @param {any} value - Value to be set
     * 設定する値
     * @throws {InputErrorException} Thrown when the type does not match
     * 型が一致しない場合にスローされます
     */
    private setEnum;
    /**
     * Recursively processes array type values.
     * Validates each element of the array and converts it to the appropriate type.
     * 配列型の値を再帰的に処理します。
     * 配列の各要素を検証し、適切な型に変換します。
     *
     * @param {Array<string | number>} keys - Current processing path (array of strings or index numbers)
     * 現在の処理パス（文字列またはインデックス番号の配列）
     * @param {any[]} values - Array to be processed
     * 処理対象の配列
     * @throws {InputErrorException} Thrown when the type of an array element is invalid
     * 配列要素の型が不正な場合にスローされます
     */
    private setArray;
    /**
     * Set the value of the request body to the specified path.
     * Automatically create intermediate objects or arrays as needed.
     * リクエストボディの値を指定されたパスに設定します。
     * 必要に応じて中間のオブジェクトや配列を自動的に作成します。
     * @param {Array<string | number>} keys - Path to the destination (array of strings or index numbers)
     * 設定先へのパス（文字列またはインデックス番号の配列）
     * @param {any} value - Value to be set
     * 設定する値
     */
    private changeBody;
    /**
     * Process object type values recursively.
     * Validate object properties and convert them to appropriate types.
     * オブジェクト型の値を再帰的に処理します。
     * オブジェクトのプロパティを検証し、適切な型に変換します。
     * @param {Array<string | number>} keys - Current processing path (array of strings or index numbers)
     * 現在の処理パス（文字列またはインデックス番号の配列）
     * @param {object} values - Object to be processed
     * 処理対象のオブジェクト
     * @throws {InputErrorException} Thrown when the property type is invalid
     * プロパティの型が不正な場合にスローされます
     */
    private setObject;
    /**
     * Convert the input value based on the specified type.
     * Throws an exception if type conversion fails.
     * 指定された型に基づいて入力値を変換します。
     * 型変換に失敗した場合は例外をスローします。
     *
     * @param {string} property - The type to convert to (e.g., 'number', 'boolean', 'string', 'date', 'time', 'datetime')
     *                        変換する型（例: 'number', 'boolean', 'string', 'date', 'time', 'datetime'）
     * @param {any} value - The value to convert
     *                      変換する値
     * @param {Array<string | number>} keys - The path to the target (array of strings or index numbers)
     *                                        処理対象のパス（文字列またはインデックス番号の配列）
     * @returns {any} The converted value, 変換された値
     * @throws {InputErrorException} Thrown if type conversion fails, 型変換に失敗した場合にスローされます
     */
    private convertValue;
    /**
     * Convert the input value to the specified type.
     * Throws an exception if type conversion fails.
     * 入力値を指定された型に変換します。
     * 型変換に失敗した場合は例外をスローします。
     * @param {Array<string | number>} keys - Path to the target (array of strings or index numbers)
     * 処理対象のパス（文字列またはインデックス番号の配列）
     * @param {any} value - Value to be converted
     * 変換する値
     * @throws {InputErrorException} Thrown when type conversion fails
     * 型変換に失敗した場合にスローされます
     */
    private convertInput;
    /**
     * Generates a Swagger YAML definition from the request body.
     * リクエストボディからSwaggerのYAML定義を生成します。
     * @returns {string} Swagger format YAML definition
     * Swagger形式のYAML定義
     */
    createSwagger(method: string): string;
    /**
     * Generates Swagger properties from object type properties
     * オブジェクト型のプロパティからSwaggerのプロパティを生成
     * @param {Array.<string|number>} keys - Path to the properties
     * プロパティへのパス
     * @returns {string} Swagger format property definition
     * Swagger形式のプロパティ定義
     */
    private makeSwaggerProperyFromObject;
    /**
     * Generates Swagger properties from array type properties
     * 配列型のプロパティからSwaggerのプロパティを生成
     * @param {Array.<string|number>} keys - Path to the properties
     * プロパティへのパス
     * @returns {string} Swagger format property definition
     * Swagger形式のプロパティ定義
     */
    private makeSwaggerPropertyFromArray;
    getInputErrorList(method: string): Array<IError>;
    private getErrorObject;
    private getErrorArray;
    private getError;
}
export interface IncomingHttpHeaders extends NodeJS.Dict<string | string[]> {
    accept?: string | undefined;
    "accept-language"?: string | undefined;
    "accept-patch"?: string | undefined;
    "accept-ranges"?: string | undefined;
    "access-control-allow-credentials"?: string | undefined;
    "access-control-allow-headers"?: string | undefined;
    "access-control-allow-methods"?: string | undefined;
    "access-control-allow-origin"?: string | undefined;
    "access-control-expose-headers"?: string | undefined;
    "access-control-max-age"?: string | undefined;
    "access-control-request-headers"?: string | undefined;
    "access-control-request-method"?: string | undefined;
    age?: string | undefined;
    allow?: string | undefined;
    "alt-svc"?: string | undefined;
    authorization?: string | undefined;
    "cache-control"?: string | undefined;
    connection?: string | undefined;
    "content-disposition"?: string | undefined;
    "content-encoding"?: string | undefined;
    "content-language"?: string | undefined;
    "content-length"?: string | undefined;
    "content-location"?: string | undefined;
    "content-range"?: string | undefined;
    "content-type"?: string | undefined;
    cookie?: string | undefined;
    date?: string | undefined;
    etag?: string | undefined;
    expect?: string | undefined;
    expires?: string | undefined;
    forwarded?: string | undefined;
    from?: string | undefined;
    host?: string | undefined;
    "if-match"?: string | undefined;
    "if-modified-since"?: string | undefined;
    "if-none-match"?: string | undefined;
    "if-unmodified-since"?: string | undefined;
    "last-modified"?: string | undefined;
    location?: string | undefined;
    origin?: string | undefined;
    pragma?: string | undefined;
    "proxy-authenticate"?: string | undefined;
    "proxy-authorization"?: string | undefined;
    "public-key-pins"?: string | undefined;
    range?: string | undefined;
    referer?: string | undefined;
    "retry-after"?: string | undefined;
    "sec-websocket-accept"?: string | undefined;
    "sec-websocket-extensions"?: string | undefined;
    "sec-websocket-key"?: string | undefined;
    "sec-websocket-protocol"?: string | undefined;
    "sec-websocket-version"?: string | undefined;
    "set-cookie"?: string[] | undefined;
    "strict-transport-security"?: string | undefined;
    tk?: string | undefined;
    trailer?: string | undefined;
    "transfer-encoding"?: string | undefined;
    upgrade?: string | undefined;
    "user-agent"?: string | undefined;
    vary?: string | undefined;
    via?: string | undefined;
    warning?: string | undefined;
    "www-authenticate"?: string | undefined;
}
//# sourceMappingURL=RequestType.d.ts.map