import { DateType, DayType, HourType, MinuteSecondType, MonthType } from "./CronType";
import { IDbClient } from '../models/IDbClient';
import { PgConnectionConfig } from '../PgConnectionFactory';
import { ID1Database } from '../D1ConnectionFactory';
import { TDbType } from '../Controller';
export declare class BaseCron {
    /** DB種別。'pg' で PostgreSQL、'd1' で Cloudflare D1。'none' は DB 未使用 */
    protected readonly db: TDbType;
    /** db = 'pg' の場合に設定する PostgreSQL 接続設定 */
    protected get pgConfig(): PgConnectionConfig | undefined;
    /** db = 'd1' の場合に設定する D1 データベースバインディング */
    protected get d1Database(): ID1Database | undefined;
    private factory?;
    private connection?;
    protected get Client(): IDbClient;
    protected commit(): Promise<void>;
    protected rollback(): Promise<void>;
    protected cronCode: string;
    protected minute: MinuteSecondType | '*';
    protected hour: HourType | '*';
    protected date: DateType | '*';
    protected month: MonthType | '*';
    protected day: DayType | '*';
    run(): Promise<void>;
    get CronSchedule(): string;
    get CronCode(): string;
    private createConnectionFactory;
    setUp(): Promise<void>;
    tearDown(): Promise<void>;
}
//# sourceMappingURL=BaseCron.d.ts.map