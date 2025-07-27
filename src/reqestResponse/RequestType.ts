import { Request } from 'express';
import ReqResType, { EnumType, PrimitiveType, PropertyType } from "./ReqResType";
import { InputErrorException } from '../exceptions/Exception';
import StringUtil from '../Utils/StringUtil';
import { ValidateStringUtil } from 'type-utils-n-daira';

// エラーメッセージの型定義
export interface ErrorMessageType {
    REQUIRED: string;
    UNNECESSARY: string;
    INVALID_OBJECT: string;
    INVALID_ARRAY: string;
    INVALID_NUMBER: string;
    INVALID_BOOL: string;
    INVALID_STRING: string;
    INVALID_UUID: string;
    INVALID_MAIL: string;
    INVALID_HTTPS: string;
    INVALID_DATE: string;
    INVALID_TIME: string;
    INVALID_DATETIME: string;
    INVALID_BASE64: string;
    INVALID_ENUM: string;
}

export class RequestType extends ReqResType {

    // *****************************************
    // Input Error Message
    // Please make changes to error messages in the subclass
    // エラー文言
    // エラーメッセージの変更はサブクラスで行ってください
    // *****************************************
    private readonly ERROR_MESSAGE_ENGLISH: ErrorMessageType = {
        REQUIRED: '{property} is required.',
        UNNECESSARY: '{property} is unnecessary input. ',
        INVALID_OBJECT: '{property} must be of type Object. ({value})',
        INVALID_ARRAY: '{property} must be of type Array. ({value})',
        INVALID_NUMBER: '{property} must be of type number. ({value})',
        INVALID_BOOL: '{property} must be of type bool or a string with true, false, or a number with 0, 1. ({value})',
        INVALID_STRING: '{property} must be of type string. ({value})',
        INVALID_UUID: '{property} must be a UUID. ({value})',
        INVALID_MAIL: '{property} must be an email. ({value})',
        INVALID_HTTPS: '{property} must be an https or http URL. ({value})',
        INVALID_DATE: '{property} must be a string in "YYYY-MM-DD" format and a valid date. ({value})',
        INVALID_TIME: '{property} must be a string in "hh:mi" format and a valid time. ({value})',
        INVALID_DATETIME: '{property} must be a string in "YYYY-MM-DD hh:mi:ss" or "YYYY-MM-DDThh:mi:ss" format and a valid date and time. ({value})',
        INVALID_BASE64: '{property} must be in Base64 format. ({value})',
        INVALID_ENUM: '{property} must be in {enums}. ({value})'
    }
    private readonly ERROR_MESSAGE_JAPAN: ErrorMessageType = {
        REQUIRED: '{property}は必須項目です。',
        UNNECESSARY: '{property}は不要な入力です。',
        INVALID_OBJECT: '{property}はobject型で入力してください。（{value}）',
        INVALID_ARRAY: '{property}はarray型で入力してください。（{value}）',
        INVALID_NUMBER: '{property}はnumber型または半角数値のstring型で入力してください。（{value}）',
        INVALID_BOOL: '{property}はboolean型またはtrue、falseのstring型または0、1のnumber型で入力してください。（{value}）',
        INVALID_STRING: '{property}はstring型で入力してください。（{value}）',
        INVALID_UUID: '{property}はUUID形式のstring型で入力してください。（{value}）',
        INVALID_MAIL: '{property}はメールアドレス形式のstring型で入力してください。（{value}）',
        INVALID_HTTPS: '{property}はhttpsまたはhttpのURL形式のstring型で入力してください。（{value}）',
        INVALID_DATE: '{property}は"YYYY-MM-DD"形式のstring型で入力してください。（{value}）',
        INVALID_TIME: '{property}は"hh:mi"形式のstring型で入力してください。（{value}）',
        INVALID_DATETIME: '{property}は"YYYY-MM-DD hh:mi:ss"または"YYYY-MM-DDThh:mi:ss"形式のstring型で入力してください。（{value}）',
        INVALID_BASE64: '{property}はBase64形式のstring型で入力してください。（{value}）',
        INVALID_ENUM: '{property}は{enums}のいずれかの値で入力してください。（{value}）'
    }
    protected readonly ERROR_MESSAGE: ErrorMessageType = process.env.TZ === 'Asia/Tokyo' ? this.ERROR_MESSAGE_JAPAN : this.ERROR_MESSAGE_ENGLISH;

