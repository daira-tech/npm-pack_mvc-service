import { TableModel } from "./TableModel";
import { TColumn } from "./Type";

export const createTableDoc = (models: Array<TableModel>, serviceName?: string) => {
    let html = `
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <!--This icon made by Yuki Kuboyama.-->
    <link rel="icon" 
      type="image/x-icon" 
      href="data:image/x-icon;base64,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" />
    <title>table document</title>
</head>
<style>
:root {
    --primary: rgb(73, 204, 144);
    --primary-dark: rgb(64, 169, 121);
    --bg-primary: rgba(73, 204, 144, 0.15);
    --border-primary: rgba(73, 204, 144, 0.3);
    --border-gray: rgb(200, 200, 200);
}

body {
    padding: 0px;
    padding-left: 12px;
    padding-right: 12px;
    margin: 0px;
    color: rgb(30, 35, 40);
}


button {
    padding-left: 8px;
    padding-right: 8px;
    padding-top: 2px;
    padding-bottom: 2px;
    background-color: var(--primary);
    border: 0px;
    color: #ffffff;
    border-radius: 999px;
}

button:hover {
    background-color: var(--primary-dark);
}

/* title*/
h1 {
    font-size: 28px;
    font-weight: bold;
    margin-top: 16px;
    margin-bottom: 16px;
}

/* db-title*/
h2 {
    background-color: var(--primary);
    border-top-left-radius: 8px;
    border-top-right-radius: 8px;
    color: #ffffff;
    padding-left: 4px;
    margin: 0;
    font-size: 24px;
    font-weight: bold;
}

.db-wrapper {
    border-radius: 8px;
    border: var(--primary) solid 1px;
    margin-bottom: 24px;
}

/* table-title*/
h3 {
    font-size: 18px;
    font-weight: bold;
}

.table-wrapper {
    padding: 0px;
    margin-bottom: 64px;
}

.table-title-wrapper {
    background-color: var(--bg-primary);
    border-top: var(--border-primary) solid 1px;
    margin: 0;
    padding: 2px 4px;
    align-items: center;
    display: flex;
}

.table-title-left {
    font-size: 18px;
    font-weight: bold;
    text-align: left;
    font-size: 18px;
    font-weight: bold;
}

.table-title-right {
    margin-left: auto;
    padding: 2px;
}

.comment-wrapper {
    padding-left: 4px;
    padding-top: 4px;
    padding-bottom: 8px;
    font-size: 14px;
}

table {
    border-collapse: collapse;
    margin-top: 0px;
    margin-left: 8px;
    margin-right: 8px;
    margin-bottom: 12px;
    font-size: 14px;
}

tr:nth-child(odd) {
    background-color: var(--bg-primary); /* 奇数行の背景色を変更 */
}

tr:nth-child(even) {
    background-color: #ffffff; /* 偶数行の背景色を変更 */
}

th {
    padding-left: 4px;
    padding-right: 4px;
    background-color: var(--primary);
    color: #ffffff;
    border: 1px solid var(--border-gray); /* 線の色と太さを指定 */
}

td {
    border: 1px solid var(--border-primary); /* 線の色と太さを指定 */
    padding-left: 4px;
    padding-right: 4px;
}

/* No */
td:nth-child(1) {
    width: 16px;
    text-align: center;
}

/* PK */
td:nth-child(2) {
    width: 24px;
    text-align: center;
}

/* name */
td:nth-child(3) {
    width: 140px;
}

/* alias */
td:nth-child(4) {
    width: 180px;
}

/* type */
td:nth-child(5) {
    width: 60px;
}

/* length */
td:nth-child(6) {
    width: 40px;
}

/* validation */
td:nth-child(7) {
    width: 120px;
}

/* nullable */
td:nth-child(8) {
    width: 40px;
}

/* default */
td:nth-child(9) {
    width: 120px;
}

/* Foreign Key */
td:nth-child(10) {
    width: 300px;
}

/* comment */
td:nth-child(11) {
    width: auto;
}

/* function */
td:nth-child(12) {
    width: auto;
}
</style>

<body>
    <h1>${serviceName === undefined ? '': serviceName + ' :'}Your Table Definition Document</h1>
`;

    const dbObj: {[key: string]: Array<TableModel>} = {};
    for (const model of models) {
        if (model.DbName in dbObj === false) {
            dbObj[model.DbName] = [];
        }
        dbObj[model.DbName].push(model);
    }
    
    const jsCripFuncs: { [key: string]: string } = {};
    for (const [keyDbName, models] of Object.entries(dbObj)) {
        html += `
    <div class="db-wrapper">
        <h2>${keyDbName} Database</h2>`;

        for (const model of models) {
            const createFuncName = `clipboard_createTable_${model.DbName}_${model.TableName}`;
            html += `
        <div class="table-wrapper">
            <div class="table-title-wrapper">
                <div class="table-title-left">${model.Id !== "" ? `[${model.Id}] ` : ""}${model.TableName} ${model.TableDescription !== '' ? ` : ${model.TableDescription}` : ''}</div>
                <button class="table-title-right" onclick="${createFuncName}()">Copy Create Query</button>
            </div>
            <div class="comment-wrapper">${model.Comment.replace(/\n/g, '<br>')}</div>

            <table>
                <tr>
                    <th>No</th>
                    <th>PK</th>
                    <th>name</th>
                    <th>alias</th>
                    <th>type</th>
                    <th>length</th>
                    <th>validation</th>
                    <th>nullable</th>
                    <th>default</th>
                    <th>foreign key</th>
                    <th>comment</th>
                    <th>function</th>
                </tr>`;

            const createColExpressions: Array<string> = [];
            const pkColNames: Array<string> = [];
            let index = 0;
            for (const [keyColName, column] of Object.entries(model.Columns)) {
                index++;
                const addFuncName = `clipboard_addColumn_${model.DbName}_${model.TableName}_${keyColName}`;
                const dropFuncName = `clipboard_dropColumn_${model.DbName}_${model.TableName}_${keyColName}`;

                // 外部キー用
                let references: Array<string> = [];
                for (const ref of model.GetReferences(keyColName)) {
                    const targetRef = ref.columns.filter(col => col.target === keyColName);
                    if (targetRef.length > 0) {
                        references.push(`[${ref.table}].[${targetRef[0].ref}]`);
                    }
                }
                references = Array.from(new Set(references)); // 重複を除く

                html += `
                <tr>
                    <td>${index}</td>
                    <td>${column.attribute === 'primary' ? 'PK' : ''}</td>
                    <td>${keyColName}</td>
                    <td>${column.alias ?? keyColName}</td>
                    <td>${column.type}</td>
                    <td>${'length' in column ? column.length : ''}</td>
                    <td>${(() => {
                        const v: string[] = [];
                        if ('min' in column && column.min !== undefined) v.push(`min: ${column.min}`);
                        if ('max' in column && column.max !== undefined) v.push(`max: ${column.max}`);
                        if ('regExp' in column && column.regExp !== undefined) v.push(`regexp: ${column.regExp}`);
                        return v.join('<br>');
                    })()}</td>
                    <td>${column.attribute === 'nullable' ? 'nullable' : ''}</td>
                    <td>${column.attribute === 'hasDefault' ? column.default ?? '???' : ''}</td>
                    <td>${references.length === 0 ? '' : references.join('<br>')}</td>
                    <td>${(column.comment ?? '').replace(/\n/g, '<br>')}</td>
                    <td>
                        ${column.attribute === "primary" ? `` : `
                        <button onclick="${addFuncName}()">Copy add column</button><br>
                        <button onclick="${dropFuncName}()">Copy drop column</button>
                        `}
                    </td>
                </tr>`;
                
                jsCripFuncs[addFuncName] = `ALTER TABLE ${model.TableName} ADD COLUMN ${keyColName} ${toColumnType(column)} ${toColumnAttibute(column)};`;
                jsCripFuncs[dropFuncName] = `ALTER TABLE ${model.TableName} DROP COLUMN ${keyColName};`;

                // CreateTable作成用
                createColExpressions.push(`${keyColName} ${toColumnType(column)} ${toColumnAttibute(column)}`)
                if (column.attribute === 'primary') {
                    pkColNames.push(keyColName);
                }
            }

            // CreateTable作成文
            const expressions = [...createColExpressions];
            if (pkColNames.length > 0) {
                expressions.push(`PRIMARY KEY (${pkColNames.join(', ')})`);
            }
            for (const ref of model.References) {
                expressions.push(`FOREIGN KEY (${ref.columns.map(col => col.target).join(', ')}) REFERENCES ${ref.table}(${ref.columns.map(col => col.ref).join(', ')})`);   
            }
            jsCripFuncs[createFuncName] = `CREATE TABLE ${model.TableName} (\n    ${expressions.join(',\n    ')}\n);`;

            html += `
            </table>
        </div>`;
        }
        html += `
    </div>`;
    }

    html += `\n    <script>\n`;
    for (const [keyFunName, value] of Object.entries(jsCripFuncs)) {
        html += `
        function ${keyFunName}() {
            const el = document.createElement('textarea');
            el.value = \`${value}\`;
            document.body.appendChild(el);
            el.select();
            document.execCommand('copy');
            document.body.removeChild(el);
            alert('コピーしました');
        }\n`;
    }

    html += `    </script>
</body>
</html>
`;
    return html;
}

