import { Request } from "express";
import { RequestType } from '../../src/RequestType';
import { PropertyType } from '../../src/ReqResType';
import TestUtils from "../TestUtils";

/**
 * class for check
 */
class TestRequestType extends RequestType {
    protected properties: { [key: string]: PropertyType; } = {
        bool: { type: 'boolean?', description: 'only boolean' }
    }
}

// ********************************************************
// * error test
// ********************************************************
const errorCheck = (param: {[key: string]: any}, errorCode: string, errorMessage: string, errorValue: string) => {
    for (const method of TestUtils.METHODS) {
        it (`${method} method`, () => {
            const instance = new TestRequestType();
            try {
                instance.setRequest(TestUtils.createMockRequest(method, param));
                fail("fali test");
            } catch (error) {
                expect(error).toBeDefined(); // confirm that occured error
                const message = ((error as unknown) as any).message;
                expect(message).toBe(`${errorCode}: ${errorMessage.replace("{property}", "bool").replace("{value}", errorValue)}`);
            }
        })
    }
}

// instance for error message
const r = new TestRequestType();

describe('input error check unnecessary input', () => {
    const param = {aaa: false}
    for (const method of TestUtils.METHODS) {
        it (`${method} method`, () => {
            const instance = new TestRequestType();
            try {
                instance.setRequest(TestUtils.createMockRequest(method, param));
                fail("fali test");
            } catch (error) {
                expect(error).toBeDefined(); // confirm that occured error
                const message = ((error as unknown) as any).message;
                expect(message).toBe(`004: ${instance.UNNECESSARY_INPUT_ERROR_MESSAGE.replace("{property}", "aaa")}`);
            }
        })
    }
})

describe('input error check', () => {
    describe('input number 2', () => {
        errorCheck({bool: 2}, "211", r.INVALID_BOOL_ERROR_MESSAGE, "2");
    });

    describe('input number -1', () => {
        errorCheck({bool: -1}, "211", r.INVALID_BOOL_ERROR_MESSAGE, "-1");
    });

    describe('input string', () => {
        errorCheck({bool: "strval"}, "212", r.INVALID_BOOL_ERROR_MESSAGE, "strval");
    });

    describe('input object', () => {
        errorCheck({bool: {key: true}}, "213", r.INVALID_BOOL_ERROR_MESSAGE, "[object Object]");
    });

    describe('input array', () => {
        errorCheck({bool: [true]}, "213", r.INVALID_BOOL_ERROR_MESSAGE, "true");
    });
});


// ********************************************************
// * success test
// ********************************************************
const successCheck = (param: {[key: string]: any}, toBe: any) => {
    for (const method of TestUtils.METHODS) {
        it (`${method} method`, () => {
            const instance = new TestRequestType();
            instance.setRequest(TestUtils.createMockRequest(method, param));
            expect(instance.Data.bool).toBe(toBe);
        })
    }
}

describe('input success check null', () => {
    describe('input empty', () => {
        successCheck({}, null);
    });

    describe('input null', () => {
        successCheck({bool: null}, null);
    });

    describe('input empty string', () => {
        successCheck({bool: ""}, null);
    });
})

describe('input success check', () => {
    describe('input boolean true', () => {
        successCheck({bool: true}, true);
    });

    describe('input boolean false', () => {
        successCheck({bool: false}, false);
    });

    describe('input number 1', () => {
        successCheck({bool: 1}, true);
    });

    describe('input nunmber 0', () => {
        successCheck({bool: 0}, false);
    });

    describe('input string true', () => {
        successCheck({bool: "true"}, true);
    });

    describe('input string false', () => {
        successCheck({bool: "false"}, false);
    });
});