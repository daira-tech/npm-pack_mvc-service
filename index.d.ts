import { RequestType, ResponseType } from "api-interface-type";
import { Request, Response } from 'express';
import { Pool, PoolClient } from 'pg';

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

        protected readonly req: Request;
        protected readonly res: Response;
        constructor(request: Request, response: Response);

        public inintialize(): Promise<void>;
        protected setPool(): Promise<Pool>;
        protected checkMaintenance(): Promise<void>;
        protected middleware(): Promise<void>;

        public resSuccess(): void;
        public handleException(ex: any): void;
        protected outputErrorLog(ex: any): Promise<void>;

        get Pool(): Pool;
        get Client(): PoolClient;

        public startConnect(): Promise<void>;
        public commit(): Promise<void>;
        public rollback(): Promise<void>;
        public release(): Promise<void>;
    }

    export function createSwagger(services: Service[], name: string, url: string, tagApi: {[key: string]: string}): string;

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