import { ResponseType } from '../../src/ResponseType';
import { PropertyType } from '../../src/ReqResType';

class TestResponseType extends ResponseType {
    protected properties: { [key: string]: PropertyType; } = {
        bool: { type: 'boolean?', description: 'only boolean' }
    }
    set Bool(value: any) { this.Data.bool = value; }
}

describe('output undefined check', () => {
    it('input empty', () => {
        const instance = new TestResponseType();
        expect(instance.ResponseData.bool).toBe(undefined);
    });

    it('input undefined', () => {
        const instance = new TestResponseType();
        instance.Bool = undefined;
        expect(instance.ResponseData.bool).toBe(undefined);
    });

    it('input number 2', () => {
        const instance = new TestResponseType();
        instance.Bool = 2;
        expect(instance.ResponseData.bool).toBe(undefined);
    });

    it('input number -1', () => {
        const instance = new TestResponseType();
        instance.Bool = -1;
        expect(instance.ResponseData.bool).toBe(undefined);
    });

    it('input string', () => {
        const instance = new TestResponseType();
        instance.Bool = "strval";
        expect(instance.ResponseData.bool).toBe(undefined);
    });

    it('input object', () => {
        const instance = new TestResponseType();
        instance.Bool = {str: "strval"};
        expect(instance.ResponseData.bool).toBe(undefined);
    });

    it('input array', () => {
        const instance = new TestResponseType();
        instance.Bool = ["strval"];
        expect(instance.ResponseData.bool).toBe(undefined);
    });
});

describe('output valid value', () => {
    it('input null', () => {
        const instance = new TestResponseType();
        instance.Bool = null;
        expect(instance.ResponseData.bool).toBe(null);
    });

    it('input empty string', () => {
        const instance = new TestResponseType();
        instance.Bool = "";
        expect(instance.ResponseData.bool).toBe(null);
    });

    it('input bool true', () => {
        const instance = new TestResponseType();
        instance.Bool = true;
        expect(instance.ResponseData.bool).toBe(true);
    });

    it('input bool false', () => {
        const instance = new TestResponseType();
        instance.Bool = false;
        expect(instance.ResponseData.bool).toBe(false);
    });

    it('input number 1', () => {
        const instance = new TestResponseType();
        instance.Bool = 1;
        expect(instance.ResponseData.bool).toBe(true);
    });

    it('input number 0', () => {
        const instance = new TestResponseType();
        instance.Bool = 0;
        expect(instance.ResponseData.bool).toBe(false);
    });

    it('input string true', () => {
        const instance = new TestResponseType();
        instance.Bool = "true";
        expect(instance.ResponseData.bool).toBe(true);
    });

    it('input string false', () => {
        const instance = new TestResponseType();
        instance.Bool = "false";
        expect(instance.ResponseData.bool).toBe(false);
    });
});