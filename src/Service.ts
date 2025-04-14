import { Request, Response } from 'express';
import { Pool, type PoolClient } from 'pg';
import { MaintenanceException, AuthException, InputErrorException, ForbiddenException } from './Exception';
import { RequestType, ResponseType } from 'api-interface-type';

export type MethodType = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export class Service {
    protected readonly method: MethodType = 'GET';
    get Method(): MethodType { return this.method; }
    protected readonly endpoint: string = '';
    get Endpoint(): string { return this.endpoint; }
    protected readonly apiCode: string = '';
    get ApiCode(): string { return this.apiCode; }
    protected readonly summary: string = '';
    get Summary(): string { return `${this.ApiCode !== '' ? this.apiCode + ': ' : ''}${this.summary}`; }
    protected readonly apiUserAvailable: string = '';
    get ApiUserAvailable(): string { return this.apiUserAvailable; }
    protected readonly request: RequestType = new RequestType();
    get Request(): RequestType { return this.request }; // swaggerで必要なので、ここだけ宣言
    get AuthToken(): string { return this.request.Authorization ?? ''; }
    protected readonly response: ResponseType = new ResponseType();
    get Response(): ResponseType { return this.response }; // swaggerで必要なので、ここだけ宣言
    protected readonly isTest: boolean = process.env.NODE_ENV === 'test';

    protected readonly req: Request;
    protected readonly res: Response;
    constructor(request: Request, response: Response) {
        this.req = request;
        this.res = response;
    }

    public async inintialize(): Promise<void> {
        this.pool = await this.setPool();
        this.request.setRequest(this.req);
        await this.checkMaintenance();
        this.Pool.query(`SET TIME ZONE '${process.env.TZ ?? 'Asia/Tokyo'}';`);
        await this.middleware();
    }

    protected async setPool(): Promise<Pool> {
        return new Pool({
            user: this.isTest ? process.env.TEST_DB_USER : process.env.DB_USER,
            host: this.isTest ? process.env.TEST_DB_HOST : process.env.DB_HOST,
            database: this.isTest ? process.env.TEST_DB_DATABASE : process.env.DB_DATABASE,
            password: this.isTest ? process.env.TEST_DB_PASSWORD : process.env.DB_PASSWORD,
            port: this.isTest ? Number(process.env.TEST_DB_PORT) : Number(process.env.DB_PORT),
            ssl: (this.isTest ? process.env.TEST_DB_IS_SSL : process.env.DB_IS_SSL) === 'true' ? {
              rejectUnauthorized: false
            } : false
        });
    }
    protected async checkMaintenance(): Promise<void> { }
    protected async middleware(): Promise<void>{ }

    public resSuccess(): void {
        this.res.status(200).json(this.response.ResponseData);
    }

    protected async outputErrorLog(ex: any): Promise<void>{ }
    public handleException(ex: any): void {
        // To avoid slowing down the response, make this asynchronous
        this.outputErrorLog(ex).catch((ex) => {
            console.error(ex);
        });

        if (ex instanceof AuthException) {
            this.res.status(401).json({
                message : "Authentication expired. Please login again."
            });
            return;
        } else if (ex instanceof ForbiddenException) {
            this.res.status(403).json({
                message : 'Forbidden error'
            });
            return;
        } else if (ex instanceof InputErrorException) {
            this.res.status(400).json({
                errorCode : `${this.apiCode}-${ex.ErrorId}`,
                errorMessage : ex.message
            });
            return;
        } else if (ex instanceof MaintenanceException) {
            this.res.status(503).json({
                errorMessage : ex.message
            });
            return;
        }

        this.res.status(500).json({
            message : 'Internal server error'
        });
        return;
    }

    private pool?: Pool;
    get Pool(): Pool {
        if (this.pool === undefined) {
            throw new Error("Please call this.Pool after using the inintialize method.");
        }
        return this.pool; 
    }
    private client?: PoolClient;
    private isExecuteRollback: boolean = false;
    get Client(): PoolClient { 
        if (this.client === undefined) {
            throw new Error("Please call this.PoolClient after using the startConnect method.");
        }
        return this.client;
    }

    public async startConnect(): Promise<void> {
        this.client = await this.Pool.connect();
        await this.Client.query('BEGIN');
        this.isExecuteRollback = true;
    }

    public async commit(): Promise<void> {
        await this.Client.query('COMMIT');
        this.isExecuteRollback = false;
    }

    public async rollback(): Promise<void> {
        if (this.isExecuteRollback) {
            await this.Client.query('ROLLBACK');
        }
        this.isExecuteRollback = false;
    }

    public async release(): Promise<void> {
        await this.rollback();
        if (this.client !== undefined) {
            await this.client.release();
        }

        if (this.isTest) {
            // In tests, the connection is terminated because it is shut down every time
            await this.Pool.end();
        }
    }
}