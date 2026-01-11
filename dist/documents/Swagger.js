"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSwagger = void 0;
const createSwagger = (services, name, pathOrUrl, params = []) => {
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
    let tags = [];
    for (const service of services) {
        if (service.Endpoint in endpontSwaggerYml === false) {
            endpontSwaggerYml[service.Endpoint] = {};
        }
        let yml = "";
        const apiTags = service.Tags;
        if (apiTags.length > 0) {
            tags = [...tags, ...apiTags];
            yml += `      tags:\n`;
            for (const tag of apiTags) {
                yml += `        - ${tag}\n`;
            }
        }
        yml += `      summary: "${service.Summary}"\n`;
        const croneParams = [...params];
        for (const path of service.Endpoint.split('/')) {
            if (path.startsWith('{') && path.endsWith('}')) {
                const key = path.replace('{', '').replace('}', '');
                croneParams.push({
                    in: 'path',
                    name: key,
                    require: true,
                    description: key,
                });
            }
        }
        if (croneParams.length > 0) {
            yml += `      parameters:\n`;
            for (const param of croneParams) {
                yml += `        - in: ${param.in}\n`;
                yml += `          name: ${param.name}\n`;
                yml += `          required: ${param.require === true ? 'true' : 'false'}\n`;
                if (param.description !== undefined) {
                    yml += `          description: |\n            ${param.description}\n`;
                }
                if (param.example !== undefined) {
                    yml += `          example: ${param.example}\n`;
                }
                yml += `          schema:\n`;
                yml += `            type: string\n`;
            }
        }
        yml += service.Request.createSwagger(service.Method);
        const errorList = [...service.ErrorList, ...service.Request.getInputErrorList(service.Method)];
        yml += service.Response.createSwagger(errorList, service.ApiCode);
        endpontSwaggerYml[service.Endpoint][service.Method] = yml;
    }
    let swaggerInfo = `openapi: 3.0.0
info:
  title: Your API Documentation
  version: 1.0.0
  description: API documentation for your service
servers:
  - url: ${pathOrUrl !== null && pathOrUrl !== void 0 ? pathOrUrl : '/'}
    description: "${name} API IF定義書"
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
