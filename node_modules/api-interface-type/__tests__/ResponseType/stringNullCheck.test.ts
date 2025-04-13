import { ResponseType } from '../../src/ResponseType';
import { PropertyType } from '../../src/ReqResType';

class TestResponseType extends ResponseType {
    protected properties: { [key: string]: PropertyType; } = {
        str: { type: 'string?', description: 'only string' }
    }
    set Str(value: any) { this.Data.str = value; }
}

describe('output undefined check', () => {
    it('input empty', () => {
        const instance = new TestResponseType();
        expect(instance.ResponseData.str).toBe(undefined);
    });

    it('input undefined', () => {
        const instance = new TestResponseType();
        instance.Str = undefined;
        expect(instance.ResponseData.str).toBe(undefined);
    });

    it('input bool true', () => {
        const instance = new TestResponseType();
        instance.Str = true;
        expect(instance.ResponseData.str).toBe(undefined);
    });

    it('input bool false', () => {
        const instance = new TestResponseType();
        instance.Str = false;
        expect(instance.ResponseData.str).toBe(undefined);
    });

    it('input object', () => {
        const instance = new TestResponseType();
        instance.Str = {str: "strval"};
        expect(instance.ResponseData.str).toBe(undefined);
    });

    it('input array', () => {
        const instance = new TestResponseType();
        instance.Str = ["strval"];
        expect(instance.ResponseData.str).toBe(undefined);
    });
});

describe('output valid value', () => {
    it('input null', () => {
        const instance = new TestResponseType();
        instance.Str = null;
        expect(instance.ResponseData.str).toBe(null);
    });

    it('input number', () => {
        const instance = new TestResponseType();
        instance.Str = 100;
        expect(instance.ResponseData.str).toBe("100");
    });

    it('input empty string', () => {
        const instance = new TestResponseType();
        instance.Str = "";
        expect(instance.ResponseData.str).toBe("");
    });

    it('input string', () => {
        const instance = new TestResponseType();
        instance.Str = "strval";
        expect(instance.ResponseData.str).toBe("strval");
    });
});