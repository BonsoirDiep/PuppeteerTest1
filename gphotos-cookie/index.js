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
const fs = require("fs-extra");
const libpath = require("path");
const qs = require("querystring");
const cheerio = require("cheerio");
const tough = require("tough-cookie");
const ProgressBar = require("progress");
const colors = require("colors");
const axios_1 = require("axios");
const axios_cookiejar_support_1 = require("@3846masa/axios-cookiejar-support");
const uploadInfoTemplate_1 = require("./util/uploadInfoTemplate");
const extractTokensFromDOM_1 = require("./util/extractTokensFromDOM");
const Album_1 = require("./Album");
const Photo_1 = require("./Photo");
const packageInfo = JSON.parse(fs.readFileSync(__dirname + '/../package.json', 'utf8'));

var FileCookieStore = require('tough-cookie-filestore');
class GPhotos {
    /**
     * @example
     * ```js
     * const gphotos = new GPhotos({
     *   username: 'username@gmail.com',
     *   password: 'YOUR_PASSWORD',
     *   options: {
     *     progress: true,
     *   }
     * });
     * ```
     */
    constructor(params) {
        const { username, password, options = {} } = params;
        this.username = username;
        this.password = password;

        var gphotosCookiesFile= new FileCookieStore('./gphotos-cookie/gphotos.json', {lockfile : true});
        var CookieJar = require("tough-cookie").CookieJar;
        
        //const defaultOptions = { silence: true, progress: false, jar: new tough.CookieJar() };
        const defaultOptions = {
            silence: true,
            progress: false,
            jar: new CookieJar(gphotosCookiesFile)
        };
        this.options = Object.assign(defaultOptions, options);
        this.axios = axios_cookiejar_support_1.default(axios_1.default.create({
            headers: {
                'User-Agent': `Mozilla/5.0 UploadGPhotos/${packageInfo.version}`,
            },
            validateStatus: () => true,
            maxRedirects: 0,
            jar: this.options.jar,
            withCredentials: true,
            responseType: 'text',
            transformResponse: [data => data],
        }));
    }
    /** @private */
    sendBatchExecute(queries) {
        return __awaiter(this, void 0, void 0, function* () {
            const postArray = [];
            for (const key of Object.keys(queries)) {
                postArray.push([key, JSON.stringify(queries[key]), null, null]);
            }
            const data = yield this.sendQuery('https://photos.google.com/_/PhotosUi/data/batchexecute', [postArray]);
            const results = JSON.parse(data.substr(4)).filter((entry) => entry[0] === 'wrb.fr');
            const error = results.find((entry) => Array.isArray(entry[entry.length - 2]));
            if (error) {
                throw new Error(`Error batchexecute (error: ${error[error.length - 2][0]}, query: ${error[1]})`);
            }
            return results.reduce((obj, entry) => {
                const key = entry[1];
                obj[key] = JSON.parse(entry[2]);
                return obj;
            }, {});
        });
    }
    /** @private */
    sendQuery(url, query) {
        return __awaiter(this, void 0, void 0, function* () {
            const queryRes = yield this.axios.post(url, qs.stringify({
                'f.req': JSON.stringify(query),
                at: this.params.at,
            }));
            if (queryRes.status !== 200) {
                return Promise.reject(new Error(`${queryRes.statusText}`));
            }
            return queryRes.data;
        });
    }
    /**
     * @example
     * ```js
     * gphotos.login()
     *   .then((gphotos) => {
     *     // do something
     *   })
     *   .catch((err) => {
     *     console.error(err.stack);
     *   });
     * ```
     */
    login() {
        return __awaiter(this, void 0, void 0, function* () {
            const params = yield this.fetchParams().catch(() => __awaiter(this, void 0, void 0, function* () {
                yield this.postLogin();
                return this.fetchParams();
            }));
            this.params = params;
            return this;
        });
    }
    /** @private */
    postLoginLegacy() {
        return __awaiter(this, void 0, void 0, function* () {
            const { data: loginHTML } = yield this.axios.get('https://accounts.google.com/ServiceLogin', {
                params: {
                    nojavascript: 1,
                },
            });
            const loginData = Object.assign(qs.parse(cheerio
                .load(loginHTML)('form')
                .serialize()), {
                Email: this.username,
                Passwd: this.password,
            });
            const loginRes = yield this.axios.post('https://accounts.google.com/signin/challenge/sl/password', qs.stringify(loginData));
            if (loginRes.status !== 302) {
                return Promise.reject(new Error('Failed to login'));
            }
            return;
        });
    }
    /** @private */
    postLogin() {
        return __awaiter(this, void 0, void 0, function* () {
            const { data: loginHTML } = yield this.axios.get('https://accounts.google.com/ServiceLogin', {
                params: {
                    continue: 'https://accounts.google.com/ManageAccount',
                    rip: 1,
                    nojavascript: 1,
                },
            });
            // require('fs').writeFileSync('./log_failed.html', loginHTML);
            // dong goi mau form thanh query
            // console.log(cheerio.load(loginHTML)('form').serialize());
            var formGG= qs.stringify( Object.assign(
                {},
                qs.parse(cheerio.load(loginHTML)('form').serialize()),
                { Email: this.username, Passwd: '', signIn: cheerio.load(loginHTML)('input#next').attr('value') }
            ));
            // console.log(formGG);
            const { data: lookupHTML } = yield this.axios.post('https://accounts.google.com/signin/v1/lookup', formGG, {
                headers: {
                    Referer: 'https://accounts.google.com/ServiceLogin',
                },
            });
            // require('fs').writeFileSync('./log_failed.html', lookupHTML);
            formGG= qs.stringify(Object.assign({}, qs.parse(cheerio
                .load(lookupHTML)('form')
                .serialize()),
                { Email: this.username, Passwd: this.password, signIn: cheerio.load(lookupHTML)('input#signIn').attr('value') })
            )
            //console.log(formGG);
            const loginRes = yield this.axios.post('https://accounts.google.com/signin/challenge/sl/password', formGG, {
                headers: {
                    Referer: 'https://accounts.google.com/signin/v1/lookup',
                },
            });
            //console.log(loginRes);
            for(var i in loginRes){
                if(!['data', 'request'].includes(i)){
                    console.log('---------');
                    console.log(i);
                    console.log('--');
                    console.log(loginRes[i]);
                    console.log('---------');
                }
            }
            require('fs').writeFileSync('./log_failed.html', loginRes.data);
            if (loginRes.status !== 302) {
                // Fallback
                return this.postLoginLegacy();
            }
            return;
        });
    }
    /** @private */
    fetchParams() {
        return __awaiter(this, void 0, void 0, function* () {
            const gPhotosTopPageRes = yield this.axios.get('https://photos.google.com');
            if (gPhotosTopPageRes.status !== 200) {
                return Promise.reject(new Error("Can't access to Google Photos"));
            }
            const tokens = extractTokensFromDOM_1.default(gPhotosTopPageRes.data);
            if (!tokens.SNlM0e || !tokens.S06Grb) {
                return Promise.reject(new Error("Can't fetch GPhotos params."));
            }
            const params = {
                at: tokens.SNlM0e,
                userId: tokens.S06Grb,
            };
            return params;
        });
    }
    searchAlbum(albumName) {
        return __awaiter(this, void 0, void 0, function* () {
            albumName = `${albumName}`;
            const checkFilter = (info) => {
                return info.title === albumName || info.id === albumName;
            };
            let albumInfo;
            let cursor;
            do {
                const { list, next } = yield this.fetchAlbumList(cursor);
                albumInfo = list.filter(checkFilter).shift();
                cursor = next;
            } while (!albumInfo && cursor);
            if (!albumInfo) {
                throw new Error(`Album "${albumName}" is not found.`);
            }
            return albumInfo;
        });
    }
    fetchAllAlbumList() {
        return __awaiter(this, void 0, void 0, function* () {
            const albumList = [];
            let cursor;
            do {
                const { list, next } = yield this.fetchAlbumList(cursor);
                albumList.push(...list);
                cursor = next;
            } while (cursor);
            return albumList;
        });
    }
    fetchAlbumList(next) {
        return __awaiter(this, void 0, void 0, function* () {
            const { Z5xsfc: results } = yield this.sendBatchExecute({
                Z5xsfc: [next || null, null, null, null, 1],
            });
            if (!results[0]) {
                return { list: [], next: undefined };
            }
            const albumList = results[0].map(al => {
                const info = al.pop()['72930366'];
                return new Album_1.default({
                    id: al.shift(),
                    title: info[1],
                    period: {
                        from: new Date(info[2][0]),
                        to: new Date(info[2][1]),
                    },
                    items_count: info[3],
                    gphotos: this,
                });
            });
            return { list: albumList, next: results[1] };
        });
    }
    createAlbum(albumName) {
        return __awaiter(this, void 0, void 0, function* () {
            const latestPhoto = yield this.fetchLatestPhoto();
            const { OXvT9d: results } = yield this.sendBatchExecute({
                OXvT9d: [albumName.toString(), null, 1, [[[latestPhoto.id]]]],
            });
            const [[albumId]] = results;
            const album = yield this.searchAlbum(albumId);
            const insertedPhoto = (yield album.fetchPhotoList()).list[0];
            yield insertedPhoto.removeFromAlbum();
            return album;
        });
    }
    fetchPhotoById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const photo = new Photo_1.default({ id: id, gphotos: this });
            return yield photo.fetchInfo();
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
    fetchPhotoList(next) {
        return __awaiter(this, void 0, void 0, function* () {
            const { lcxiM: results } = yield this.sendBatchExecute({
                lcxiM: [next || null, null, null, null, 1],
            });
            if (!results[0]) {
                return { list: [], next: undefined };
            }
            const photoList = results[0].map(info => {
                const data = Object.assign(Photo_1.default.parseInfo(info), { gphotos: this });
                return new Photo_1.default(data);
            });
            return { list: photoList, next: results[1] };
        });
    }
    fetchLatestPhoto() {
        return __awaiter(this, void 0, void 0, function* () {
            const latestPhotoList = yield this.fetchPhotoList();
            return latestPhotoList.list[0];
        });
    }
    searchOrCreateAlbum(albumName) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.searchAlbum(albumName).catch(() => this.createAlbum(albumName));
        });
    }
    upload(filePath, _fileName) {
        return __awaiter(this, void 0, void 0, function* () {
            const fileName = _fileName || libpath.basename(filePath);
            const fileStat = yield fs.stat(filePath);
            const fileReadStream = fs.createReadStream(filePath);
            return yield this.uploadFromStream(fileReadStream, fileStat.size, fileName);
        });
    }
    uploadFromStream(stream, size, fileName) {
        return __awaiter(this, void 0, void 0, function* () {
            stream.pause();
            const sendInfo = uploadInfoTemplate_1.default();
            for (let field of sendInfo.createSessionRequest.fields) {
                if (field.external) {
                    field.external.filename = fileName || Date.now().toString(10);
                    field.external.size = size;
                }
                else if (field.inlined) {
                    const name = field.inlined.name;
                    if (name !== 'effective_id' && name !== 'owner_name')
                        continue;
                    field.inlined.content = this.params.userId;
                }
            }
            const serverStatusRes = yield this.axios.post('https://photos.google.com/_/upload/photos/resumable?authuser=0', JSON.stringify(sendInfo), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
                },
            });
            if (serverStatusRes.status !== 200) {
                return Promise.reject(new Error(`Server Error: ${serverStatusRes.status}`));
            }
            const serverStatus = JSON.parse(serverStatusRes.data);
            if (!('sessionStatus' in serverStatus)) {
                return Promise.reject(new Error('Server Error: sessionStatus is not found.'));
            }
            const sendUrl = serverStatus.sessionStatus.externalFieldTransfers[0].putInfo.url;
            if (this.options.progress) {
                const progressBar = new ProgressBar(`${colors.green('Uploading')} [:bar] :percent :etas`, {
                    total: size,
                });
                stream.on('open', () => process.stderr.write('\n'));
                stream.on('data', chunk => {
                    progressBar.tick(chunk.length);
                });
                stream.on('end', () => process.stderr.write('\n'));
            }
            const resultRes = yield this.axios.post(sendUrl, stream, {
                headers: {
                    'Content-Type': 'application/octet-stream',
                    'X-HTTP-Method-Override': 'PUT',
                },
            });
            const result = JSON.parse(resultRes.data);
            if (result.sessionStatus.state !== 'FINALIZED') {
                return Promise.reject(new Error(`Upload Error: ${result.sessionStatus.state}`));
            }
            const uploadInfo = result.sessionStatus.additionalInfo['uploader_service.GoogleRupioAdditionalInfo'].completionInfo
                .customerSpecificInfo;
            const uploadedPhoto = new Photo_1.default({
                id: uploadInfo.photoMediaKey,
                uploadedAt: new Date(),
                createdAt: new Date(uploadInfo.timestamp * 1000),
                type: uploadInfo.kind,
                title: uploadInfo.title,
                description: uploadInfo.description,
                rawUrl: uploadInfo.url,
                uploadInfo: uploadInfo,
                gphotos: this,
            });
            return uploadedPhoto;
        });
    }
}
exports.default = GPhotos;
