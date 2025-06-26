import { AxiosResponse } from "axios";
import { Request, Response } from 'express';
import { Pool, PoolClient } from 'pg';
import { ErrorMessageType, IncomingHttpHeaders } from './src/reqestResponse/RequestType';
import { ArrayType, EnumType, ObjectType, PrimitiveType } from './src/reqestResponse/ReqResType';
import { AwsS3Client } from './src/clients/AwsS3Client';
import { Base64Client } from './src/clients/Base64Client';
import { StringClient } from './src/clients/StringClient';
import { EncryptClient } from './src/clients/EncryptClient';

export { AwsS3Client } from './src/clients/AwsS3Client';

// models class
import ValidateClient from './src/models/ValidateClient';

declare module 'pg-mvc-service' {
    export type MethodType = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

    export class Service {
        protected readonly method: MethodType;
        get Method(): MethodType;
        protected readonly endpoint: string;
        get Endpoint(): string;
        protected readonly apiCode: string;
        get ApiCode(): string;
        protected readonly summary: string;
        get Summary(): string;
        protected readonly apiUserAvailable: string;
        get ApiUserAvailable(): string;
        protected readonly request: RequestType;
        get AuthToken(): string;
        protected readonly response: ResponseType;
        protected readonly isTest: boolean;
        protected readonly tags: Array<string>;
        get Tags(): Array<string>;

        protected readonly req: Request;
        protected readonly res: Response;
        constructor(request: Request, response: Response);

        public inintialize(): void;

        protected dbUser?: string;
        protected dbHost?: string;
        protected dbName?: string;
        protected dbPassword?: string;
        protected dbPort?: number;
        protected dbIsSslConnect?: boolean;
        protected checkMaintenance(): Promise<void>;
        protected middleware(): Promise<void>;

        public resSuccess(): void;
        public handleException(ex: any): void;
        protected outputErrorLog(ex: any): Promise<void>;

        protected get Pool(): Pool;
        protected get Client(): PoolClient;

        public startConnect(): Promise<void>;
        public commit(): Promise<void>;
        public rollback(): Promise<void>;
        public release(): Promise<void>;

        get S3Client(): AwsS3Client;
        get Base64Client(): Base64Client;
        get StringClient(): StringClient;
        get EncryptClient(): EncryptClient;

        public requestApi<TRequest=Record<string, any>, TResponse={[key: string]: any}>(
            method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE', url: string, params: TRequest, header: {[key: string]: any}): Promise<AxiosResponse<TResponse>>;
    }

    export interface IParams {
        in: 'header' | 'path',
        name: string,
        require?: boolean,
        description?: string,
        example?: string
    }
    export function createSwagger(services: Service[], name: string, url: string, params: Array<IParams>): string;

    export type PropertyType =  PrimitiveType | ObjectType | ArrayType | EnumType;

    export class RequestType {
        constructor();

        protected properties: { [key: string]: PropertyType; };
        protected paramProperties: Array<(PrimitiveType | EnumType) & { key: string }>;
        protected readonly ERROR_MESSAGE: ErrorMessageType;

        protected throwException(code: string, message: string): never;

        public setRequest(request: Request): void;
        get Data(): { [key: string]: any };
        get Headers(): IncomingHttpHeaders;
        get Params(): { [key: string]: any };
        get RemoteAddress(): string | undefined;
        get Authorization(): string | null;
    }

    export class ResponseType {
        public Data: { [key: string]: any };

        protected properties: { [key: string]: PropertyType; };
        get ResponseData(): { [key: string]: any };
    }

    export class AuthException extends Error {
        private id: string;
        get Id(): string;
        constructor(id: string, message?: string);
    }

    export class ForbiddenException extends Error {
    }

    export class InputErrorException extends Error {
        private errorId: string;
        get ErrorId(): string;
        private errorLog: string;
        get ErrorLog(): string;
        constructor(errorId: string, message?: string, errorLog?: string);
    }

    export class MaintenanceException extends Error {
        constructor(message?: string);
    }

    export class DbConflictException extends Error {
        private errorId: string;
        get ErrorId(): string;
        constructor(errorId: string, message?: string);
    }

    export class UnprocessableException extends Error {
        private errorId: string;
        get ErrorId(): string;
        constructor(errorId: string, message?: string);
    }

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

    export class TableModel {
        protected readonly dbName: string;
        get DbName(): string;
        protected readonly tableName: string;
        get TableName(): string;
        protected readonly tableDescription: string;
        get TableDescription(): string;
        protected readonly comment: string;
        get Comment(): string;
        protected readonly columns: { [key: string]: TColumn };
        get Columns(): { [key: string]: TColumn };
        protected readonly references: Array<{table: string, columns: Array<{target: string, ref: string}>}>;
        get References(): Array<{table: string, columns: Array<{target: string, ref: string}>}>;
        public GetReferences(columnName: string): Array<{table: string, columns: Array<{target: string, ref: string}>}>;
        get TableAlias(): string;
        public IsOutputLog: boolean;
        public SortKeyword: TSortKeyword;
        public Offset: number;
        public Limit: number;
        public PageCount: number;
        set OffsetPage(value: number);

