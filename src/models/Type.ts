import { BaseTableModel } from "./BaseTableModel";

// column type
export type TColumnAttribute = "primary" | "nullable" | "hasDefault" | "noDefault";
export type TColumnType = "integer" | "real" | "string" | "uuid" |  "date" | "time" | "timestamp" | "bool" | "json" | "jsonb";
export type TColumnArrayType = "integer[]" | "real[]" | "string[]" | "uuid[]" |  "date[]" | "time[]" | "timestamp[]" | "bool[]" | "json[]" | "jsonb[]";
type TColumnBase = {
    alias?: string,
    type: TColumnType | TColumnArrayType,
    attribute: TColumnAttribute,
    default?: string,
    comment?: string
};

type TStringColumn = TColumnBase & {
    type: "string";
    length: number;
    regExp?: RegExp;
};

type TIntegerColumn = TColumnBase & {
    type: "integer";
    max?: number;
    min?: number;
};

type TJsonColumn = TColumnBase & {
    type: "json" | "jsonb"
    length?: undefined,
    attribute: Exclude<TColumnAttribute, "primary">
};

type TBasicColumn = TColumnBase & {
    type: Exclude<TColumnType, "string" | "integer">,
    length?: undefined,
};

type TStringArrayColumn = TColumnBase & {
    type: "string[]";
    length: number;
    regExp?: RegExp;
    attribute: Exclude<TColumnAttribute, "primary">
};

type TIntegerArrayColumn = TColumnBase & {
    type: "integer[]";
    max?: number;
    min?: number;
    attribute: Exclude<TColumnAttribute, "primary">
};

type TArrayColumn = TColumnBase & {
    type:  Exclude<TColumnArrayType, "string[]" | "integer[]">,
    length?: undefined,
    attribute: Exclude<TColumnAttribute, "primary">
};

export type TColumn = TStringColumn | TIntegerColumn | TJsonColumn | TBasicColumn | TStringArrayColumn | TIntegerArrayColumn | TArrayColumn;
export type TColumnDetail = TColumn & {
    columnName: string,
    tableName: string,
    expression: string
}

export type TOperator = "=" | "!=" | ">" | ">=" | "<" | "<=" | "like" | "ilike" | "h2f_like" | "h2f_ilike" | "in" | "not in" | "any" | "@>" | "&&";
export type TColumnInfo = { model: BaseTableModel, name: string }
export type TQuery = {expression: string, vars?: Array<any>};
export type TSelectExpression = { expression: string, alias: string }
export type TAggregateFuncType = 'sum' | 'avg' | 'max' | 'min' | 'count';
export type TCondition = string | {
    l: string | TColumnInfo, 
    o: TOperator, 
    r: any | TColumnInfo
};
export type TNestedCondition = TCondition | ['AND' | 'OR', ...TNestedCondition[]] | TNestedCondition[];
export type TSortKeyword = 'desc' | 'asc';
export type TKeyFormat = 'snake' | 'lowerCamel';

// D1/SQLite specific types
/** D1で使用可能な演算子。配列演算子(any, @>, &&)とh2f_like/h2f_ilikeを除外 */
export type TD1Operator = "=" | "!=" | ">" | ">=" | "<" | "<=" | "like" | "ilike" | "in" | "not in";
/** D1で使用可能なカラム型。配列型(string[], integer[]等)を除外 */
export type TD1Column = TStringColumn | TIntegerColumn | TJsonColumn | TBasicColumn;
export type TD1Condition = string | {
    l: string | TColumnInfo, 
    o: TD1Operator, 
    r: any | TColumnInfo
};
export type TD1NestedCondition = TD1Condition | ['AND' | 'OR', ...TD1NestedCondition[]] | TD1NestedCondition[];