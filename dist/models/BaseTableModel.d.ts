import { TColumn, TColumnDetail, TColumnInfo, TNestedCondition, TQuery, TSortKeyword } from "./Type";
import { IDbClient } from './IDbClient';
import ValidateClient from './ValidateClient';
import ExpressionClient from './ExpressionClient';
import { TOptionErrorMessage } from './Utils/MessageUtil';
/**
 * 全DBモデルの基底クラス。
 * テーブル定義（カラム・外部キー）、バリデーション、クエリ実行、例外処理など
 * DB方言に依存しない共通ロジックを提供する。
 * DB固有のSQL生成はサブクラス（PgTableModel, D1TableModel等）で実装する。
 */
export declare abstract class BaseTableModel {
    /** 現在日時（Controller.Nowと同期） */
    protected get Now(): Date;
    /** 現在日時の文字列表現 "YYYY-MM-DD HH:mm:ss" */
    protected get NowString(): string;
    /** 今日の0時0分0秒 */
    protected get Today(): Date;
    /** 今日の日付文字列 "YYYY-MM-DD" */
    protected get TodayString(): string;
    /** モデル識別子。エラーコードのプレフィックスに使用される */
    protected readonly id: string;
    get Id(): string;
    /** DBスキーマ名。D1では未サポートのため空文字のままにすること */
    protected readonly schemaName: string;
    get SchemaName(): string;
    /** テーブル名。サブクラスで必ず設定すること */
    protected readonly tableName: string;
    get TableName(): string;
    /** スキーマ付きテーブル名を返す。スキーマ未設定時はテーブル名のみ */
    get SchemaTableName(): string;
    /** テーブルの説明（設計書生成用） */
    protected readonly tableDescription: string;
    get TableDescription(): string;
    /** テーブルへの補足コメント（設計書生成用） */
    protected readonly comment: string;
    get Comment(): string;
    /** カラム定義。サブクラスで必ず設定すること */
    protected readonly columns: {
        [key: string]: TColumn;
    };
    get Columns(): {
        [key: string]: TColumn;
    };
    /**
     * 指定キーのカラム詳細情報を返す。
     * テーブル名・エイリアス付きのSQL式（例: "t".column_name）も含む。
     * @param key カラム名
     */
    getColumn(key: string): TColumnDetail;
    /** 外部キー制約の定義。insert時にバリデーションで参照先の存在チェックに使用 */
    protected readonly references: Array<{
        table: string;
        columns: Array<{
            target: string;
            ref: string;
        }>;
    }>;
    get References(): Array<{
        table: string;
        columns: Array<{
            target: string;
            ref: string;
        }>;
    }>;
    /**
     * 指定カラムに関連する外部キー制約を返す。
     * @param columnName 対象のカラム名
     */
    GetReferences(columnName: string): Array<{
        table: string;
        columns: Array<{
            target: string;
            ref: string;
        }>;
    }>;
    /** テーブルのSQLエイリアス。JOINで同一テーブルを複数回使う場合に設定 */
    protected readonly tableAlias?: string;
    /** エイリアスが未設定の場合はテーブル名をそのまま返す */
    get TableAlias(): string;
    /** trueにするとクエリ実行時にSQL・パラメータ・結果をconsole.logに出力する（デバッグ用） */
    IsOutputLog: boolean;
    SortKeyword: TSortKeyword;
    Offset?: number;
    Limit?: number;
    /** サブクラスのselect()等で組み立てられるSELECT句の断片リスト */
    protected selectExpressions: Array<string>;
    /** join()で蓄積されるJOIN条件リスト */
    protected joinConditions: Array<{
        type: 'inner' | 'left' | 'full';
        model: BaseTableModel;
        conditions: Array<TNestedCondition>;
    }>;
    /** where()で蓄積されるWHERE句の断片リスト（ANDで結合される） */
    protected whereExpressions: Array<string>;
    /** groupBy()で蓄積されるGROUP BY式リスト */
    protected groupExpression: Array<string>;
    /** orderBy()で蓄積されるORDER BY式リスト */
    protected sortExpression: Array<string>;
    /** プレースホルダに対応するバインド変数のリスト */
    protected vars: Array<any>;
    private client;
    get Client(): IDbClient;
    /**
     * @param client DBクライアント（IDbClient実装）
     * @param tableAlias JOINで同テーブルを複数回使う場合のエイリアス
     */
    constructor(client: IDbClient, tableAlias?: string);
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
    join(joinType: 'left' | 'inner' | 'full', joinModel: BaseTableModel, conditions: Array<TNestedCondition>): void;
    /**
     * GROUP BY句にカラムを追加する。
     * @param column カラム名またはTColumnInfo
     */
    groupBy(column: string | TColumnInfo): void;
    /**
     * ORDER BY句にカラムを追加する。
     * @param column カラム名またはTColumnInfo
     * @param sortKeyword 'asc' | 'desc'
     */
    orderBy(column: string | TColumnInfo, sortKeyword: TSortKeyword): void;
    /**
     * ORDER BY句に生のSQL式を追加する。
     * @param query SQL式（例: "CASE WHEN ... END"）
     * @param sortKeyword 'asc' | 'desc'
     */
    orderBySentence(query: string, sortKeyword: TSortKeyword): void;
    /** バリデーションエラーメッセージの言語。サブクラスで "ja" に変更可能 */
    protected readonly language: "ja" | "en";
    /** 現在の言語に対応するエラーメッセージテンプレートを返す */
    protected get errorMessages(): TOptionErrorMessage;
    /** カラム定義に基づいてエラーメッセージを組み立て、UnprocessableExceptionをthrowする */
    private throwException;
    /** 入力エラー（400 Bad Request）をthrowする */
    protected throwInputErrorException(code: string, message: string): never;
    /** DB競合エラー（409 Conflict）をthrowする */
    protected throwDbCoflictException(code: string, message: string): never;
    /** 処理不可エラー（422 Unprocessable Entity）をthrowする */
    protected throwUnprocessableException(code: string, message: string): never;
    /** 未検出エラー（404 Not Found）をthrowする */
    protected throwNotFoundException(code: string, message: string): never;
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
    protected validateOptions(options: {
        [key: string]: any;
    }, isInsert: boolean, pkOrId?: string | number | boolean | {
        [key: string]: any;
    }): Promise<void>;
    /**
     * SQLを実行し、クエリ組み立て状態（select/where/join/vars等）をリセットする。
     * サブクラスのfind, insert, executeSelect等から呼ばれる。
     */
    protected executeQuery(param1: string, vars?: Array<any>): Promise<any>;
    protected executeQuery(param1: TQuery): Promise<any>;
    /** IDbClient経由でSQLを実行する。IsOutputLog=trueの場合はSQL・結果をログ出力する */
    protected clientQuery(sql: string, vars?: Array<any>): Promise<any>;
    private validateClient?;
    /**
     * 業務バリデーション用ヘルパー（遅延初期化）。
     * validateInList, validateUnderToday, validateRegExp, validatePositiveNumber等を提供。
     */
    get ValidateClient(): ValidateClient;
    private expressionClient?;
    /**
     * SQL式組み立てヘルパー（遅延初期化）。
     * CASE式の生成、文字列・数値リテラルのSQL変換等を提供。
     */
    get ExpressionClient(): ExpressionClient;
}
//# sourceMappingURL=BaseTableModel.d.ts.map