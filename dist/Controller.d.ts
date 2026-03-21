import { AxiosResponse } from "axios";
import { Request, Response } from 'express';
import { Context, TypedResponse } from 'hono';
import { Pool, type PoolClient } from 'pg';
import { RequestType } from './reqestResponse/RequestType';
import { ResponseType } from './reqestResponse/ResponseType';
import { StringClient } from './clients/StringClient';
import { EncryptClient } from './clients/EncryptClient';
type TStatusCode = 200 | 201 | 400 | 401 | 403 | 404 | 409 | 422 | 500 | 503;
export type MethodType = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export interface IError {
    status: TStatusCode;
    code: string;
    description: string;
}
interface IBaseEnv {
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
export declare class Controller<IEnv extends IBaseEnv = IBaseEnv> {
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
    runHono(): Promise<(globalThis.Response & TypedResponse<{
        [x: string]: any;
    }, 200, "json">) | (globalThis.Response & TypedResponse<{
        message: string;
    }, 401, "json">) | (globalThis.Response & TypedResponse<{
        message: string;
    }, 403, "json">) | (globalThis.Response & TypedResponse<{
        errorCode: string;
        errorMessage: string;
    }, 400, "json">) | (globalThis.Response & TypedResponse<{
        errorCode: string;
        errorMessage: string;
    }, 409, "json">) | (globalThis.Response & TypedResponse<{
        errorCode: string;
        errorMessage: string;
    }, 422, "json">) | (globalThis.Response & TypedResponse<{
        errorCode: string;
        errorMessage: string;
    }, 429, "json">) | (globalThis.Response & TypedResponse<{
        errorMessage: string;
    }, 503, "json">) | (globalThis.Response & TypedResponse<{
        errorCode: string;
        errorMessage: string;
    }, 404, "json">) | (globalThis.Response & TypedResponse<{
        message: string;
    }, 500, "json">)>;
    runExpress(): Promise<Response<any, Record<string, any>> | undefined>;
    private static now;
    static set Now(value: Date);
    static get Now(): Date;
    static get NowString(): string;
    static get Today(): Date;
    static get TodayString(): string;
    private readonly req?;
    protected get Req(): Request;
    private readonly res?;
    protected get Res(): Response;
    private readonly c?;
    protected get C(): Context;
    get Module(): 'express' | 'hono';
    protected get Headers(): Record<string, string | string[] | undefined>;
    protected getHeader(key: string): string | undefined;
    protected setResponseHeader(key: string, value: string | Record<string, any>): void;
    protected setCookie(key: string, value: string, options?: {
        httpOnly?: boolean;
        secure?: boolean;
        sameSite?: 'strict' | 'lax' | 'none';
        maxAgeSec?: number;
        path?: string;
        domain?: string;
        expires?: Date;
    }): void;
    protected getCookie(key: string): string | undefined;
    protected removeCookie(key: string, options?: {
        path?: string;
        domain?: string;
    }): void;
    get Env(): IEnv;
    constructor(request: Request, response: Response);
    constructor(c: Context);
    protected get DbUser(): string | undefined;
    protected get DbHost(): string | undefined;
    protected get DbName(): string | undefined;
    protected get DbPassword(): string | undefined;
    protected get DbPort(): string | number | undefined;
    protected get DbIsSslConnect(): boolean;
    private setPool;
    private pool?;
    private get Pool();
    private client?;
    private isExecuteRollback;
    protected get Client(): Pool | PoolClient;
    private stringClient?;
    get StringClient(): StringClient;
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