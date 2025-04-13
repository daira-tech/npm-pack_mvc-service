import { ResponseType } from '../../src/ResponseType';
import { PropertyType } from '../../src/ReqResType';

class TestResponseType extends ResponseType {
    protected properties: { [key: string]: PropertyType; } = {
        arr: { type: 'array', properties: { type: 'string' } }
    }
    set Arr(value: any) { this.Data.arr = value; }
}

describe('output undefined check', () => {
    it('input empty', () => {
        const instance = new TestResponseType();
        expect(instance.ResponseData.arr).toBe(undefined);
    });

    it('input undefined', () => {
        const instance = new TestResponseType();
        instance.Arr = undefined;
        expect(instance.ResponseData.arr).toBe(undefined);
    });

    it('input null', () => {
        const instance = new TestResponseType();
        instance.Arr = null;
        expect(instance.ResponseData.arr).toBe(undefined);
    });

    it('input empty string', () => {
        const instance = new TestResponseType();
        instance.Arr = "";
        expect(instance.ResponseData.arr).toBe(undefined);
    });

    it('input number 2', () => {
        const instance = new TestResponseType();
        instance.Arr = 2;
        expect(instance.ResponseData.arr).toBe(undefined);
    });

    it('input number -1', () => {
        const instance = new TestResponseType();
        instance.Arr = -1;
        expect(instance.ResponseData.arr).toBe(undefined);
    });

    it('input string', () => {
        const instance = new TestResponseType();
        instance.Arr = "strval";
        expect(instance.ResponseData.arr).toBe(undefined);
    });

    it('input bool true', () => {
        const instance = new TestResponseType();
        instance.Arr = true;
        expect(instance.ResponseData.arr).toBe(undefined);
    });

    it('input bool false', () => {
        const instance = new TestResponseType();
        instance.Arr = false;
        expect(instance.ResponseData.arr).toBe(undefined);
    });

    it('input object', () => {
        const instance = new TestResponseType();
        instance.Arr = {str: "strval"};
        expect(instance.ResponseData.arr).toBe(undefined);
    });

    it('input array undefines', () => {
        const instance = new TestResponseType();
        instance.Arr = [undefined, null, true, false];
        for (const arrVal of instance.ResponseData.arr) {
            expect(arrVal).toBe(undefined);
        }
    });
});

describe('output valid value', () => {
});