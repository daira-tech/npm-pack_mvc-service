import { Request, Response } from 'express';
import { Pool, PoolClient } from 'pg';
import { IncomingHttpHeaders } from './src/RequestType';
import { ArrayType, EnumType, ObjectType, PrimitiveType } from './src/ReqResType';
import S3Client from './src/S3Client';
import Base64Client from './src/Base64Client';
import StringClient from './src/StringClient';
import EncryptClient from './src/EncryptClient';

declare module 'mvc-service' {
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

        get S3Client(): S3Client;
        get Base64Client(): Base64Client;
        get StringClient(): StringClient;
        get EncryptClient(): EncryptClient;
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

        public readonly INVALID_PATH_PARAM_UUID_ERROR_MESSAGE: string;
        public readonly REQUIRED_ERROR_MESSAGE: string;
        public readonly UNNECESSARY_INPUT_ERROR_MESSAGE: string;
        public readonly INVALID_OBJECT_ERROR_MESSAGE: string;
        public readonly INVALID_ARRAY_ERROR_MESSAGE: string;
        public readonly INVALID_NUMBER_ERROR_MESSAGE: string;
        public readonly INVALID_BOOL_ERROR_MESSAGE: string;
        public readonly INVALID_STRING_ERROR_MESSAGE: string;
        public readonly INVALID_UUID_ERROR_MESSAGE: string;
        public readonly INVALID_MAIL_ERROR_MESSAGE: string;
        public readonly INVALID_DATE_ERROR_MESSAGE: string;
        public readonly INVALID_TIME_ERROR_MESSAGE: string;
        public readonly INVALID_DATETIME_ERROR_MESSAGE: string;
        public readonly INVALID_BASE64_ERROR_MESSAGE: string;
        public readonly INVALID_ENUM_ERROR_MESSAGE: string;

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
}