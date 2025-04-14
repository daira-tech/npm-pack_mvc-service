"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSwagger = void 0;
const createSwagger = (services, name, url, tagApi = {}) => {
    var _a;
    // *****************************************
    // Internal method definitions
    // *****************************************
    function setYmlByMethod(method, swaggerYmlObj) {
        if (method in swaggerYmlObj) {
            swaggerInfo += `    ${method.toLowerCase()}:\n`;
            swaggerInfo += swaggerYmlObj[method];
        }
    }
    // *****************************************
    // Execution part
    // *****************************************
    const endpontSwaggerYml = {};
    const tags = [];
    for (const service of services) {
        if (service.Endpoint in endpontSwaggerYml === false) {
            endpontSwaggerYml[service.Endpoint] = {};
        }
        let yml = "";
        const splitEndpont = service.Endpoint.split('/');
        let tagName = splitEndpont[0];
        if (tagName === '' && splitEndpont.length > 1) {
            tagName = splitEndpont[1];
            ;
        }
        const tag = `${tagName} ${(_a = tagApi[service.ApiUserAvailable]) !== null && _a !== void 0 ? _a : ''}`;
        if (tags.includes(tag) === false) {
            tags.push(tag);
        }
        yml += `      tags:\n`;
        yml += `        - ${tag}\n`;
        yml += `      summary: ${service.Summary}\n`;
        const params = [];
        params.push({
            in: 'header',
            name: 'Authorization',
            require: false,
            description: '認証のために必要なヘッダー情報です。トークンを入力してください。',
            example: 'Bearer 123e4567-e89b-12d3-a456-426614174000'
        });
        params.push({
            in: 'header',
            name: 'User-Id',
            require: false,
            description: '開発環境のみヘッダーにUserIdを入れればそのユーザで使用することができます。',
            example: '',
        });
        params.push({
            in: 'header',
            name: 'Api-Key',
            require: false,
            description: 'API-KEYで認証処理を飛ばすことができます。',
            example: '',
        });
        for (const path of service.Endpoint.split('/')) {
            if (path.includes('{') && path.includes('}')) {
                const key = path.replace('{', '').replace('}', '');
                params.push({
                    in: 'path',
                    name: key,
                    require: true,
                    description: key,
                    example: '',
                });
            }
        }
        if (params.length > 0) {
            yml += `      parameters:\n`;
            for (const param of params) {
                yml += `        - in: ${param.in}\n`;
                yml += `          name: ${param.name}\n`;
                yml += `          required: ${param.require}\n`;
                yml += `          description: ${param.description}\n`;
                if (param.example !== '') {
                    yml += `          example: ${param.example}\n`;
                }
                yml += `          schema:\n`;
                yml += `            type: string\n`;
            }
        }
        yml += service.Request.createSwagger(service.Method);
        yml += service.Response.createSwagger();
        endpontSwaggerYml[service.Endpoint][service.Method] = yml;
    }
    let swaggerInfo = `openapi: 3.0.0
info:
  title: Your API Documentation
  version: 1.0.0
  description: API documentation for your service
servers:
  - url: ${url}
    description: ${name} API IF定義書
tags:\n`;
    for (const tag of tags) {
        swaggerInfo += `  - name: ${tag}\n`;
    }
    swaggerInfo += 'paths:\n';
    for (const keyEndpoint in endpontSwaggerYml) {
        swaggerInfo += `  ${keyEndpoint}:\n`;
        setYmlByMethod('GET', endpontSwaggerYml[keyEndpoint]);
        setYmlByMethod('POST', endpontSwaggerYml[keyEndpoint]);
        setYmlByMethod('PUT', endpontSwaggerYml[keyEndpoint]);
        setYmlByMethod('PATCH', endpontSwaggerYml[keyEndpoint]);
        setYmlByMethod('DELETE', endpontSwaggerYml[keyEndpoint]);
    }
    return swaggerInfo;
};
exports.createSwagger = createSwagger;
