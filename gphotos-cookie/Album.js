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
const Photo_1 = require("./Photo");
class GPhotosAlbum {
    constructor(opts) {
        this.items_count = 0;
        this.type = 'album';
        Object.assign(this, opts);
    }
    get gphotos() {
        return this._gphotos;
    }
    set gphotos(gphotos) {
        Object.defineProperty(this, '_gphotos', { value: gphotos });
    }
    addPhoto(photo) {
        return __awaiter(this, void 0, void 0, function* () {
            const [insertedPhotoId] = yield this.addPhotos([photo]);
            return insertedPhotoId;
        });
    }
    addPhotos(photos) {
        return __awaiter(this, void 0, void 0, function* () {
            const results = yield this.gphotos
                .sendBatchExecute({
                E1Cajb: [photos.map(p => p.id), this.id],
            })
                .then(res => res['E1Cajb'])
                .catch(() => {
                // Fallback: If album is shared, use 99484733.
                return this.gphotos
                    .sendBatchExecute({
                    C2V01c: [[this.id], [2, null, [[photos.map(p => p.id)]], null, null, [], [1], null, null, null, []]],
                })
                    .then(res => res['C2V01c']);
            });
            const insertedPhotoIds = results[1] || [];
            return insertedPhotoIds;
        });
    }
    fetchPhotoList(next) {
        return __awaiter(this, void 0, void 0, function* () {
            const { snAcKc: results } = yield this.gphotos.sendBatchExecute({
                snAcKc: [this.id, next || null, null, null, 0],
            });
            const photoList = results[1].map(info => {
                const data = Object.assign(Photo_1.default.parseInfo(info), { gphotos: this.gphotos });
                return new Photo_1.default(data);
            });
            return { list: photoList, next: results[2] };
        });
    }
    fetchAllPhotoList() {
        return __awaiter(this, void 0, void 0, function* () {
            const photoList = [];
            let cursor;
            do {
                const { list, next } = yield this.fetchPhotoList(cursor);
                photoList.push(...list);
                cursor = next;
            } while (cursor);
            return photoList;
        });
    }
    remove() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.gphotos.sendBatchExecute({
                nV6Qv: [[this.id], []],
            });
            return true;
        });
    }
}
exports.default = GPhotosAlbum;
