export interface IDbClient {
    query(sql: string, vars?: any[]): Promise<any>;
}

export interface IDbConnection extends IDbClient {
    begin(): Promise<void>;
    commit(): Promise<void>;
    rollback(): Promise<void>;
    release(): Promise<void>;
}

export interface IDbConnectionFactory extends IDbClient {
    connect(): Promise<IDbConnection>;
    close(): Promise<void>;
}
