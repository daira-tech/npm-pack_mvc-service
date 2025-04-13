import { Request } from "express";
import { RequestType } from '../../src/RequestType';
import { PropertyType } from '../../src/ReqResType';
import TestUtils from "../TestUtils";

/**
 * class for check
 */
class TestRequestType extends RequestType {
    protected properties: { [key: string]: PropertyType; } = {
        num: { type: 'number?', description: 'only boolean' }
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
                expect(message).toBe(`${errorCode}: ${errorMessage.replace("{property}", "num").replace("{value}", errorValue)}`);
            }
        })
    }
}

// instance for error message
const r = new TestRequestType();

describe('input error check unnecessary input', () => {
    const param = {aaa: -100}
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
    describe('input string', () => {
        errorCheck({num: "strval"}, "201", r.INVALID_NUMBER_ERROR_MESSAGE, "strval");
    });

    describe('input boolean true', () => {
        errorCheck({num: true}, "201", r.INVALID_NUMBER_ERROR_MESSAGE, "true");
    });

    describe('input boolean false', () => {
        errorCheck({num: false}, "201", r.INVALID_NUMBER_ERROR_MESSAGE, "false");
    });

    describe('input object', () => {
        errorCheck({num: {key: 1}}, "201", r.INVALID_NUMBER_ERROR_MESSAGE, "[object Object]");
    });

    describe('input array', () => {
        errorCheck({num: [9]}, "201", r.INVALID_NUMBER_ERROR_MESSAGE, "9");
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
            expect(instance.Data.num).toBe(toBe);
        })
    }
}

describe('input success check null', () => {
    describe('input empty', () => {
        successCheck({}, null);
    });

    describe('input null', () => {
        successCheck({num: null}, null);
    });

    describe('input empty string', () => {
        successCheck({num: ""}, null);
    });
})

describe('input success check', () => {
    describe('input number 1', () => {
        successCheck({num: 1}, 1);
    });

    describe('input nunmber -100', () => {
        successCheck({num: -100}, -100);
    });

    describe('input nunmber 50.234', () => {
        successCheck({num: 50.234}, 50.234);
    });

    describe('input string 9', () => {
        successCheck({num: "9"}, 9);
    });

    describe('input string -500', () => {
        successCheck({num: "-500"}, -500);
    });

    describe('input string 12.345', () => {
        successCheck({num: "12.345"}, 12.345);
    });
});