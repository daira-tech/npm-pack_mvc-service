import axios, { AxiosResponse } from "axios";
import { Request, Response } from 'express';
import { Context, TypedResponse } from 'hono'
import { setCookie, getCookie, deleteCookie } from 'hono/cookie'
import { Pool, type PoolClient } from 'pg';
import { MaintenanceException, AuthException, InputErrorException, ForbiddenException, DbConflictException, UnprocessableException, NotFoundException } from './exceptions/Exception';
import { RequestType } from './reqestResponse/RequestType';
import { ResponseType } from './reqestResponse/ResponseType';
import { AwsS3Client } from './clients/AwsS3Client';
import { StringClient } from './clients/StringClient';
import { EncryptClient } from './clients/EncryptClient';
import PoolManager from './PoolManager';

type TStatusCode = 200 | 201 | 400 | 401 | 403 | 404 | 409 | 422 | 500 | 503;

export type MethodType = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export interface IError {
    status: TStatusCode;
    code: string;
    description: string; 
}

interface IServiceEnv {
    DB_USER?: string;
    DB_HOST?: string;
    DB_DATABASE?: string;
    DB_PASSWORD?: string;
    DB_PORT?: string | number;
    DB_IS_SSL?: string;
    TZ?: string;
    S3_BUCKET_NAME?: string;
    S3_REGION?: string;
    S3_ACCESS_KEY_ID?: string;
    S3_SECRET_ACCESS_KEY?: string;
    SECRET_KEY_HEX?: string;
    HMAC_KEY_BASE64?: string;
}

export class Service<IEnv extends IServiceEnv = IServiceEnv> {
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

    private readonly req?: Request;
    protected get Req(): Request {
        if (this.req === undefined) {
            throw new Error('This method can only be used when module is "express".');
        }

        return this.req;
    }
    private readonly res?: Response;
    protected get Res(): Response {
        if (this.res === undefined) {
            throw new Error('This method can only be used when module is "express".');
        }

        return this.res;
    }
    private readonly c?: Context;
    protected get C(): Context {
        if (this.c === undefined) {
            throw new Error('This method can only be used when module is "hono".');
        }

        return this.c;
    }
    get Module(): 'express' | 'hono' {
        if (this.c !== undefined) {
            return 'hono';
        } else if (this.req !== undefined && this.res !== undefined) {
            return 'express';
        }

        throw new Error('Failed to determine whether the module is "express" or "hono".');
    };

    protected get Headers(): Record<string, string | string[] | undefined> {
        if (this.Module === 'express') {
            return this.Req.headers;
        } else {
            return this.C.req.header();
        }
    }

    protected getHeader(key: string): string | undefined {
        if (this.Module === 'express') {
            // Expressの場合
            const value = this.Req.header(key);
            return Array.isArray(value) ? value[0] : value;
        } else {
            // Honoの場合
            return this.C.req.header(key);
        }
    }

    protected setResponseHeader(key: string, value: string | Record<string, any>): void {
        let formattedValue: string;

        if (typeof value === 'string') {
            formattedValue = value;
        } else {
            // オブジェクトの場合（配列は Record<string, any> に合致しないよう、念のためチェック）
            if (Array.isArray(value)) {
                throw new Error('Arrays are not allowed in setResponseHeader. Please use string or object.');
            }
            formattedValue = JSON.stringify(value);
        }

        if (this.Module === 'express') {
            // Expressの場合
            this.Res.setHeader(key, formattedValue);
        } else {
            // Honoの場合
            this.C.header(key, formattedValue);
        }
    }