    protected paramProperties: Array<(PrimitiveType | EnumType) & { key: string }> = []
    get paramPath(): string {
        return this.paramProperties.map(property => `/{${property.key}}`).join("");
    }

    private params?: {[key: string]: any};
    get Params():  {[key: string]: any} {
        if (this.params === undefined) {
            throw new Error("Request data must be set using setRequest method before accessing Req.");
        }
        return this.params ?? {};
    }
    private data?: {[key: string]: any};
    get Data(): {[key: string]: any} {
        if (this.data === undefined) {
            throw new Error("Request data must be set using setRequest method before accessing Req.");
        }
        return this.data ?? {};
    }
    private headers?: IncomingHttpHeaders;
    get Headers(): IncomingHttpHeaders { 
        if (this.headers === undefined) {
            throw new Error("Request data must be set using setRequest method before accessing Req.");
        }
        return this.headers;
    }
    private remoteAddress: string | undefined;
    get RemoteAddress(): string | undefined { return this.remoteAddress; }
    get Authorization(): string | null { 
        const authorization = this.Headers['authorization'] ?? '';
        if (authorization.startsWith('Bearer ') === false) {
            return null;
        }
        return authorization.replace(/^Bearer\s/, '');
    }

    public setRequest(request: Request) {
        this.createBody(request);

        this.params = {};
        if (request.params !== undefined) {
            for (const [key, value] of Object.entries(request.params)) {
                const index = this.paramProperties.findIndex(property => property.key === key);
                if (index === -1) {
                    throw new Error(`${key} is not set in paramProperties.`);                  
                }
                const property = this.paramProperties[index];
                this.params[key] = this.convertValue(property.type, value, [key, `(pathIndex: ${index})`], false);
            }
        }
        this.params = request.params ?? {};
        this.headers = request.headers ?? {};

        this.remoteAddress = request.socket?.remoteAddress;
    }

