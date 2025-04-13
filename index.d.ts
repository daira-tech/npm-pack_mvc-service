import { RequestType, ResponseType } from "api-interface-type";
import { Request, Response } from 'express';
import { Pool, PoolClient } from 'pg';

declare module 'pg-model-controller-service' {
    export type MethodType = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

    export class TableModel {
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

        constructor(response: Response);

        public inintialize(request: Request): Promise<void>;
        protected setPool(): Pool;
        private checkMaintenance(): Promise<void>;
        private middleware(): Promise<void>;

        public resSuccess(): void;
        public handleException(ex: any): void;
        private outputErrorLog(ex: any): Promise<void>;

        get Pool(): Pool;
        get Client(): PoolClient;

        public startConnect(): Promise<void>;
        public commit(): Promise<void>;
        public rollback(): Promise<void>;
        public release(): Promise<void>;
    }
}