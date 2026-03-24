export interface IParams {
    in: 'header' | 'path';
    name: string;
    require?: boolean;
    description?: string;
    example?: string;
}
export interface SwaggerFromSourceConfig {
    sourceDir: string;
    name: string;
    serverUrl: string;
    params?: Array<IParams>;
}
export declare function createSwagger(config: SwaggerFromSourceConfig): string;
//# sourceMappingURL=Swagger.d.ts.map