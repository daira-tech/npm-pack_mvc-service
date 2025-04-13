import { Request } from "express";

export default class TestUtils {
    public static readonly METHODS: Array<'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'> = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
    public static createMockRequest(method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH', param: {[key: string]: any}): Request {
        const req = { method: method } as Request;
        if (['GET', 'DELETE'].includes(method)) {
            req.query = param;
        } else {
            req.body = param;
        }
        return req;
    }
}