    /**
     * Generates an error message based on the provided code, keys, and value.
     * 指定されたコード、キー、および値に基づいてエラーメッセージを生成します。
     * @param {string} code - The error code. エラーコード
     * @param {Array<string | number>} keys - The keys indicating the property path. プロパティパスを示すキー
     * @param {any} value - The value that caused the error. エラーを引き起こした値
     * @returns {string} The generated error message. 生成されたエラーメッセージ
     */ 
    private throwInputError(code: 
        "REQUIRE_00" | "REQUIRE_01" | "OBJECT_01" | "ARRAY_01" | "UNNECESSARY_01" | 
        "REQUIRE_11" | "OBJECT_11" | "ARRAY_11" | "UNNECESSARY_11" |
        "NUMBER_21" | "BOOL_21" | "BOOL_22" | "BOOL_23" | "STRING_21" | "UUID_21" | "MAIL_21" | "DATE_21" | "DATE_22" |
        "TIME_21" | "DATETIME_21" | "DATETIME_22" | "HTTPS_21" | "BASE64_21" | 
        "REQUIRE_31" | 
        "ENUM_41" | "ENUM_42" | "NUMBER_41" | "STRING_41" |
        "NUMBER_91" | "BOOL_91" | "BOOL_92" | "BOOL_93" | "STRING_91" | "UUID_91" | "MAIL_91" | "DATE_91" | "DATE_92" |
        "TIME_91" | "DATETIME_91" | "DATETIME_92" | "HTTPS_91" | "BASE64_91"
        , keys: Array<string | number>, value: any): never {
        const list = {
            "REQUIRE_00": this.ERROR_MESSAGE.REQUIRED,
            "REQUIRE_01": this.ERROR_MESSAGE.REQUIRED,
            "OBJECT_01": this.ERROR_MESSAGE.INVALID_OBJECT,
            "ARRAY_01": this.ERROR_MESSAGE.INVALID_ARRAY,
            "UNNECESSARY_01": this.ERROR_MESSAGE.UNNECESSARY,
            "REQUIRE_11": this.ERROR_MESSAGE.REQUIRED,
            "OBJECT_11": this.ERROR_MESSAGE.INVALID_OBJECT,
            "ARRAY_11": this.ERROR_MESSAGE.INVALID_ARRAY,
            "UNNECESSARY_11": this.ERROR_MESSAGE.UNNECESSARY,
            "NUMBER_21": this.ERROR_MESSAGE.INVALID_NUMBER,
            "BOOL_21": this.ERROR_MESSAGE.INVALID_BOOL,
            "BOOL_22": this.ERROR_MESSAGE.INVALID_BOOL,
            "BOOL_23": this.ERROR_MESSAGE.INVALID_BOOL,
            "STRING_21": this.ERROR_MESSAGE.INVALID_STRING,
            "UUID_21": this.ERROR_MESSAGE.INVALID_UUID,
            "MAIL_21": this.ERROR_MESSAGE.INVALID_MAIL,
            "DATE_21": this.ERROR_MESSAGE.INVALID_DATE,
            "DATE_22": this.ERROR_MESSAGE.INVALID_DATE,
            "TIME_21": this.ERROR_MESSAGE.INVALID_TIME,
            "DATETIME_21": this.ERROR_MESSAGE.INVALID_DATETIME,
            "DATETIME_22": this.ERROR_MESSAGE.INVALID_DATETIME,
            "HTTPS_21": this.ERROR_MESSAGE.INVALID_HTTPS,
            "BASE64_21": this.ERROR_MESSAGE.INVALID_BASE64,
            "REQUIRE_31": this.ERROR_MESSAGE.REQUIRED,
            "NUMBER_41": this.ERROR_MESSAGE.INVALID_NUMBER,
            "STRING_41": this.ERROR_MESSAGE.INVALID_STRING,
            "ENUM_41": this.ERROR_MESSAGE.INVALID_ENUM,
            "ENUM_42": this.ERROR_MESSAGE.INVALID_ENUM,
            "NUMBER_91": this.ERROR_MESSAGE.INVALID_NUMBER,
            "BOOL_91": this.ERROR_MESSAGE.INVALID_BOOL,
            "BOOL_92": this.ERROR_MESSAGE.INVALID_BOOL,
            "BOOL_93": this.ERROR_MESSAGE.INVALID_BOOL,
            "STRING_91": this.ERROR_MESSAGE.INVALID_STRING,
            "UUID_91": this.ERROR_MESSAGE.INVALID_UUID,
            "MAIL_91": this.ERROR_MESSAGE.INVALID_MAIL,
            "DATE_91": this.ERROR_MESSAGE.INVALID_DATE,
            "DATE_92": this.ERROR_MESSAGE.INVALID_DATE,
            "TIME_91": this.ERROR_MESSAGE.INVALID_TIME,
            "DATETIME_91": this.ERROR_MESSAGE.INVALID_DATETIME,
            "DATETIME_92": this.ERROR_MESSAGE.INVALID_DATETIME,
            "HTTPS_91": this.ERROR_MESSAGE.INVALID_HTTPS,
            "BASE64_91": this.ERROR_MESSAGE.INVALID_BASE64,
        }

        let errorMessage =  list[code];
        if (code === "ENUM_41" || code === "ENUM_42") {
            const property = this.getProperty(keys);
            errorMessage = errorMessage.replace('{enums}', Object.keys(property.enums).join(','));
        }

        errorMessage = errorMessage.replace("{property}", keys.join('.')).replace("{value}", value);

        throw new InputErrorException(code, errorMessage);
    }

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
    private createBody(request: Request) {
        if (request.method === 'GET' || request.method === 'DELETE') {
            this.data = request.query;
        } else {
            this.data = request.body;
        }

        if (this.data === undefined) {
            // ここは基本通ることはないと思いますが...
            throw new Error(`リクエストBodyがundefinedです。`);
        }

        for (const key of Object.keys(this.properties)) {

            // NULLチェック
            if (key in this.data === false || this.data[key] === null || this.data[key] === "") {
                if (this.properties[key].type === 'array' && ['GET', 'DELETE'].includes(request.method)) {
                    // GET,DELETEメソッドの場合、?array=1&array=2で配列となるが、
                    // ?array=1のみで終わる場合は配列にならないため、直接配列にしている
                    // この処理で空文字やnullが入った場合の対処をここで行う
                    const itemProperty = this.properties[key].properties;
                    if (itemProperty.type.endsWith('?')) {
                        const tempValue = this.data[key];
                        this.data[key] = [];
                        if (tempValue !== undefined) {
                            if (itemProperty.type === 'string?') {
                                this.data[key][0] = tempValue;
                            } else {
                                this.data[key][0] = null;
                            }
                        }
                        continue;
                    } else {
                        this.throwInputError("REQUIRE_00", [key, 0], "");
                    }
                } else {
                    if (this.properties[key].type.endsWith('?')) {
                        this.changeBody([key], null);
                        continue;
                    } else {
                        this.throwInputError("REQUIRE_01", [key], "");
                    }
                }
            }

            const value = this.data[key];
            switch (this.properties[key].type) {
                case 'object':
                case 'object?':
                    if (typeof value === 'object') {
                        this.setObject([key], value);
                    } else {
                        this.throwInputError("OBJECT_01", [key], value);
                    }
                    break;
                case 'array':
                case 'array?':
                    if (Array.isArray(value)) {
                        this.setArray([key], value);
                    } else {
                        if (request.method === 'GET' || request.method === 'DELETE') {
                            // GET,DELETEメソッドの場合、?array=1&array=2で配列となるが、
                            // ?array=1のみで終わる場合は配列にならないため、直接配列にしている
                            this.data[key] = [this.convertValue(this.properties[key].properties.type, value, [key, 0], true)];
                        } else {
                            this.throwInputError("ARRAY_01", [key], value);
                        }
                    }
                    break;
                case 'enum':
                case 'enum?':
                    this.setEnum([key], value);
                    break;
                default:
                    this.convertInput([key], value);
                    break;
            }
        }

        // 不要項目チェック
        for (const [key, value] of Object.entries(this.data)) {
            if (key in this.properties === false) {
                this.throwInputError("UNNECESSARY_01", [key], value);
            }
        }
    }

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
    private setEnum(keys: Array<string | number>, value: any) {
        const property = this.getProperty(keys);

        const enumType = property.enumType;
        if (value === undefined || value === null || (typeof value === 'string' && value === '')) {
            if (enumType.endsWith('?')) {
                this.changeBody(keys, null);
            } else {
                this.throwInputError("ENUM_41", keys, value);
            }
        }

        switch (enumType) {
            case 'number':
            case 'number?':
                if (this.isNumber(value) === false) {
                    this.throwInputError("NUMBER_41", keys, value);
                }
                value = Number(value);
                break;
            case 'string':
            case 'string?':
                switch (typeof value) {
                    case 'number':
                        value = value.toString();
                        break;
                    case 'string':
                        value = value;
                        break;
                    default:
                        this.throwInputError("STRING_41", keys, value);
                }
                break;
        }

        if (Object.keys(property.enums).includes(value.toString()) === false) {
            this.throwInputError("ENUM_42", keys, value);
        }

        this.changeBody(keys, value);
    }

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
    private setArray(keys: Array<string | number>, values: any) {
        const property = this.getProperty(keys);
        for (let i = 0;i < values.length; i++) {

            // NULL Check
            if (values[i] === undefined || values[i] === null || (property.properties.type.replace("?", "") !== "string" && values[i] === "")) {
                if (property.properties.type.endsWith('?')) {
                    this.changeBody([...keys, i], values[i] === undefined ? undefined : null);
                    continue;
                } else {
                    this.throwInputError("REQUIRE_31", [...keys, i], "");
                }
            }

            switch (property.properties.type) {
                case 'object':
                case 'object?':
                    this.setObject([...keys, i], values[i]);
                    break;
                case 'array':
                case 'array?':
                    this.setArray([...keys, i], values[i]);
                    break;
                case 'enum':
                case 'enum?':
                    for (const value of values) {
                        this.setEnum([...keys, i], value);
                    }
                    break;
                default:
                    this.convertInput([...keys, i], values[i]);
                    break;
            }
        }
    }

