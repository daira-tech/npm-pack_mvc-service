import { AxiosResponse } from "axios";
import { Request, Response } from 'express';
import { Pool, PoolClient } from 'pg';
import { ErrorMessageType, IncomingHttpHeaders } from './src/reqestResponse/RequestType';
import { ArrayType, EnumType, MapType, NumberType, ObjectType, PrimitiveType, StringType } from './src/reqestResponse/ReqResType';

import { MethodType } from './src/Service';
export { MethodType } from './src/Service';

import { Base64Client } from './src/clients/Base64Client';
import { StringClient } from './src/clients/StringClient';
import { EncryptClient } from './src/clients/EncryptClient';

import { AwsS3Client } from './src/clients/AwsS3Client';
export { AwsS3Client } from './src/clients/AwsS3Client';

// models class
import ValidateClient from './src/models/ValidateClient';

import { TableModel } from "./src/models/TableModel";
export { TableModel } from "./src/models/TableModel";

export { TColumnAttribute, TColumnType, TColumnArrayType, TColumn, TColumnDetail, TOperator, TColumnInfo, TQuery, TSelectExpression, TAggregateFuncType, TCondition, TNestedCondition, TSortKeyword, TKeyFormat } from './src/models/Type';

export { DayType, MonthType, DateType, HourType, MinuteSecondType } from './src/cron/CronType';
export { BaseCron } from "./src/cron/BaseCron";
export { runCron } from "./src/cron/CronExecuter";

declare module 'pg-mvc-service' {
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
            method: MethodType, url: string, params: TRequest, header: {[key: string]: any}): Promise<AxiosResponse<TResponse>>;
    }

    export interface IParams {
        in: 'header' | 'path',
        name: string,
        require?: boolean,
        description?: string,
        example?: string
    }
    export function createSwagger(services: Service[], name: string, url: string, params: Array<IParams>): string;

    export type PropertyType =  PrimitiveType | StringType | NumberType | ObjectType | ArrayType | EnumType | MapType;

    export class RequestType {
        constructor();

        protected properties: { [key: string]: PropertyType; };
        protected paramProperties: Array<(PrimitiveType | StringType | NumberType | EnumType) & { key: string }>;
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

    export class NotFoundException extends Error {
        private errorId: string;
        get ErrorId(): string;
        constructor(errorId: string, message?: string);
    }

    export class UnprocessableException extends Error {
        private errorId: string;
        get ErrorId(): string;
        constructor(errorId: string, message?: string);
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