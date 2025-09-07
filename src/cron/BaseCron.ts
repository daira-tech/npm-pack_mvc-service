import { Pool, PoolClient } from "pg";
import { DateType, DayType, HourType, MinuteSecondType, MonthType } from "./CronType";
import PoolManager from "../PoolManager";

export class BaseCron {

    protected readonly isTest: boolean = process.env.NODE_ENV === 'test';
    protected dbUser?: string = this.isTest ? process.env.TEST_DB_USER : process.env.DB_USER;
    protected dbHost?: string = this.isTest ? process.env.TEST_DB_HOST : process.env.DB_HOST;
    protected dbName?: string = this.isTest ? process.env.TEST_DB_DATABASE : process.env.DB_DATABASE;
    protected dbPassword?: string = this.isTest ? process.env.TEST_DB_PASSWORD : process.env.DB_PASSWORD;
    protected dbPort?: string | number = this.isTest ? process.env.TEST_DB_PORT : process.env.DB_PORT;
    protected dbIsSslConnect: boolean = (this.isTest ? process.env.TEST_DB_IS_SSL : process.env.DB_IS_SSL) === 'true';

    private isExecuteRollback: boolean = false;
    private pool?: Pool;
    private client?: PoolClient;
    protected get Client(): PoolClient { 
        if (this.client === undefined) {
            throw new Error("Please call this.PoolClient after using the setClient method.");
        }
        return this.client;
    }

    protected async commit(): Promise<void> {
        await this.Client.query('COMMIT');
        this.isExecuteRollback = false;
    }

    protected async rollback(): Promise<void> {
        if (this.isExecuteRollback) {
            await this.Client.query('ROLLBACK');
        }
        this.isExecuteRollback = false;
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

    public async setUp() {
        if (this.dbUser === undefined) {
            throw new Error("Database user is not configured");
        }
        if (this.dbHost === undefined) {
            throw new Error("Database host is not configured");
        }
        if (this.dbName === undefined) {
            throw new Error("Database name is not configured");
        }
        if (this.dbPassword === undefined) {
            throw new Error("Database password is not configured");
        }
        if (this.dbPort === undefined) {
            throw new Error("Database port is not configured");
        }

        this.pool = PoolManager.getPool(this.dbUser, this.dbHost, this.dbName, this.dbPassword, this.dbPort, this.dbIsSslConnect);
        this.pool.query(`SET TIME ZONE '${process.env.TZ ?? 'Asia/Tokyo'}';`);
        this.client = await this.pool.connect();
        await this.Client.query('BEGIN');
        this.isExecuteRollback = true;
    }

    public async tearDown() {
        if (this.isExecuteRollback === false) {
            this.rollback();
        }
    }
}