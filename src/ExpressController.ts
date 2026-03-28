import { Request, Response } from 'express';
import { Controller, IBaseEnv } from './Controller';

export class ExpressController<IEnv extends IBaseEnv = IBaseEnv> extends Controller<IEnv> {

    constructor(protected readonly Req: Request, protected readonly Res: Response) {
        super();
    }

    get Env(): IEnv {
        return process.env as unknown as IEnv;
    }

    protected async initializeRequest(): Promise<void> {
        await this.request.setRequest('express', this.Req);
    }

    protected returnSuccessResponse() {
        return this.Res.status(200).json(this.response.ResponseData);
    }

    protected returnErrorResponse(ex: any) {
        const { status, body } = this.getErrorResponse(ex);
        this.Res.status(status).json(body);
    }

    protected get Headers(): Record<string, string | string[] | undefined> {
        return this.Req.headers;
    }

    protected getHeader(key: string): string | undefined {
        const value = this.Req.header(key);
        return Array.isArray(value) ? value[0] : value;
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

        this.Res.setHeader(key, formattedValue);
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
        this.Res.cookie(key, value, {
            httpOnly: options?.httpOnly ?? true,
            secure: options?.secure ?? true,
            sameSite: options?.sameSite ?? 'strict',
            path: options?.path ?? '/',
            domain: options?.domain,
            expires: options?.expires,
            maxAge: options?.maxAgeSec !== undefined ? options.maxAgeSec * 1000 : undefined,
        });
    }

    protected getCookie(key: string): string | undefined {
        return this.Req.cookies[key];
    }

    protected removeCookie(key: string, options?: { path?: string, domain?: string }) {
        this.Res.clearCookie(key, options);
    }
}
