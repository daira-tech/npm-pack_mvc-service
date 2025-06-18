import { TableModel } from "./TableModel";

export type TSqlValue = string | number | boolean | Date | null | Array<string | null> | Array<number | null> | Array<Date | null> | Array<Boolean | null>;

// column type
export type TColumnAttribute = "primary" | "nullable" | "hasDefault" | "noDefault";
export type TColumnType = "number" | "string" | "uuid" |  "date" | "time" | "timestamp" | "bool";
export type TColumnArrayType = "number[]" | "string[]" | "uuid[]" |  "date[]" | "time[]" | "timestamp[]" | "bool[]";
type TColumnBase = {
    alias?: string,
    type: TColumnType | TColumnArrayType,
    attribute: TColumnAttribute,
    default?: string,
    comment?: string
};

type TStringColumn = TColumnBase & {
    type: "string",
    length: number
};

type TNonStringColumn = TColumnBase & {
    type: Exclude<TColumnType, "string">,
    length?: undefined
};

type TStringArrayColumn = TColumnBase & {
    type: "string[]",
    length: number,
    attribute: Exclude<TColumnAttribute, "primary">
};

type TArrayColumn = TColumnBase & {
    type:  Exclude<TColumnArrayType, "string[]">,
    length?: undefined,
    attribute: Exclude<TColumnAttribute, "primary">
};

export type TColumn = TStringColumn | TNonStringColumn | TStringArrayColumn | TArrayColumn;
export type TColumnDetail = TColumn & {
    columnName: string,
    tableName: string,
    expression: string
}

export type TOperator = "=" | "!=" | ">" | ">=" | "<" | "<=" | "like" | "ilike" | "h2f_like" | "h2f_ilike" | "in" | "not in";
export type TColumnInfo = { model: TableModel, name: string }
export type TQuery = {sql: string, vars?: Array<any>};
export type TSelectExpression = { expression: string, alias: string }
export type TAggregateFuncType = 'sum' | 'avg' | 'max' | 'min' | 'count';
export type TCondition = string | {
    l: string | TColumnInfo, 
    o: TOperator, 
    r: TSqlValue | Array<TSqlValue> | TColumnInfo
};
export type TNestedCondition = TCondition | ['AND' | 'OR', ...TNestedCondition[]] | TNestedCondition[];
export type TSortKeyword = 'desc' | 'asc';
export type TKeyFormat = 'snake' | 'lowerCamel';
export type TOption = {[key: string]: TSqlValue};