    protected setCookie(key: string, value: string, options?: {
        httpOnly?: boolean;
        secure?: boolean;
        sameSite?: 'strict' | 'lax' | 'none';
        maxAgeSec?: number; // ミリ秒単位で受け取る（Expressに合わせる）
        path?: string;
        domain?: string;
        expires?: Date;
    }) {
        const config = {
            httpOnly: options?.httpOnly ?? true,
            secure: options?.secure ?? true,
            sameSite: options?.sameSite ?? 'strict',
            path: options?.path ?? '/',
            domain: options?.domain,
            expires: options?.expires
        };

        if (this.Module === 'express') {
            this.Res.cookie(key, value, {
                ...config,
                maxAge: options?.maxAgeSec !== undefined ? options.maxAgeSec * 1000 : undefined,
            });
        } else if (this.Module === 'hono') {
            setCookie(this.C, key, value, {
                ...config,
                maxAge: options?.maxAgeSec,
                // HonoのsameSiteはPascalCase（Strict等）
                sameSite: (config.sameSite.charAt(0).toUpperCase() + config.sameSite.slice(1)) as 'Strict' | 'Lax' | 'None',
            });
        }
    }

    protected getCookie(key: string): string | undefined {
        if (this.Module === 'express') {
            return this.Req.cookies[key];
        } else if (this.Module === 'hono') {
            return getCookie(this.C, key);
        }
        
        return undefined;
    }

    protected removeCookie(key: string, options?: { path?: string, domain?: string }) {
        if (this.Module === 'express') {
            // Expressの場合
            this.Res.clearCookie(key, options);
        } else if (this.Module === 'hono') {
            // Honoの場合
            deleteCookie(this.C, key, options);
        }
    }

    get Env(): IEnv {
        if (this.Module === 'express') {
            return process.env as unknown as IEnv;
        } else {
            return this.C.env;
        }
    }

    constructor(request: Request, response: Response);
    constructor(c: Context);
    constructor(param1: Request | Context, param2?: Response) {
        if (param2 !== undefined) {
            // Express の場合: (request, response)
            this.req = param1 as Request;
            this.res = param2;
        } else {
            // Hono の場合: (c)
            this.c = param1 as Context;
        }
    }

    public async inintialize(): Promise<void> {
        if (this.Module === "express") {
            await this.request.setRequest(this.Module, this.Req);
        } else {
            await this.request.setRequest(this.Module, this.C);
        }

        await this.checkMaintenance();
        await this.middleware();
    }

    protected get DbUser(): string | undefined { return this.Env.DB_USER; }
    protected get DbHost(): string | undefined { return this.Env.DB_HOST; }
    protected get DbName(): string | undefined { return this.Env.DB_DATABASE; }
    protected get DbPassword(): string | undefined { return this.Env.DB_PASSWORD; }
    protected get DbPort(): string | number | undefined { return this.Env.DB_PORT; }
    protected get DbIsSslConnect(): boolean { return this.Env.DB_IS_SSL === 'true'; }
    
    private setPool(): Pool {
        if (this.DbUser === undefined) {
            throw new Error("Database user is not configured");
        }
        if (this.DbHost === undefined) {
            throw new Error("Database host is not configured");
        }
        if (this.DbName === undefined) {
            throw new Error("Database name is not configured");
        }
        if (this.DbPassword === undefined) {
            throw new Error("Database password is not configured");
        }
        if (this.DbPort === undefined) {
            throw new Error("Database port is not configured");
        }

        try {
            // honoの場合、Poolは各リクエストで使い捨てのため、Poolマネージャーを使わず、リクエスト内で接続・破棄をする
            if (this.Module === 'hono') {
                return new Pool({
                    user: this.DbUser,
                    host: this.DbHost,
                    database: this.DbName,
                    password: this.DbPassword,
                    port: Number(this.DbPort),
                    ssl: this.DbIsSslConnect ? {
                        rejectUnauthorized: false
                        } : false
                })
            }

            return PoolManager.getPool(this.DbUser, this.DbHost, this.DbName, this.DbPassword, this.DbPort, this.DbIsSslConnect);
        } catch (ex) {
            throw new Error("Failed to connect to the database. Please check the connection settings.");
        }
    }
    protected async checkMaintenance(): Promise<void> { }
    protected async middleware(): Promise<void>{ }

    protected async outputSuccessLog(): Promise<void>{ }
    public resSuccessExpress(): void {
        this.outputSuccessLog().catch((ex) => {
            console.error(ex);
        });
        this.Res.status(200).json(this.response.ResponseData);
    }
    public resSuccessHono(): TypedResponse<any> {
        this.outputSuccessLog().catch((ex) => {
            console.error(ex);
        });
        return this.C.json(this.response.ResponseData, 200);
    }

