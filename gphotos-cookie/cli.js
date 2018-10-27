#!/usr/bin/env node
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
const crypto = require("crypto");
const fs = require("fs-extra");
const log4js = require("log4js");
const yargs = require("yargs");
const inquirer = require("inquirer");
const Configstore = require("configstore");
const tough = require("tough-cookie");
const _1 = require("./");
const wait_1 = require("./util/wait");
const packageInfo = JSON.parse(fs.readFileSync(__dirname + '/../package.json', 'utf8'));
function decodeCookie(encoded, password) {
    try {
        const decipher = crypto.createDecipher('aes-256-cbc', password);
        const decoded = decipher.update(encoded, 'base64', 'utf8');
        return tough.CookieJar.fromJSON(decoded);
    }
    catch (_err) {
        return new tough.CookieJar();
    }
}
function encodeCookie(jar, password) {
    const cipher = crypto.createCipher('aes-256-cbc', password);
    const decoded = Buffer.concat([cipher.update(JSON.stringify(jar), 'utf8'), cipher.final()]).toString('base64');
    return decoded;
}
log4js.configure({
    appenders: {
        console: {
            type: 'console',
            layout: {
                type: 'pattern',
                pattern: '%[%p%] %m',
            },
        },
    },
    categories: {
        default: {
            appenders: ['console'],
            level: 'all',
        },
    },
});
const logger = log4js.getLogger();
yargs.demand(1);
yargs.usage(`Upload-GPhotos ${packageInfo.version}\n\nUsage: upload-gphotos file [...] [--quiet] [-r retry] [-u username] [-p password] [-a albumname]`);
yargs.options('r', {
    alias: 'retry',
    type: 'number',
    default: 3,
    desc: 'The number of times to retry when failed uploads.',
});
yargs.options('u', {
    alias: 'username',
    desc: 'Google account username.',
});
yargs.options('p', {
    alias: 'password',
    desc: 'Google account password.',
});
yargs.options('a', {
    alias: 'album',
    array: true,
    desc: 'Album where uploaded files put.',
});
yargs.options('q', {
    alias: 'quiet',
    boolean: true,
    default: false,
    desc: 'Prevent to show progress.',
});
yargs.help('h').alias('h', 'help');
yargs.alias('v', 'version');
const { username: _username, password: _password, quiet, retry, album: albumNameList, version: showVersion, _: files, } = yargs.argv;
if (showVersion) {
    console.log(packageInfo.version);
    process.exit(0);
}
(() => __awaiter(this, void 0, void 0, function* () {
    try {
        yield Promise.all(files.map(path => fs.access(path)));
    }
    catch (_) {
        yargs.showHelp();
        process.abort();
    }
    const { username = _username, password = _password } = (yield inquirer.prompt([
        {
            type: 'input',
            name: 'username',
            message: 'Username?',
            when: !_username,
        },
        {
            type: 'password',
            name: 'password',
            message: 'Password?',
            when: !_password,
        },
    ]));
    // Restore cookies
    const conf = new Configstore(packageInfo.name, {});
    const jar = conf.has('jar') && username === conf.get('username')
        ? decodeCookie(conf.get('jar'), password)
        : new tough.CookieJar();
    // Login
    const gphotos = new _1.default({
        username: username,
        password: password,
        options: {
            progress: !quiet,
            jar,
        },
    });
    yield gphotos.login().catch(err => {
        logger.error(`Failed to login. ${err.message}`);
        console.error(jar.serializeSync());
        return Promise.reject(err);
    });
    // Store cookies
    conf.set('username', username);
    conf.set('jar', encodeCookie(jar, password));
    const albumList = [];
    const photos = [];
    for (let path of files) {
        // Try 3 times
        let uploadPromise = Promise.reject(null);
        for (let cnt = 0; cnt < retry; cnt++) {
            uploadPromise = uploadPromise.catch((err) => __awaiter(this, void 0, void 0, function* () {
                if (err) {
                    logger.error(`Failed to upload. Retry after 3 sec. ${err.message}`);
                }
                yield wait_1.default(3000);
                return gphotos.upload(path);
            }));
        }
        const photo = yield uploadPromise.catch(err => {
            logger.error(`Failed to upload. ${err.message}`);
            return Promise.reject(err);
        });
        if (albumNameList && albumList.length !== albumNameList.length) {
            for (let albumName of albumNameList) {
                const album = yield gphotos.searchOrCreateAlbum(albumName).catch(err => {
                    logger.error(`Failed to create album. ${err.message}`);
                    return Promise.reject(err);
                });
                albumList.push(album);
            }
        }
        for (let album of albumList) {
            yield album.addPhoto(photo).catch(err => {
                logger.error(`Failed to add photo to album. ${err.message}`);
                return Promise.reject(err);
            });
        }
        photos.push(photo);
    }
    console.info(JSON.stringify(photos, null, 2));
}))().catch(function (err) {
    logger.error(err.stack);
    process.abort();
});
