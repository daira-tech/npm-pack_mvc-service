import { Pool, PoolClient } from 'pg';
import { TAggregateFuncType, TColumn, TColumnDetail, TColumnInfo, TKeyFormat, TNestedCondition, TOperator, TQuery, TSelectExpression, TSortKeyword } from "./Type";
import ValidateClient from './ValidateClient';
import ExpressionClient from './ExpressionClient';
import { TOptionErrorMessage } from './Utils/MessageUtil';
export declare class TableModel {
    protected readonly id: string;
    get Id(): string;
    protected readonly schemaName: string;
    get SchemaName(): string;
    protected readonly tableName: string;
    get TableName(): string;
    get SchemaTableName(): string;
    protected readonly tableDescription: string;
    get TableDescription(): string;
    protected readonly comment: string;
    get Comment(): string;
    protected readonly columns: {
        [key: string]: TColumn;
    };
    get Columns(): {
        [key: string]: TColumn;
    };
    getColumn(key: string): TColumnDetail;
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
    GetReferences(columnName: string): Array<{
        table: string;
        columns: Array<{
            target: string;
            ref: string;
        }>;
    }>;
    protected readonly tableAlias?: string;
    get TableAlias(): string;
    IsOutputLog: boolean;
    SortKeyword: TSortKeyword;
    Offset?: number;
    Limit?: number;
    private selectExpressions;
    private joinConditions;
    private whereExpressions;
    private groupExpression;
    private sortExpression;
    private vars;
    private get createSqlFromJoinWhere();
    private get createSqlFromJoinWhereSortLimit();
    private client;
    get Client(): PoolClient | Pool;
    constructor(client: Pool | PoolClient, tableAlias?: string);
    find<T = {
        [key: string]: any;
    }>(pk: {
        [key: string]: any;
    }): Promise<T | null>;
    find<T = {
        [key: string]: any;
    }>(id: string | number | boolean): Promise<T | null>;
    find<T = {
        [key: string]: any;
    }>(pk: {
        [key: string]: any;
    }, selectColumns: Array<string> | "*" | null): Promise<T | null>;
    find<T = {
        [key: string]: any;
    }>(id: string | number | boolean, selectColumns: Array<string> | "*" | null): Promise<T | null>;
    find<T = {
        [key: string]: any;
    }>(pk: {
        [key: string]: any;
    }, selectColumns: Array<string> | "*" | null, selectExpressions: Array<TSelectExpression> | null): Promise<T | null>;
    find<T = {
        [key: string]: any;
    }>(id: string | number | boolean, selectColumns: Array<string> | "*" | null, selectExpressions: Array<TSelectExpression> | null): Promise<T | null>;
    find<T = {
        [key: string]: any;
    }>(pk: {
        [key: string]: any;
    }, selectColumns: Array<string> | "*" | null, selectExpressions: Array<TSelectExpression> | null, keyFormat: TKeyFormat): Promise<T | null>;
    find<T = {
        [key: string]: any;
    }>(id: string | number | boolean, selectColumns: Array<string> | "*" | null, selectExpressions: Array<TSelectExpression> | null, keyFormat: TKeyFormat): Promise<T | null>;
    select(): void;
    select(columls: Array<string | {
        name: string;
        alias?: string;
        func?: TAggregateFuncType;
    }> | '*'): void;
    select(columls: Array<string | {
        name: string;
        alias?: string;
        func?: TAggregateFuncType;
    }> | '*', model: TableModel): void;
    select(columls: Array<string | {
        name: string;
        alias?: string;
        func?: TAggregateFuncType;
    }> | '*', keyFormat: TKeyFormat): void;
    select(columls: Array<string | {
        name: string;
        alias?: string;
        func?: TAggregateFuncType;
    }> | '*', model: TableModel, keyFormat: TKeyFormat): void;
    select(expression: string, alias: string): void;
    /**
     * 指定されたカラム情報がNULLの場合に、指定された値に変換して選択します。
     *
     * @param columnInfo カラム情報。文字列または{name: string, model: TableModel}のオブジェクト。
     * @param toValue NULLの場合に変換する値。
     * @param alias 結果セットで使用するエイリアス名。
     */
    selectNullToValue(columnInfo: string | {
        name: string;
        model: TableModel;
    }, toValue: any, alias: string): void;
    /**
     * 指定されたカラムを特定のフォーマットの日付情報に変換し、SELECT句で使用します。
     *
     * @param column カラム情報。文字列または{name: string, model: TableModel}のオブジェクト。
     * @param to 変換先のフォーマットを指定します。'date'、'time'、'datetime'のいずれか。
     * @param alias 結果セットで使用するエイリアス名。
     */
    selectDateAsFormat(column: string | {
        name: string;
        model: TableModel;
    }, to: 'date' | 'time' | 'datetime', alias: string): void;
    /**
     * 指定された条件に基づいてテーブルを結合します。
     * @param joinType 結合の種類を指定します
     * @param joinBaseModel 結合する対象のBaseModelインスタンスを指定します。
     * @param conditions 結合条件を指定します。条件はオブジェクトまたは文字列で指定できます。
     */
    join(joinType: 'left' | 'inner' | 'full', joinModel: TableModel, conditions: Array<TNestedCondition>): void;
    where(expression: string): void;
    where(expression: string, vars: Array<any>): void;
    where(conditions: Array<TNestedCondition>): void;
    where(left: string, operator: TOperator, right: TColumnInfo | any): void;
    where(left: TColumnInfo, operator: TOperator, right: TColumnInfo | any): void;
    groupBy(column: string | TColumnInfo): void;
    orderBy(column: string | TColumnInfo, sortKeyword: TSortKeyword): void;
    orderByList(column: string | TColumnInfo, list: Array<string | number | boolean | null>, sortKeyword: TSortKeyword): void;
    orderBySentence(query: string, sortKeyword: TSortKeyword): void;
    executeSelect<T = {
        [key: string]: any;
    }>(): Promise<Array<T>>;
    executeSelectForPage<T = any>(pageCount: number, currentPage: number): Promise<{
        datas: Array<T>;
        totalCount: number;
        lastPage: number;
        isLastData: boolean;
    }>;
    protected readonly errorMessages: TOptionErrorMessage;
    private throwException;
    protected throwDbCoflictException(code: string, message: string): never;
    protected throwUnprocessableException(code: string, message: string): never;
    protected throwNotFoundException(code: string, message: string): never;
    protected validateOptions(options: {
        [key: string]: any;
    }, isInsert: boolean, pkOrId?: string | number | boolean | {
        [key: string]: any;
    }): Promise<void>;
    insert(options: {
        [key: string]: any;
    }): Promise<void>;
    update(pkOrId: string | number | boolean | {
        [key: string]: any;
    }, options: {
        [key: string]: any;
    }): Promise<void>;
    delete(pkOrId: string | number | boolean | {
        [key: string]: any;
    }): Promise<void>;
    executeUpdate(options: {
        [key: string]: any;
    }): Promise<number>;
    executeDelete(): Promise<number>;
    protected executeQuery(param1: string, vars?: Array<any>): Promise<any>;
    protected executeQuery(param1: TQuery): Promise<any>;
    private clientQuery;
    private validateClient?;
    get ValidateClient(): ValidateClient;
    private expressionClient?;
    get ExpressionClient(): ExpressionClient;
}
//# sourceMappingURL=TableModel.d.ts.map