import { TColumn, TColumnArrayType, TColumnDetail, TColumnInfo, TColumnType, TKeyFormat, TNestedCondition, TQuery, TSortKeyword } from "./Type";
import { IDbClient } from './IDbClient';
import ValidateValueUtil from './ValidateValueUtil';
import ValidateClient from './ValidateClient';
import { DbConflictException, InputErrorException, NotFoundException, UnprocessableException } from '../exceptions/Exception';
import ExpressionClient from './ExpressionClient';
import MessageUtil, { TOptionErrorMessage } from './Utils/MessageUtil';
import { Controller } from '../Controller';

/**
 * 全DBモデルの基底クラス。
 * テーブル定義（カラム・外部キー）、バリデーション、クエリ実行、例外処理など
 * DB方言に依存しない共通ロジックを提供する。
 * DB固有のSQL生成はサブクラス（PgTableModel, D1TableModel等）で実装する。
 */
export abstract class BaseTableModel {

    /** 現在日時（Controller.Nowと同期） */
    protected get Now(): Date { return Controller.Now; }
    /** 現在日時の文字列表現 "YYYY-MM-DD HH:mm:ss" */
    protected get NowString(): string { return Controller.NowString; }
    /** 今日の0時0分0秒 */
    protected get Today(): Date { return Controller.Today; }
    /** 今日の日付文字列 "YYYY-MM-DD" */
    protected get TodayString(): string { return Controller.TodayString; }

    /** モデル識別子。エラーコードのプレフィックスに使用される */
    protected readonly id: string = "";
    get Id(): string { return this.id; }
    /** DBスキーマ名。D1では未サポートのため空文字のままにすること */
    protected readonly schemaName: string = "";
    get SchemaName(): string { return this.schemaName; }
    /** テーブル名。サブクラスで必ず設定すること */
    protected readonly tableName: string = "";
    get TableName(): string { 
        if (this.tableName === "") {
            throw new Error("Please set the tableName for TableModel.");
        }
        return this.tableName;
    }

