import { TableModel } from "./TableModel";
export type TColumnAttribute = "primary" | "nullable" | "hasDefault" | "noDefault";
export type TColumnType = "integer" | "real" | "string" | "uuid" | "date" | "time" | "timestamp" | "bool" | "json" | "jsonb";
export type TColumnArrayType = "integer[]" | "real[]" | "string[]" | "uuid[]" | "date[]" | "time[]" | "timestamp[]" | "bool[]" | "json[]" | "jsonb[]";
type TColumnBase = {
    alias?: string;
    type: TColumnType | TColumnArrayType;
    attribute: TColumnAttribute;
    default?: string;
    comment?: string;
};
type TStringColumn = TColumnBase & {
    type: "string";
    length: number;
};
type TJsonColumn = TColumnBase & {
    type: "json" | "jsonb";
    length?: undefined;
    attribute: Exclude<TColumnAttribute, "primary">;
};
type TBasicColumn = TColumnBase & {
    type: Exclude<TColumnType, "string">;
    length?: undefined;
};
type TStringArrayColumn = TColumnBase & {
    type: "string[]";
    length: number;
    attribute: Exclude<TColumnAttribute, "primary">;
};
type TArrayColumn = TColumnBase & {
    type: Exclude<TColumnArrayType, "string[]">;
    length?: undefined;
    attribute: Exclude<TColumnAttribute, "primary">;
};
export type TColumn = TStringColumn | TJsonColumn | TBasicColumn | TStringArrayColumn | TArrayColumn;
export type TColumnDetail = TColumn & {
    columnName: string;
    tableName: string;
    expression: string;
};
export type TOperator = "=" | "!=" | ">" | ">=" | "<" | "<=" | "like" | "ilike" | "h2f_like" | "h2f_ilike" | "in" | "not in" | "any" | "@>" | "&&";
export type TColumnInfo = {
    model: TableModel;
    name: string;
};
export type TQuery = {
    expression: string;
    vars?: Array<any>;
};
export type TSelectExpression = {
    expression: string;
    alias: string;
};
export type TAggregateFuncType = 'sum' | 'avg' | 'max' | 'min' | 'count';
export type TCondition = string | {
    l: string | TColumnInfo;
    o: TOperator;
    r: any | TColumnInfo;
};
export type TNestedCondition = TCondition | ['AND' | 'OR', ...TNestedCondition[]] | TNestedCondition[];
export type TSortKeyword = 'desc' | 'asc';
export type TKeyFormat = 'snake' | 'lowerCamel';
export {};
//# sourceMappingURL=Type.d.ts.map