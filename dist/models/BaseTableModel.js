"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseTableModel = void 0;
const ValidateValueUtil_1 = __importDefault(require("./ValidateValueUtil"));
const ValidateClient_1 = __importDefault(require("./ValidateClient"));
const Exception_1 = require("../exceptions/Exception");
const ExpressionClient_1 = __importDefault(require("./ExpressionClient"));
const MessageUtil_1 = __importDefault(require("./Utils/MessageUtil"));
const Controller_1 = require("../Controller");
/**
 * 全DBモデルの基底クラス。
 * テーブル定義（カラム・外部キー）、バリデーション、クエリ実行、例外処理など
 * DB方言に依存しない共通ロジックを提供する。
 * DB固有のSQL生成はサブクラス（PgTableModel, D1TableModel等）で実装する。
 */
class BaseTableModel {
    /** 現在日時（Controller.Nowと同期） */
    get Now() { return Controller_1.Controller.Now; }
    /** 現在日時の文字列表現 "YYYY-MM-DD HH:mm:ss" */
    get NowString() { return Controller_1.Controller.NowString; }
    /** 今日の0時0分0秒 */
    get Today() { return Controller_1.Controller.Today; }
    /** 今日の日付文字列 "YYYY-MM-DD" */
    get TodayString() { return Controller_1.Controller.TodayString; }
    get Id() { return this.id; }
    get SchemaName() { return this.schemaName; }
    get TableName() {
        if (this.tableName === "") {
            throw new Error("Please set the tableName for TableModel.");
        }
        return this.tableName;
    }
    /** スキーマ付きテーブル名を返す。スキーマ未設定時はテーブル名のみ */
    get SchemaTableName() {
        if (this.tableName === "") {
            throw new Error("Please set the tableName for TableModel.");
        }
        if (this.schemaName === "") {
            return this.tableName;
        }
        return this.schemaName + "." + this.tableName;
    }
    get TableDescription() { return this.tableDescription; }
    get Comment() { return this.comment; }
    get Columns() {
        if (Object.keys(this.columns).length === 0) {
            throw new Error("Please set the columns for TableModel.");
        }
        return this.columns;
    }
    /**
     * 指定キーのカラム詳細情報を返す。
     * テーブル名・エイリアス付きのSQL式（例: "t".column_name）も含む。
     * @param key カラム名
     */
    getColumn(key) {
        if (key in this.Columns === false) {
            throw new Error(`${this.TableName} does not contain ${key}.`);
        }
        return Object.assign(Object.assign({}, this.Columns[key]), { columnName: key, tableName: this.TableName, expression: `"${this.TableAlias}".${key}` });
    }
    get References() { return this.references; }
    /**
     * 指定カラムに関連する外部キー制約を返す。
     * @param columnName 対象のカラム名
     */
    GetReferences(columnName) {
        const _ = this.getColumn(columnName);
        const references = [];
        for (const ref of this.References) {
            if (ref.columns.filter(col => col.target === columnName).length > 0) {
                references.push(ref);
            }
        }
        return references;
    }
    /** エイリアスが未設定の場合はテーブル名をそのまま返す */
    get TableAlias() {
        return this.tableAlias === undefined ? this.TableName : this.tableAlias;
    }
    get Client() {
        return this.client;
    }
    /**
     * @param client DBクライアント（IDbClient実装）
     * @param tableAlias JOINで同テーブルを複数回使う場合のエイリアス
     */
    constructor(client, tableAlias) {
        /** モデル識別子。エラーコードのプレフィックスに使用される */
        this.id = "";
        /** DBスキーマ名。D1では未サポートのため空文字のままにすること */
        this.schemaName = "";
        /** テーブル名。サブクラスで必ず設定すること */
        this.tableName = "";
        /** テーブルの説明（設計書生成用） */
        this.tableDescription = "";
        /** テーブルへの補足コメント（設計書生成用） */
        this.comment = "";
        /** カラム定義。サブクラスで必ず設定すること */
        this.columns = {};
        /** 外部キー制約の定義。insert時にバリデーションで参照先の存在チェックに使用 */
        this.references = [];
        /** trueにするとクエリ実行時にSQL・パラメータ・結果をconsole.logに出力する（デバッグ用） */
        this.IsOutputLog = false;
        this.SortKeyword = 'asc';
        /** サブクラスのselect()等で組み立てられるSELECT句の断片リスト */
        this.selectExpressions = [];
        /** join()で蓄積されるJOIN条件リスト */
        this.joinConditions = [];
        /** where()で蓄積されるWHERE句の断片リスト（ANDで結合される） */
        this.whereExpressions = [];
        /** groupBy()で蓄積されるGROUP BY式リスト */
        this.groupExpression = [];
        /** orderBy()で蓄積されるORDER BY式リスト */
        this.sortExpression = [];
        /** プレースホルダに対応するバインド変数のリスト */
        this.vars = [];
        /** バリデーションエラーメッセージの言語。サブクラスで "ja" に変更可能 */
        this.language = "en";
        this.client = client;
        if (tableAlias !== undefined && tableAlias.trim() !== '') {
            this.tableAlias = tableAlias;
        }
    }
    /**
     * テーブル結合条件を追加する。executeSelect等の実行時にSQL化される。
     * @param joinType 結合種別（inner / left / full）
     * @param joinModel 結合対象のモデル
     * @param conditions 結合条件
     */
    join(joinType, joinModel, conditions) {
        this.joinConditions.push({ type: joinType, model: joinModel, conditions: conditions });
    }
    /**
     * GROUP BY句にカラムを追加する。
     * @param column カラム名またはTColumnInfo
     */
    groupBy(column) {
        if (typeof column === 'string') {
            column = { model: this, name: column };
        }
        this.groupExpression.push(column.model.getColumn(column.name).expression);
    }
    /**
     * ORDER BY句にカラムを追加する。
     * @param column カラム名またはTColumnInfo
     * @param sortKeyword 'asc' | 'desc'
     */
    orderBy(column, sortKeyword) {
        if (typeof column === 'string') {
            column = { model: this, name: column };
        }
        this.sortExpression.push(`${column.model.getColumn(column.name).expression} ${sortKeyword}`);
    }
    /**
     * ORDER BY句に生のSQL式を追加する。
     * @param query SQL式（例: "CASE WHEN ... END"）
     * @param sortKeyword 'asc' | 'desc'
     */
    orderBySentence(query, sortKeyword) {
        this.sortExpression.push(`${query} ${sortKeyword}`);
    }
    /** 現在の言語に対応するエラーメッセージテンプレートを返す */
    get errorMessages() {
        return this.language === 'ja' ? MessageUtil_1.default.optionErrorMessageJapan : MessageUtil_1.default.optionErrorMessageEnglish;
    }
    /** カラム定義に基づいてエラーメッセージを組み立て、UnprocessableExceptionをthrowする */
    throwException(code, type, columnName, value) {
        var _a, _b, _c;
        const column = this.getColumn(columnName);
        let message = this.errorMessages[type];
        const name = (column.alias === undefined || column.alias === '') ? columnName : column.alias;
        message = message.replace('{name}', name);
        if (message.includes("{length}") && (column.type === 'string' || column.type === 'string[]')) {
            message = message.replace('{length}', ((_a = column.length) !== null && _a !== void 0 ? _a : '未設定').toString());
        }
        if (message.includes("{min}") && (column.type === 'integer' || column.type === 'integer[]')) {
            message = message.replace('{min}', ((_b = column.min) !== null && _b !== void 0 ? _b : '').toString());
        }
        if (message.includes("{max}") && (column.type === 'integer' || column.type === 'integer[]')) {
            message = message.replace('{max}', ((_c = column.max) !== null && _c !== void 0 ? _c : '').toString());
        }
        this.throwUnprocessableException(code, message);
    }
    /** 入力エラー（400 Bad Request）をthrowする */
    throwInputErrorException(code, message) {
        throw new Exception_1.InputErrorException(`${this.id}-${code}`, message);
    }
    /** DB競合エラー（409 Conflict）をthrowする */
    throwDbCoflictException(code, message) {
        throw new Exception_1.DbConflictException(`${this.id}-${code}`, message);
    }
    /** 処理不可エラー（422 Unprocessable Entity）をthrowする */
    throwUnprocessableException(code, message) {
        throw new Exception_1.UnprocessableException(`${this.id}-${code}`, message);
    }
    /** 未検出エラー（404 Not Found）をthrowする */
    throwNotFoundException(code, message) {
        throw new Exception_1.NotFoundException(`${this.id}-${code}`, message);
    }
    /**
     * insert/update時のバリデーションを行う。
     * - 型チェック（string, integer, date等）
     * - 文字列長、正規表現、最大最小値
     * - NULL許容チェック
     * - INSERT時: 必須カラムの未入力チェック、外部キー参照先の存在チェック
     *
     * サブクラスでoverrideして業務バリデーションを追加可能。
     * その際は先頭で await super.validateOptions(...) を呼ぶこと。
     */
    validateOptions(options, isInsert, pkOrId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (Object.keys(options).length === 0) {
                throw new Error('At least one key-value pair is required in options.');
            }
            for (const [key, value] of Object.entries(options)) {
                const column = this.getColumn(key);
                if (isInsert === false && column.attribute === 'primary') {
                    throw new Error(`${this.SchemaTableName}.${key} cannot be modified because it is a primary key.`);
                }
                if (value === null) {
                    if (column.attribute === 'nullable') {
                        continue;
                    }
                    this.throwException("001", "null", key, value);
                }
                if (ValidateValueUtil_1.default.isErrorValue(column.type, value)) {
                    this.throwException("002", column.type, key, value);
                }
                if (column.type === 'string') {
                    if (Number.isInteger(column.length) === false) {
                        throw new Error(`For strings, please specify the length of the column.(column: ${column.columnName})`);
                    }
                    if (value.toString().length > column.length) {
                        this.throwException("003", "length", key, value);
                    }
                    if (column.regExp !== undefined && column.regExp.test(value) === false) {
                        this.throwException("008", "regExp", key, value);
                    }
                }
                else if (column.type === 'string[]') {
                    if (Number.isInteger(column.length) === false) {
                        throw new Error(`For strings, please specify the length of the column.(column: ${column.columnName})`);
                    }
                    for (const v of value) {
                        if (v.toString().length > column.length) {
                            this.throwException("004", "length", key, v);
                        }
                        if (column.regExp !== undefined && column.regExp.test(v.toString()) === false) {
                            this.throwException("009", "regExp", key, v);
                        }
                    }
                }
                else if (column.type === 'integer') {
                    if (column.min !== undefined && column.min > Number(value)) {
                        this.throwException("010", "min", key, value);
                    }
                    if (column.max !== undefined && column.max < Number(value)) {
                        this.throwException("011", "max", key, value);
                    }
                }
                else if (column.type === 'integer[]') {
                    for (const v of value) {
                        if (column.min !== undefined && column.min > Number(v)) {
                            this.throwException("010", "min", key, v);
                        }
                        if (column.max !== undefined && column.max < Number(v)) {
                            this.throwException("011", "max", key, v);
                        }
                    }
                }
            }
            if (isInsert) {
                for (const key in this.Columns) {
                    const column = this.getColumn(key);
                    if (options[key] === undefined || options[key] === null) {
                        if (column.attribute === "primary" || column.attribute === "noDefault") {
                            this.throwException("005", "notInput", key, options[key]);
                        }
                    }
                }
                for (const ref of this.References) {
                    const refValues = ref.columns.map(col => options[col.target]);
                    if (refValues.every(value => value === null || value === undefined)) {
                        continue;
                    }
                    if (refValues.some(value => value === null || value === undefined)) {
                        const name = ref.columns.map(col => { var _a; return (_a = this.getColumn(col.target).alias) !== null && _a !== void 0 ? _a : this.getColumn(col.target).columnName; }).join(',');
                        this.throwUnprocessableException("006", this.errorMessages.null.replace('{name}', name));
                    }
                    let refIndex = 1;
                    const sql = `SELECT COUNT(*) as count FROM ${ref.table} WHERE ${ref.columns.map(col => `${col.ref} = ${this.placeholder(refIndex++)}`).join(" AND ")}`;
                    const datas = yield this.clientQuery(sql, refValues);
                    if (datas.rows[0].count == "0") {
                        const name = ref.columns.map(col => { var _a; return (_a = this.getColumn(col.target).alias) !== null && _a !== void 0 ? _a : this.getColumn(col.target).columnName; }).join(',');
                        this.throwUnprocessableException("007", this.errorMessages.fk.replace('{name}', name));
                    }
                }
            }
        });
    }
    executeQuery(param1, vars) {
        return __awaiter(this, void 0, void 0, function* () {
            this.selectExpressions = [];
            this.whereExpressions = [];
            this.joinConditions = [];
            this.sortExpression = [];
            this.SortKeyword = 'asc';
            this.groupExpression = [];
            this.vars = [];
            this.Offset = undefined;
            this.Limit = undefined;
            let sql = '';
            if (typeof param1 === 'string') {
                sql = param1;
            }
            else {
                sql = param1.expression;
                vars = param1.vars;
            }
            return yield this.clientQuery(sql, vars);
        });
    }
    /** IDbClient経由でSQLを実行する。IsOutputLog=trueの場合はSQL・結果をログ出力する */
    clientQuery(sql, vars) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.IsOutputLog) {
                console.log("--- Debug Sql ----------");
                console.log(sql);
                console.log(vars);
            }
            const data = yield this.client.query(sql, vars !== null && vars !== void 0 ? vars : []);
            if (this.IsOutputLog) {
                console.log("- 実行結果");
                if (data.rowCount == 0) {
                    console.log("データなし");
                }
                else {
                    let log = "";
                    for (let i = 0; i < data.fields.length; i++) {
                        log += i == 0 ? "" : ",";
                        log += data.fields[i].name;
                    }
                    console.log(log);
                    for (let i = 0; i < data.rows.length; i++) {
                        log = "";
                        for (let j = 0; j < data.fields.length; j++) {
                            let key = data.fields[j].name;
                            log += j == 0 ? "" : ",";
                            log += data.rows[i][key];
                        }
                        console.log(log);
                    }
                }
            }
            return data;
        });
    }
    /**
     * 業務バリデーション用ヘルパー（遅延初期化）。
     * validateInList, validateUnderToday, validateRegExp, validatePositiveNumber等を提供。
     */
    get ValidateClient() {
        if (this.validateClient === undefined) {
            this.validateClient = new ValidateClient_1.default(this);
        }
        return this.validateClient;
    }
    /**
     * SQL式組み立てヘルパー（遅延初期化）。
     * CASE式の生成、文字列・数値リテラルのSQL変換等を提供。
     */
    get ExpressionClient() {
        if (this.expressionClient === undefined) {
            this.expressionClient = new ExpressionClient_1.default(this);
        }
        return this.expressionClient;
    }
}
exports.BaseTableModel = BaseTableModel;
