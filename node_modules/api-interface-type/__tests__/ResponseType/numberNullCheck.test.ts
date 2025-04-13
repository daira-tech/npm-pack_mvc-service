import { ResponseType } from '../../src/ResponseType';
import { PropertyType } from '../../src/ReqResType';

class TestResponseType extends ResponseType {
    protected properties: { [key: string]: PropertyType; } = {
        num: { type: 'number?', description: 'only number' }
    }
    set Num(value: any) { this.Data.num = value; }
}

describe('output undefined check', () => {
    it('input empty', () => {
        const instance = new TestResponseType();
        expect(instance.ResponseData.num).toBe(undefined);
    });

    it('input undefined', () => {
        const instance = new TestResponseType();
        instance.Num = undefined;
        expect(instance.ResponseData.num).toBe(undefined);
    });

    it('input string', () => {
        const instance = new TestResponseType();
        instance.Num = "strval";
        expect(instance.ResponseData.num).toBe(undefined);
    });

    it('input bool true', () => {
        const instance = new TestResponseType();
        instance.Num = true;
        expect(instance.ResponseData.num).toBe(undefined);
    });

    it('input bool false', () => {
        const instance = new TestResponseType();
        instance.Num = false;
        expect(instance.ResponseData.num).toBe(undefined);
    });

    it('input object', () => {
        const instance = new TestResponseType();
        instance.Num = {num: 1};
        expect(instance.ResponseData.num).toBe(undefined);
    });

    it('input array', () => {
        const instance = new TestResponseType();
        instance.Num = [5];
        expect(instance.ResponseData.num).toBe(undefined);
    });
});

describe('output valid value', () => {
    it('input null', () => {
        const instance = new TestResponseType();
        instance.Num = null;
        expect(instance.ResponseData.num).toBe(null);
    });

    it('input empty string', () => {
        const instance = new TestResponseType();
        instance.Num = "";
        expect(instance.ResponseData.num).toBe(null);
    });

    it('input number', () => {
        const instance = new TestResponseType();
        instance.Num = 9;
        expect(instance.ResponseData.num).toBe(9);
    });

    it('input string number', () => {
        const instance = new TestResponseType();
        instance.Num = "-9";
        expect(instance.ResponseData.num).toBe(-9);
    });
});