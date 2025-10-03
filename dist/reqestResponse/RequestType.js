"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestType = void 0;
const ReqResType_1 = __importDefault(require("./ReqResType"));
const Exception_1 = require("../exceptions/Exception");
const StringUtil_1 = __importDefault(require("../Utils/StringUtil"));
const type_utils_n_daira_1 = require("type-utils-n-daira");
class RequestType extends ReqResType_1.default {
    constructor() {
        super(...arguments);
        // *****************************************
        // Input Error Message
        // Please make changes to error messages in the subclass
        // エラー文言
        // エラーメッセージの変更はサブクラスで行ってください
        // *****************************************
        this.ERROR_MESSAGE_ENGLISH = {
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
            INVALID_ENUM: '{property} must be in {enums}. ({value})',
            INVALID_MAP_NUMBER: '{property} must be a valid number for a map key. ({value})',
            INVALID_MAP_STRING: '{property} must be a valid string for a map key. ({value})',
            INVALID_MAP_BOOL: '{property} must be a valid boolean for a map key. ({value})',
        };
        this.ERROR_MESSAGE_JAPAN = {
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
            INVALID_ENUM: '{property}は{enums}のいずれかの値で入力してください。（{value}）',
            INVALID_MAP_NUMBER: '{property} は有効な数値のマップキーでなければなりません。({value})',
            INVALID_MAP_STRING: '{property} は有効な文字列のマップキーでなければなりません。({value})',
            INVALID_MAP_BOOL: '{property} は有効なboolのマップキーでなければなりません。({value})',
        };
        this.ERROR_MESSAGE = process.env.TZ === 'Asia/Tokyo' ? this.ERROR_MESSAGE_JAPAN : this.ERROR_MESSAGE_ENGLISH;
        this.paramProperties = [];
        // private makeSwaggerPropertyFromDictionary(keys: Array<string | number>, tabCount: number): string {
        //     const property = this.getProperty(keys).properties;
        //     const space = '  '.repeat(tabCount);
        //     let ymlString = `${space}items:\n`;
        //     ymlString += `${space}  type: ${this.replaceFromPropertyTypeToSwagger(property)}\n`;
        //     if ((property.description ?? '') !== '') {
        //         const descJoin = `\n${space}    `;
        //         ymlString += `${space}  description: |${descJoin}${property.description.replaceAll('\n', descJoin)}\n`;
        //     }
        //     switch (property.type) {
        //         case 'object':
        //         case 'object?':
        //             ymlString += this.makeSwaggerProperyFromObject([...keys, 0], tabCount + 1);
        //             break;
        //         case 'array':
        //         case 'array?':
        //             ymlString += this.makeSwaggerPropertyFromArray([...keys, 0], tabCount + 1);
        //             break;
        //     }
        //     return ymlString;
        // }
    }
    get paramPath() {
        return this.paramProperties.map(property => `/{${property.key}}`).join("");
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
    throwInputError(code, keys, value) {
        var _a;
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
            "MAP_01": this.ERROR_MESSAGE.INVALID_MAP_NUMBER, // // tODO : mapのエラーメッセージどうするか
            "MAP_02": this.ERROR_MESSAGE.INVALID_MAP_STRING,
            "MAP_03": this.ERROR_MESSAGE.INVALID_MAP_BOOL,
            "MAP_04": this.ERROR_MESSAGE.INVALID_MAP_BOOL,
            "MAP_05": this.ERROR_MESSAGE.INVALID_MAP_BOOL,
            "MAP_11": this.ERROR_MESSAGE.INVALID_MAP_NUMBER,
            "MAP_12": this.ERROR_MESSAGE.INVALID_MAP_STRING,
            "MAP_13": this.ERROR_MESSAGE.INVALID_MAP_BOOL,
            "MAP_14": this.ERROR_MESSAGE.INVALID_MAP_BOOL,
            "MAP_15": this.ERROR_MESSAGE.INVALID_MAP_BOOL,
            "MAP_31": this.ERROR_MESSAGE.INVALID_MAP_NUMBER,
            "MAP_32": this.ERROR_MESSAGE.INVALID_MAP_STRING,
            "MAP_33": this.ERROR_MESSAGE.INVALID_MAP_BOOL,
            "MAP_34": this.ERROR_MESSAGE.INVALID_MAP_BOOL,
            "MAP_35": this.ERROR_MESSAGE.INVALID_MAP_BOOL,
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
        };
        let errorMessage = list[code];
        if (code === "ENUM_41" || code === "ENUM_42") {
            const property = this.getProperty(keys);
            errorMessage = errorMessage.replace('{enums}', Object.keys((_a = property.enums) !== null && _a !== void 0 ? _a : '').join(','));
        }
        errorMessage = errorMessage.replace("{property}", keys.join('.')).replace("{value}", value);
        throw new Exception_1.InputErrorException(code, errorMessage);
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
                    const itemProperty = this.properties[key].item;
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
                        this.throwInputError("REQUIRE_00", [key, 0], "");
                    }
                }
                else {
                    if (this.properties[key].type.endsWith('?')) {
                        this.changeBody([key], null);
                        continue;
                    }
                    else {
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
                    }
                    else {
                        this.throwInputError("OBJECT_01", [key], value);
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
                            this.data[key] = [this.convertValue(this.properties[key].item.type, value, [key, 0], true)];
                        }
                        else {
                            this.throwInputError("ARRAY_01", [key], value);
                        }
                    }
                    break;
                case 'map':
                case 'map?':
                    // tODO : ここは共通化したい
                    const mapData = {};
                    for (const [mapKey, mapValue] of Object.entries(value)) {
                        switch (this.properties[key].mapType) {
                            case 'number':
                                if (this.isNumber(mapValue) === false) {
                                    this.throwInputError("MAP_01", [key], value);
                                }
                                mapData[mapKey] = Number(mapValue);
                                break;
                            case 'string':
                                switch (typeof mapValue) {
                                    case 'number':
                                        mapData[mapKey] = mapValue.toString();
                                        break;
                                    case 'string':
                                        mapData[mapKey] = mapValue;
                                        break;
                                    default:
                                        this.throwInputError("MAP_02", [key], value);
                                }
                                break;
                            case 'bool':
                                switch (typeof mapValue) {
                                    case 'boolean':
                                        mapData[mapKey] = mapValue;
                                        break;
                                    case 'number':
                                        if (mapValue !== 0 && mapValue !== 1) {
                                            this.throwInputError("MAP_03", [key], mapValue);
                                        }
                                        mapData[mapKey] = mapValue === 1;
                                        break;
                                    case 'string':
                                        if (mapValue !== 'true' && mapValue !== 'false') {
                                            this.throwInputError("MAP_04", [key], mapValue);
                                        }
                                        mapData[mapKey] = mapValue === 'true';
                                        break;
                                    default:
                                        this.throwInputError("MAP_05", [key], mapValue);
                                }
                                break;
                        }
                    }
                    this.changeBody([key], mapData);
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
    setEnum(keys, value) {
        const property = this.getProperty(keys);
        if (property.type !== 'enum' && property.type !== 'enum?') {
            throw new Error(`setEnumメソッドでEnum型以外が入力された場合はエラー\n keys: ${keys.join(',')}`);
        }
        const enumType = property.enumType;
        if (value === undefined || value === null || (typeof value === 'string' && value === '')) {
            if (enumType.endsWith('?')) {
                this.changeBody(keys, null);
            }
            else {
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
    setArray(keys, values) {
        const property = this.getProperty(keys);
        if (property.type !== 'array' && property.type !== 'array?') {
            throw new Error(`setArrayメソッドでArray型以外が入力された場合はエラー\n keys: ${keys.join(',')}`);
        }
        for (let i = 0; i < values.length; i++) {
            // NULL Check
            if (values[i] === undefined || values[i] === null || (property.item.type.replace("?", "") !== "string" && values[i] === "")) {
                if (property.item.type.endsWith('?')) {
                    this.changeBody([...keys, i], values[i] === undefined ? undefined : null);
                    continue;
                }
                else {
                    this.throwInputError("REQUIRE_31", [...keys, i], "");
                }
            }
            switch (property.item.type) {
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
                case 'map':
                case 'map?':
                    const mapData = {};
                    for (const [mapKey, mapValue] of Object.entries(values[i])) {
                        switch (property.item.mapType) {
                            case 'number':
                                if (this.isNumber(mapValue) === false) {
                                    this.throwInputError("MAP_31", [...keys, i], values[i]);
                                }
                                mapData[mapKey] = Number(mapValue);
                                break;
                            case 'string':
                                switch (typeof mapValue) {
                                    case 'number':
                                        mapData[mapKey] = mapValue.toString();
                                        break;
                                    case 'string':
                                        mapData[mapKey] = mapValue;
                                        break;
                                    default:
                                        this.throwInputError("MAP_32", [...keys, i], values[i]);
                                }
                                break;
                            case 'bool':
                                switch (typeof mapValue) {
                                    case 'boolean':
                                        mapData[mapKey] = mapValue;
                                        break;
                                    case 'number':
                                        if (mapValue !== 0 && mapValue !== 1) {
                                            this.throwInputError("MAP_33", keys, mapValue);
                                        }
                                        mapData[mapKey] = mapValue === 1;
                                        break;
                                    case 'string':
                                        if (mapValue !== 'true' && mapValue !== 'false') {
                                            this.throwInputError("MAP_34", keys, mapValue);
                                        }
                                        mapData[mapKey] = mapValue === 'true';
                                        break;
                                    default:
                                        this.throwInputError("MAP_35", keys, mapValue);
                                }
                                break;
                        }
                    }
                    this.changeBody([...keys, i], mapData);
                    break;
                default:
                    this.convertInput([...keys, i], values[i]);
                    break;
            }
        }
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
        if (property.type !== 'object' && property.type !== 'object?') {
            throw new Error(`setObjectメソッドでObject型以外が入力された場合はエラー\n keys: ${keys.join(',')}`);
        }
        for (const key of Object.keys(property.properties)) {
            // NULL Check
            if (key in values === false || values[key] === null || values[key] === "") {
                if (property.properties[key].type.endsWith('?')) {
                    this.changeBody([...keys, key], null);
                    continue;
                }
                else {
                    this.throwInputError("REQUIRE_11", [...keys, key], "");
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
                        this.throwInputError("OBJECT_11", [...keys, key], value);
                    }
                    break;
                case 'array':
                case 'array?':
                    if (Array.isArray(value)) {
                        this.setArray([...keys, key], value);
                    }
                    else {
                        this.throwInputError("ARRAY_11", [...keys, key], value);
                    }
                    break;
                case 'enum':
                case 'enum?':
                    this.setEnum([...keys, key], value);
                    break;
                case 'map':
                case 'map?':
                    const mapData = {};
                    for (const [mapKey, mapValue] of Object.entries(value)) {
                        switch (property.properties[key].mapType) {
                            case 'number':
                                if (this.isNumber(mapValue) === false) {
                                    this.throwInputError("MAP_11", [key], value);
                                }
                                mapData[mapKey] = Number(mapValue);
                                break;
                            case 'string':
                                switch (typeof mapValue) {
                                    case 'number':
                                        mapData[mapKey] = mapValue.toString();
                                        break;
                                    case 'string':
                                        mapData[mapKey] = mapValue;
                                        break;
                                    default:
                                        this.throwInputError("MAP_12", [key], value);
                                }
                                break;
                            case 'bool':
                                switch (typeof mapValue) {
                                    case 'boolean':
                                        mapData[mapKey] = mapValue;
                                        break;
                                    case 'number':
                                        if (mapValue !== 0 && mapValue !== 1) {
                                            this.throwInputError("MAP_13", keys, mapValue);
                                        }
                                        mapData[mapKey] = mapValue === 1;
                                        break;
                                    case 'string':
                                        if (mapValue !== 'true' && mapValue !== 'false') {
                                            this.throwInputError("MAP_14", keys, mapValue);
                                        }
                                        mapData[mapKey] = mapValue === 'true';
                                        break;
                                    default:
                                        this.throwInputError("MAP_15", keys, mapValue);
                                }
                                break;
                        }
                    }
                    this.changeBody([...keys, key], mapData);
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
    convertValue(type, value, keys, isRequestBody) {
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
                if (StringUtil_1.default.isUUID(value)) {
                    return value;
                }
                this.throwInputError(isRequestBody ? "UUID_21" : "UUID_91", keys, value);
            case 'mail':
            case 'mail?':
                if (type_utils_n_daira_1.ValidateStringUtil.isMail(value)) {
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
                if (type_utils_n_daira_1.ValidateStringUtil.isHttps(value)) {
                    return value;
                }
                this.throwInputError(isRequestBody ? "HTTPS_21" : "HTTPS_91", keys, value);
            case 'base64':
            case 'base64?':
                if (type_utils_n_daira_1.ValidateStringUtil.isBase64(value)) {
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
    convertInput(keys, value) {
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
        var _a, _b;
        const objectProperty = this.getProperty(keys);
        if (objectProperty.type !== 'object' && objectProperty.type !== 'object?') {
            throw new Error(`setObjectメソッドでObject型以外が入力された場合はエラー\n keys: ${keys.join(',')}`);
        }
        const space = '  '.repeat(tabCount);
        let ymlString = `${space}properties:\n`;
        for (const key of Object.keys(objectProperty.properties)) {
            const property = objectProperty.properties[key];
            ymlString += `${space}  ${key}:\n`;
            ymlString += `${space}    type: ${this.replaceFromPropertyTypeToSwagger(property)}\n`;
            const descJoin = `\n${space}      `;
            if (property.type === 'enum' || property.type === 'enum?') {
                ymlString += `${space}    description: |${property.description === undefined ? '' : `${descJoin}${property.description.replaceAll('\n', descJoin)}`}`;
                ymlString += `${descJoin}enum list`;
                ymlString += `${Object.entries(property.enums).map(([key, value]) => `${descJoin}- ${key}: ${value}`)}\n`;
            }
            else if (((_a = property.description) !== null && _a !== void 0 ? _a : '') !== '') {
                ymlString += `${space}    description: |${descJoin}${((_b = property.description) !== null && _b !== void 0 ? _b : "").replaceAll('\n', descJoin)}\n`;
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
        var _a, _b;
        const arrayProperty = this.getProperty(keys);
        if (arrayProperty.type !== 'array' && arrayProperty.type !== 'array?') {
            throw new Error(`getArrayメソッドでArray型以外が入力された場合はエラー\n keys: ${keys.join(',')}`);
        }
        const space = '  '.repeat(tabCount);
        let ymlString = `${space}items:\n`;
        ymlString += `${space}  type: ${this.replaceFromPropertyTypeToSwagger(arrayProperty.item)}\n`;
        if (((_a = arrayProperty.item.description) !== null && _a !== void 0 ? _a : '') !== '') {
            const descJoin = `\n${space}    `;
            ymlString += `${space}  description: |${descJoin}${((_b = arrayProperty.item.description) !== null && _b !== void 0 ? _b : '').replaceAll('\n', descJoin)}\n`;
        }
        switch (arrayProperty.item.type) {
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
