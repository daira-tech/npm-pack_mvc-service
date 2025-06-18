"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Base64Client = void 0;
const pdf_lib_1 = require("pdf-lib");
const sharp_1 = __importDefault(require("sharp"));
class Base64Client {
    constructor() { }
    // public encode(text: string): string {
    //     return Buffer.from(text).toString('base64');
    // }
    tryDecode(base64) {
        try {
            // Data URLのパターンをチェック
            if (base64.startsWith('data:')) {
                const matches = base64.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
                if (!matches || matches.length !== 3) {
                    return false;
                }
                // base64部分のみを取得
                base64 = matches[2];
            }
            if (base64.length % 4 !== 0) {
                return false;
            }
            const regex = /^[A-Za-z0-9+/]*={0,2}$/;
            if (!regex.test(base64)) {
                return false;
            }
            return Buffer.from(base64, 'base64');
        }
        catch (_a) {
            return false;
        }
    }
    getMimeType(data) {
        try {
            let buffer;
            if (typeof data === 'string') {
                // Data URLのパターンをチェック
                if (data.startsWith('data:')) {
                    const matches = data.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
                    if (!matches || matches.length !== 3) {
                        throw new Error('Invalid Data URL format');
                    }
                    // base64部分のみを取得
                    data = matches[2];
                }
                buffer = this.tryDecode(data);
            }
            else {
                buffer = data;
            }
            if (buffer === false) {
                throw new Error('Cannot getMineType because the input is not in base64 format.');
            }
            const header = buffer.subarray(0, 4);
            if (header[0] === 0x25 && header[1] === 0x50 && header[2] === 0x44 && header[3] === 0x46) {
                return 'application/pdf';
            }
            else if (header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4E && header[3] === 0x47) {
                return 'image/png';
            }
            else if (header[0] === 0xFF && header[1] === 0xD8) {
                return 'image/jpeg';
            }
            else if (header[0] === 0x47 && header[1] === 0x49 && header[2] === 0x46 && header[3] === 0x38) {
                return 'image/gif';
            }
            throw new Error('Cannot getMimeType because the file type is not PDF, PNG, JPEG, or GIF.');
        }
        catch (_a) {
            throw new Error('Cannot getMineType because the input is not in base64 format.');
        }
    }
    mergeToPdfBase64(datas) {
        return __awaiter(this, void 0, void 0, function* () {
            const mergedPdf = yield pdf_lib_1.PDFDocument.create();
            for (const data of datas) {
                const buffer = this.tryDecode(data);
                if (buffer === false) {
                    throw new Error('Cannot mergeToPdf because the input is not in base64 format.');
                }
                const fileType = this.getMimeType(buffer);
                if (fileType === 'application/pdf') {
                    const pdfDoc = yield pdf_lib_1.PDFDocument.load(buffer);
                    const pages = yield mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
                    pages.forEach(page => mergedPdf.addPage(page));
                }
                else {
                    // convert from image to pdf
                    const imagePdf = yield this.convertImageToPdf(buffer);
                    const pdfDoc = yield pdf_lib_1.PDFDocument.load(imagePdf);
                    const pages = yield mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
                    pages.forEach(page => mergedPdf.addPage(page));
                }
            }
            // 結合したPDFをBase64に変換
            const mergedPdfBytes = yield mergedPdf.save();
            return Buffer.from(mergedPdfBytes).toString('base64');
        });
    }
    convertImageToPdf(imageBuffer) {
        return __awaiter(this, void 0, void 0, function* () {
            const fileType = this.getMimeType(imageBuffer);
            let optimizedImage;
            if (fileType === 'image/gif') {
                // gifの場合はpngに変換して処理
                optimizedImage = yield (0, sharp_1.default)(imageBuffer)
                    .png()
                    .toBuffer();
            }
            else {
                optimizedImage = yield (0, sharp_1.default)(imageBuffer).toBuffer();
            }
            // 新しいPDFドキュメントを作成
            const pdfDoc = yield pdf_lib_1.PDFDocument.create();
            const page = pdfDoc.addPage();
            // 画像をPDFに埋め込み
            let image;
            if (fileType === 'image/jpeg') {
                image = yield pdfDoc.embedJpg(optimizedImage);
            }
            else {
                image = yield pdfDoc.embedPng(optimizedImage);
            }
            const { width, height } = image.scale(1);
            // ページサイズを画像に合わせる
            page.setSize(width, height);
            // 画像を描画
            page.drawImage(image, {
                x: 0,
                y: 0,
                width,
                height,
            });
            // PDFをバッファに変換
            const pdfBytes = yield pdfDoc.save();
            return Buffer.from(pdfBytes);
        });
    }
}
exports.Base64Client = Base64Client;
