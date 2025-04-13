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
