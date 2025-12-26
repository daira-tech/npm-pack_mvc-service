// const cron = require('node-cron');
// import fs from 'fs';
// import path from 'path';
// import { BaseCron } from "./BaseCron";

export const runCron = async (dir: string, logCallback?: (ex: Error) => Promise<void>) => {
    // const files = fs.readdirSync(dir);
    // for (let file of files) {
    //     if (['BaseCron.ts'].includes(file)) {
    //         continue;
    //     }

    //     const filePath = path.join(dir, file);
    //     const module = await import(filePath);
    //     const cronClass = module.default;
    //     const cronInstance: BaseCron = new cronClass();

    //     cron.schedule(cronInstance.CronSchedule, async () => {
    //         try {
    //             await cronInstance.setUp();
    //             await cronInstance.run();
    //         } catch (ex: unknown) {
    //             if (logCallback !== undefined && ex instanceof Error) {
    //                 await logCallback(ex).
    //                     catch(() => {
    //                         // ログ送信時にエラーになっても握りつぶす
    //                     });
    //             }
    //         } finally {
    //             await cronInstance.tearDown();
    //         }
    //     });
    // }
}