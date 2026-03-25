import * as fs from 'fs';
import {
    discoverClasses,
    buildClassMap,
    parseReqResProperties,
    findTsFiles,
    appendPathParams as appendPathParamsFromFile,
    RequestPropertyInfo,
} from './DesignDoc';


export interface IParams {
    in: 'header' | 'path',
    name: string,
    require?: boolean,
    description?: string,
    example?: string
}

export interface SwaggerFromSourceConfig {
    sourceDir: string;
    name: string;
    serverUrl: string;
    params?: Array<IParams>;
}

function toSwaggerType(type: string): string {
    switch (type.replace('?', '')) {
        case 'integer': return 'integer';
        case 'number': case 'real': return 'number';
        case 'boolean': case 'bool': return 'boolean';
        case 'object': return 'object';
        case 'array': return 'array';
        default: return 'string';
    }
}

export function createSwagger(config: SwaggerFromSourceConfig): string {
    const { controllerClasses, allParsed } = discoverClasses(config.sourceDir);
    const classMap = buildClassMap(controllerClasses);

    const allTsFiles = findTsFiles(config.sourceDir);
    const classFileMap = new Map<string, string>();
    for (const cls of allParsed) classFileMap.set(cls.name, cls.filePath);
    for (const file of allTsFiles) {
        const content = fs.readFileSync(file, 'utf-8');
        const cm = content.match(/(?:export\s+)?(?:default\s+)?class\s+(\w+)/);
        if (cm && !classFileMap.has(cm[1])) {
            classFileMap.set(cm[1], file);
        }
    }

    const endpointYml: { [endpoint: string]: { [method: string]: string } } = {};
    const allTags = new Set<string>();

    for (const cls of controllerClasses) {
        const method = cls.properties['method'] || 'GET';
        let endpoint = (cls.properties['endpoint'] || '').replace(/:([a-zA-Z_][a-zA-Z0-9_]*)/g, '{$1}');
        const summary = cls.properties['summary'] || '';
        const apiCode = cls.properties['apiCode'] || '';
        if (!endpoint) continue;

        let yml = '';

        if (cls.tags.length > 0) {
            yml += `      tags:\n`;
            for (const tag of cls.tags) {
                allTags.add(tag);
                yml += `        - ${tag}\n`;
            }
        }
        yml += `      summary: "${apiCode ? `[${apiCode}] ` : ''}${summary}"\n`;

        const m = method.toUpperCase();
        const location: 'body' | 'query' = (m === 'GET' || m === 'DELETE') ? 'query' : 'body';

        endpoint = appendPathParamsFromFile(endpoint, cls.filePath);

        const reqFilePath = cls.requestClassName ? classFileMap.get(cls.requestClassName) : undefined;
        let reqProps: RequestPropertyInfo[] = [];
        if (reqFilePath) {
            reqProps = parseReqResProperties(reqFilePath, location);
        }

        if (!(endpoint in endpointYml)) endpointYml[endpoint] = {};
        const queryParams = reqProps.filter(p => p.location === 'query');
        const bodyParams = reqProps.filter(p => p.location === 'body');

        const paramsList: IParams[] = [...(config.params ?? [])];
        for (const seg of endpoint.split('/')) {
            if (seg.startsWith('{') && seg.endsWith('}')) {
                const key = seg.slice(1, -1);
                paramsList.push({ in: 'path', name: key, require: true, description: key });
            }
        }

        if (m === 'GET' || m === 'DELETE') {
            for (const p of queryParams) {
                yml += queryParams.indexOf(p) === 0 && paramsList.length === 0 ? `      parameters:\n` : '';
                // handled below
            }
        }

        if (paramsList.length > 0 || queryParams.length > 0) {
            yml += `      parameters:\n`;
            for (const param of paramsList) {
                yml += `        - in: ${param.in}\n`;
                yml += `          name: ${param.name}\n`;
                yml += `          required: ${param.require === true ? 'true' : 'false'}\n`;
                if (param.description) {
                    yml += `          description: |\n            ${param.description}\n`;
                }
                if (param.example) {
                    yml += `          example: ${param.example}\n`;
                }
                yml += `          schema:\n`;
                yml += `            type: string\n`;
            }
            for (const p of queryParams) {
                yml += `        - in: query\n`;
                yml += `          name: ${p.key}\n`;
                yml += `          required: ${p.required ? 'true' : 'false'}\n`;
                if (p.description) {
                    yml += `          description: |\n            ${p.description}\n`;
                }
                yml += `          schema:\n`;
                yml += `            type: ${toSwaggerType(p.type)}\n`;
            }
        }

        if ((m === 'POST' || m === 'PUT' || m === 'PATCH') && bodyParams.length > 0) {
            const requiredList = bodyParams.filter(p => p.required).map(p => p.key);
            yml += `      requestBody:\n`;
            yml += `        content:\n`;
            yml += `          application/json:\n`;
            yml += `            schema:\n`;
            yml += `              type: object\n`;
            yml += `              properties:\n`;
            for (const p of bodyParams) {
                yml += `                ${p.key}:\n`;
                yml += `                  type: ${toSwaggerType(p.type)}\n`;
                if (p.description) {
                    yml += `                  description: |\n                    ${p.description}\n`;
                }
            }
            if (requiredList.length > 0) {
                yml += `              required:\n`;
                for (const r of requiredList) {
                    yml += `                - ${r}\n`;
                }
            }
        }

        yml += `      responses:\n`;
        yml += `        '200':\n`;
        yml += `          description: 成功\n`;

        let resProps: RequestPropertyInfo[] = [];
        const resFilePath = cls.responseClassName ? classFileMap.get(cls.responseClassName) : undefined;
        if (resFilePath) {
            resProps = parseReqResProperties(resFilePath, 'body');
        }
        if (resProps.length > 0) {
            yml += `          content:\n`;
            yml += `            application/json:\n`;
            yml += `              schema:\n`;
            yml += `                type: object\n`;
            yml += `                properties:\n`;
            for (const p of resProps) {
                yml += `                  ${p.key}:\n`;
                yml += `                    type: ${toSwaggerType(p.type)}\n`;
                if (p.description) {
                    yml += `                    description: |\n                      ${p.description}\n`;
                }
            }
        }

        const grouped: { [status: number]: { code: string; description: string }[] } = {};
        const allErrors = [...cls.errorList, { status: 500, code: '', description: 'サーバー内部エラー（予期せぬエラー）' }];
        for (const err of allErrors) {
            if (!grouped[err.status]) grouped[err.status] = [];
            const fullCode = err.code ? (apiCode ? `${apiCode}-${err.code}` : err.code) : '';
            grouped[err.status].push({ code: fullCode, description: err.description });
        }
        for (const status of [400, 401, 403, 404, 409, 422, 429, 500, 503]) {
            const list = grouped[status];
            if (!list || list.length === 0) continue;
            if (list.length === 1) {
                const e = list[0];
                yml += `        '${status}':\n`;
                yml += `          description: ${e.description}${e.code ? ` > ${e.code}` : ''}\n`;
            } else {
                yml += `        '${status}':\n`;
                yml += `          description: |\n`;
                for (const e of list) {
                    yml += `            - ${e.description}${e.code ? ` > ${e.code}` : ''}\n`;
                }
            }
        }

        endpointYml[endpoint][method] = yml;
    }

    let swaggerInfo = `openapi: 3.0.0
info:
  title: ${config.name}
  version: 1.0.0
  description: API documentation for ${config.name}
servers:
  - url: ${config.serverUrl ?? '/'}
    description: "${config.name} API IF定義書"
tags:\n`;

    for (const tag of allTags) {
        swaggerInfo += `  - name: ${tag}\n`;
    }
    swaggerInfo += 'paths:\n';

    for (const endpoint in endpointYml) {
        swaggerInfo += `  ${endpoint}:\n`;
        for (const m of ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']) {
            if (m in endpointYml[endpoint]) {
                swaggerInfo += `    ${m.toLowerCase()}:\n`;
                swaggerInfo += endpointYml[endpoint][m];
            }
        }
    }

    return swaggerInfo;
}

