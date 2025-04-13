import { Request, Response } from 'express';
import { Pool, type PoolClient } from 'pg';
import { MaintenanceException, AuthException, InputErrorException, ForbiddenException } from './Exception';
import { RequestType, ResponseType } from 'api-interface-type';

export type MethodType = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export class ServiceRequestType extends RequestType {

    public readonly INVALID_PATH_PARAM_UUID_ERROR_MESSAGE = 'urlの{property}はUUIDを受け付けています。({value})';
    public readonly REQUIRED_ERROR_MESSAGE = '{property}は必須です。'; 
    public readonly UNNECESSARY_INPUT_ERROR_MESSAGE = "{property} : {value}は不要なINPUTです。`"

    public readonly INVALID_OBJECT_ERROR_MESSAGE = '{property}はObject型を受け付けています。({value})';
    public readonly INVALID_ARRAY_ERROR_MESSAGE = "{property}はArray型を受け付けています。({value})";
    public readonly INVALID_NUMBER_ERROR_MESSAGE = '{property}はnumber型を受け付けています。({value})';
    public readonly INVALID_BOOL_ERROR_MESSAGE = '{property}はbool型または文字列でtrue,falseまたは数値で0,1のみを受け付けています。({value})';
    public readonly INVALID_STRING_ERROR_MESSAGE = '{property}はstring型を受け付けています。({value})';
    public readonly INVALID_UUID_ERROR_MESSAGE = '{property}はUUIDを受け付けています。({value})';
    public readonly INVALID_MAIL_ERROR_MESSAGE = '{property}はメールを受け付けています。({value})';
    public readonly INVALID_DATE_ERROR_MESSAGE = '{property}は"YYYY-MM-DD"の文字列かつ存在する日付のみ受け付けています。({value})';
    public readonly INVALID_TIME_ERROR_MESSAGE = '{property}は"hh:mi"の文字列かつ存在する時間のみ受け付けています。({value})';
    public readonly INVALID_DATETIME_ERROR_MESSAGE = '{property}は"YYYY-MM-DD hh:mi:ss"または"YYYY-MM-DDThh:mi:ss"かつ存在する日時、時間のみ受け付けています。({value})';

    protected throwException(code: string, message: string): never {
        throw new InputErrorException(code, message);
    }
}

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
    protected readonly request: ServiceRequestType = new ServiceRequestType();
    get Request(): ServiceRequestType { return this.request };
    get AuthToken(): string { return this.request.Authorization ?? ''; }
    protected readonly response: ResponseType = new ResponseType();
    get Response(): ResponseType { return this.response };
    protected readonly isTest: boolean = process.env.NODE_ENV === 'test';

    private res: Response;
    constructor(response: Response) {
        this.pool = this.setPool();
        this.res = response;
    }

    public async inintialize(request: Request): Promise<void> {
        this.request.setRequest(request);
        await this.checkMaintenance();
        this.pool.query(`SET TIME ZONE '${process.env.TZ ?? 'Asia/Tokyo'}';`);
        await this.middleware();
    }

    protected setPool(): Pool {
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

    private pool: Pool;
    get Pool(): Pool { return this.pool; }
    private client?: PoolClient;
    private isExecuteRollback: boolean = false;
    get Client(): PoolClient { 
        if (this.client === undefined) {
            throw new Error("Please call this after using the startConnect method.");
        }
        return this.client;
    }

    public async startConnect(): Promise<void> {
        this.client = await this.pool.connect();
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
            await this.pool.end();
        }
    }
}