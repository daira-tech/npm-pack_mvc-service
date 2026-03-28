import { DateType, DayType, HourType, MinuteSecondType, MonthType } from "./CronType";
import { IDbClient, IDbConnection, IDbConnectionFactory } from '../models/IDbClient';
import { PgConnectionFactory, PgConnectionConfig } from '../PgConnectionFactory';
import { D1ConnectionFactory, ID1Database } from '../D1ConnectionFactory';
import { TDbType } from '../Controller';

export class BaseCron {

    /** DB種別。'pg' で PostgreSQL、'd1' で Cloudflare D1。'none' は DB 未使用 */
    protected readonly db: TDbType = 'none';
    /** db = 'pg' の場合に設定する PostgreSQL 接続設定 */
    protected get pgConfig(): PgConnectionConfig | undefined { return undefined; }
    /** db = 'd1' の場合に設定する D1 データベースバインディング */
    protected get d1Database(): ID1Database | undefined { return undefined; }

    private factory?: IDbConnectionFactory;
    private connection?: IDbConnection;
    protected get Client(): IDbClient {
        if (this.connection) {
            return this.connection;
        }
        if (this.factory) {
            return this.factory;
        }
        throw new Error("Please call setUp() before accessing Client.");
    }

    protected async commit(): Promise<void> {
        if (this.connection) {
            await this.connection.commit();
        }
    }

    protected async rollback(): Promise<void> {
        if (this.connection) {
            await this.connection.rollback();
        }
    }

    // **********************************************************************
    // こちらのメソッド、プロパティを各サブクラスで設定してください
    // **********************************************************************
    protected cronCode: string = '';
    protected minute: MinuteSecondType | '*' = '*';
    protected hour: HourType | '*' = '*';
    protected date: DateType | '*' = '*';
    protected month: MonthType | '*' = '*';
    protected day: DayType | '*' = '*';
    public async run() { }

    // **********************************************************************
    // ベースクラスで設定
    // **********************************************************************
    get CronSchedule(): string {
        let schedule = '';
        schedule += this.minute.toString() + ' ';
        schedule += this.hour.toString() + ' ';
        schedule += this.date.toString() + ' ';
        schedule += this.month.toString() + ' ';
        schedule += this.day.toString();
        return schedule;
    }
    get CronCode(): string { return this.cronCode; }

    private createConnectionFactory(): IDbConnectionFactory {
        switch (this.db) {
            case 'pg':
                if (!this.pgConfig) {
                    throw new Error("pgConfig is required when db = 'pg'.");
                }
                return new PgConnectionFactory(this.pgConfig);
            case 'd1':
                if (!this.d1Database) {
                    throw new Error("d1Database is required when db = 'd1'.");
                }
                return new D1ConnectionFactory(this.d1Database);
            case 'none':
                throw new Error("BaseCron.db is 'none'. Set db = 'pg' or 'd1'.");
        }
    }

    public async setUp() {
        this.factory = this.createConnectionFactory();
        this.connection = await this.factory.connect();
        await this.connection.begin();
    }

    public async tearDown() {
        try {
            await this.rollback();
        } finally {
            if (this.connection) {
                try { await this.connection.release(); } catch (_) {}
                this.connection = undefined;
            }
            if (this.factory) {
                try { await this.factory.close(); } catch (_) {}
                this.factory = undefined;
            }
        }
    }
}