    protected async outputErrorLog(ex: any): Promise<void>{ }
    public handleExceptionExpress(ex: any): void {
        // To avoid slowing down the response, make this asynchronous
        this.outputErrorLog(ex).catch((ex) => {
            console.error(ex);
        });

        if (ex instanceof AuthException) {
            this.Res.status(401).json({
                message : "Authentication expired. Please login again."
            });
        } else if (ex instanceof ForbiddenException) {
            this.Res.status(403).json({
                message : 'Forbidden error'
            });
        } else if (ex instanceof InputErrorException) {
            this.Res.status(400).json({
                errorCode : `${this.apiCode}-${ex.ErrorId}`,
                errorMessage : ex.message
            });
            return;
        } else if (ex instanceof DbConflictException) {
            this.Res.status(409).json({
                errorCode : `${this.apiCode}-${ex.ErrorId}`,
                errorMessage : ex.message
            })
        } else if (ex instanceof UnprocessableException) {
            this.Res.status(422).json({
                errorCode : `${this.apiCode}-${ex.ErrorId}`,
                errorMessage : ex.message
            });
        } else if (ex instanceof MaintenanceException) {
            this.Res.status(503).json({
                errorMessage : ex.message
            });
        } else if (ex instanceof NotFoundException) {
            this.Res.status(404).json({
                errorCode : `${this.apiCode}-${ex.ErrorId}`,
                errorMessage : ex.message
            });
        } else {
            this.Res.status(500).json({
                message : 'Internal server error'
            });
        }
    }

    public handleExceptionHono(ex: any): TypedResponse<any> {
        // To avoid slowing down the response, make this asynchronous
        this.outputErrorLog(ex).catch((ex) => {
            console.error(ex);
        });

        if (ex instanceof AuthException) {
            return this.C.json({ 
                message: "Authentication expired. Please login again." 
            }, 401);
        } else if (ex instanceof ForbiddenException) {
            return this.C.json({ 
                message: 'Forbidden error' 
            }, 403);
        } else if (ex instanceof InputErrorException) {
            return this.C.json({ 
                errorCode: `${this.apiCode}-${ex.ErrorId}`, 
                errorMessage: ex.message 
            }, 400);
        } else if (ex instanceof DbConflictException) {
            return this.C.json({ 
                errorCode: `${this.apiCode}-${ex.ErrorId}`, 
                errorMessage: ex.message 
            }, 409);
        } else if (ex instanceof UnprocessableException) {
            return this.C.json({ 
                errorCode: `${this.apiCode}-${ex.ErrorId}`, 
                errorMessage: ex.message 
            },422);
        } else if (ex instanceof MaintenanceException) {
            return this.C.json({ 
                errorMessage: ex.message 
            }, 503);
        } else if (ex instanceof NotFoundException) {
            return this.C.json({ 
                errorCode: `${this.apiCode}-${ex.ErrorId}`, 
                errorMessage: ex.message 
            }, 404);
        } else {
            return this.C.json({ 
                message: 'Internal server error' 
            }, 500);
        }
    }

    private pool?: Pool;
    protected get Pool(): Pool {
        if (this.pool === undefined) {
            this.pool = this.setPool();
            this.pool.query(`SET TIME ZONE '${this.Env.TZ ?? 'Asia/Tokyo'}';`);
        }
        return this.pool; 
    }
    private client?: PoolClient;
    private isExecuteRollback: boolean = false;
    protected get Client(): PoolClient { 
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

        if (this.Module === 'hono' && this.pool !== undefined) {
            await this.pool.end();
        }
    }

    private s3Client?: AwsS3Client;
    get S3Client(): AwsS3Client {
        if (this.s3Client === undefined) {
            this.s3Client = new AwsS3Client({
                bucketName: this.Env.S3_BUCKET_NAME,
                region: this.Env.S3_REGION,
                accessKeyId: this.Env.S3_ACCESS_KEY_ID,
                secretAccessKey: this.Env.S3_SECRET_ACCESS_KEY
            });
        }
        return this.s3Client;
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

        // GET,DELETEのparamをURLクエリに
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