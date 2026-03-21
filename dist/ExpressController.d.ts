import { Request, Response } from 'express';
import { Controller, IBaseEnv } from './Controller';
import { IDbConnectionFactory } from './models/IDbClient';
export declare class ExpressController<IEnv extends IBaseEnv = IBaseEnv> extends Controller<IEnv> {
    protected readonly Req: Request;
    protected readonly Res: Response;
    constructor(Req: Request, Res: Response);
    get Env(): IEnv;
    protected createConnectionFactory(): IDbConnectionFactory;
    protected initializeRequest(): Promise<void>;
    protected returnSuccessResponse(): Response<any, Record<string, any>>;
    protected returnErrorResponse(ex: any): void;
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
}
//# sourceMappingURL=ExpressController.d.ts.map