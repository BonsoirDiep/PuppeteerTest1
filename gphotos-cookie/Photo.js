"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
class GPhotosPhoto {
    constructor(opts) {
        this.type = 'photo';
        Object.assign(this, opts);
    }
    get uploadInfo() {
        return this._uploadInfo;
    }
    set uploadInfo(info) {
        Object.defineProperty(this, '_uploadInfo', { value: info });
    }
    get gphotos() {
        return this._gphotos;
    }
    set gphotos(gphotos) {
        Object.defineProperty(this, '_gphotos', { value: gphotos });
    }
    static parseInfo(data) {
        const lastIdx = data.length - 1;
        const type = !data[lastIdx] || typeof data[lastIdx] !== 'object'
            ? 'photo'
            : '76647426' in data[lastIdx]
                ? 'video'
                : '139842850' in data[lastIdx]
                    ? 'animation_gif'
                    : 'photo';
        return {
            id: data[0],
            createdAt: new Date(data[2]),
            uploadedAt: new Date(data[5]),
            type: type,
            length: type === 'video' ? data[lastIdx]['76647426'][0] : null,
            width: type === 'video' ? data[lastIdx]['76647426'][2] : data[1][1],
            height: type === 'video' ? data[lastIdx]['76647426'][3] : data[1][2],
            rawUrl: data[1][0],
        };
    }
    removeFromAlbum() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.gphotos.sendBatchExecute({
                ycV3Nd: [[this.id], []],
            });
            return true;
        });
    }
    remove() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.gphotos.sendBatchExecute({
                XwAOJf: [[], 1, [this.id], 3, null, [], []],
            });
            return true;
        });
    }
    fetchInfo() {
        return __awaiter(this, void 0, void 0, function* () {
            const queries = {
                fDcn4b: [this.id, 1],
                VrseUb: [this.id, null, null, true],
            };
            const results = yield this.gphotos.sendBatchExecute(queries);
            this.description = results['fDcn4b'][0][1];
            this.title = results['fDcn4b'][0][2];
            this.fileSize = results['fDcn4b'][0][5];
            const info = GPhotosPhoto.parseInfo(results['VrseUb'][0]);
            Object.assign(this, info);
            return this;
        });
    }
    modifyCreatedDate(createdDate, timezoneSec) {
        return __awaiter(this, void 0, void 0, function* () {
            const diffTime = Math.round((new Date(createdDate).getTime() - this.createdAt.getTime()) / 1000);
            yield this.gphotos.sendBatchExecute({
                DaSgWe: [[[this.id, null, timezoneSec || null, diffTime]]],
            });
            yield this.fetchInfo();
            return true;
        });
    }
    modifyDescription(description) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.gphotos.sendBatchExecute({
                AQNOFd: [null, description, this.id],
            });
            yield this.fetchInfo();
            return true;
        });
    }
}
exports.default = GPhotosPhoto;