    /** スキーマ付きテーブル名を返す。スキーマ未設定時はテーブル名のみ */
    get SchemaTableName(): string { 
        if (this.tableName === "") {
            throw new Error("Please set the tableName for TableModel.");
        }

        if (this.schemaName === "") {
            return this.tableName;
        }

        return this.schemaName + "." + this.tableName;
    }
    /** テーブルの説明（設計書生成用） */
    protected readonly tableDescription: string = "";
    get TableDescription(): string { return this.tableDescription; }
    /** テーブルへの補足コメント（設計書生成用） */
    protected readonly comment: string = "";
    get Comment(): string { return this.comment; }
    /** カラム定義。サブクラスで必ず設定すること */
    protected readonly columns: { [key: string]: TColumn } = {};
    get Columns(): { [key: string]: TColumn } { 
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
    public getColumn(key: string): TColumnDetail {
        if (key in this.Columns === false) {
            throw new Error(`${this.TableName} does not contain ${key}.`);
        }

        return { 
            ...this.Columns[key],
            columnName: key,
            tableName: this.TableName,
            expression: `"${this.TableAlias}".${key}`
        };
    }
    /** 外部キー制約の定義。insert時にバリデーションで参照先の存在チェックに使用 */
    protected readonly references: Array<{table: string, columns: Array<{target: string, ref: string}>}> = [];
    get References(): Array<{table: string, columns: Array<{target: string, ref: string}>}> { return this.references; }
    /**
     * 指定カラムに関連する外部キー制約を返す。
     * @param columnName 対象のカラム名
     */
    public GetReferences(columnName: string): Array<{table: string, columns: Array<{target: string, ref: string}>}> {
        const _ = this.getColumn(columnName);
        const references: Array<{table: string, columns: Array<{target: string, ref: string}>}> = [];
        for (const ref of this.References) {
            if (ref.columns.filter(col => col.target === columnName).length > 0) {
                references.push(ref);
            }
        }

        return references;
    }

    /** テーブルのSQLエイリアス。JOINで同一テーブルを複数回使う場合に設定 */
    protected readonly tableAlias?: string;
    /** エイリアスが未設定の場合はテーブル名をそのまま返す */
    get TableAlias(): string {
        return this.tableAlias === undefined ? this.TableName : this.tableAlias;
    }

    /** trueにするとクエリ実行時にSQL・パラメータ・結果をconsole.logに出力する（デバッグ用） */
    public IsOutputLog: boolean = false;
    public SortKeyword: TSortKeyword = 'asc';
    public Offset?: number;
    public Limit?: number;

    /** サブクラスのselect()等で組み立てられるSELECT句の断片リスト */
    protected selectExpressions: Array<string> = [];
    /** join()で蓄積されるJOIN条件リスト */
    protected joinConditions: Array<{
        type: 'inner' | 'left' | 'full',
        model: BaseTableModel,
        conditions: Array<TNestedCondition>
    }> = [];
    /** where()で蓄積されるWHERE句の断片リスト（ANDで結合される） */
    protected whereExpressions: Array<string> = [];
    /** groupBy()で蓄積されるGROUP BY式リスト */
    protected groupExpression: Array<string> = [];
    /** orderBy()で蓄積されるORDER BY式リスト */
    protected sortExpression: Array<string> = [];
    /** プレースホルダに対応するバインド変数のリスト */
    protected vars: Array<any> = [];

    private client: IDbClient;
    get Client(): IDbClient {
        return this.client;
    }

    /**
     * @param client DBクライアント（IDbClient実装）
     * @param tableAlias JOINで同テーブルを複数回使う場合のエイリアス
     */
    constructor(client: IDbClient, tableAlias?: string) {
        this.client = client;
        if (tableAlias !== undefined && tableAlias.trim() !== '') {
            this.tableAlias = tableAlias;
        }
    }

    /**
     * SQLのパラメータプレースホルダを返す。DB方言ごとに異なる。
     * - PostgreSQL: `$1`, `$2`, `$3` ...
     * - D1/SQLite: `?`
     * @param index 1始まりのパラメータ番号
     */
    protected abstract placeholder(index: number): string;

    /**
     * テーブル結合条件を追加する。executeSelect等の実行時にSQL化される。
     * @param joinType 結合種別（inner / left / full）
     * @param joinModel 結合対象のモデル
     * @param conditions 結合条件
     */
    public join(joinType: 'left' | 'inner' | 'full', joinModel: BaseTableModel, conditions: Array<TNestedCondition>): void {
        this.joinConditions.push({type: joinType, model: joinModel, conditions: conditions});
    }

    /**
     * GROUP BY句にカラムを追加する。
     * @param column カラム名またはTColumnInfo
     */
    public groupBy(column: string | TColumnInfo): void {
        if (typeof column === 'string') {
            column = {model: this, name: column};
        }
        this.groupExpression.push(column.model.getColumn(column.name).expression);
    }

    /**
     * ORDER BY句にカラムを追加する。
     * @param column カラム名またはTColumnInfo
     * @param sortKeyword 'asc' | 'desc'
     */
    public orderBy(column: string | TColumnInfo, sortKeyword: TSortKeyword) {
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
    public orderBySentence(query: string, sortKeyword: TSortKeyword): void {
        this.sortExpression.push(`${query} ${sortKeyword}`);
    }

    /** バリデーションエラーメッセージの言語。サブクラスで "ja" に変更可能 */
    protected readonly language: "ja" | "en" = "en";
    /** 現在の言語に対応するエラーメッセージテンプレートを返す */
    protected get errorMessages(): TOptionErrorMessage {
        return this.language === 'ja' ? MessageUtil.optionErrorMessageJapan : MessageUtil.optionErrorMessageEnglish;
    }

    /** カラム定義に基づいてエラーメッセージを組み立て、UnprocessableExceptionをthrowする */
    private throwException(code: string, type: TColumnType | TColumnArrayType | 'length' | 'regExp' | 'min' | 'max' | 'null' | 'notInput' | 'fk', columnName: string, value: any): never {
        const column = this.getColumn(columnName);
        
        let message = this.errorMessages[type];

        const name = (column.alias === undefined || column.alias === '') ? columnName : column.alias;
        message = message.replace('{name}', name);
        if (message.includes("{length}") && (column.type === 'string' || column.type === 'string[]')) {
            message = message.replace('{length}', (column.length ?? '未設定').toString());
        } 
        if (message.includes("{min}") && (column.type === 'integer' || column.type === 'integer[]')) {
            message = message.replace('{min}', (column.min ?? '').toString());
        }
        if (message.includes("{max}") && (column.type === 'integer' || column.type === 'integer[]')) {
            message = message.replace('{max}', (column.max ?? '').toString());
        }

        this.throwUnprocessableException(code, message);
    }

    /** 入力エラー（400 Bad Request）をthrowする */
    protected throwInputErrorException(code: string, message: string): never {
        throw new InputErrorException(`${this.id}-${code}`, message);
    }

    /** DB競合エラー（409 Conflict）をthrowする */
    protected throwDbCoflictException(code: string, message: string): never {
        throw new DbConflictException(`${this.id}-${code}`, message);
    }

    /** 処理不可エラー（422 Unprocessable Entity）をthrowする */
    protected throwUnprocessableException(code: string, message: string): never {
        throw new UnprocessableException(`${this.id}-${code}`, message);
    }

    /** 未検出エラー（404 Not Found）をthrowする */
    protected throwNotFoundException(code: string, message: string): never {
        throw new NotFoundException(`${this.id}-${code}`, message);
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
    protected async validateOptions(options: {[key: string]: any}, isInsert: boolean, pkOrId?: string | number | boolean | {[key: string]: any}): Promise<void> {
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

            if (ValidateValueUtil.isErrorValue(column.type, value)) {
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
            } else if (column.type === 'string[]') {
                if (Number.isInteger(column.length) === false) {
                    throw new Error(`For strings, please specify the length of the column.(column: ${column.columnName})`);
                }

                for (const v of value as Array<string | number | boolean>) {
                    if (v.toString().length > column.length) {
                        this.throwException("004", "length", key, v);
                    }

                    if (column.regExp !== undefined && column.regExp.test(v.toString()) === false) {
                        this.throwException("009", "regExp", key, v);
                    }
                }
            } else if (column.type === 'integer') {
                if (column.min !== undefined && column.min > Number(value)) {
                    this.throwException("010", "min", key, value);
                }

                if (column.max !== undefined && column.max < Number(value)) {
                    this.throwException("011", "max", key, value);
                }
            } else if(column.type === 'integer[]') {
                for (const v of value as Array<string | number | boolean>) {
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
                    const name = ref.columns.map(col => this.getColumn(col.target).alias ?? this.getColumn(col.target).columnName).join(',');
                    this.throwUnprocessableException("006", this.errorMessages.null.replace('{name}', name));
                }

                let refIndex = 1;
                const sql = `SELECT COUNT(*) as count FROM ${ref.table} WHERE ${ref.columns.map(col => `${col.ref} = ${this.placeholder(refIndex++)}`).join(" AND ")}`;
                const datas = await this.clientQuery(sql, refValues);
                if (datas.rows[0].count == "0") {
                    const name = ref.columns.map(col => this.getColumn(col.target).alias ?? this.getColumn(col.target).columnName).join(',');
                    this.throwUnprocessableException("007", this.errorMessages.fk.replace('{name}', name))
                }
            }
        }
    }

    /**
     * SQLを実行し、クエリ組み立て状態（select/where/join/vars等）をリセットする。
     * サブクラスのfind, insert, executeSelect等から呼ばれる。
     */
    protected executeQuery(param1: string, vars?: Array<any>) : Promise<any>;
    protected executeQuery(param1: TQuery) : Promise<any>;
    protected async executeQuery(param1: string | TQuery, vars?: Array<any>) : Promise<any> {

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
        } else {
            sql = param1.expression;
            vars = param1.vars;
        }

        return await this.clientQuery(sql, vars);
    }

    /** IDbClient経由でSQLを実行する。IsOutputLog=trueの場合はSQL・結果をログ出力する */
    protected async clientQuery(sql: string, vars?: Array<any>) {
        if (this.IsOutputLog) {
            console.log("--- Debug Sql ----------");
            console.log(sql);
            console.log(vars);
        }

        const data = await this.client.query(sql, vars ?? []);
        if (this.IsOutputLog) {
            console.log("- 実行結果");
            if (data.rowCount == 0) {
                console.log("データなし");
            } else {
                let log = "";
                for (let i = 0;i < data.fields.length;i++) {
                    log += i == 0 ? "" : ",";
                    log += data.fields[i].name;
                }
                console.log(log);
        
                for (let i = 0;i < data.rows.length;i++) {
                    log = "";
                    for (let j = 0;j < data.fields.length;j++) {
                        let key = data.fields[j].name;
                        log += j == 0 ? "" : ",";
                        log += data.rows[i][key];
                    }
                    console.log(log);
                }
            }
        }

        return data;
    }

    private validateClient?: ValidateClient;
    /**
     * 業務バリデーション用ヘルパー（遅延初期化）。
     * validateInList, validateUnderToday, validateRegExp, validatePositiveNumber等を提供。
     */
    get ValidateClient(): ValidateClient {
        if (this.validateClient === undefined) {
            this.validateClient = new ValidateClient(this);
        }

        return this.validateClient;
    }

    private expressionClient?: ExpressionClient;
    /**
     * SQL式組み立てヘルパー（遅延初期化）。
     * CASE式の生成、文字列・数値リテラルのSQL変換等を提供。
     */
    get ExpressionClient(): ExpressionClient {
        if (this.expressionClient === undefined) {
            this.expressionClient = new ExpressionClient(this);
        }

        return this.expressionClient;
    }
}
