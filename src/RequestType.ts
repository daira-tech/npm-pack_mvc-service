import { Request } from 'express';
import ReqResType from "./ReqResType";
import { InputErrorException } from './Exception';

export class RequestType extends ReqResType {

    // *****************************************
    // Input Error Message
    // Please make changes to error messages in the subclass
    // エラー文言
    // エラーメッセージの変更はサブクラスで行ってください
    // *****************************************
    public readonly INVALID_PATH_PARAM_UUID_ERROR_MESSAGE = 'The {property} in the URL must be a UUID. ({value})';
    public readonly REQUIRED_ERROR_MESSAGE = '{property} is required.';
    public readonly UNNECESSARY_INPUT_ERROR_MESSAGE = "{property} is unnecessary input. ";
    public readonly INVALID_OBJECT_ERROR_MESSAGE = '{property} must be of type Object. ({value})';
    public readonly INVALID_ARRAY_ERROR_MESSAGE = '{property} must be of type Array. ({value})';
    public readonly INVALID_NUMBER_ERROR_MESSAGE = '{property} must be of type number. ({value})';
    public readonly INVALID_BOOL_ERROR_MESSAGE = '{property} must be of type bool or a string with true, false, or a number with 0, 1. ({value})';
    public readonly INVALID_STRING_ERROR_MESSAGE = '{property} must be of type string. ({value})';
    public readonly INVALID_UUID_ERROR_MESSAGE = '{property} must be a UUID. ({value})';
    public readonly INVALID_MAIL_ERROR_MESSAGE = '{property} must be an email. ({value})';
    public readonly INVALID_DATE_ERROR_MESSAGE = '{property} must be a string in "YYYY-MM-DD" format and a valid date. ({value})';
    public readonly INVALID_TIME_ERROR_MESSAGE = '{property} must be a string in "hh:mi" format and a valid time. ({value})';
    public readonly INVALID_DATETIME_ERROR_MESSAGE = '{property} must be a string in "YYYY-MM-DD hh:mi:ss" or "YYYY-MM-DDThh:mi:ss" format and a valid date and time. ({value})';

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
        if (request.params !== undefined) {
            for (const [key, value] of Object.entries(request.params)) {
                if (key.includes("id") || key.includes("Id")) {
                    if (this.isUUID(value) === false) {
                        throw new InputErrorException("990", this.ErrorMessage("990", [key], value));
                    }
                }
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
    private ErrorMessage(code: "990" | "000" | "001" | "002" | "003" | "004" | "101" | "102" | "103" | "104" |
        "201" | "211" | "212" | "213" | "221" | "231" | "241" | "251" | "252" |
        "261" | "271" | "272" | "301", keys: Array<string | number>, value: any): string {
        const list = {
            "990": this.INVALID_PATH_PARAM_UUID_ERROR_MESSAGE,
            "000": this.REQUIRED_ERROR_MESSAGE,
            "001": this.REQUIRED_ERROR_MESSAGE,
            "101": this.REQUIRED_ERROR_MESSAGE,
            "301": this.REQUIRED_ERROR_MESSAGE,
            "002": this.INVALID_OBJECT_ERROR_MESSAGE,
            "102": this.INVALID_OBJECT_ERROR_MESSAGE,
            "003": this.INVALID_ARRAY_ERROR_MESSAGE,
            "103": this.INVALID_ARRAY_ERROR_MESSAGE,
            "004": this.UNNECESSARY_INPUT_ERROR_MESSAGE,
            "104": this.UNNECESSARY_INPUT_ERROR_MESSAGE,
            "201": this.INVALID_NUMBER_ERROR_MESSAGE,
            "211": this.INVALID_BOOL_ERROR_MESSAGE,
            "212": this.INVALID_BOOL_ERROR_MESSAGE,
            "213": this.INVALID_BOOL_ERROR_MESSAGE,
            "221": this.INVALID_STRING_ERROR_MESSAGE,
            "231": this.INVALID_UUID_ERROR_MESSAGE,
            "241": this.INVALID_MAIL_ERROR_MESSAGE,
            "251": this.INVALID_DATE_ERROR_MESSAGE,
            "252": this.INVALID_DATE_ERROR_MESSAGE,
            "261": this.INVALID_TIME_ERROR_MESSAGE,
            "271": this.INVALID_DATETIME_ERROR_MESSAGE,
            "272": this.INVALID_DATETIME_ERROR_MESSAGE,
        }
        return list[code].replace("{property}", keys.join('.')).replace("{value}", value);
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
                        throw new InputErrorException("000", this.ErrorMessage("000", [key, 0], ""));
                    }
                } else {
                    if (this.properties[key].type.endsWith('?')) {
                        this.changeBody([key], null);
                        continue;
                    } else {
                        throw new InputErrorException("001", this.ErrorMessage("001", [key], ""));
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
                        throw new InputErrorException("002", this.ErrorMessage("002", [key], value));
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
                            this.data[key] = [this.convertValue(this.properties[key].properties.type, value, [key, 0])];
                        } else {
                            throw new InputErrorException("003", this.ErrorMessage("003", [key], value));
                        }
                    }
                    break;
                default:
                    this.convertInput([key], value);
                    break;
            }
        }

        // 不要項目チェック
        for (const [key, value] of Object.entries(this.data)) {
            if (key in this.properties === false) {
                throw new InputErrorException("004", this.ErrorMessage("004", [key], value));
            }
        }
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
                    throw new InputErrorException("301", this.ErrorMessage("301", [...keys, i], ""));
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
                    throw new InputErrorException("101", this.ErrorMessage("101", [...keys, key], ""));
                }
            }

            const value = values[key];
            switch (property.properties[key].type) {
                case 'object':
                case 'object?':
                    if (typeof value === 'object') {
                        this.setObject([...keys, key], value);
                    } else {
                        throw new InputErrorException("102", this.ErrorMessage("102", [...keys, key], value));
                    }
                    break;
                case 'array':
                case 'array?':
                    if (Array.isArray(value)) {
                        this.setArray([...keys, key], value);
                    } else {
                        throw new InputErrorException("103", this.ErrorMessage("103", [...keys, key], value));
                    }
                    break;
                default:
                    this.convertInput([...keys, key], value);
                    break;
            }
        }

        // unnecessary input check
        for (const [key, value] of Object.entries(values)) {
            if (key in property.properties === false) {
                throw new InputErrorException("104", this.ErrorMessage("104", [...keys, key], value));
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
    private convertValue(type: string, value: any, keys: Array<string | number>) {

        switch (type) {
            case 'number':
            case 'number?':
                if (this.isNumber(value) === false) {
                    throw new InputErrorException("201", this.ErrorMessage("201", keys, value));
                }
                return Number(value);
            case 'boolean':
            case 'boolean?':
                switch (typeof value) {
                    case 'boolean':
                        return value;
                    case 'number':
                        if (value !== 0 && value !== 1) {
                            throw new InputErrorException("211", this.ErrorMessage("211", keys, value));
                        }
                        return value === 1 ? true : false;
                    case 'string':
                        if (value !== 'true' && value !== 'false') {
                            throw new InputErrorException("212", this.ErrorMessage("212", keys, value));
                        }
                        return value === 'true' ? true : false;
                    default:
                        throw new InputErrorException("213", this.ErrorMessage("213", keys, value));
                }
            case 'string':
            case 'string?':
                switch (typeof value) {
                    case 'number':
                        return value.toString();
                    case 'string':
                        return value;
                    default:
                        throw new InputErrorException("221", this.ErrorMessage("221", keys, value));
                }
            case 'uuid':
            case 'uuid?':
                if (this.isUUID(value)) {
                    return value;
                }
                throw new InputErrorException("231", this.ErrorMessage("231", keys, value));
            case 'mail':
            case 'mail?':
                if (this.isMail(value)) {
                    return value;
                }
                throw new InputErrorException("241", this.ErrorMessage("241", keys, value));
            case 'date':
            case 'date?':
                if (this.isYYYYMMDD(value) === false) {
                    throw new InputErrorException("251", this.ErrorMessage("251", keys, value));
                }

                if (this.isErrorDateTime(value)) {
                    throw new InputErrorException("252", this.ErrorMessage("252", keys, value));
                }
                return value;
            case 'time':
            case 'time?':
                if (this.isHHMM(value)) {
                    return `${value}`;
                }
                throw new InputErrorException("261", this.ErrorMessage("261", keys, value));
            case 'datetime':
            case 'datetime?':
                if (this.isYYYYMMDDhhmiss(value) === false) {
                    throw new InputErrorException("271", this.ErrorMessage("271", keys, value));
                }

                if (this.isErrorDateTime(value)) {
                    throw new InputErrorException("272", this.ErrorMessage("272", keys, value));
                }
                return value.replace('T', ' ');
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
        this.changeBody(keys, this.convertValue(property.type, value, keys));
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
                if (property.description !== undefined) {
                    ymlString += `${space}  description: ${property.description}\n`;
                }
                ymlString += `${space}  required: ${property.type.endsWith('?') ? 'false' : 'true'}\n`;
                ymlString += `${space}  schema:\n`;
                ymlString += `${space}    type: ${this.replaceFromPropertyTypeToSwagger(property.type)}\n`;
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
                componentYml += `  ${space}type: ${this.replaceFromPropertyTypeToSwagger(property.type)}\n`;
                if (property.description !== undefined) {
                    componentYml += `  ${space}description: ${property.description}\n`;
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
            ymlString += `${space}    type: ${this.replaceFromPropertyTypeToSwagger(property.type)}\n`;
            if (property.description !== undefined) {
                ymlString += `${space}    description: ${property.description}\n`;
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
        ymlString += `${space}  type: ${this.replaceFromPropertyTypeToSwagger(property.type)}\n`;
        ymlString += `${space}  description: ${property.description}\n`;

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