import { TColumnArrayType, TColumnType } from "../Type";
export type TOptionErrorMessage = Record<TColumnType | TColumnArrayType | 'length' | 'null' | 'notInput' | 'fk' | 'find', string>;
export default class MessageUtil {
    static readonly optionErrorMessageEnglish: TOptionErrorMessage;
    static readonly optionErrorMessageJapan: TOptionErrorMessage;
}
//# sourceMappingURL=MessageUtil.d.ts.map