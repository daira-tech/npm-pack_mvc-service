"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseReqResProperties = parseReqResProperties;
exports.parseSourceFile = parseSourceFile;
exports.findTsFiles = findTsFiles;
exports.discoverClasses = discoverClasses;
exports.buildClassMap = buildClassMap;
exports.appendPathParams = appendPathParams;
exports.createDesignDoc = createDesignDoc;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
// =============================================
// Reserved Words (メソッドとして検出しない)
// =============================================
const RESERVED_WORDS = new Set([
    'if', 'else', 'for', 'while', 'do', 'switch', 'case',
    'try', 'catch', 'finally', 'throw', 'return',
    'new', 'delete', 'typeof', 'instanceof', 'void', 'yield',
    'import', 'export', 'default', 'class', 'extends', 'super',
    'const', 'let', 'var', 'function', 'break', 'continue',
]);
// =============================================
// Parser Utilities
// =============================================
function findClosingBrace(content, openIndex) {
    let depth = 1;
    let inStr = null;
    for (let i = openIndex + 1; i < content.length; i++) {
        const ch = content[i];
        if (inStr) {
            if (ch === '\\') {
                i++;
                continue;
            }
            if (ch === inStr)
                inStr = null;
            continue;
        }
        if (ch === "'" || ch === '"' || ch === '`') {
            inStr = ch;
            continue;
        }
        if (ch === '{')
            depth++;
        else if (ch === '}') {
            depth--;
            if (depth === 0)
                return i;
        }
    }
    return -1;
}
function cleanJsDoc(raw) {
    return raw
        .split('\n')
        .map(line => line.trim().replace(/^\* ?/, ''))
        .join('\n')
        .trim();
}
function escapeHtml(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
function mkdirSafe(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}
// =============================================
// ReqRes Property Parser
// =============================================
function parseReqResProperties(filePath, location) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const result = [];
    const classRegex = /(?:export\s+)?(?:default\s+)?class\s+\w+(?:<[^{]*?>)?\s*(?:extends\s+\w+(?:<[^{]*?>)?)?\s*(?:implements\s+[^{]*)?\s*\{/;
    const classMatch = content.match(classRegex);
    if (!classMatch || classMatch.index === undefined)
        return result;
    const openBrace = content.indexOf('{', classMatch.index);
    const closeBrace = findClosingBrace(content, openBrace);
    if (closeBrace === -1)
        return result;
    const classBody = content.substring(openBrace + 1, closeBrace);
    const paramProps = parseParamProperties(classBody);
    result.push(...paramProps);
    const propsMatch = classBody.match(/(?:protected\s+)?properties\s*(?::[^=]*)?\s*=\s*\{/);
    if (!propsMatch || propsMatch.index === undefined)
        return result;
    const propsOpenIdx = classBody.indexOf('{', propsMatch.index + propsMatch[0].length - 1);
    const propsCloseIdx = findClosingBrace(classBody, propsOpenIdx);
    if (propsCloseIdx === -1)
        return result;
    const propsBody = classBody.substring(propsOpenIdx + 1, propsCloseIdx);
    result.push(...parsePropertyEntries(propsBody, location));
    return result;
}
function parsePropertyEntries(propsBody, location) {
    const result = [];
    let i = 0;
    while (i < propsBody.length) {
        while (i < propsBody.length && /[\s,]/.test(propsBody[i]))
            i++;
        if (i >= propsBody.length)
            break;
        if (propsBody[i] === '/' && i + 1 < propsBody.length && propsBody[i + 1] === '/') {
            while (i < propsBody.length && propsBody[i] !== '\n')
                i++;
            continue;
        }
        if (propsBody[i] === '/' && i + 1 < propsBody.length && propsBody[i + 1] === '*') {
            i += 2;
            while (i < propsBody.length - 1 && !(propsBody[i] === '*' && propsBody[i + 1] === '/'))
                i++;
            i += 2;
            continue;
        }
        const keyMatch = propsBody.substring(i).match(/^(\w+)\s*:\s*\{/);
        if (!keyMatch) {
            i++;
            continue;
        }
        const keyName = keyMatch[1];
        const braceStart = i + keyMatch[0].length - 1;
        const braceEnd = findClosingBrace(propsBody, braceStart);
        if (braceEnd === -1)
            break;
        const valueBody = propsBody.substring(braceStart + 1, braceEnd);
        const typeMatch = valueBody.match(/type\s*:\s*['"]([^'"]+)['"]/);
        const type = typeMatch ? typeMatch[1] : 'unknown';
        const descMatch = valueBody.match(/description\s*:\s*['"]([^'"]*)['"]/);
        const description = descMatch ? descMatch[1] : '';
        const prop = {
            key: keyName,
            type: type.replace('?', ''),
            required: !type.endsWith('?'),
            description,
            location,
        };
        const baseType = type.replace('?', '');
        if (baseType === 'object') {
            const nestedMatch = valueBody.match(/properties\s*:\s*\{/);
            if (nestedMatch && nestedMatch.index !== undefined) {
                const nestedOpen = valueBody.indexOf('{', nestedMatch.index + nestedMatch[0].length - 1);
                const nestedClose = findClosingBrace(valueBody, nestedOpen);
                if (nestedClose !== -1) {
                    const nestedBody = valueBody.substring(nestedOpen + 1, nestedClose);
                    prop.children = parsePropertyEntries(nestedBody, location);
                }
            }
        }
        else if (baseType === 'array') {
            const itemMatch = valueBody.match(/item\s*:\s*\{/);
            if (itemMatch && itemMatch.index !== undefined) {
                const itemOpen = valueBody.indexOf('{', itemMatch.index + itemMatch[0].length - 1);
                const itemClose = findClosingBrace(valueBody, itemOpen);
                if (itemClose !== -1) {
                    const itemBody = valueBody.substring(itemOpen + 1, itemClose);
                    const itemTypeMatch = itemBody.match(/type\s*:\s*['"]([^'"]+)['"]/);
                    const itemType = itemTypeMatch ? itemTypeMatch[1].replace('?', '') : 'unknown';
                    if (itemType === 'object') {
                        const nestedMatch = itemBody.match(/properties\s*:\s*\{/);
                        if (nestedMatch && nestedMatch.index !== undefined) {
                            const nestedOpen = itemBody.indexOf('{', nestedMatch.index + nestedMatch[0].length - 1);
                            const nestedClose = findClosingBrace(itemBody, nestedOpen);
                            if (nestedClose !== -1) {
                                const nestedBody = itemBody.substring(nestedOpen + 1, nestedClose);
                                prop.children = parsePropertyEntries(nestedBody, location);
                            }
                        }
                    }
                    else {
                        prop.type = `array(${itemType})`;
                    }
                }
            }
        }
        result.push(prop);
        i = braceEnd + 1;
    }
    return result;
}
function parseParamProperties(classBody) {
    const result = [];
    const match = classBody.match(/paramProperties\s*(?::[^=]*)?\s*=\s*\[/);
    if (!match || match.index === undefined)
        return result;
    const bracketStart = classBody.indexOf('[', match.index);
    let depth = 1;
    let idx = bracketStart + 1;
    while (idx < classBody.length && depth > 0) {
        if (classBody[idx] === '[')
            depth++;
        else if (classBody[idx] === ']')
            depth--;
        idx++;
    }
    const arrayBody = classBody.substring(bracketStart + 1, idx - 1);
    const itemRegex = /\{([^}]*)\}/g;
    let im;
    while ((im = itemRegex.exec(arrayBody)) !== null) {
        const itemBody = im[1];
        const keyMatch = itemBody.match(/key\s*:\s*['"](\w+)['"]/);
        const typeMatch = itemBody.match(/type\s*:\s*['"]([^'"]+)['"]/);
        const descMatch = itemBody.match(/description\s*:\s*['"]([^'"]*)['"]/);
        if (keyMatch) {
            const type = typeMatch ? typeMatch[1] : 'string';
            result.push({
                key: keyMatch[1],
                type: type.replace('?', ''),
                required: !type.endsWith('?'),
                description: descMatch ? descMatch[1] : '',
                location: 'path',
            });
        }
    }
    return result;
}
function typeDisplayName(type) {
    const base = type.replace('?', '');
    const nullable = type.endsWith('?') ? ' (nullable)' : '';
    switch (base) {
        case 'uuid': return `UUID${nullable}`;
        case 'date': return `date (YYYY-MM-DD)${nullable}`;
        case 'time': return `time (hh:mm)${nullable}`;
        case 'datetime': return `datetime (YYYY-MM-DD hh:mm:ss)${nullable}`;
        case 'mail': return `email${nullable}`;
        case 'https': return `URL (https)${nullable}`;
        case 'base64': return `base64${nullable}`;
        default: return `${base}${nullable}`;
    }
}
function parseModelColumns(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const result = [];
    const classRegex = /(?:export\s+)?(?:default\s+)?class\s+\w+(?:<[^{]*?>)?\s*(?:extends\s+\w+(?:<[^{]*?>)?)?\s*(?:implements\s+[^{]*)?\s*\{/;
    const classMatch = content.match(classRegex);
    if (!classMatch || classMatch.index === undefined)
        return result;
    const openBrace = content.indexOf('{', classMatch.index);
    const closeBrace = findClosingBrace(content, openBrace);
    if (closeBrace === -1)
        return result;
    const classBody = content.substring(openBrace + 1, closeBrace);
    const colsMatch = classBody.match(/columns\s*(?::[^=]*)?\s*=\s*\{/);
    if (!colsMatch || colsMatch.index === undefined)
        return result;
    const colsOpenIdx = classBody.indexOf('{', colsMatch.index + colsMatch[0].length - 1);
    const colsCloseIdx = findClosingBrace(classBody, colsOpenIdx);
    if (colsCloseIdx === -1)
        return result;
    const colsBody = classBody.substring(colsOpenIdx + 1, colsCloseIdx);
    let i = 0;
    while (i < colsBody.length) {
        while (i < colsBody.length && /[\s,]/.test(colsBody[i]))
            i++;
        if (i >= colsBody.length)
            break;
        if (colsBody[i] === '/' && i + 1 < colsBody.length && colsBody[i + 1] === '/') {
            while (i < colsBody.length && colsBody[i] !== '\n')
                i++;
            continue;
        }
        if (colsBody[i] === '/' && i + 1 < colsBody.length && colsBody[i + 1] === '*') {
            i += 2;
            while (i < colsBody.length - 1 && !(colsBody[i] === '*' && colsBody[i + 1] === '/'))
                i++;
            i += 2;
            continue;
        }
        const keyMatch = colsBody.substring(i).match(/^(\w+)\s*:\s*\{/);
        if (!keyMatch) {
            i++;
            continue;
        }
        const colName = keyMatch[1];
        const braceStart = i + keyMatch[0].length - 1;
        const braceEnd = findClosingBrace(colsBody, braceStart);
        if (braceEnd === -1)
            break;
        const valueBody = colsBody.substring(braceStart + 1, braceEnd);
        const typeMatch = valueBody.match(/type\s*:\s*['"]([^'"]+)['"]/);
        const attrMatch = valueBody.match(/attribute\s*:\s*['"]([^'"]+)['"]/);
        const aliasMatch = valueBody.match(/alias\s*:\s*['"]([^'"]*)['"]/);
        const lengthMatch = valueBody.match(/length\s*:\s*(\d+)/);
        const defaultMatch = valueBody.match(/default\s*:\s*['"]([^'"]*)['"]/);
        const commentMatch = valueBody.match(/comment\s*:\s*['"]([^'"]*)['"]/);
        const validations = [];
        const minMatch = valueBody.match(/min\s*:\s*(-?\d+)/);
        const maxMatch = valueBody.match(/max\s*:\s*(-?\d+)/);
        const regExpMatch = valueBody.match(/regExp\s*:\s*\/([^/]*)\/[gimsuy]*/);
        if (minMatch)
            validations.push(`min: ${minMatch[1]}`);
        if (maxMatch)
            validations.push(`max: ${maxMatch[1]}`);
        if (regExpMatch)
            validations.push(`regexp: /${regExpMatch[1]}/`);
        result.push({
            name: colName,
            type: typeMatch ? typeMatch[1] : '',
            attribute: attrMatch ? attrMatch[1] : '',
            alias: aliasMatch ? aliasMatch[1] : colName,
            length: lengthMatch ? lengthMatch[1] : '',
            defaultValue: defaultMatch ? defaultMatch[1] : '',
            comment: commentMatch ? commentMatch[1] : '',
            validation: validations.join(', '),
        });
        i = braceEnd + 1;
    }
    return result;
}
function parseModelReferences(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const result = [];
    const classRegex = /(?:export\s+)?(?:default\s+)?class\s+\w+(?:<[^{]*?>)?\s*(?:extends\s+\w+(?:<[^{]*?>)?)?\s*(?:implements\s+[^{]*)?\s*\{/;
    const classMatch = content.match(classRegex);
    if (!classMatch || classMatch.index === undefined)
        return result;
    const openBrace = content.indexOf('{', classMatch.index);
    const closeBrace = findClosingBrace(content, openBrace);
    if (closeBrace === -1)
        return result;
    const classBody = content.substring(openBrace + 1, closeBrace);
    const refsMatch = classBody.match(/references\s*(?::[^=]*)?\s*=\s*\[/);
    if (!refsMatch || refsMatch.index === undefined)
        return result;
    const bracketStart = classBody.indexOf('[', refsMatch.index);
    let depth = 1;
    let idx = bracketStart + 1;
    while (idx < classBody.length && depth > 0) {
        if (classBody[idx] === '[')
            depth++;
        else if (classBody[idx] === ']')
            depth--;
        idx++;
    }
    const refsBody = classBody.substring(bracketStart + 1, idx - 1);
    const refBlockRegex = /\{([^}]*columns\s*:\s*\[[^\]]*\][^}]*)\}/g;
    let rm;
    while ((rm = refBlockRegex.exec(refsBody)) !== null) {
        const block = rm[1];
        const tableMatch = block.match(/table\s*:\s*['"]([^'"]+)['"]/);
        if (!tableMatch)
            continue;
        const cols = [];
        const colPairRegex = /target\s*:\s*['"](\w+)['"]\s*,\s*ref\s*:\s*['"](\w+)['"]/g;
        let cm;
        while ((cm = colPairRegex.exec(block)) !== null) {
            cols.push({ target: cm[1], ref: cm[2] });
        }
        result.push({ table: tableMatch[1], columns: cols });
    }
    return result;
}
// =============================================
// Source File Parser
// =============================================
function parseSourceFile(filePath) {
    var _a, _b;
    const content = fs.readFileSync(filePath, 'utf-8');
    const classRegex = /(?:export\s+)?(?:default\s+)?(?:abstract\s+)?class\s+(\w+)(?:<[^{]*?>)?\s*(?:extends\s+(\w+)(?:<[^{]*?>)?)?\s*(?:implements\s+[^{]*)?\s*\{/;
    const classMatch = content.match(classRegex);
    if (!classMatch || classMatch.index === undefined)
        return null;
    const className = classMatch[1];
    const extendsName = classMatch[2] || '';
    let classJsDoc = '';
    const beforeClass = content.substring(0, classMatch.index);
    const classJsDocMatch = beforeClass.match(/\/\*\*([\s\S]*?)\*\/\s*$/);
    if (classJsDocMatch) {
        classJsDoc = cleanJsDoc(classJsDocMatch[1]);
    }
    const openBrace = content.indexOf('{', classMatch.index);
    const closeBrace = findClosingBrace(content, openBrace);
    if (closeBrace === -1)
        return null;
    const classBody = content.substring(openBrace + 1, closeBrace);
    const properties = {};
    const methods = [];
    const seen = new Set();
    const bodyLines = classBody.split('\n');
    let currentJsDoc = '';
    let jsDocBuffer = [];
    let inJsDoc = false;
    for (let i = 0; i < bodyLines.length; i++) {
        const trimmed = bodyLines[i].trim();
        if (trimmed.startsWith('/**')) {
            jsDocBuffer = [];
            if (trimmed.endsWith('*/')) {
                currentJsDoc = trimmed.slice(3, -2).trim();
            }
            else {
                inJsDoc = true;
                const first = trimmed.slice(3).trim();
                if (first)
                    jsDocBuffer.push(first);
            }
            continue;
        }
        if (inJsDoc) {
            if (trimmed === '*/' || trimmed.endsWith('*/')) {
                const last = trimmed.replace(/\*\/\s*$/, '').replace(/^\*\s?/, '').trim();
                if (last)
                    jsDocBuffer.push(last);
                inJsDoc = false;
                currentJsDoc = jsDocBuffer.join('\n').trim();
            }
            else {
                jsDocBuffer.push(trimmed.replace(/^\*\s?/, ''));
            }
            continue;
        }
        if (trimmed === '' || trimmed.startsWith('//'))
            continue;
        const propMatch = trimmed.match(/^(?:public|protected|private)\s+(?:readonly\s+)?(\w+)\s*(?::\s*[^=]+?)?\s*=\s*(?:'([^']*)'|"([^"]*)")/);
        if (propMatch) {
            properties[propMatch[1]] = (_b = (_a = propMatch[2]) !== null && _a !== void 0 ? _a : propMatch[3]) !== null && _b !== void 0 ? _b : '';
            currentJsDoc = '';
            continue;
        }
        const boolPropMatch = trimmed.match(/^(?:public|protected|private)\s+(?:readonly\s+)?(\w+)\s*(?::\s*\w+)?\s*=\s*(true|false)/);
        if (boolPropMatch) {
            properties[boolPropMatch[1]] = boolPropMatch[2];
            currentJsDoc = '';
            continue;
        }
        if (/^(?:public|protected|private)?\s*(?:static\s+)?(?:get|set)\s+\w+/.test(trimmed)) {
            currentJsDoc = '';
            continue;
        }
        if (/^(?:public|protected|private)?\s*constructor\s*\(/.test(trimmed)) {
            currentJsDoc = '';
            continue;
        }
        const methodMatch = trimmed.match(/^(?:(public|protected|private)\s+)?(?:static\s+)?(async\s+)?(\w+)\s*(?:<[^(]*?>)?\s*\(/);
        if (methodMatch) {
            const access = methodMatch[1] || 'public';
            const isAsync = !!methodMatch[2];
            const name = methodMatch[3];
            if (RESERVED_WORDS.has(name)) {
                currentJsDoc = '';
                continue;
            }
            let lastLine = trimmed;
            let j = i;
            while (j + 1 < bodyLines.length && !lastLine.trimEnd().endsWith('{') && !lastLine.trimEnd().endsWith(';')) {
                j++;
                lastLine = bodyLines[j].trim();
            }
            const isOverload = lastLine.trimEnd().endsWith(';');
            if (!isOverload && !seen.has(name)) {
                seen.add(name);
                methods.push({ name, jsDoc: currentJsDoc, accessModifier: access, isAsync });
            }
            if (!isOverload)
                currentJsDoc = '';
            continue;
        }
        currentJsDoc = '';
    }
    // field type declarations (e.g. private newsModel: NewsModel, or = new NewsModel(...))
    const fieldTypes = {};
    const fieldRegex = /(?:private|protected|public)\s+(\w+)\s*(?::\s*(\w+)|[^=;]*=\s*new\s+(\w+))/g;
    let fm;
    while ((fm = fieldRegex.exec(classBody)) !== null) {
        const fieldName = fm[1];
        const typeName = fm[2] || fm[3];
        if (typeName)
            fieldTypes[fieldName] = typeName;
    }
    // main() call order
    const mainCallOrder = [];
    const mainRegex = /(?:protected\s+)?(?:async\s+)?main\s*\(\s*\)(?:[^{]*)\{/;
    const mainMatch = classBody.match(mainRegex);
    if (mainMatch && mainMatch.index !== undefined) {
        const bracePos = classBody.indexOf('{', mainMatch.index);
        const closePos = findClosingBrace(classBody, bracePos);
        if (closePos !== -1) {
            const mainBody = classBody.substring(bracePos + 1, closePos);
            const callRegex = /(?:await\s+)?this\.(\w+(?:\.\w+)?)\s*\(/g;
            let cm;
            while ((cm = callRegex.exec(mainBody)) !== null) {
                const call = cm[1];
                const firstPart = call.split('.')[0];
                if (!RESERVED_WORDS.has(firstPart)) {
                    mainCallOrder.push(call);
                }
            }
        }
    }
    // errorList extraction
    const errorList = [];
    const errorListMatch = classBody.match(/errorList\s*(?::\s*[^=]+)?\s*=\s*\[([\s\S]*?)\]\s*;/);
    if (errorListMatch) {
        const errorObjRegex = /\{\s*status\s*:\s*(\d+)\s*,\s*code\s*:\s*['"]([^'"]*)['"]\s*,\s*description\s*:\s*['"]([^'"]*)['"]\s*\}/g;
        let em;
        while ((em = errorObjRegex.exec(errorListMatch[1])) !== null) {
            errorList.push({ status: parseInt(em[1]), code: em[2], description: em[3] });
        }
    }
    // tags extraction
    const tags = [];
    const tagsMatch = classBody.match(/tags\s*(?::\s*[^=]+)?\s*=\s*\[([\s\S]*?)\]\s*;/);
    if (tagsMatch) {
        const tagRegex = /['"]([^'"]+)['"]/g;
        let tm;
        while ((tm = tagRegex.exec(tagsMatch[1])) !== null) {
            tags.push(tm[1]);
        }
    }
    // request/response class name extraction
    const reqMatch = classBody.match(/request\s*(?::\s*\w+)?\s*=\s*new\s+(\w+)\s*\(/);
    const requestClassName = reqMatch ? reqMatch[1] : '';
    const resMatch = classBody.match(/response\s*(?::\s*\w+)?\s*=\s*new\s+(\w+)\s*\(/);
    const responseClassName = resMatch ? resMatch[1] : '';
    // 各メソッド本体から new XxxModel(...) を検出
    const methodModelUsage = {};
    for (const m of methods) {
        const methodRegex = new RegExp(`(?:public|protected|private)?\\s*(?:async\\s+)?${m.name}\\s*(?:<[^(]*?>)?\\s*\\([^)]*\\)(?:[^{]*)\\{`);
        const mm = classBody.match(methodRegex);
        if (mm && mm.index !== undefined) {
            const bracePos = classBody.indexOf('{', mm.index);
            const closePos = findClosingBrace(classBody, bracePos);
            if (closePos !== -1) {
                const methodBody = classBody.substring(bracePos + 1, closePos);
                const models = [];
                const newModelRegex = /new\s+(\w+Model)\s*\(/g;
                let nm;
                while ((nm = newModelRegex.exec(methodBody)) !== null) {
                    if (!models.includes(nm[1]))
                        models.push(nm[1]);
                }
                if (models.length > 0)
                    methodModelUsage[m.name] = models;
            }
        }
    }
    return {
        name: className,
        extendsName,
        filePath,
        classJsDoc,
        properties,
        methods,
        errorList,
        tags,
        mainCallOrder,
        requestClassName,
        responseClassName,
        fieldTypes,
        methodModelUsage,
    };
}
// =============================================
// Auto-Discovery
// =============================================
const CONTROLLER_BASES = new Set(['Controller', 'HonoController', 'ExpressController']);
const MODEL_BASES = new Set(['TableModel']);
function findTsFiles(dir) {
    const results = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name.startsWith('.'))
                continue;
            results.push(...findTsFiles(fullPath));
        }
        else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.d.ts')) {
            results.push(fullPath);
        }
    }
    return results;
}
function isControllerClass(cls, classMap) {
    if (CONTROLLER_BASES.has(cls.name))
        return false;
    if (CONTROLLER_BASES.has(cls.extendsName))
        return true;
    const parent = classMap.get(cls.extendsName);
    return parent ? isControllerClass(parent, classMap) : false;
}
function isModelClass(cls, classMap) {
    if (MODEL_BASES.has(cls.name))
        return false;
    if (MODEL_BASES.has(cls.extendsName))
        return true;
    const parent = classMap.get(cls.extendsName);
    return parent ? isModelClass(parent, classMap) : false;
}
function discoverClasses(sourceDir) {
    const files = findTsFiles(sourceDir);
    const allParsed = [];
    for (const file of files) {
        const parsed = parseSourceFile(file);
        if (parsed)
            allParsed.push(parsed);
    }
    const classMap = buildClassMap(allParsed);
    return {
        controllerClasses: allParsed.filter(c => isControllerClass(c, classMap)),
        modelClasses: allParsed.filter(c => isModelClass(c, classMap)),
        allParsed,
    };
}
// =============================================
// Inheritance Resolution
// =============================================
function buildClassMap(classes) {
    const map = new Map();
    for (const cls of classes)
        map.set(cls.name, cls);
    return map;
}
function getAncestorChain(cls, map) {
    const chain = [];
    let current = cls;
    while (current) {
        chain.unshift(current);
        current = map.get(current.extendsName);
    }
    return chain;
}
function resolveMethodDoc(methodName, currentClass, classMap) {
    const chain = getAncestorChain(currentClass, classMap);
    for (let i = chain.length - 1; i >= 0; i--) {
        const method = chain[i].methods.find(m => m.name === methodName);
        if (method) {
            return { jsDoc: method.jsDoc, source: chain[i].name };
        }
    }
    return { jsDoc: '', source: '' };
}
function isBaseClass(cls, allClasses) {
    return allClasses.some(c => c.extendsName === cls.name);
}
// =============================================
// HTML Generation
// =============================================
const CSS = `
:root {
    --primary: rgb(73, 204, 144);
    --primary-dark: rgb(64, 169, 121);
    --bg-primary: rgba(73, 204, 144, 0.15);
    --border-primary: rgba(73, 204, 144, 0.3);
    --border-gray: rgb(200, 200, 200);
    --text: rgb(30, 35, 40);
    --text-light: rgb(100, 110, 120);
    --bg-code: rgb(245, 247, 250);
}
body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    padding: 12px 24px;
    margin: 0;
    color: var(--text);
    max-width: 1600px;
    margin: 0 auto;
    line-height: 1.6;
}
h1 {
    font-size: 28px;
    font-weight: bold;
    margin-top: 16px;
    margin-bottom: 24px;
    border-bottom: 3px solid var(--primary);
    padding-bottom: 8px;
}
h2 {
    background-color: var(--primary);
    border-top-left-radius: 8px;
    border-top-right-radius: 8px;
    color: #ffffff;
    padding: 6px 12px;
    margin: 0;
    font-size: 20px;
    font-weight: bold;
}
h3 {
    font-size: 16px;
    font-weight: bold;
    margin: 16px 0 8px 0;
    padding: 4px 8px;
    border-left: 4px solid var(--primary);
    background-color: var(--bg-primary);
}
.section-wrapper {
    border-radius: 8px;
    border: var(--primary) solid 1px;
    margin-bottom: 32px;
}
.section-body {
    padding: 8px 16px 16px 16px;
}
.class-doc {
    font-size: 14px;
    color: var(--text-light);
    margin-bottom: 12px;
    white-space: pre-wrap;
}
.toc { margin-bottom: 32px; }
.toc ul { list-style: none; padding-left: 0; }
.toc li { margin-bottom: 4px; }
.toc a { color: var(--primary-dark); text-decoration: none; }
.toc a:hover { text-decoration: underline; }
.toc .toc-section { font-weight: bold; font-size: 16px; margin-top: 12px; }
.back-link { display: inline-block; margin-bottom: 16px; color: var(--primary-dark); text-decoration: none; font-size: 14px; }
.back-link:hover { text-decoration: underline; }
table {
    border-collapse: collapse;
    width: 100%;
    font-size: 14px;
    margin-bottom: 16px;
}
th {
    padding: 6px 8px;
    background-color: var(--primary);
    color: #ffffff;
    border: 1px solid var(--border-gray);
    text-align: left;
    white-space: nowrap;
}
td {
    border: 1px solid var(--border-primary);
    padding: 6px 8px;
    vertical-align: top;
}
tr:nth-child(odd) { background-color: var(--bg-primary); }
tr:nth-child(even) { background-color: #ffffff; }
.info-table { width: auto; min-width: 400px; }
.info-table th { width: 140px; }
.badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: bold;
    color: #fff;
}
.badge-get { background-color: #61affe; }
.badge-post { background-color: #49cc90; }
.badge-put { background-color: #fca130; }
.badge-patch { background-color: #50e3c2; }
.badge-delete { background-color: #f93e3e; }
.method-name { font-family: monospace; font-size: 13px; background: var(--bg-code); padding: 2px 4px; border-radius: 3px; }
.source-tag { font-size: 11px; color: var(--text-light); margin-left: 4px; }
.jsDoc-content { white-space: pre-wrap; font-size: 13px; }
@media print {
    .section-wrapper { break-inside: avoid; }
    body { max-width: none; }
}`;
function convertColonParams(endpoint) {
    return endpoint.replace(/:([a-zA-Z_][a-zA-Z0-9_]*)/g, '{$1}');
}
function findRequestTypeFile(controllerFilePath) {
    const content = fs.readFileSync(controllerFilePath, 'utf-8');
    const dir = path.dirname(controllerFilePath);
    const importRegex = /import\s+(?:\w+|\{[^}]*\})\s+from\s+['"]([^'"]+)['"]/g;
    let m;
    while ((m = importRegex.exec(content)) !== null) {
        let importPath = m[1];
        if (!importPath.startsWith('.'))
            continue;
        // .js → .ts に置き換え（ESM import対応）
        if (importPath.endsWith('.js')) {
            importPath = importPath.slice(0, -3) + '.ts';
        }
        const resolved = path.resolve(dir, importPath);
        for (const ext of ['.ts', '/index.ts', '']) {
            const candidate = ext ? resolved.replace(/\.ts$/, '') + ext : resolved;
            if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
                const c = fs.readFileSync(candidate, 'utf-8');
                if (c.includes('paramProperties'))
                    return candidate;
            }
        }
    }
    return undefined;
}
function readParamKeys(filePath) {
    const lines = fs.readFileSync(filePath, 'utf-8').split('\n');
    const keys = [];
    let inParamProps = false;
    for (const line of lines) {
        if (line.includes('paramProperties') && line.includes('=')) {
            inParamProps = true;
        }
        if (inParamProps) {
            const km = line.match(/key\s*:\s*['"](\w+)['"]/);
            if (km)
                keys.push(km[1]);
            if (line.includes('];'))
                inParamProps = false;
        }
    }
    return keys;
}
function appendPathParams(endpoint, controllerFilePath) {
    const reqFile = findRequestTypeFile(controllerFilePath);
    if (!reqFile)
        return endpoint;
    const keys = readParamKeys(reqFile);
    for (const key of keys) {
        const placeholder = `{${key}}`;
        if (!endpoint.includes(placeholder)) {
            endpoint += `/${placeholder}`;
        }
    }
    return endpoint;
}
function wrapHtmlPage(title, body, backLink) {
    const backHtml = backLink ? `<a class="back-link" href="${backLink}">← 目次に戻る</a>` : '';
    return `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(title)}</title>
    <style>${CSS}</style>
</head>
<body>
    ${backHtml}
    ${body}
</body>
</html>`;
}
function methodBadge(method) {
    const m = method.toUpperCase();
    const cls = `badge-${m.toLowerCase()}`;
    return `<span class="badge ${cls}">${m}</span>`;
}
function jsDocToHtml(jsDoc) {
    if (!jsDoc)
        return '<span style="color:#bbb">―</span>';
    const lines = jsDoc.split('\n');
    const htmlLines = [];
    for (const line of lines) {
        if (line.startsWith('@param') || line.startsWith('@returns') || line.startsWith('@throws') || line.startsWith('@remark')) {
            htmlLines.push(`<strong>${escapeHtml(line)}</strong>`);
        }
        else {
            htmlLines.push(escapeHtml(line));
        }
    }
    return `<span class="jsDoc-content">${htmlLines.join('\n')}</span>`;
}
function renderPropertyRows(props, depth, counter) {
    let html = '';
    const indent = depth > 0 ? `${'&nbsp;&nbsp;'.repeat(depth)}└ ` : '';
    for (const p of props) {
        counter.counter++;
        const hasChildren = p.children && p.children.length > 0;
        const typeLabel = hasChildren && p.type === 'array' ? 'array(object)' : p.type;
        html += `
                <tr>
                    <td style="text-align:center">${counter.counter}</td>
                    <td><code>${indent}${escapeHtml(p.key)}</code></td>
                    <td>${escapeHtml(typeDisplayName(typeLabel))}</td>
                    <td style="text-align:center">${p.required ? '○' : '―'}</td>
                    <td>${escapeHtml(p.description)}</td>
                </tr>`;
        if (hasChildren) {
            html += renderPropertyRows(p.children, depth + 1, counter);
        }
    }
    return html;
}
function generateControllerBody(cls, classMap, modelClassNames, reqProps, resProps) {
    const chain = getAncestorChain(cls, classMap);
    const apiCode = cls.properties['apiCode'] || '';
    const summary = cls.properties['summary'] || '';
    const method = cls.properties['method'] || 'GET';
    const endpoint = cls.properties['_resolvedEndpoint'] || convertColonParams(cls.properties['endpoint'] || '');
    const titleParts = [];
    if (apiCode)
        titleParts.push(`[${apiCode}]`);
    titleParts.push(summary || cls.name);
    let html = `
    <div class="section-wrapper">
        <h2>${escapeHtml(titleParts.join(' '))}</h2>
        <div class="section-body">`;
    if (cls.classJsDoc) {
        html += `<div class="class-doc">${escapeHtml(cls.classJsDoc)}</div>`;
    }
    html += `
            <h3>基本情報</h3>
            <table class="info-table">
                <tr><th>クラス名</th><td>${escapeHtml(cls.name)}</td></tr>
                <tr><th>API Code</th><td>${escapeHtml(apiCode)}</td></tr>
                <tr><th>Method</th><td>${methodBadge(method)}</td></tr>
                <tr><th>Endpoint</th><td><code>${escapeHtml(endpoint)}</code></td></tr>
                <tr><th>Summary</th><td>${escapeHtml(summary)}</td></tr>`;
    if (cls.tags.length > 0) {
        html += `<tr><th>Tags</th><td>${cls.tags.map(t => escapeHtml(t)).join(', ')}</td></tr>`;
    }
    html += `</table>`;
    const reqLabel = cls.requestClassName ? `入力パラメータ（${escapeHtml(cls.requestClassName)}）` : '入力パラメータ';
    const resLabel = cls.responseClassName ? `出力パラメータ（${escapeHtml(cls.responseClassName)}）` : '出力パラメータ';
    let sendMethodNote = '';
    const reqFile = findRequestTypeFile(cls.filePath);
    const isForm = reqFile ? fs.readFileSync(reqFile, 'utf-8').includes('isFormRequest') && fs.readFileSync(reqFile, 'utf-8').match(/isFormRequest\s*=\s*true/) : false;
    if (isForm) {
        sendMethodNote = 'フォームデータにて送信';
    }
    else if (method === 'GET' || method === 'DELETE') {
        sendMethodNote = 'URLクエリパラメータにて送信';
    }
    else {
        sendMethodNote = 'リクエストボディにて送信';
    }
    html += `<div style="display:flex;gap:16px;flex-wrap:wrap">`;
    html += `<div style="flex:1;min-width:300px">
            <h3>${reqLabel}</h3>
            <p style="color:var(--text-light);font-size:13px;margin:0 0 8px 0">${sendMethodNote}</p>`;
    if (reqProps && reqProps.length > 0) {
        html += `<table>
                <tr><th style="width:30px">No</th><th>パラメータ名</th><th style="width:100px">型</th><th style="width:30px">必須</th><th>説明</th></tr>`;
        html += renderPropertyRows(reqProps, 0, { counter: 0 });
        html += `</table>`;
    }
    else {
        html += `<p style="color:var(--text-light);font-size:14px">なし</p>`;
    }
    html += `</div>`;
    html += `<div style="flex:1;min-width:300px">
            <h3>${resLabel}</h3>`;
    if (resProps && resProps.length > 0) {
        html += `<table>
                <tr><th style="width:30px">No</th><th>パラメータ名</th><th style="width:100px">型</th><th>説明</th></tr>`;
        html += renderPropertyRows(resProps, 0, { counter: 0 });
        html += `</table>`;
    }
    else {
        html += `<p style="color:var(--text-light);font-size:14px">なし</p>`;
    }
    html += `</div>`;
    html += `</div>`;
    const baseClasses = chain.filter(c => c.name !== cls.name);
    const mainMethod = cls.methods.find(m => m.name === 'main');
    if (mainMethod && mainMethod.jsDoc) {
        html += `
            <h3>処理概要</h3>
            <div class="class-doc">${jsDocToHtml(mainMethod.jsDoc)}</div>`;
    }
    if (cls.mainCallOrder.length > 0) {
        html += `
            <h3>処理フロー（main）</h3>
            <table>
                <tr><th style="width:40px">No</th><th style="width:180px">メソッド名</th><th>説明</th><th style="width:100px">参照</th></tr>`;
        cls.mainCallOrder.forEach((call, idx) => {
            let displayCall = call;
            let jsDoc = '';
            let modelLink = '';
            if (call.includes('.')) {
                const [fieldName, methodName] = call.split('.');
                const modelClassName = cls.fieldTypes[fieldName];
                if (modelClassName && modelClassNames.has(modelClassName)) {
                    modelLink = `<a href="../models/${modelClassName}.html" style="color:var(--primary-dark);font-size:12px">${escapeHtml(modelClassName)}</a>`;
                }
                displayCall = `${fieldName}.${methodName}`;
            }
            else {
                const resolved = resolveMethodDoc(call, cls, classMap);
                jsDoc = resolved.jsDoc;
                const models = cls.methodModelUsage[call];
                if (models && models.length > 0) {
                    modelLink = models
                        .filter(m => modelClassNames.has(m))
                        .map(m => `<a href="../models/${m}.html" style="color:var(--primary-dark);font-size:12px">${escapeHtml(m)}</a>`)
                        .join('<br>');
                }
            }
            html += `
                <tr>
                    <td style="text-align:center">${idx + 1}</td>
                    <td><span class="method-name">${escapeHtml(displayCall)}</span></td>
                    <td>${jsDocToHtml(jsDoc)}</td>
                    <td style="text-align:center">${modelLink}</td>
                </tr>`;
        });
        html += `</table>`;
    }
    const mainCallSet = new Set(cls.mainCallOrder);
    const ownMethods = cls.methods.filter(m => m.name !== 'main' && !mainCallSet.has(m.name));
    if (ownMethods.length > 0) {
        html += `
            <h3>固有メソッド（${escapeHtml(cls.name)}）</h3>
            <table>
                <tr><th style="width:40px">No</th><th style="width:180px">メソッド名</th><th>説明</th></tr>`;
        ownMethods.forEach((m, idx) => {
            html += `
                <tr>
                    <td style="text-align:center">${idx + 1}</td>
                    <td><span class="method-name">${escapeHtml(m.name)}</span></td>
                    <td>${jsDocToHtml(m.jsDoc)}</td>
                </tr>`;
        });
        html += `</table>`;
    }
    const allErrors = [...cls.errorList];
    for (const base of baseClasses) {
        for (const err of base.errorList) {
            if (!allErrors.some(e => e.code === err.code && e.status === err.status)) {
                allErrors.push(err);
            }
        }
    }
    allErrors.push({ status: 500, code: '', description: 'サーバー内部エラー（予期せぬエラー）' });
    html += `
            <h3>エラー一覧</h3>
            <table>
                <tr><th style="width:60px">Status</th><th style="width:250px">Code</th><th>説明</th></tr>`;
    for (const err of allErrors) {
        const codeDisplay = err.code ? (apiCode ? `${apiCode}-${err.code}` : err.code) : '';
        html += `
                <tr>
                    <td style="text-align:center">${err.status}</td>
                    <td>${escapeHtml(codeDisplay)}</td>
                    <td>${escapeHtml(err.description)}</td>
                </tr>`;
    }
    html += `</table>`;
    html += `
        </div>
    </div>`;
    return html;
}
function generateModelBody(cls, classMap, columnInfos, referenceInfos) {
    var _a;
    const chain = getAncestorChain(cls, classMap);
    const tableName = cls.properties['tableName'] || '';
    const schemaName = cls.properties['schemaName'] || '';
    const tableDescription = cls.properties['tableDescription'] || '';
    const modelId = cls.properties['id'] || '';
    const titleParts = [];
    if (modelId)
        titleParts.push(`[${modelId}]`);
    titleParts.push(cls.name);
    if (tableDescription)
        titleParts.push(`: ${tableDescription}`);
    let html = `
    <div class="section-wrapper">
        <h2>${escapeHtml(titleParts.join(' '))}</h2>
        <div class="section-body">`;
    if (cls.classJsDoc) {
        html += `<div class="class-doc">${escapeHtml(cls.classJsDoc)}</div>`;
    }
    html += `
            <h3>基本情報</h3>
            <table class="info-table">
                <tr><th>クラス名</th><td>${escapeHtml(cls.name)}</td></tr>`;
    if (tableName) {
        html += `<tr><th>テーブル名</th><td>${escapeHtml(schemaName ? `${schemaName}.${tableName}` : tableName)}</td></tr>`;
    }
    if (tableDescription) {
        html += `<tr><th>説明</th><td>${escapeHtml(tableDescription)}</td></tr>`;
    }
    html += `</table>`;
    if (columnInfos && columnInfos.length > 0) {
        const refMap = new Map();
        if (referenceInfos) {
            for (const ref of referenceInfos) {
                for (const col of ref.columns) {
                    const existing = (_a = refMap.get(col.target)) !== null && _a !== void 0 ? _a : [];
                    existing.push(`[${ref.table}].[${col.ref}]`);
                    refMap.set(col.target, existing);
                }
            }
        }
        html += `
            <h3>テーブル定義</h3>
            <table>
                <tr>
                    <th style="width:30px">No</th>
                    <th style="width:30px">PK</th>
                    <th style="width:140px">カラム名</th>
                    <th style="width:160px">別名</th>
                    <th style="width:80px">型</th>
                    <th style="width:40px">長さ</th>
                    <th style="width:120px">バリデーション</th>
                    <th style="width:60px">NULL</th>
                    <th style="width:120px">デフォルト</th>
                    <th style="width:200px">外部キー</th>
                    <th>コメント</th>
                </tr>`;
        columnInfos.forEach((col, idx) => {
            var _a;
            const refs = (_a = refMap.get(col.name)) !== null && _a !== void 0 ? _a : [];
            html += `
                <tr>
                    <td style="text-align:center">${idx + 1}</td>
                    <td style="text-align:center">${col.attribute === 'primary' ? 'PK' : ''}</td>
                    <td>${escapeHtml(col.name)}</td>
                    <td>${escapeHtml(col.alias)}</td>
                    <td>${escapeHtml(col.type)}</td>
                    <td style="text-align:center">${escapeHtml(col.length)}</td>
                    <td>${escapeHtml(col.validation)}</td>
                    <td style="text-align:center">${col.attribute === 'nullable' ? '○' : ''}</td>
                    <td>${col.attribute === 'hasDefault' ? escapeHtml(col.defaultValue) : ''}</td>
                    <td>${refs.map(r => escapeHtml(r)).join('<br>')}</td>
                    <td>${escapeHtml(col.comment)}</td>
                </tr>`;
        });
        html += `</table>`;
    }
    const baseClasses = chain.filter(c => c.name !== cls.name);
    if (baseClasses.length > 0) {
        for (const base of baseClasses) {
            if (base.methods.length === 0)
                continue;
            html += `
            <h3>共通処理（${escapeHtml(base.name)}）</h3>
            <table>
                <tr><th style="width:40px">No</th><th style="width:180px">メソッド名</th><th>説明</th></tr>`;
            base.methods.forEach((m, idx) => {
                html += `
                <tr>
                    <td style="text-align:center">${idx + 1}</td>
                    <td><span class="method-name">${escapeHtml(m.name)}</span></td>
                    <td>${jsDocToHtml(m.jsDoc)}</td>
                </tr>`;
            });
            html += `</table>`;
        }
    }
    if (cls.methods.length > 0) {
        html += `
            <h3>固有メソッド（${escapeHtml(cls.name)}）</h3>
            <table>
                <tr><th style="width:40px">No</th><th style="width:180px">メソッド名</th><th>説明</th></tr>`;
        cls.methods.forEach((m, idx) => {
            html += `
                <tr>
                    <td style="text-align:center">${idx + 1}</td>
                    <td><span class="method-name">${escapeHtml(m.name)}</span></td>
                    <td>${jsDocToHtml(m.jsDoc)}</td>
                </tr>`;
        });
        html += `</table>`;
    }
    html += `
        </div>
    </div>`;
    return html;
}
// =============================================
// Main Export
// =============================================
function createDesignDoc(config) {
    var _a, _b, _c, _d;
    let controllerClasses;
    let modelClasses;
    let allParsed = [];
    if (config.sourceDir) {
        const discovered = discoverClasses(config.sourceDir);
        controllerClasses = discovered.controllerClasses;
        modelClasses = discovered.modelClasses;
        allParsed = discovered.allParsed;
    }
    else {
        controllerClasses = [];
        for (const file of (_a = config.controllerFiles) !== null && _a !== void 0 ? _a : []) {
            const parsed = parseSourceFile(file);
            if (parsed)
                controllerClasses.push(parsed);
        }
        modelClasses = [];
        for (const file of (_b = config.modelFiles) !== null && _b !== void 0 ? _b : []) {
            const parsed = parseSourceFile(file);
            if (parsed)
                modelClasses.push(parsed);
        }
        allParsed = [...controllerClasses, ...modelClasses];
    }
    const allClasses = [...controllerClasses, ...modelClasses];
    const classMap = buildClassMap(allClasses);
    const fileMap = new Map();
    for (const cls of allParsed)
        fileMap.set(cls.name, cls);
    const allTsFiles = config.sourceDir ? findTsFiles(config.sourceDir) : [...((_c = config.controllerFiles) !== null && _c !== void 0 ? _c : []), ...((_d = config.modelFiles) !== null && _d !== void 0 ? _d : [])];
    const classFileMap = new Map();
    for (const cls of allParsed)
        classFileMap.set(cls.name, cls.filePath);
    for (const file of allTsFiles) {
        const content = fs.readFileSync(file, 'utf-8');
        const cm = content.match(/(?:export\s+)?(?:default\s+)?class\s+(\w+)/);
        if (cm && !classFileMap.has(cm[1])) {
            classFileMap.set(cm[1], file);
        }
    }
    const resolveFilePath = (className) => classFileMap.get(className);
    const resolveProps = (className, method) => {
        const filePath = resolveFilePath(className);
        if (!filePath)
            return undefined;
        const location = (method === 'GET' || method === 'DELETE') ? 'query' : 'body';
        return parseReqResProperties(filePath, location);
    };
    const resolveResProps = (className) => {
        const filePath = resolveFilePath(className);
        if (!filePath)
            return undefined;
        return parseReqResProperties(filePath, 'body');
    };
    const leafControllers = controllerClasses.filter(c => !isBaseClass(c, controllerClasses));
    const baseControllers = controllerClasses.filter(c => isBaseClass(c, controllerClasses));
    const leafModels = modelClasses.filter(c => !isBaseClass(c, modelClasses));
    const baseModels = modelClasses.filter(c => isBaseClass(c, modelClasses));
    const outDir = config.outDir;
    const ctrlDir = path.join(outDir, 'controllers');
    const modelDir = path.join(outDir, 'models');
    mkdirSafe(outDir);
    mkdirSafe(ctrlDir);
    mkdirSafe(modelDir);
    const allControllersSorted = [...baseControllers, ...leafControllers];
    const allModelsSorted = [...baseModels, ...leafModels];
    const modelClassNameSet = new Set(modelClasses.map(c => c.name));
    // --- Write individual Controller files ---
    for (const cls of allControllersSorted) {
        const method = cls.properties['method'] || 'GET';
        const reqProps = cls.requestClassName ? resolveProps(cls.requestClassName, method) : undefined;
        const resProps = cls.responseClassName ? resolveResProps(cls.responseClassName) : undefined;
        cls.properties['_resolvedEndpoint'] = appendPathParams(convertColonParams(cls.properties['endpoint'] || ''), cls.filePath);
        const body = generateControllerBody(cls, classMap, modelClassNameSet, reqProps, resProps);
        const apiCode = cls.properties['apiCode'] || '';
        const summary = cls.properties['summary'] || '';
        const pageTitle = apiCode ? `[${apiCode}] ${summary || cls.name}` : cls.name;
        const fileName = apiCode || cls.name;
        const html = wrapHtmlPage(`${pageTitle} - ${config.name}`, body, '../index.html');
        fs.writeFileSync(path.join(ctrlDir, `${fileName}.html`), html);
    }
    // --- Write individual Model files ---
    for (const cls of allModelsSorted) {
        const columnInfos = parseModelColumns(cls.filePath);
        const referenceInfos = parseModelReferences(cls.filePath);
        const body = generateModelBody(cls, classMap, columnInfos, referenceInfos);
        const desc = cls.properties['tableDescription'] || '';
        const pageTitle = desc ? `${cls.name} : ${desc}` : cls.name;
        const html = wrapHtmlPage(`${pageTitle} - ${config.name}`, body, '../index.html');
        fs.writeFileSync(path.join(modelDir, `${cls.name}.html`), html);
    }
    // --- Write index.html ---
    let indexBody = `<h1>${escapeHtml(config.name)} 設計書</h1>`;
    if (allControllersSorted.length > 0) {
        if (baseControllers.length > 0) {
            indexBody += `<h3>共通 Controller</h3>
            <div class="toc"><ul>`;
            for (const cls of baseControllers) {
                indexBody += `<li>├ <a href="controllers/${cls.name}.html">${escapeHtml(cls.name)}</a></li>`;
            }
            indexBody += `</ul></div>`;
        }
        indexBody += `<h3>Controller 一覧</h3>
        <table>
            <tr>
                <th style="width:40px">No</th>
                <th style="width:160px">APIコード</th>
                <th>API概要</th>
                <th style="width:80px">メソッド</th>
                <th style="width:260px">エンドポイント</th>
            </tr>`;
        leafControllers.forEach((cls, idx) => {
            const code = cls.properties['apiCode'] || '';
            const summary = cls.properties['summary'] || cls.name;
            const method = cls.properties['method'] || '';
            const m = method.toUpperCase();
            const endpoint = appendPathParams(convertColonParams(cls.properties['endpoint'] || ''), cls.filePath);
            const fileName = code || cls.name;
            indexBody += `
            <tr>
                <td style="text-align:center">${idx + 1}</td>
                <td><a href="controllers/${fileName}.html" style="color:var(--primary-dark);text-decoration:none">${escapeHtml(code)}</a></td>
                <td><a href="controllers/${fileName}.html" style="color:var(--text);text-decoration:none">${escapeHtml(summary)}</a></td>
                <td style="text-align:center">${method ? methodBadge(method) : ''}</td>
                <td><a href="controllers/${fileName}.html" style="color:var(--text);text-decoration:none"><code>${escapeHtml(endpoint)}</code></a></td>
            </tr>`;
        });
        indexBody += `</table>`;
    }
    if (allModelsSorted.length > 0) {
        if (baseModels.length > 0) {
            indexBody += `<h3>共通 Model</h3>
            <div class="toc"><ul>`;
            for (const cls of baseModels) {
                indexBody += `<li>├ <a href="models/${cls.name}.html">${escapeHtml(cls.name)}</a></li>`;
            }
            indexBody += `</ul></div>`;
        }
        indexBody += `<h3>Model 一覧</h3>
        <table>
            <tr>
                <th style="width:40px">No</th>
                <th style="width:200px">テーブル名</th>
                <th>説明</th>
                <th style="width:200px">クラス名</th>
            </tr>`;
        leafModels.forEach((cls, idx) => {
            const tableName = cls.properties['tableName'] || '';
            const schemaName = cls.properties['schemaName'] || '';
            const fullTable = schemaName ? `${schemaName}.${tableName}` : tableName;
            const desc = cls.properties['tableDescription'] || '';
            indexBody += `
            <tr>
                <td style="text-align:center">${idx + 1}</td>
                <td><a href="models/${cls.name}.html" style="color:var(--text);text-decoration:none"><code>${escapeHtml(fullTable)}</code></a></td>
                <td><a href="models/${cls.name}.html" style="color:var(--text);text-decoration:none">${escapeHtml(desc)}</a></td>
                <td><a href="models/${cls.name}.html" style="color:var(--primary-dark);text-decoration:none">${escapeHtml(cls.name)}</a></td>
            </tr>`;
        });
        indexBody += `</table>`;
    }
    const indexHtml = wrapHtmlPage(`${config.name} - 設計書`, indexBody);
    fs.writeFileSync(path.join(outDir, 'index.html'), indexHtml);
    console.log(`Generated: ${outDir}/index.html`);
    console.log(`  Controllers: ${allControllersSorted.length} files -> ${ctrlDir}/`);
    console.log(`  Models: ${allModelsSorted.length} files -> ${modelDir}/`);
}
