"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestType = void 0;
const ReqResType_1 = __importDefault(require("./ReqResType"));
const Exception_1 = require("./Exception");
class RequestType extends ReqResType_1.default {
    constructor() {
        super(...arguments);
        // *****************************************
        // Input Error Message
        // Please make changes to error messages in the subclass
        // エラー文言
        // エラーメッセージの変更はサブクラスで行ってください
        // *****************************************
        this.INVALID_PATH_PARAM_UUID_ERROR_MESSAGE = 'The {property} in the URL must be a UUID. ({value})';
        this.REQUIRED_ERROR_MESSAGE = '{property} is required.';
        this.UNNECESSARY_INPUT_ERROR_MESSAGE = "{property} is unnecessary input. ";
        this.INVALID_OBJECT_ERROR_MESSAGE = '{property} must be of type Object. ({value})';
        this.INVALID_ARRAY_ERROR_MESSAGE = '{property} must be of type Array. ({value})';
        this.INVALID_NUMBER_ERROR_MESSAGE = '{property} must be of type number. ({value})';
        this.INVALID_BOOL_ERROR_MESSAGE = '{property} must be of type bool or a string with true, false, or a number with 0, 1. ({value})';
        this.INVALID_STRING_ERROR_MESSAGE = '{property} must be of type string. ({value})';
        this.INVALID_UUID_ERROR_MESSAGE = '{property} must be a UUID. ({value})';
        this.INVALID_MAIL_ERROR_MESSAGE = '{property} must be an email. ({value})';
        this.INVALID_HTTPS_ERROR_MESSAGE = '{property} must be an https or http URL. ({value})';
        this.INVALID_DATE_ERROR_MESSAGE = '{property} must be a string in "YYYY-MM-DD" format and a valid date. ({value})';
        this.INVALID_TIME_ERROR_MESSAGE = '{property} must be a string in "hh:mi" format and a valid time. ({value})';
        this.INVALID_DATETIME_ERROR_MESSAGE = '{property} must be a string in "YYYY-MM-DD hh:mi:ss" or "YYYY-MM-DDThh:mi:ss" format and a valid date and time. ({value})';
        this.INVALID_BASE64_ERROR_MESSAGE = '{property} must be in Base64 format. ({value})';
        this.INVALID_ENUM_ERROR_MESSAGE = '{property} must be in {enums}. ({value})';
    }
    get Params() {
        var _a;
        if (this.params === undefined) {
            throw new Error("Request data must be set using setRequest method before accessing Req.");
        }
        return (_a = this.params) !== null && _a !== void 0 ? _a : {};
    }
    get Data() {
        var _a;
        if (this.data === undefined) {
            throw new Error("Request data must be set using setRequest method before accessing Req.");
        }
        return (_a = this.data) !== null && _a !== void 0 ? _a : {};
    }
    get Headers() {
        if (this.headers === undefined) {
            throw new Error("Request data must be set using setRequest method before accessing Req.");
        }
        return this.headers;
    }
    get RemoteAddress() { return this.remoteAddress; }
    get Authorization() {
        var _a;
        const authorization = (_a = this.Headers['authorization']) !== null && _a !== void 0 ? _a : '';
        if (authorization.startsWith('Bearer ') === false) {
            return null;
        }
        return authorization.replace(/^Bearer\s/, '');
    }
    setRequest(request) {
        var _a, _b, _c;
        this.createBody(request);
        if (request.params !== undefined) {
            for (const [key, value] of Object.entries(request.params)) {
                if (key.includes("id") || key.includes("Id")) {
                    if (this.isUUID(value) === false) {
                        throw new Exception_1.InputErrorException("990", this.ErrorMessage("990", [key], value));
                    }
                }
            }
        }
        this.params = (_a = request.params) !== null && _a !== void 0 ? _a : {};
        this.headers = (_b = request.headers) !== null && _b !== void 0 ? _b : {};
        this.remoteAddress = (_c = request.socket) === null || _c === void 0 ? void 0 : _c.remoteAddress;
    }
    /**
     * Generates an error message based on the provided code, keys, and value.
     * 指定されたコード、キー、および値に基づいてエラーメッセージを生成します。
     * @param {string} code - The error code. エラーコード
     * @param {Array<string | number>} keys - The keys indicating the property path. プロパティパスを示すキー
     * @param {any} value - The value that caused the error. エラーを引き起こした値
     * @returns {string} The generated error message. 生成されたエラーメッセージ
     */
    ErrorMessage(code, keys, value) {
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
            "281": this.INVALID_HTTPS_ERROR_MESSAGE,
            "291": this.INVALID_BASE64_ERROR_MESSAGE,
            "411": this.INVALID_NUMBER_ERROR_MESSAGE,
            "421": this.INVALID_BOOL_ERROR_MESSAGE,
            "422": this.INVALID_BOOL_ERROR_MESSAGE,
            "423": this.INVALID_BOOL_ERROR_MESSAGE,
            "431": this.INVALID_STRING_ERROR_MESSAGE,
        };
        let errorMessage = '';
        if (code === "401" || code === "402") {
            const property = this.getProperty(keys);
            errorMessage = this.INVALID_ENUM_ERROR_MESSAGE.replace('{enums}', Object.keys(property.enums).join(','));
        }
        else {
            errorMessage = list[code];
        }
        errorMessage = errorMessage.replace("{property}", keys.join('.')).replace("{value}", value);
        return errorMessage;
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
    createBody(request) {
        if (request.method === 'GET' || request.method === 'DELETE') {
            this.data = request.query;
        }
        else {
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
                            }
                            else {
                                this.data[key][0] = null;
                            }
                        }
                        continue;
                    }
                    else {
                        throw new Exception_1.InputErrorException("000", this.ErrorMessage("000", [key, 0], ""));
                    }
                }
                else {
                    if (this.properties[key].type.endsWith('?')) {
                        this.changeBody([key], null);
                        continue;
                    }
                    else {
                        throw new Exception_1.InputErrorException("001", this.ErrorMessage("001", [key], ""));
                    }
                }
            }
            const value = this.data[key];
            switch (this.properties[key].type) {
                case 'object':
                case 'object?':
                    if (typeof value === 'object') {
                        this.setObject([key], value);
                    }
                    else {
                        throw new Exception_1.InputErrorException("002", this.ErrorMessage("002", [key], value));
                    }
                    break;
                case 'array':
                case 'array?':
                    if (Array.isArray(value)) {
                        this.setArray([key], value);
                    }
                    else {
                        if (request.method === 'GET' || request.method === 'DELETE') {
                            // GET,DELETEメソッドの場合、?array=1&array=2で配列となるが、
                            // ?array=1のみで終わる場合は配列にならないため、直接配列にしている
                            this.data[key] = [this.convertValue(this.properties[key].properties.type, value, [key, 0])];
                        }
                        else {
                            throw new Exception_1.InputErrorException("003", this.ErrorMessage("003", [key], value));
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
                throw new Exception_1.InputErrorException("004", this.ErrorMessage("004", [key], value));
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
    setEnum(keys, value) {
        const property = this.getProperty(keys);
        const enumType = property.enumType;
        if (value === undefined || value === null || (typeof value === 'string' && value === '')) {
            if (enumType.endsWith('?')) {
                this.changeBody(keys, null);
            }
            else {
                throw new Exception_1.InputErrorException("401", this.ErrorMessage("401", keys, value));
            }
        }
        switch (enumType) {
            case 'number':
            case 'number?':
                if (this.isNumber(value) === false) {
                    throw new Exception_1.InputErrorException("411", this.ErrorMessage("411", keys, value));
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
                        throw new Exception_1.InputErrorException("431", this.ErrorMessage("431", keys, value));
                }
                break;
        }
        if (Object.keys(property.enums).includes(value.toString()) === false) {
            throw new Exception_1.InputErrorException("402", this.ErrorMessage("402", keys, value));
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
    setArray(keys, values) {
        const property = this.getProperty(keys);
        for (let i = 0; i < values.length; i++) {
            // NULL Check
            if (values[i] === undefined || values[i] === null || (property.properties.type.replace("?", "") !== "string" && values[i] === "")) {
                if (property.properties.type.endsWith('?')) {
                    this.changeBody([...keys, i], values[i] === undefined ? undefined : null);
                    continue;
                }
                else {
                    throw new Exception_1.InputErrorException("301", this.ErrorMessage("301", [...keys, i], ""));
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
    getProperty(keys) {
        let property = this.properties;
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            if (typeof key === 'number') {
                property = property.properties;
                continue;
            }
            if (i === 0) {
                property = property[key];
            }
            else {
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
    changeBody(keys, value) {
        let body = this.data;
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
    setObject(keys, values) {
        const property = this.getProperty(keys);
        for (const key of Object.keys(property.properties)) {
            // NULL Check
            if (key in values === false || values[key] === null || values[key] === "") {
                if (property.properties[key].type.endsWith('?')) {
                    this.changeBody([...keys, key], null);
                    continue;
                }
                else {
                    throw new Exception_1.InputErrorException("101", this.ErrorMessage("101", [...keys, key], ""));
                }
            }
            const value = values[key];
            switch (property.properties[key].type) {
                case 'object':
                case 'object?':
                    if (typeof value === 'object') {
                        this.setObject([...keys, key], value);
                    }
                    else {
                        throw new Exception_1.InputErrorException("102", this.ErrorMessage("102", [...keys, key], value));
                    }
                    break;
                case 'array':
                case 'array?':
                    if (Array.isArray(value)) {
                        this.setArray([...keys, key], value);
                    }
                    else {
                        throw new Exception_1.InputErrorException("103", this.ErrorMessage("103", [...keys, key], value));
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
                throw new Exception_1.InputErrorException("104", this.ErrorMessage("104", [...keys, key], value));
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
    convertValue(type, value, keys) {
        switch (type) {
            case 'number':
            case 'number?':
                if (this.isNumber(value) === false) {
                    throw new Exception_1.InputErrorException("201", this.ErrorMessage("201", keys, value));
                }
                return Number(value);
            case 'boolean':
            case 'boolean?':
                switch (typeof value) {
                    case 'boolean':
                        return value;
                    case 'number':
                        if (value !== 0 && value !== 1) {
                            throw new Exception_1.InputErrorException("211", this.ErrorMessage("211", keys, value));
                        }
                        return value === 1 ? true : false;
                    case 'string':
                        if (value !== 'true' && value !== 'false') {
                            throw new Exception_1.InputErrorException("212", this.ErrorMessage("212", keys, value));
                        }
                        return value === 'true' ? true : false;
                    default:
                        throw new Exception_1.InputErrorException("213", this.ErrorMessage("213", keys, value));
                }
            case 'string':
            case 'string?':
                switch (typeof value) {
                    case 'number':
                        return value.toString();
                    case 'string':
                        return value;
                    default:
                        throw new Exception_1.InputErrorException("221", this.ErrorMessage("221", keys, value));
                }
            case 'uuid':
            case 'uuid?':
                if (this.isUUID(value)) {
                    return value;
                }
                throw new Exception_1.InputErrorException("231", this.ErrorMessage("231", keys, value));
            case 'mail':
            case 'mail?':
                if (this.isMail(value)) {
                    return value;
                }
                throw new Exception_1.InputErrorException("241", this.ErrorMessage("241", keys, value));
            case 'date':
            case 'date?':
                if (this.isYYYYMMDD(value) === false) {
                    throw new Exception_1.InputErrorException("251", this.ErrorMessage("251", keys, value));
                }
                if (this.isErrorDateTime(value)) {
                    throw new Exception_1.InputErrorException("252", this.ErrorMessage("252", keys, value));
                }
                return value;
            case 'time':
            case 'time?':
                if (this.isHHMM(value)) {
                    return `${value}`;
                }
                throw new Exception_1.InputErrorException("261", this.ErrorMessage("261", keys, value));
            case 'datetime':
            case 'datetime?':
                if (this.isYYYYMMDDhhmi(value)) {
                    value += ':00';
                }
                if (this.isYYYYMMDDhhmiss(value) === false) {
                    throw new Exception_1.InputErrorException("271", this.ErrorMessage("271", keys, value));
                }
                if (this.isErrorDateTime(value)) {
                    throw new Exception_1.InputErrorException("272", this.ErrorMessage("272", keys, value));
                }
                return value.replace('T', ' ');
            case 'https':
            case 'https?':
                if (this.isHttps(value)) {
                    return value;
                }
                throw new Exception_1.InputErrorException("281", this.ErrorMessage("281", keys, value));
            case 'base64':
            case 'base64?':
                if (this.isBase64(value)) {
                    return value;
                }
                throw new Exception_1.InputErrorException("291", this.ErrorMessage("291", keys, value));
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
    convertInput(keys, value) {
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
    createSwagger(method) {
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
                }
                else if (property.description !== undefined) {
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
        }
        else {
            const tabCount = 8;
            const space = '  '.repeat(tabCount);
            let componentYml = '\n';
            let requiredList = [];
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
                }
                else if (property.description !== undefined) {
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
    makeSwaggerProperyFromObject(keys, tabCount) {
        var _a;
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
            }
            else if (((_a = property.description) !== null && _a !== void 0 ? _a : '') !== '') {
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
    makeSwaggerPropertyFromArray(keys, tabCount) {
        var _a;
        const property = this.getProperty(keys).properties;
        const space = '  '.repeat(tabCount);
        let ymlString = `${space}items:\n`;
        ymlString += `${space}  type: ${this.replaceFromPropertyTypeToSwagger(property)}\n`;
        if (((_a = property.description) !== null && _a !== void 0 ? _a : '') !== '') {
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
exports.RequestType = RequestType;
