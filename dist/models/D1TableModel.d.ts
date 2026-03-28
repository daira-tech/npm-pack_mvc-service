import { TAggregateFuncType, TColumnInfo, TKeyFormat, TD1Column, TD1NestedCondition, TD1Operator, TSelectExpression, TSortKeyword } from "./Type";
import { BaseTableModel } from './BaseTableModel';
/**
 * Cloudflare D1（SQLite）用のテーブルモデル。
 * BaseTableModelを継承し、SQLite互換のSQL生成を行う。
 *
 * PostgreSQL版（PgTableModel）との主な違い:
 * - プレースホルダ: ? （$N ではない）
 * - 日付フォーマット: strftime() （to_char() ではない）
 * - 配列型: 非対応
 * - スキーマ: 非対応
 * - ILIKE: LIKE にマッピング
 * - h2f_like/h2f_ilike: 非対応（NORMALIZE/TRANSLATE がない）
 * - UPDATE FROM / DELETE USING: 非対応（JOINを使ったUPDATE/DELETEは不可）
 * - トランザクション: D1ConnectionFactory側でno-op
 */
export declare class D1TableModel extends BaseTableModel {
    /** D1では配列型カラムを使用不可。TD1Columnに制限される */
    protected readonly columns: {
        [key: string]: TD1Column;
    };
    protected placeholder(index: number): string;
    /** D1ではスキーマ非対応。schemaNameが設定されていたらエラー */
    get SchemaTableName(): string;
    /** D1用のjoin。条件にTD1NestedConditionのみ許可（配列演算子等は使用不可） */
    join(joinType: 'left' | 'inner' | 'full', joinModel: BaseTableModel, conditions: Array<TD1NestedCondition>): void;
    private get createSqlFromJoinWhere();
    private get createSqlFromJoinWhereSortLimit();
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
    }> | '*', model: BaseTableModel): void;
    select(columls: Array<string | {
        name: string;
        alias?: string;
        func?: TAggregateFuncType;
    }> | '*', keyFormat: TKeyFormat): void;
    select(columls: Array<string | {
        name: string;
        alias?: string;
        func?: TAggregateFuncType;
    }> | '*', model: BaseTableModel, keyFormat: TKeyFormat): void;
    select(expression: string, alias: string): void;
    selectNullToValue(columnInfo: string | {
        name: string;
        model: BaseTableModel;
    }, toValue: any, alias: string): void;
    selectNullToEmptyString(column: string | {
        name: string;
        model: BaseTableModel;
    }, alias: string): void;
    selectDateAsFormat(column: string | {
        name: string;
        model: BaseTableModel;
    }, to: 'date' | 'time' | 'datetime', alias: string): void;
    where(expression: string): void;
    where(expression: string, vars: Array<any>): void;
    where(conditions: Array<TD1NestedCondition>): void;
    where(left: string, operator: TD1Operator, right: TColumnInfo | any): void;
    where(left: TColumnInfo, operator: TD1Operator, right: TColumnInfo | any): void;
    orderByList(column: string | TColumnInfo, list: Array<string | number | boolean | null>, sortKeyword: TSortKeyword): void;
    executeSelect<T = {
        [key: string]: any;
    }>(): Promise<Array<T>>;
    executeSelectForPage<T = any>(pageCount: number, currentPage: number): Promise<{
        datas: Array<T>;
        totalCount: number;
        lastPage: number;
        isLastData: boolean;
    }>;
    insert(options: {
        [key: string]: any;
    }): Promise<void>;
    update(pkOrId: string | number | boolean | {
        [key: string]: string | number | boolean;
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
}
//# sourceMappingURL=D1TableModel.d.ts.map