function toColumnType(column: TColumn) {
    if (column.type.startsWith('uuid')) {
        return column.type.replace('uuid', 'UUID');
    } else if (column.type.startsWith('bool')) {
        return column.type.replace('bool', 'BOOLEAN');
    } else if (column.type.startsWith('date')) {
        return column.type.replace('date', 'DATE');
    } else if (column.type.startsWith('integer')) {
        return column.type.replace('integer', 'INTEGER');
    } else if (column.type.startsWith('real')) {
        return column.type.replace('real', 'REAL');
    } else if (column.type.startsWith('string')) {
        return column.type.replace('string', `VARCHAR(${'length' in column ? column.length : '???'})`);
    } else if (column.type.startsWith('timestamp')) {
        return column.type.replace('timestamp', 'TIMESTAMP');
    } else if (column.type.startsWith('time')) {
        return column.type.replace('time', 'TIME');
    } else if (column.type.startsWith('jsonb')) {
        return column.type.replace('jsonb', 'JSONB');
    } else if (column.type.startsWith('json')) {
        return column.type.replace('json', 'JSON');
    }

    return '';
}

function toColumnAttibute(column: TColumn) {
    switch (column.attribute) {
        case 'hasDefault':
            return 'NOT NULL DEFAULT ' + column.default;
        case 'noDefault':
            return 'NOT NULL';
        case 'nullable':
            return 'NULL';
        case 'primary':
            return ''; // 主キーは後で設定するので
    }
}