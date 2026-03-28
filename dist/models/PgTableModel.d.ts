import { TAggregateFuncType, TColumnInfo, TKeyFormat, TNestedCondition, TOperator, TSelectExpression, TSortKeyword } from "./Type";
import { BaseTableModel } from './BaseTableModel';
export declare class PgTableModel extends BaseTableModel {
    protected placeholder(index: number): string;
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
    where(conditions: Array<TNestedCondition>): void;
    where(left: string, operator: TOperator, right: TColumnInfo | any): void;
    where(left: TColumnInfo, operator: TOperator, right: TColumnInfo | any): void;
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
//# sourceMappingURL=PgTableModel.d.ts.map