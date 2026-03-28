import { Context } from 'hono';
import { Controller, IBaseEnv } from './Controller';
export declare class HonoController<IEnv extends IBaseEnv = IBaseEnv> extends Controller<IEnv> {
    protected readonly C: Context;
    constructor(C: Context);
    get Env(): IEnv;
    protected initializeRequest(): Promise<void>;
    protected returnSuccessResponse(): Response & import("hono").TypedResponse<{
        [x: string]: any;
    }, 200, "json">;
    protected returnErrorResponse(ex: any): Response & import("hono").TypedResponse<{
        [x: string]: any;
    }, any, "json">;
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
//# sourceMappingURL=HonoController.d.ts.map