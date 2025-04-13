import { Request } from "express";
import { RequestType } from '../../src/RequestType';
import { PropertyType } from '../../src/ReqResType';
import TestUtils from "../TestUtils";

/**
 * class for check
 */
class TestRequestType extends RequestType {
    protected properties: { [key: string]: PropertyType; } = {
        str: { type: 'string', description: 'only string' }
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
                expect(message).toBe(`${errorCode}: ${errorMessage.replace("{property}", "str").replace("{value}", errorValue)}`);
            }
        })
    }
}

// instance for error message
const r = new TestRequestType();

describe('input error check unnecessary input', () => {
    const param = {str: "strval", aaa: true}
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

describe('input error check required param', () => {
    describe('input empty', () => {
        errorCheck({}, "001", r.REQUIRED_ERROR_MESSAGE, "");
    });

    describe('input null', () => {
        errorCheck({str: null}, "001", r.REQUIRED_ERROR_MESSAGE, "");
    });

    describe('input empty string', () => {
        errorCheck({str: ""}, "001", r.REQUIRED_ERROR_MESSAGE, "");
    });
})

describe('input error check fail input', () => {
    describe('input boolean true', () => {
        errorCheck({str: true}, "221", r.INVALID_STRING_ERROR_MESSAGE, "true");
    });

    describe('input boolean false', () => {
        errorCheck({str: false}, "221", r.INVALID_STRING_ERROR_MESSAGE, "false");
    });

    describe('input object', () => {
        errorCheck({str: {key: "strval"}}, "221", r.INVALID_STRING_ERROR_MESSAGE, "[object Object]");
    });

    describe('input array', () => {
        errorCheck({str: ["strval"]}, "221", r.INVALID_STRING_ERROR_MESSAGE, "strval");
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
            expect(instance.Data.str).toBe(toBe);
        })
    }
}

describe('input success check', () => {
    describe('input number 1', () => {
        successCheck({str: 1}, "1");
    });

    describe('input nunmber -123.456', () => {
        successCheck({str: -123.456}, "-123.456");
    });

    describe('input string strval', () => {
        successCheck({str: "strval"}, "strval");
    });

    describe('input string 999', () => {
        successCheck({str: "999"}, "999");
    });

    describe('input string true', () => {
        successCheck({str: "true"}, "true");
    });

    describe('input string false', () => {
        successCheck({str: "false"}, "false");
    });
});