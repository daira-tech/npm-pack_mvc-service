"use strict";
// const cron = require('node-cron');
// import fs from 'fs';
// import path from 'path';
// import { BaseCron } from "./BaseCron";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runCron = void 0;
const runCron = (dir, logCallback) => __awaiter(void 0, void 0, void 0, function* () {
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
});
exports.runCron = runCron;