    /**
     * Retrieve the property definition corresponding to the specified key path.
     * 指定されたキーパスに対応するプロパティ定義を取得します。
     * @param {Array<string | number>} keys - Access path to the property (array of strings or index numbers)
     * プロパティへのアクセスパス（文字列またはインデックス番号の配列）
     * @returns {BaseType} Property definition object
     * プロパティ定義オブジェクト
     */
    private getProperty(keys: Array<string | number>) {
        let property: any = this.properties;
        for (let i = 0;i < keys.length;i++) {
            const key = keys[i];
            if (typeof key === 'number') {
                property = property.properties;
                continue;
            }

            if (i === 0) {
                property = property[key];
            } else {
                property = property.properties[key];
            }
        }

        return property;
    }

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
    private changeBody(keys: Array<string | number>, value: any) {
        let body: any = this.data;
        // 最後のキーを除いて順番にオブジェクトを辿る
        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            const nextKey = keys[i + 1];
            
            // 次のキーが数値型の場合は配列、そうでない場合はオブジェクトとして初期化
            if (!(key in body)) {
                body[key] = typeof nextKey === 'number' ? [] : {};
            }
            body = body[key];
        }
        // 最後のキーに対して値を設定
        body[keys[keys.length - 1]] = value;
    }

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
    private setObject(keys: Array<string | number>, values: {[key: string]: any}) {
        const property = this.getProperty(keys);

        for (const key of Object.keys(property.properties)) {

            // NULL Check
            if (key in values === false || values[key] === null || values[key] === "") {
                if (property.properties[key].type.endsWith('?')) {
                    this.changeBody([...keys, key], null);
                    continue;
                } else {
                    this.throwInputError("REQUIRE_11", [...keys, key], "");
                }
            }

            const value = values[key];
            switch (property.properties[key].type) {
                case 'object':
                case 'object?':
                    if (typeof value === 'object') {
                        this.setObject([...keys, key], value);
                    } else {
                        this.throwInputError("OBJECT_11", [...keys, key], value);
                    }
                    break;
                case 'array':
                case 'array?':
                    if (Array.isArray(value)) {
                        this.setArray([...keys, key], value);
                    } else {
                        this.throwInputError("ARRAY_11", [...keys, key], value);
                    }
                    break;
                case 'enum':
                case 'enum?':
                    this.setEnum([...keys, key], value);
                    break;
                default:
                    this.convertInput([...keys, key], value);
                    break;
            }
        }

        // unnecessary input check
        for (const [key, value] of Object.entries(values)) {
            if (key in property.properties === false) {
                this.throwInputError("UNNECESSARY_11", [...keys, key], value);
            }
        }
    }

    /**
     * Convert the input value based on the specified type.
     * Throws an exception if type conversion fails.
     * 指定された型に基づいて入力値を変換します。
     * 型変換に失敗した場合は例外をスローします。
     * 
     * @param {string} type - The type to convert to (e.g., 'number', 'boolean', 'string', 'date', 'time', 'datetime')
     *                        変換する型（例: 'number', 'boolean', 'string', 'date', 'time', 'datetime'）
     * @param {any} value - The value to convert
     *                      変換する値
     * @param {Array<string | number>} keys - The path to the target (array of strings or index numbers)
     *                                        処理対象のパス（文字列またはインデックス番号の配列）
     * @returns {any} The converted value, 変換された値
     * @throws {InputErrorException} Thrown if type conversion fails, 型変換に失敗した場合にスローされます
     */
    private convertValue(type: string, value: any, keys: Array<string | number>, isRequestBody: boolean) {

        switch (type) {
            case 'number':
            case 'number?':
                if (this.isNumber(value) === false) {
                    this.throwInputError(isRequestBody ? "NUMBER_21" : "NUMBER_91", keys, value);
                }
                return Number(value);
            case 'boolean':
            case 'boolean?':
                switch (typeof value) {
                    case 'boolean':
                        return value;
                    case 'number':
                        if (value !== 0 && value !== 1) {
                            this.throwInputError(isRequestBody ? "BOOL_21" : "BOOL_91", keys, value);
                        }
                        return value === 1 ? true : false;
                    case 'string':
                        if (value !== 'true' && value !== 'false') {
                            this.throwInputError(isRequestBody ? "BOOL_22" : "BOOL_92", keys, value);
                        }
                        return value === 'true' ? true : false;
                    default:
                        this.throwInputError(isRequestBody ? "BOOL_23" : "BOOL_93", keys, value);
                }
            case 'string':
            case 'string?':
                switch (typeof value) {
                    case 'number':
                        return value.toString();
                    case 'string':
                        return value;
                    default:
                        this.throwInputError(isRequestBody ? "STRING_21" : "STRING_91", keys, value);
                }
            case 'uuid':
            case 'uuid?':
                if (StringUtil.isUUID(value)) {
                    return value;
                }
                this.throwInputError(isRequestBody ? "UUID_21" : "UUID_91", keys, value);
            case 'mail':
            case 'mail?':
                if (ValidateStringUtil.isMail(value)) {
                    return value;
                }
                this.throwInputError(isRequestBody ? "MAIL_21" : "MAIL_91", keys, value);
            case 'date':
            case 'date?':
                if (this.isYYYYMMDD(value) === false) {
                    this.throwInputError(isRequestBody ? "DATE_21" : "DATE_91", keys, value);
                }

                if (this.isErrorDateTime(value)) {
                    this.throwInputError(isRequestBody ? "DATE_22" : "DATE_92", keys, value);
                }
                return value;
            case 'time':
            case 'time?':
                if (this.isHHMM(value)) {
                    return `${value}`;
                }
                this.throwInputError(isRequestBody ? "TIME_21" : "TIME_91", keys, value);
            case 'datetime':
            case 'datetime?':
                if (this.isYYYYMMDDhhmi(value)) {
                    value += ':00';
                }

                if (this.isYYYYMMDDhhmiss(value) === false) {
                    this.throwInputError(isRequestBody ? "DATETIME_21" : "DATETIME_91", keys, value);
                }

                if (this.isErrorDateTime(value)) {
                    this.throwInputError(isRequestBody ? "DATETIME_22" : "DATETIME_92", keys, value);
                }
                return value.replace('T', ' ');
            case 'https':
            case 'https?':
                if (ValidateStringUtil.isHttps(value)) {
                    return value;
                }
                this.throwInputError(isRequestBody ? "HTTPS_21" : "HTTPS_91", keys, value);
            case 'base64':
            case 'base64?':
                if (ValidateStringUtil.isBase64(value)) {
                    return value;
                }
                this.throwInputError(isRequestBody ? "BASE64_21" : "BASE64_91", keys, value);
        }

        return value;
    }

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
    private convertInput(keys: Array<string | number>, value: any) {
        const property = this.getProperty(keys);
        this.changeBody(keys, this.convertValue(property.type, value, keys, true));
    }


    // ****************************************************************************
    // for create swagger
    // ****************************************************************************


    /**
     * Generates a Swagger YAML definition from the request body.
     * リクエストボディからSwaggerのYAML定義を生成します。
     * @returns {string} Swagger format YAML definition
     * Swagger形式のYAML定義
     */
    public createSwagger(method: string) {

        if (method === 'GET' || method === 'DELETE') {

            const tabCount = 4;
            const space = '  '.repeat(tabCount);

            let ymlString = '';
            for (const [key, property] of Object.entries(this.properties)) {
                ymlString += `${space}- name: ${key}\n`;
                ymlString += `${space}  in: query\n`;

                const descJoin = `\n${space}    `;
                if (property.type === 'enum' || property.type === 'enum?') {
                    ymlString += `${space}  description: |${property.description === undefined ? '' : `${descJoin}${property.description.replaceAll("\n", descJoin)}`}`;
                    ymlString += `${descJoin}enum list`;
                    ymlString += `${Object.entries(property.enums).map(([key, value]) => `${descJoin}- ${key}: ${value}`)}\n`;
                } else if (property.description !== undefined) {
                    ymlString += `${space}  description: |\n${space}    ${property.description.replaceAll("\n", descJoin)}\n`;
                }
                ymlString += `${space}  required: ${property.type.endsWith('?') ? 'false' : 'true'}\n`;
                ymlString += `${space}  schema:\n`;
                ymlString += `${space}    type: ${this.replaceFromPropertyTypeToSwagger(property)}\n`;
                if (property.type === 'enum' || property.type === 'enum?') {
                    ymlString += `${space}  nullable: ${property.enumType.endsWith('?')}\n`;
                    ymlString += `${space}  enum:\n`;
                    for (const type of Object.keys(property.enumType)) {
                        ymlString += `${space}    - ${type}\n`;
                    }
                    if (property.enumType.endsWith('?')) {
                        ymlString += `${space}    - null\n`;
                    }
                }
            }

            return ymlString;
        } else {
            const tabCount = 8;
            const space = '  '.repeat(tabCount);
            let componentYml = '\n';
            let requiredList: Array<string> = [];
            for (const [key, property] of Object.entries(this.properties)) {
                if (property.type.endsWith('?') === false) {
                    requiredList.push(key);
                }
    
                componentYml += `${space}${key}:\n`;
                componentYml += `  ${space}type: ${this.replaceFromPropertyTypeToSwagger(property)}\n`;
                const descJoin = `\n${space}    `;
                if (property.type === 'enum' || property.type === 'enum?') {
                    componentYml += `${space}  description: |${property.description === undefined ? '' : `${descJoin}${property.description.replaceAll("\n", descJoin)}`}`;
                    componentYml += `${descJoin}enum list`;
                    componentYml += `${Object.entries(property.enums).map(([key, value]) => `${descJoin}- ${key}: ${value}`)}\n`;
                } else if (property.description !== undefined) {
                    componentYml += `${space}  description: |${descJoin}${property.description.replaceAll("\n", descJoin)}\n`;
                }

                if (property.type === 'enum' || property.type === 'enum?') {
                    componentYml += `${space}  nullable: ${property.enumType.endsWith('?')}\n`;
                    componentYml += `${space}  enum:\n`;
                    for (const type of Object.keys(property.enums)) {
                        componentYml += `${space}    - ${type}\n`;
                    }
                    if (property.enumType.endsWith('?')) {
                        componentYml += `${space}    - null\n`;
                    }
                }

                switch (property.type) {
                    case 'object':
                    case 'object?':
                        componentYml += this.makeSwaggerProperyFromObject([key], tabCount + 1);
                        break;
                    case 'array':
                    case 'array?':
                        componentYml += this.makeSwaggerPropertyFromArray([key], tabCount + 1);
                        break;
                }
            }
    
            if (requiredList.length > 0) {
                componentYml += `              required:\n`;
                componentYml += `                - ${requiredList.join(`\n                - `)}\n`;
            }
    
            let ymlString = `      requestBody:\n`;
            ymlString += `        content:\n`;
            ymlString += `          application/json:\n`;
            ymlString += `            schema:\n`;
            ymlString += `              type: object\n`;
            ymlString += `              properties:${componentYml}`;
            ymlString += `          application/x-www-form-urlencoded:\n`;
            ymlString += `            schema:\n`;
            ymlString += `              type: object\n`;
            ymlString += `              properties:${componentYml}`;

            return ymlString;
        }
    }


    /**
     * Generates Swagger properties from object type properties
     * オブジェクト型のプロパティからSwaggerのプロパティを生成
     * @param {Array.<string|number>} keys - Path to the properties
     * プロパティへのパス
     * @returns {string} Swagger format property definition
     * Swagger形式のプロパティ定義
     */
    private makeSwaggerProperyFromObject(keys: Array<string | number>, tabCount: number): string {

        const space = '  '.repeat(tabCount);

        let ymlString = `${space}properties:\n`;

        const properties = this.getProperty(keys).properties;
        for (const key of Object.keys(properties)) {
            const property = properties[key];

            
            ymlString += `${space}  ${key}:\n`;
            ymlString += `${space}    type: ${this.replaceFromPropertyTypeToSwagger(property)}\n`;
            const descJoin = `\n${space}      `;
            if (property.type === 'enum' || property.type === 'enum?') {
                ymlString += `${space}    description: |${property.description === undefined ? '' : `${descJoin}${property.description.replaceAll('\n', descJoin)}`}`;
                ymlString += `${descJoin}enum list`;
                ymlString += `${Object.entries(property.enums).map(([key, value]) => `${descJoin}- ${key}: ${value}`)}\n`;
            } else if ((property.description ?? '') !== '') {
                ymlString += `${space}    description: |${descJoin}${property.description.replaceAll('\n', descJoin)}\n`;
            }

            if (property.type === 'enum' || property.type === 'enum?') {
                ymlString += `${space}    nullable: ${property.enumType.endsWith('?')}\n`;
                ymlString += `${space}    enum:\n`;
                for (const type of Object.keys(property.enumType)) {
                    ymlString += `${space}    - ${type}\n`;
                }
                if (property.enumType.endsWith('?')) {
                    ymlString += `${space}    - null\n`;
                }
            }

            switch (property.type) {
                case 'object':
                case 'object?':
                    ymlString += this.makeSwaggerProperyFromObject([...keys, key], tabCount + 2);
                    break;
                case 'array':
                case 'array?':
                    ymlString += this.makeSwaggerPropertyFromArray([...keys, key], tabCount + 2);
                    break;
            }
        }

        return ymlString;
    }

    /**
     * Generates Swagger properties from array type properties
     * 配列型のプロパティからSwaggerのプロパティを生成
     * @param {Array.<string|number>} keys - Path to the properties
     * プロパティへのパス
     * @returns {string} Swagger format property definition
     * Swagger形式のプロパティ定義
     */
    private makeSwaggerPropertyFromArray(keys: Array<string | number>, tabCount: number): string {

        const property = this.getProperty(keys).properties;

        const space = '  '.repeat(tabCount);

        let ymlString = `${space}items:\n`;
        ymlString += `${space}  type: ${this.replaceFromPropertyTypeToSwagger(property)}\n`;
        if ((property.description ?? '') !== '') {
            const descJoin = `\n${space}    `;
            ymlString += `${space}  description: |${descJoin}${property.description.replaceAll('\n', descJoin)}\n`;
        }


        switch (property.type) {
            case 'object':
            case 'object?':
                ymlString += this.makeSwaggerProperyFromObject([...keys, 0], tabCount + 1);
                break;
            case 'array':
            case 'array?':
                ymlString += this.makeSwaggerPropertyFromArray([...keys, 0], tabCount + 1);
                break;
        }

        return ymlString;
    }
}

// Requestのheaderで定義されているIFをそのまま拝借
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