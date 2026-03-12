import { Controller } from '../Controller';
export interface IParams {
    in: 'header' | 'path';
    name: string;
    require?: boolean;
    description?: string;
    example?: string;
}
export declare const createSwagger: (controllers: Controller[], name: string, pathOrUrl: string, params?: Array<IParams>) => string;
//# sourceMappingURL=Swagger.d.ts.map