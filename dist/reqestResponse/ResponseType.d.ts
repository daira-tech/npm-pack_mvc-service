import ReqResType from "./ReqResType";
import { IError } from "../Service";
export declare class ResponseType extends ReqResType {
    /**
     * Property to store response data
     * レスポンスデータを格納するためのプロパティ
     */
    Data: {
        [key: string]: any;
    };
    /**
     * Convert and retrieve data according to the type definition
     * 型定義に従ってデータを変換して取得
     * @returns {Object.<string, any>} Converted data, 変換されたデータ
     */
    get ResponseData(): {
        [key: string]: any;
    };
    /**
     * Retrieve object type data
     * オブジェクト型のデータを取得
     * @param {Array.<string|number>} keys - Path to the property, プロパティへのパス
     * @returns {Object.<string, any>} Retrieved object data, 取得されたオブジェクトデータ
     */
    private getObject;
    /**
     * Retrieve array type data
     * 配列型のデータを取得
     * @param {Array.<string|number>} keys - Path to the property, プロパティへのパス
     * @returns {Array<any> | undefined} Retrieved array data, 取得された配列データ
     */
    private getArray;
    /**
 * Retrieve array type data
 * 配列型のデータを取得
 * @param {Array.<string|number>} keys - Path to the property, プロパティへのパス
 * @returns {Array<any> | undefined} Retrieved array data, 取得された配列データ
 */
    private getMap;
    /**
     * Retrieve data based on the provided keys
     * 指定されたキーに基づいてデータを取得
     * @param {Array.<string|number>} keys - Path to the data, データへのパス
     * @returns {any} Retrieved data, 取得されたデータ
     */
    private getData;
    /**
     * Retrieve value based on the provided keys
     * 指定されたキーに基づいて値を取得
     * @param {Array.<string|number>} keys - Path to the value, 値へのパス
     * @returns {string | number | boolean | null | undefined} Retrieved value, 取得された値
     */
    private getValue;
    /**
     * Generates Swagger response definition
     * Swaggerのレスポンス定義を生成します
     * @returns {string} Swagger format response definition
     * Swagger形式のレスポンス定義
     */
    createSwagger(errorList: Array<IError>, apiCode: string): string;
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
     * @param {Array.<string|number>} keys - Path to the properties, プロパティへのパス
     * @returns {string} Swagger format property definition, Swagger形式のプロパティ定義
     */
    private makeSwaggerPropertyFromArray;
    /**
 * Generates Swagger properties from array type properties
 * 配列型のプロパティからSwaggerのプロパティを生成
 * @param {Array.<string|number>} keys - Path to the properties, プロパティへのパス
 * @returns {string} Swagger format property definition, Swagger形式のプロパティ定義
 */
    private makeSwaggerPropertyFromDictionary;
}
//# sourceMappingURL=ResponseType.d.ts.map