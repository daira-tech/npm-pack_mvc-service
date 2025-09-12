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
const axios_1 = __importDefault(require("axios"));
const pdf_lib_1 = require("pdf-lib");
const sharp_1 = __importDefault(require("sharp"));
const type_utils_n_daira_1 = require("type-utils-n-daira");
class Base64Client {
    constructor() {
        this.PREFIX_JPEG_DATA = '/9j/';
        this.PREFIX_PNG_DATA = 'iVBORw0KGgo';
    }
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
    isJpeg(value) {
        if (type_utils_n_daira_1.ValidateStringUtil.isBase64(value) === false) {
            return false;
        }
        if (value.startsWith('data:')) {
            if (value.startsWith('data:image/jpeg,') === false && value.startsWith('data:image/jpg,') === false) {
                return false;
            }
            const valueParts = value.split(',');
            if (valueParts.length !== 2) {
                return false;
            }
            return valueParts[1].startsWith(this.PREFIX_JPEG_DATA);
        }
        return value.startsWith(this.PREFIX_JPEG_DATA);
    }
    isPng(value) {
        if (type_utils_n_daira_1.ValidateStringUtil.isBase64(value) === false) {
            return false;
        }
        if (value.startsWith('data:')) {
            if (value.startsWith('data:image/png,') === false) {
                return false;
            }
            const valueParts = value.split(',');
            if (valueParts.length !== 2) {
                return false;
            }
            return valueParts[1].startsWith(this.PREFIX_PNG_DATA);
        }
        return value.startsWith(this.PREFIX_PNG_DATA);
    }
    tryConvertToPng(base64Value) {
        return __awaiter(this, void 0, void 0, function* () {
            if (type_utils_n_daira_1.ValidateStringUtil.isBase64(base64Value) === false) {
                return false;
            }
            const base64Data = base64Value.startsWith('data:') ? base64Value.split(',')[1] : base64Value;
            if (this.isPng(base64Data)) {
                return base64Data;
            }
            else if (this.isJpeg(base64Data)) {
                const buffer = Buffer.from(base64Data, 'base64');
                try {
                    const pngBuffer = yield (0, sharp_1.default)(buffer)
                        .ensureAlpha().png().toBuffer();
                    return pngBuffer.toString('base64');
                }
                catch (e) {
                    return false;
                }
            }
            return false;
        });
    }
    resizeImage(base64Data, toSize) {
        return __awaiter(this, void 0, void 0, function* () {
            if (type_utils_n_daira_1.ValidateStringUtil.isBase64(base64Data) === false) {
                throw new Error("The specified data is not in base64 format");
            }
            const imageBuffer = Buffer.from(base64Data, 'base64');
            const metadata = yield (0, sharp_1.default)(imageBuffer).metadata();
            const { width, height, format } = metadata;
            if (width === undefined || height === undefined) {
                throw new Error("Failed to retrieve image dimensions");
            }
            let rate = 1;
            if ('rate' in toSize) {
                rate = toSize.rate;
            }
            else if ('w' in toSize && 'h' in toSize && 'func' in toSize) {
                const wRate = toSize.w / width;
                const hRate = toSize.h / height;
                switch (toSize.func) {
                    case 'max':
                        rate = Math.max(wRate, hRate);
                        break;
                    case 'min':
                        rate = Math.min(wRate, hRate);
                        break;
                }
            }
            else if ('w' in toSize) {
                rate = toSize.w / width;
            }
            else if ('h' in toSize) {
                rate = toSize.h / height;
            }
            // 画像は1倍より大きくできないので
            if (rate >= 1 || rate <= 0) {
                return base64Data;
            }
            let resizedImage;
            // フォーマットに応じて処理を分岐
            const targetWidth = Math.round(width * rate);
            const targetHeight = Math.round(height * rate);
            if (format === 'png') {
                resizedImage = yield (0, sharp_1.default)(imageBuffer)
                    .resize(targetWidth, targetHeight, {
                    fit: 'inside',
                    withoutEnlargement: true
                })
                    .png({ quality: 90 })
                    .toBuffer();
            }
            else {
                // JPEG、その他のフォーマット
                resizedImage = yield (0, sharp_1.default)(imageBuffer)
                    .resize(targetWidth, targetHeight, {
                    fit: 'inside',
                    withoutEnlargement: true
                })
                    .jpeg({ quality: 90 })
                    .toBuffer();
            }
            return resizedImage.toString('base64');
        });
    }
    fetchImageAsBase64(imageUrl) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield axios_1.default.get(imageUrl, {
                responseType: 'arraybuffer' // これを追加
            });
            // Content-Typeをチェック
            const contentType = res.headers['content-type'];
            if (!(contentType === null || contentType === void 0 ? void 0 : contentType.startsWith('image/'))) {
                throw new Error(`Invalid content type: ${contentType}. Expected image/*`);
            }
            // ArrayBufferをBufferに変換してBase64にエンコード
            const buffer = Buffer.from(res.data);
            return buffer.toString('base64');
        });
    }
}
exports.Base64Client = Base64Client;
