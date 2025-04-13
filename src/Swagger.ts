import { Service } from './Service';

export const createSwagger = (services: Service[], name: string, url: string, tagApi: {[key: string]: string} = {}): string => {
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
    const tags: Array<string> = [];

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
    
        const tag = `${tagName} ${tagApi[service.ApiUserAvailable] ?? ''}`;
        tags.push(tag);
        yml += `      tags:\n`;
        yml += `        - ${tag}\n`;
        yml += `      summary: ${service.Summary}\n`;
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