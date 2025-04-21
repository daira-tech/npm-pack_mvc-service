import { Service } from './Service';


export interface IParams {
    in: 'header' | 'path',
    name: string,
    require?: boolean,
    description?: string,
    example?: string
}

export const createSwagger = (services: Service[], name: string, url: string, params: Array<IParams> = []): string => {
    // *****************************************
    // Internal method definitions
    // *****************************************
    function setYmlByMethod(method: string, swaggerYmlObj: {[key: string]: string}) {
        if (method in swaggerYmlObj) {
            swaggerInfo += `    ${method.toLowerCase()}:\n`;
            swaggerInfo += swaggerYmlObj[method];    
        }
    }
    // *****************************************
    // Execution part
    // *****************************************
    const endpontSwaggerYml: {[keyEndpoint: string]: {[keyMethod: string]: string}} = {};
    let tags: Array<string> = [];

    for (const service of services) {
        if (service.Endpoint in endpontSwaggerYml === false) {
            endpontSwaggerYml[service.Endpoint] = {};
        }
        let yml = "";
    
        const splitEndpont = service.Endpoint.split('/');
        let tagName = splitEndpont[0];
        if (tagName === '' && splitEndpont.length > 1) {
            tagName = splitEndpont[1];;
        }
    
        const apiTags = service.Tags;
        if (apiTags.length > 0) {
            tags = [ ...tags, ...apiTags];
            yml += `      tags:\n`;
            for (const tag of apiTags) {
                yml += `        - ${tag}\n`;
            }
        }
        yml += `      summary: ${service.Summary}\n`;

        for (const path of service.Endpoint.split('/')) {
            if (path.includes('{') && path.includes('}')) {
                const key = path.replace('{', '').replace('}', '');
                params.push({
                    in: 'path',
                    name: key,
                    require: true,
                    description: key,
                });
            }
        }

        if (params.length > 0) {
            yml += `      parameters:\n`;
            for (const param of params) {
                yml += `        - in: ${param.in}\n`;
                yml += `          name: ${param.name}\n`;
                yml += `          required: ${param.require === true ? 'true' : 'false'}\n`;
                if (param.description !== undefined) {
                    yml += `          description: ${param.description}\n`;
                }
                if (param.example !== undefined) {
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
    swaggerInfo += 'paths:\n'

    for (const keyEndpoint in endpontSwaggerYml) {
        swaggerInfo += `  ${keyEndpoint}:\n`;

        setYmlByMethod('GET', endpontSwaggerYml[keyEndpoint]);
        setYmlByMethod('POST', endpontSwaggerYml[keyEndpoint]);
        setYmlByMethod('PUT', endpontSwaggerYml[keyEndpoint]);
        setYmlByMethod('PATCH', endpontSwaggerYml[keyEndpoint]);
        setYmlByMethod('DELETE', endpontSwaggerYml[keyEndpoint]);
    }

    return swaggerInfo;
}