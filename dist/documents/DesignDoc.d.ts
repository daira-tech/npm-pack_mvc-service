export interface MethodInfo {
    name: string;
    jsDoc: string;
    accessModifier: string;
    isAsync: boolean;
}
export interface ErrorItem {
    status: number;
    code: string;
    description: string;
}
export interface RequestPropertyInfo {
    key: string;
    type: string;
    required: boolean;
    description: string;
    location: 'body' | 'query' | 'path';
    children?: RequestPropertyInfo[];
}
export interface ParsedClass {
    name: string;
    extendsName: string;
    filePath: string;
    classJsDoc: string;
    properties: Record<string, string>;
    methods: MethodInfo[];
    errorList: ErrorItem[];
    tags: string[];
    mainCallOrder: string[];
    requestClassName: string;
    responseClassName: string;
    fieldTypes: Record<string, string>;
}
export interface DesignDocConfig {
    /** ソースディレクトリを指定すると、Controller/Model を自動検出する */
    sourceDir?: string;
    /** 自動検出を使わない場合、Controller のソースファイルパスを個別に指定 */
    controllerFiles?: string[];
    /** 自動検出を使わない場合、Model のソースファイルパスを個別に指定 */
    modelFiles?: string[];
    name: string;
    /** 出力先ディレクトリ（個別HTMLファイルを生成） */
    outDir: string;
}
export declare function parseReqResProperties(filePath: string, location: 'body' | 'query'): RequestPropertyInfo[];
export declare function parseSourceFile(filePath: string): ParsedClass | null;
export declare function findTsFiles(dir: string): string[];
export declare function discoverClasses(sourceDir: string): {
    controllerClasses: ParsedClass[];
    modelClasses: ParsedClass[];
    allParsed: ParsedClass[];
};
export declare function buildClassMap(classes: ParsedClass[]): Map<string, ParsedClass>;
export declare function appendPathParams(endpoint: string, controllerFilePath: string): string;
export declare function createDesignDoc(config: DesignDocConfig): void;
//# sourceMappingURL=DesignDoc.d.ts.map