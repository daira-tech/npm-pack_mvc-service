"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ExpressionClient {
    constructor(model) {
        this.model = model;
    }
    toSqlStringValue(value) {
        if (typeof value === 'string' || typeof value === 'number') {
            return `'${value}'`;
        }
        throw new Error('Please enter a value of type string or number.');
    }
    toSqlNumberValue(value) {
        if (typeof value === 'number') {
            return value.toString();
        }
        else if (typeof value === 'string') {
            if (value.trim() !== "" || isNaN(Number(value)) === false) {
                return value;
            }
        }
        throw new Error('Please enter a value of type number or a string of half-width digits.');
    }
    createCaseFromObject(column, obj, elseValue) {
        const columnInfo = typeof column === 'string' ? this.model.getColumn(column) : column.model.getColumn(column.name);
        if (columnInfo.type !== 'string' && columnInfo.type !== 'integer') {
            throw new Error('This method cannot be used for columns other than integer, real, or string.');
        }
        const whenExpression = Object.entries(obj).map(([key, value]) => {
            let expression = `WHEN ${columnInfo.expression} = `;
            // 今は文字列と数値だけだが、他のも対応しないといけないかも
            if (columnInfo.type === 'string') {
                expression += this.toSqlStringValue(key);
            }
            else {
                expression += this.toSqlNumberValue(key);
            }
            expression += ` THEN `;
            if (value === null) {
                expression += 'null';
            }
            else if (typeof value === 'string') {
                expression += this.toSqlStringValue(value);
            }
            else if (typeof value === 'boolean') {
                expression += `${value}`;
            }
            else {
                expression += `${value}`;
            }
            return expression;
        });
        let elseExpression = `ELSE `;
        if (elseValue === null) {
            elseExpression += 'null';
        }
        else if (typeof elseValue === 'string') {
            elseExpression += this.toSqlStringValue(elseValue);
        }
        else if (typeof elseValue === 'boolean') {
            elseExpression += `${elseValue}`;
        }
        else {
            elseExpression += `${elseValue}`;
        }
        return `CASE ${whenExpression.join(' ')} ${elseExpression} END`;
    }
}
exports.default = ExpressionClient;
