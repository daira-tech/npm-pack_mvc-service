import axios, { AxiosResponse } from "axios";
import { MaintenanceException, AuthException, InputErrorException, ForbiddenException, DbConflictException, UnprocessableException, NotFoundException, TooManyRequestsException } from './exceptions/Exception';
import { RequestType } from './reqestResponse/RequestType';
import { ResponseType } from './reqestResponse/ResponseType';
import { StringClient } from './clients/StringClient';
import { EncryptClient } from './clients/EncryptClient';
import DateTimeUtil from './Utils/DateTimeUtil';
import { IDbClient, IDbConnection, IDbConnectionFactory } from './models/IDbClient';

type TStatusCode = 200 | 201 | 400 | 401 | 403 | 404 | 409 | 422 | 429 | 500 | 503;

export type MethodType = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export interface IError {
    status: TStatusCode;
    code: string;
    description: string; 
}

export interface IBaseEnv {
    DB_USER?: string;
    DB_HOST?: string;
    DB_DATABASE?: string;
    DB_PASSWORD?: string;
    DB_PORT?: string | number;
    DB_IS_SSL?: string;
    TZ?: string;
    SECRET_KEY_HEX?: string;
    HMAC_KEY_BASE64?: string;
}

export abstract class Controller<IEnv extends IBaseEnv = IBaseEnv> {
    protected readonly method: MethodType = 'GET';
    get Method(): MethodType { return this.method; }
    protected readonly endpoint: string = '';
    get Endpoint(): string { return this.endpoint + this.request.paramPath; }
    protected readonly apiCode: string = '';
    get ApiCode(): string { return this.apiCode; }
    protected readonly summary: string = '';
    get Summary(): string { return `${this.ApiCode !== '' ? `[${this.apiCode}]` : ''}${this.summary}`; }
    protected readonly apiUserAvailable: string = '';
    get ApiUserAvailable(): string { return this.apiUserAvailable; }
    protected readonly request: RequestType = new RequestType();
    get Request(): RequestType { return this.request }; // swaggerで必要なので、ここだけ宣言
    protected readonly response: ResponseType = new ResponseType();
    get Response(): ResponseType { return this.response }; // swaggerで必要なので、ここだけ宣言
    protected readonly tags: Array<string> = [];
    get Tags(): Array<string> { return this.tags; }
    protected readonly errorList: Array<IError> = [];
    get ErrorList(): Array<IError> {
        return [...this.errorList, {
            status: 500,
            code: '',
            description: 'サーバー内部エラー（予期せぬエラー）'
        }];
    }
    protected readonly isSetDbConnection: boolean = true;

    protected async main(): Promise<void> {}
    protected async middleware(): Promise<void>{ }
    protected async outputSuccessLog(): Promise<void>{ }
    protected async outputErrorLog(ex: any): Promise<void>{ }

    // サブクラスで実装するフレームワーク固有メソッド
    abstract get Env(): IEnv;
    protected abstract initializeRequest(): Promise<void>;
    protected abstract returnSuccessResponse(): any;
    protected abstract returnErrorResponse(ex: any): any;

    // DB接続ファクトリ
    protected abstract createConnectionFactory(): IDbConnectionFactory;

    private factory?: IDbConnectionFactory;
    private connection?: IDbConnection;

    protected get Client(): IDbClient { 
        if (this.isSetDbConnection) {
            if (this.connection === undefined) {
                throw new Error("Please call this.Client after the connection is established in run().");
            }
            return this.connection;
        }
        if (this.factory === undefined) {
            this.factory = this.createConnectionFactory();
        }
        return this.factory;
    }

    protected async commit(): Promise<void> {
        if (!this.connection) {
            throw new Error("Cannot commit: no active database connection.");
        }
        await this.connection.commit();
    }

    public async run(): Promise<any> {
        try {
            await this.initializeRequest();

            if (this.isSetDbConnection) {
                this.factory = this.createConnectionFactory();
                this.connection = await this.factory.connect();
                await this.connection.begin();
            }
    
            await this.middleware();
            await this.main();
    
            if (this.isSetDbConnection) {
                await this.commit();
            }
    
            this.outputSuccessLog().catch((ex) => {
                console.error(ex);
            });

            return this.returnSuccessResponse();
        } catch (ex) {
            this.outputErrorLog(ex).catch((ex) => {
                console.error(ex);
            });

            return this.returnErrorResponse(ex);
        } finally {
            if (this.connection) {
                await this.connection.rollback();
                await this.connection.release();
            }
            if (this.factory) {
                await this.factory.close();
            }
        }
    }