        constructor(client: Pool);
        constructor(client: Pool, tableAlias: string);
        constructor(client: PoolClient);
        constructor(client: PoolClient, tableAlias: string);

        public select(): void;
        public select(columls: Array<string | {name: string, alias?: string, func?: TAggregateFuncType}> | '*'): void;
        public select(columls: Array<string | {name: string, alias?: string, func?: TAggregateFuncType}> | '*', model: TableModel): void;
        public select(columls: Array<string | {name: string, alias?: string, func?: TAggregateFuncType}> | '*', keyFormat: TKeyFormat): void;
        public select(columls: Array<string | {name: string, alias?: string, func?: TAggregateFuncType}> | '*', model: TableModel, keyFormat: TKeyFormat): void;
        public select(expression: string, alias: string): void;

        public join(joinType: 'left' | 'inner', joinModel: TableModel, conditions: Array<TNestedCondition>): void;

        public where(expression: string): void;
        public where(conditions: Array<TNestedCondition>): void;
        public where(left: string, operator: TOperator, right: TSqlValue | Array<TSqlValue> | TColumnInfo | null): void;
        public where(left: TColumnInfo, operator: TOperator, right: TSqlValue | Array<TSqlValue> | TColumnInfo | null): void;

        public find<T = {[key: string]: any}>(pk: {[key: string]: any}, selectColumns: Array<string> | "*" | null, selectExpressions: Array<TSelectExpression> | null, keyFormat: TKeyFormat): Promise<T | null>;
        public find<T = {[key: string]: any}>(pk: {[key: string]: any}, selectColumns: Array<string> | "*" | null, selectExpressions: Array<TSelectExpression> | null): Promise<T | null>;
        public find<T = {[key: string]: any}>(pk: {[key: string]: any}, selectColumns: Array<string> | "*" | null): Promise<T | null>;
        public find<T = {[key: string]: any}>(pk: {[key: string]: any}): Promise<T | null>;

        public findId<T = {[key: string]: any}>(id: any, selectColumns: Array<string> | "*" | null, selectExpressions: Array<TSelectExpression> | null, keyFormat: TKeyFormat): Promise<T | null>;
        public findId<T = {[key: string]: any}>(id: any, selectColumns: Array<string> | "*" | null, selectExpressions: Array<TSelectExpression> | null): Promise<T | null>;
        public findId<T = {[key: string]: any}>(id: any, selectColumns: Array<string> | "*" | null): Promise<T | null>;
        public findId<T = {[key: string]: any}>(id: any): Promise<T | null>;

        protected readonly errorMessages: Record<TColumnType | 'length' | 'null' | 'notInput', string>
        protected throwValidationError(code: string, message: string): never;
        protected validateOptions(options: TOption, isInsert: boolean) : Promise<void>;
        protected validateInsert(options: TOption) : Promise<void>;
        protected validateUpdate(options: TOption) : Promise<void>;
        protected validateUpdateId(id: any, options: TOption) : Promise<void>;
        protected validateDelete() : Promise<void>;
        protected validateDeleteId(id: any) : Promise<void>;

        public executeInsert(options: TOption) : Promise<void>;
        public executeUpdate(options: TOption) : Promise<number>;
        public executeUpdateId(id: any, options: TOption) : Promise<void>;
        public executeDelete() : Promise<number>;
        public executeDeleteId(id: any) : Promise<void>;

        public executeSelect<T = {[key: string]: any}>(): Promise<Array<T>>;
        public executeSelectWithCount<T = any>(): Promise<{ datas: Array<T>, count: number, lastPage: number}>;

        protected executeQuery(param1: string, vars?: Array<any>) : Promise<any>;
        protected executeQuery(param1: TQuery) : Promise<any>;

        public orderBy(column: string | TColumnInfo, sortKeyword: TSortKeyword): void;
        public orderByList(column: string | TColumnInfo, list: Array<string | number | boolean | null>, sortKeyword: TSortKeyword): void;
        public orderBySentence(query: string, sortKeyword: TSortKeyword): void;

        public groupBy(column: string | TColumnInfo): void;

        get ValidateClient(): ValidateClient;
    }

    export function createTableDoc(models: Array<TableModel>, serviceName?: string): string;
    export function migrate(migrates: Array<MigrateTable>, poolParam: {
        host: string, user: string, dbName: string, password: string, port?: number, isSsl?: boolean
    }): Promise<void>;
    export function rollback(toNumber: number, poolParam: {
        host: string, user: string, dbName: string, password: string, port?: number, isSsl?: boolean
    }): Promise<void>;
    export class MigrateTable {
        protected readonly migrateSql: string;
        protected readonly rollbackSql: string;
        protected readonly addGrantTables: Array<string>;
        protected readonly user: string;

        constructor();
        constructor(user: string);
    }

    export class MigrateDatabase {
        constructor(dbName: string, userName: string, pool: Pool);
    
        get DbName(): string;
        get UserName(): string;
        get Password(): string | null;
    
        public IsExistUser(): Promise<boolean>;
        public CreateUser(password?: string): Promise<void>;
        public IsExistDb(): Promise<boolean>;
        public CreateDb(collateType?: string): Promise<void>;
        public RollbackDbSql(): string;
        public RollbackUserSql(otherUserName: string): string;
    }
}