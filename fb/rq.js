const request_module= require('request');
var cheerio= require('cheerio');
const HOST_BASIC= 'https://mbasic.facebook.com';
const headers= require('./cookie').headers;

/*var FileCookieStore = require('tough-cookie-filestore');
const request = request_module.defaults({
	jar : request_module.jar(new FileCookieStore('./fb/cookie.json'))
});
*/

const request= request_module;

String.prototype.GetValue2 = function(para) {
    let reg = new RegExp("(^|&)" + para + "=([^&]*)(&|$)");
    let r = this.substr(this.indexOf("\?") + 1).match(reg);
    if (r != null) return (r[2]);
    return null;
}

function meRq(url, cb){
    request.get({
        url: url,
        headers
    }, function(err, resp, body){
        if(resp && resp.statusCode!=200) err= err|| {message: 'cookie expire'};
        if(resp && resp.statusCode!=200) require('fs').writeFileSync('./fb/coop/failedFB.html', body)
        if(err) return cb(err);
        var $= cheerio.load(body);
        cb(null, $, body);
    })
}

function meRqChrome(url, cb){
    request.get({
        url: url,
        headers: {
            ["cookie"]: headers.cookie,
            ["user-agent"]: 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36'
        }
    }, function(err, resp, body){
        if(resp && resp.statusCode!=200) err= err|| {message: 'cookie expire'};
        if(resp && resp.statusCode!=200) require('fs').writeFileSync('./fb/coop/failedFB.html', body)
        if(err) return cb(err);
        var $= cheerio.load(body);
        cb(null, $, body);
    })
}

function meRqChromeNonCookie(url, cb){
    request.get({
        url: url,
        headers: {
            ["user-agent"]: 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36'
        }
    }, function(err, resp, body){
        if(resp && resp.statusCode!=200) err= err|| {message: 'cookie expire'};
        if(resp && resp.statusCode!=200) require('fs').writeFileSync('./fb/coop/failedFB.html', body)
        if(err) return cb(err);
        var $= cheerio.load(body);
        cb(null, $, body);
    })
}

async function download(x, name, dirPath){
    return new Promise(function(solve){
        const fs= require('fs');
        const dir= __dirname+ '/medix/images/'+ dirPath;
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir);
        }
        require('request').get({
            url: x,
            headers
        })
        .on('error', function(err){
            solve({err});
        })
        .pipe(require('fs').createWriteStream(dir+ '/image_'+ name+ '.jpg'))
        .on('close', function(){
            solve({data: 1})
        })
    })
}

async function download2(x, name, dirPath){
    return new Promise(function(solve){
        const fs= require('fs');
        const dir= __dirname+ '/medix/videos/'+ dirPath;
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir);
        }
        require('request').get({
            url: x,
            headers
        })
        .on('error', function(err){
            solve({err});
        })
        .pipe(require('fs').createWriteStream(dir+ '/video_'+ name+ '.mp4'))
        .on('close', function(){
            solve({data: 1})
        })
    })
}
const database= require('./database.json');
// console.log({database})
function save(){
    require('fs').writeFileSync('./fb/database.json', JSON.stringify(database));
}
module.exports= {
    meRq,
    meRqChrome,
    meRqChromeNonCookie,
    HOST_BASIC,
    download,
    download2,
    database,
    save,
    saveUser: function(idUser){
        const users= require('./usersbase.json');
        if(!users[idUser]){
            users[idUser]= true;
            require('fs').writeFileSync('./fb/usersbase.json', JSON.stringify(users));
        }
    }
}