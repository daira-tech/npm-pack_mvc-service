import { Service } from '../Service';
export interface IParams {
    in: 'header' | 'path';
    name: string;
    require?: boolean;
    description?: string;
    example?: string;
}
export declare const createSwagger: (services: Service[], name: string, url: string, params?: Array<IParams>) => string;
//# sourceMappingURL=Swagger.d.ts.map