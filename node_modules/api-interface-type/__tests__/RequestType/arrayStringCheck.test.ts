import { Request } from "express";
import { RequestType } from '../../src/RequestType';
import { PropertyType } from '../../src/ReqResType';
import TestUtils from "../TestUtils";

class TestRequestType extends RequestType {
    protected properties: { [key: string]: PropertyType; } = {
        arr: { 
            type: 'array',
            properties: {type: "string"}
        }
    }
}

// ********************************************************
// * error test
// ********************************************************
const errorCheck = (param: {[key: string]: any}, errorCode: string, errorMessage: string, errorValue: string, errorIndex: number | null = null) => {
    for (const method of TestUtils.METHODS) {
        if (['GET', 'DELETE'].includes(method)) {
            // ここもテストしたいがどのようにするか...(別メソッドで分ける)
            continue;
        }

        it (`${method} method`, () => {
            const instance = new TestRequestType();
            try {
                instance.setRequest(TestUtils.createMockRequest(method, param));
                fail("fali test");
            } catch (error) {
                expect(error).toBeDefined(); // confirm that occured error
                const message = ((error as unknown) as any).message;
                expect(message).toBe(`${errorCode}: ${errorMessage.replace("{property}", `arr${errorIndex === null ? '' : `.${errorIndex}`}`).replace("{value}", errorValue)}`);
            }
        });
    }
}

// instance for error message
const r = new TestRequestType();

describe('input error check unnecessary input', () => {
    const param = {arr: ["strval"], aaa: true}
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
        errorCheck({arr: null}, "001", r.REQUIRED_ERROR_MESSAGE, "");
    });

    describe('input empty string', () => {
        errorCheck({arr: ""}, "001", r.REQUIRED_ERROR_MESSAGE, "");
    });
})

describe('input error check fail input', () => {
    describe('input number 2', () => {
        errorCheck({arr: 2}, "003", r.INVALID_ARRAY_ERROR_MESSAGE, "2");
    });

    describe('input string', () => {
        errorCheck({arr: "strval"}, "003", r.INVALID_ARRAY_ERROR_MESSAGE, "strval");
    });

    describe('input boolean true', () => {
        errorCheck({arr: true}, "003", r.INVALID_ARRAY_ERROR_MESSAGE, "true");
    });

    describe('input boolean false', () => {
        errorCheck({arr: false}, "003", r.INVALID_ARRAY_ERROR_MESSAGE, "false");
    });

    describe('input object', () => {
        errorCheck({arr: {key: "strval"}}, "003", r.INVALID_ARRAY_ERROR_MESSAGE, "[object Object]");
    });

    describe('input array object', () => {
        errorCheck({arr: [{key: "strval"}]}, "221", r.INVALID_STRING_ERROR_MESSAGE, "[object Object]", 0);
    });

    describe('input array bool 2nd', () => {
        errorCheck({arr: ["strval", true]}, "221", r.INVALID_STRING_ERROR_MESSAGE, "true", 1);
    });

    describe('input array null 3rd', () => {
        errorCheck({arr: ["strval", "strval2", null]}, "301", r.REQUIRED_ERROR_MESSAGE, "", 2);
    });

    describe('input array undefined 1st', () => {
        errorCheck({arr: [undefined, "strval2", null]}, "301", r.REQUIRED_ERROR_MESSAGE, "", 0);
    });
});

// ********************************************************
// * success test
// ********************************************************
const successCheck = (param: {[key: string]: any}, toBe: Array<any>) => {
    for (const method of TestUtils.METHODS) {
        it (`${method} method`, () => {
            if (['GET', 'DELETE'].includes(method) && param.arr.length === 1) {
                param = {arr: param.arr[0]};
            }
            const instance = new TestRequestType();
            instance.setRequest(TestUtils.createMockRequest(method, param));
            expect(instance.Data.arr.length).toBe(toBe.length);
            for (let i = 0;i < instance.Data.arr.length;i++) {
                expect(instance.Data.arr[i]).toBe(toBe[i]);
            }
        })
    }
}

describe('input success check', () => {
    describe('input array index string', () => {
        successCheck({arr: ["strval"]}, ["strval"]);
    })

    describe('input array 1index number', () => {
        successCheck({arr: [999]}, ["999"]);
    })

    describe('input array 4index', () => {
        successCheck({arr: ["strval", 300, "strval3", "true"]}, ["strval", "300", "strval3", "true"]);
    })
})