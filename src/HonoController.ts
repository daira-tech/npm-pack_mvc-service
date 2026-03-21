import { Context } from 'hono';
import { setCookie, getCookie, deleteCookie } from 'hono/cookie';
import { Controller, IBaseEnv } from './Controller';
import { IDbConnectionFactory } from './models/IDbClient';
import { PgConnectionFactory } from './PgConnectionFactory';

export class HonoController<IEnv extends IBaseEnv = IBaseEnv> extends Controller<IEnv> {

    constructor(protected readonly C: Context) {
        super();
    }

    get Env(): IEnv {
        return this.C.env;
    }

    protected createConnectionFactory(): IDbConnectionFactory {
        const config = this.validateDbConfig();
        return new PgConnectionFactory({ ...config, usePoolManager: false });
    }

    protected async initializeRequest(): Promise<void> {
        await this.request.setRequest('hono', this.C);
    }

    protected returnSuccessResponse() {
        return this.C.json(this.response.ResponseData, 200);
    }

    protected returnErrorResponse(ex: any) {
        const { status, body } = this.getErrorResponse(ex);
        return this.C.json(body, status as any);
    }

    protected get Headers(): Record<string, string | string[] | undefined> {
        return this.C.req.header();
    }

    protected getHeader(key: string): string | undefined {
        return this.C.req.header(key);
    }

    protected setResponseHeader(key: string, value: string | Record<string, any>): void {
        let formattedValue: string;

        if (typeof value === 'string') {
            formattedValue = value;
        } else {
            if (Array.isArray(value)) {
                throw new Error('Arrays are not allowed in setResponseHeader. Please use string or object.');
            }
            formattedValue = JSON.stringify(value);
        }

        this.C.header(key, formattedValue);
    }

    protected setCookie(key: string, value: string, options?: {
        httpOnly?: boolean;
        secure?: boolean;
        sameSite?: 'strict' | 'lax' | 'none';
        maxAgeSec?: number;
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

        setCookie(this.C, key, value, {
            ...config,
            maxAge: options?.maxAgeSec,
            sameSite: (config.sameSite.charAt(0).toUpperCase() + config.sameSite.slice(1)) as 'Strict' | 'Lax' | 'None',
        });
    }

    protected getCookie(key: string): string | undefined {
        return getCookie(this.C, key);
    }

    protected removeCookie(key: string, options?: { path?: string, domain?: string }) {
        deleteCookie(this.C, key, options);
    }
}
