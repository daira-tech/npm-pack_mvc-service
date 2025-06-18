import axios, { AxiosResponse } from "axios";
import { Request, Response } from 'express';
import { Pool, type PoolClient } from 'pg';
import { MaintenanceException, AuthException, InputErrorException, ForbiddenException } from './exceptions/Exception';
import { RequestType } from './reqestResponse/RequestType';
import { ResponseType } from './reqestResponse/ResponseType';
import { AwsS3Client } from './clients/AwsS3Client';
import { Base64Client } from './clients/Base64Client';
import { StringClient } from './clients/StringClient';
import { EncryptClient } from './clients/EncryptClient';
import PoolManager from './PoolManager';

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
    protected readonly tags: Array<string> = [];
    get Tags(): Array<string> { return this.tags; }

    protected readonly req: Request;
    protected readonly res: Response;
    constructor(request: Request, response: Response) {
        this.req = request;
        this.res = response;
    }

    public async inintialize(): Promise<void> {
        this.request.setRequest(this.req);
        await this.checkMaintenance();
        await this.middleware();
    }

    protected dbUser?: string = this.isTest ? process.env.TEST_DB_USER : process.env.DB_USER;
    protected dbHost?: string = this.isTest ? process.env.TEST_DB_HOST : process.env.DB_HOST;
    protected dbName?: string = this.isTest ? process.env.TEST_DB_DATABASE : process.env.DB_DATABASE;
    protected dbPassword?: string = this.isTest ? process.env.TEST_DB_PASSWORD : process.env.DB_PASSWORD;
    protected dbPort?: string | number = this.isTest ? process.env.TEST_DB_PORT : process.env.DB_PORT;
    protected dbIsSslConnect: boolean = (this.isTest ? process.env.TEST_DB_IS_SSL : process.env.DB_IS_SSL) === 'true';
    private setPool(): Pool {
        if (this.dbUser === undefined) {
            throw new Error("Database user is not configured");
        }
        if (this.dbHost === undefined) {
            throw new Error("Database host is not configured");
        }
        if (this.dbName === undefined) {
            throw new Error("Database name is not configured");
        }
        if (this.dbPassword === undefined) {
            throw new Error("Database password is not configured");
        }
        if (this.dbPort === undefined) {
            throw new Error("Database port is not configured");
        }

        try {
            return PoolManager.getPool(this.dbUser, this.dbHost, this.dbName, this.dbPassword, this.dbPort, this.dbIsSslConnect);
        } catch (ex) {
            throw new Error("Failed to connect to the database. Please check the connection settings.");
        }
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
    protected get Pool(): Pool {
        if (this.pool === undefined) {
            this.pool = this.setPool();
            this.pool.query(`SET TIME ZONE '${process.env.TZ ?? 'Asia/Tokyo'}';`);
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

        if (this.isTest) {
            // In tests, the connection is terminated because it is shut down every time
            await this.Pool.end();
        }
    }

    private s3Client?: AwsS3Client;
    get S3Client(): AwsS3Client {
        if (this.s3Client === undefined) {
            this.s3Client = new AwsS3Client({
                bucketName: process.env.S3_BUCKET_NAME,
                region: process.env.S3_REGION,
                accessKeyId: process.env.S3_ACCESS_KEY_ID,
                secretAccessKey: process.env.S3_SECRET_ACCESS_KEY
            });
        }
        return this.s3Client;
    }

    private base64Client? : Base64Client;
    get Base64Client(): Base64Client {
        if (this.base64Client === undefined) {
            this.base64Client = new Base64Client();
        }
        return this.base64Client;
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
                secretKeyHex: process.env.SECRET_KEY_HEX,
                hmacKeyBase64: process.env.HMAC_KEY_BASE64
            });
        }

        return this.encryptClient;
    }

    public async requestApi<TRequest=Record<string, any>, TResponse={[key: string]: any}>(
        method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE', url: string, params: TRequest, header: {[key: string]: any}): Promise<AxiosResponse<TResponse>> {

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
            if (response && [400,401,403,409,422].includes(response.status)) {
                return response;
            }
            throw ex;
        }
    }
}