import { PoolClient } from "pg";
import { DateType, DayType, HourType, MinuteSecondType, MonthType } from "./CronType";
export declare class BaseCron {
    protected readonly isTest: boolean;
    protected dbUser?: string;
    protected dbHost?: string;
    protected dbName?: string;
    protected dbPassword?: string;
    protected dbPort?: string | number;
    protected dbIsSslConnect: boolean;
    private isExecuteRollback;
    private pool?;
    private client?;
    protected get Client(): PoolClient;
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
    setUp(): Promise<void>;
    tearDown(): Promise<void>;
}
//# sourceMappingURL=BaseCron.d.ts.map