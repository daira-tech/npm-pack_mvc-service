import { AxiosResponse } from "axios";
import { RequestType } from './reqestResponse/RequestType';
import { ResponseType } from './reqestResponse/ResponseType';
import { EncryptClient } from './clients/EncryptClient';
import { IDbClient } from './models/IDbClient';
export type TDbType = 'none' | 'pg' | 'd1';
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
export declare abstract class Controller<IEnv extends IBaseEnv = IBaseEnv> {
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
    get Request(): RequestType;
    protected readonly response: ResponseType;
    get Response(): ResponseType;
    protected readonly tags: Array<string>;
    get Tags(): Array<string>;
    protected readonly errorList: Array<IError>;
    get ErrorList(): Array<IError>;
    protected readonly isSetDbConnection: boolean;
    protected main(): Promise<void>;
    protected middleware(): Promise<void>;
    protected outputSuccessLog(): Promise<void>;
    protected outputErrorLog(ex: any): Promise<void>;
    abstract get Env(): IEnv;
    protected abstract initializeRequest(): Promise<void>;
    protected abstract returnSuccessResponse(): any;
    protected abstract returnErrorResponse(ex: any): any;
    /** DB種別。'pg' で PostgreSQL、'd1' で Cloudflare D1 に自動接続。'none' は DB 未使用 */
    protected readonly db: TDbType;
    private createConnectionFactory;
    private factory?;
    private connection?;
    protected get Client(): IDbClient;
    protected commit(): Promise<void>;
    run(): Promise<any>;
    protected getErrorResponse(ex: any): {
        status: number;
        body: Record<string, any>;
    };
    private static now;
    static set Now(value: Date);
    static get Now(): Date;
    static get NowString(): string;
    static get Today(): Date;
    static get TodayString(): string;
    protected get DbUser(): string | undefined;
    protected get DbHost(): string | undefined;
    protected get DbName(): string | undefined;
    protected get DbPassword(): string | undefined;
    protected get DbPort(): string | number | undefined;
    protected get DbIsSslConnect(): boolean;
    protected validateDbConfig(): {
        user: string;
        host: string;
        database: string;
        password: string;
        port: number;
        ssl: boolean;
        timezone: string | undefined;
    };
    private encryptClient?;
    get EncryptClient(): EncryptClient;
    requestApi<TRequest = Record<string, any>, TResponse = {
        [key: string]: any;
    }>(method: MethodType, url: string, params: TRequest, header: {
        [key: string]: any;
    }): Promise<AxiosResponse<TResponse>>;
}
export {};
//# sourceMappingURL=Controller.d.ts.map