    protected getErrorResponse(ex: any): { status: number, body: Record<string, any> } {
        if (ex instanceof AuthException) {
            return { status: 401, body: { message: "Authentication expired. Please login again." } };
        } else if (ex instanceof ForbiddenException) {
            return { status: 403, body: { message: 'Forbidden error' } };
        } else if (ex instanceof InputErrorException) {
            return { status: 400, body: { errorCode: `${this.apiCode}-${ex.ErrorId}`, errorMessage: ex.message } };
        } else if (ex instanceof DbConflictException) {
            return { status: 409, body: { errorCode: `${this.apiCode}-${ex.ErrorId}`, errorMessage: ex.message } };
        } else if (ex instanceof UnprocessableException) {
            return { status: 422, body: { errorCode: `${this.apiCode}-${ex.ErrorId}`, errorMessage: ex.message } };
        } else if (ex instanceof TooManyRequestsException) {
            return { status: 429, body: { errorCode: `${this.apiCode}-${ex.ErrorId}`, errorMessage: ex.message } };
        } else if (ex instanceof MaintenanceException) {
            return { status: 503, body: { errorMessage: ex.message } };
        } else if (ex instanceof NotFoundException) {
            return { status: 404, body: { errorCode: `${this.apiCode}-${ex.ErrorId}`, errorMessage: ex.message } };
        }
        return { status: 500, body: { message: 'Internal server error' } };
    }

    // 日時ユーティリティ（static）
    private static now: Date | null = null;
    public static set Now(value: Date) {
        this.now = value;
    }
    public static get Now(): Date {
        return this.now ?? new Date();
    }
    public static get NowString(): string {
        return DateTimeUtil.toStringFromDate(this.Now, 'datetime');
    }
    public static get Today(): Date {
        const now = this.Now;
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }
    public static get TodayString(): string {
        return DateTimeUtil.toStringFromDate(this.Now, 'date');
    }

    // DB接続設定
    protected get DbUser(): string | undefined { return this.Env.DB_USER; }
    protected get DbHost(): string | undefined { return this.Env.DB_HOST; }
    protected get DbName(): string | undefined { return this.Env.DB_DATABASE; }
    protected get DbPassword(): string | undefined { return this.Env.DB_PASSWORD; }
    protected get DbPort(): string | number | undefined { return this.Env.DB_PORT; }
    protected get DbIsSslConnect(): boolean { return this.Env.DB_IS_SSL === 'true'; }

    protected validateDbConfig() {
        const user = this.DbUser;
        const host = this.DbHost;
        const database = this.DbName;
        const password = this.DbPassword;
        const port = this.DbPort;

        if (user === undefined) throw new Error("Database user is not configured");
        if (host === undefined) throw new Error("Database host is not configured");
        if (database === undefined) throw new Error("Database name is not configured");
        if (password === undefined) throw new Error("Database password is not configured");
        if (port === undefined) throw new Error("Database port is not configured");

        return { user, host, database, password, port: Number(port), ssl: this.DbIsSslConnect, timezone: this.Env.TZ };
    }

    private stringClient? : StringClient;
    get StringClient(): StringClient {
        if (this.stringClient === undefined) {
            this.stringClient = new StringClient();
        }
        return this.stringClient;
    }

    private encryptClient?: EncryptClient;
    get EncryptClient(): EncryptClient {
        if (this.encryptClient === undefined) {
            this.encryptClient = new EncryptClient({
                secretKeyHex: this.Env.SECRET_KEY_HEX,
                hmacKeyBase64: this.Env.HMAC_KEY_BASE64
            });
        }

        return this.encryptClient;
    }

    public async requestApi<TRequest=Record<string, any>, TResponse={[key: string]: any}>(
        method: MethodType, url: string, params: TRequest, header: {[key: string]: any}): Promise<AxiosResponse<TResponse>> {

        if (method === 'GET' || method === 'DELETE') {
            for (const [key, value] of Object.entries(params as Record<string, any>)) {
                if (value === undefined || value === null) {
                    continue;
                }

                if (Array.isArray(value)) {
                    for (const arrayValue of value) {
                        url += url.includes('?') ? '&' : '?';
                        url += `${key}=${arrayValue.toString()}`;
                    }
                } else {
                    url += url.includes('?') ? '&' : '?';
                    url += `${key}=${value.toString()}`;
                }
            }
        }

        try {
            switch (method) {
                case 'GET':
                    return await axios.get(url, header === undefined ? {} : { headers: header });
                case 'POST':
                    return await axios.post(url, params, header === undefined ? {} : { headers: header });
                case 'PUT':
                    return await axios.put(url, params, header === undefined ? {} : { headers: header });
                case 'DELETE':
                    return await axios.delete(url, header === undefined ? {} : { headers: header });
                case 'PATCH':
                    return await axios.patch(url, params, header === undefined ? {} : { headers: header });
            }
        } catch (ex) {
            let response = (ex as any).response as AxiosResponse<TResponse>;
            if (response && [400, 401, 403, 404, 409, 422].includes(response.status)) {
                return response;
            }
            throw ex;
        }
    }
}
