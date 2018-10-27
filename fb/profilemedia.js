const {meRq, meRqChrome, meRqChromeNonCookie, HOST_BASIC, download, download2, database, save}= require('./rq');

//const KeyAlbum= '/photoset/t.'; // 
const KeyAlbum= '/photoset/pb.';
function listImages(opt, cb){
    var id= ''+ opt.id;
    meRq((opt.id) ? 'https://mbasic.facebook.com/profile.php?v=photos&id='+ id : opt.url, function(err, $, body){
        if(err) return cb(err);
        if(opt.open1) return cb(null, $);
        var data= {next: '', images: []};
        //var a = $("div[style^='text-align:center']").eq(0);
        $('#root>table>tbody>tr>td>div>a').each(function(i, el){
            var a= $(this).attr('href');
            if(a.includes('/photo.php?')) data.images.push(HOST_BASIC+ a);
            // Video từ Lê Thị Hồng videos_by
            // Video của Lê Thị Hồng
            /*else {
                var idVideo= a.GetValue2('id');
                var idUser= opt.id || opt.url.GetValue2('owner_id');
                console.log({idVideo, idUser});
                if(idUser== idVideo) data.videos.push(HOST_BASIC+ a);
            }*/
        });
        if($('#m_more_item a').eq(0).attr('href'))
            data.next= HOST_BASIC+ $('#m_more_item a').eq(0).attr('href');
        cb(null, data);
    });
}

function detailImagePromise(opt, cb){
    return new Promise(function(solve){
        meRq(opt.url, function(err, $, body){
            if(err) return solve({err});
            var data= {thumb: [], origin: ''};
            $('#objects_container img').each(function(i, el){
                var a= $(this).attr('src');
                if(!a.includes('/static.xx.fbcdn.net/')) data.thumb.push(a);
            })
            data.origin= data.thumb[0];
            solve({data: data.origin});
        })
    });
}
function scanImages(opt, xPath){
    var id= ''+ opt.id;
    var turl= (opt.id) ? 'https://mbasic.facebook.com/profile.php?v=photos&id='+ id : opt.url;
    if(!turl.includes(KeyAlbum)){
        listImages({
            url: opt.url,
            id: opt.id,
            open1: true
        }, function(err, $){
            if(!err) {
                var x= $("a[href*='"+ KeyAlbum+ "']").attr('href');
                if(x){
                    x= HOST_BASIC+ x;
                    return scanImages({url: x});
                }
            }
        })
        return;
    }
    listImages({id: opt.id, url: opt.url}, function(er, dat){
        if(er) return console.error(er);
        if(!xPath) xPath= (opt.id) || opt.url.GetValue2('owner_id');
        console.log({xPath});
        (async function(){
            if(dat.images.length>0){
                for(var i in dat.images){
                    var el= dat.images[i];
                    const idItem= el.GetValue2('fbid');
                    if(el && !database[idItem]){
                        var x= await detailImagePromise({url: el});
                        if(x.data){
                            database[idItem]= true;
                            save();
                            console.log('> download image');
                            x= await download(x.data, idItem, xPath);
                            if(x.err) throw x.err;
                        }
                    }
                }
            }
            if(dat.next) setTimeout(function(){
                scanImages({
                    url: dat.next
                }, xPath)
            }, 3000)
        })();
    })
}

function getJson4(body, truoc, sau){
    if(body.includes(truoc)){
        var a= body.indexOf(truoc)+ truoc.length;
        return body.substring(a, body.indexOf(sau, a));
    }
    return '';
}

function getJson5(body, truoc, sau, res){
    res= res || [];
    while(body.includes(truoc)){
        var a= body.indexOf(truoc)+ truoc.length;
        var b= body.indexOf(sau, a);
        var c= body.substring(a, b);
        if(!res.includes(c)) res.push(c);
        body= body.substr(a);
    }
    return res;
}

function listVideos(opt, cb){
    if(!opt.id) return cb({message: 'not opt.id'});
    meRqChrome('https://web.facebook.com/'+ opt.id+ '/videos_by', function(err, $, body){
        var async_get_token= getJson4(body, 'async_get_token":"', '"');
        var pagelet_token= getJson5(body, 'pagelet_token:"', '"');
        var data_fbid= getJson5(body, 'data-fbid="', '"');
        var collection_token= getJson4(body, 'collection_token=', '&');
        //console.log({async_get_token, pagelet_token, collection_token: decodeURIComponent(collection_token)});

        const cursorKey= 'MDpub3Rfc3RydWN0dXJlZDpBUU'
        var idx= body.indexOf(cursorKey),
        nextCursor= body.substring(idx, body.indexOf('"', idx))

        var data= {
            "collection_token": decodeURIComponent(collection_token),
            "cursor": nextCursor, // Base64
            "disablepager": false,
            "overview": false,
            "profile_id": opt.id,
            "pagelet_token": pagelet_token[0],
            "tab_key": "videos_by",
            //"lst": 'xxxxxxxxxxxxxxxx',
            "order": null,
            "sk": "videos",
            "importer_state": null
        };
        
        var more= "https://web.facebook.com/ajax/pagelet/generic.php/VideosByUserAppCollectionPagelet?";
        var query1= {
            dpr: 1,
            fb_dtsg_ag: async_get_token,
            data: decodeURI(JSON.stringify(data)),
            __a: 1,
        };
        more+= require('querystring').stringify(query1);

        console.log('> len:', data_fbid.length);
        function loopMeRqChrome(urlMore){
            meRqChrome(urlMore, function(err2, $2, body2){
                if(err2) cb(err2, data_fbid);
                data_fbid= getJson5(body2, 'data-fbid=\\"', '\\"', data_fbid);
                console.log('> len:', data_fbid.length);
                if(body2.includes(cursorKey)){
                    idx= body2.indexOf(cursorKey);
                    nextCursor= body2.substring(idx, body2.indexOf('"', idx));
                    //data.pagelet_token= pagelet_token[1];
                    data.cursor= nextCursor;
                    var Nmore= "https://web.facebook.com/ajax/pagelet/generic.php/VideosByUserAppCollectionPagelet?"+ 
                        require('querystring').stringify({
                            dpr: 1,
                            fb_dtsg_ag: async_get_token,
                            data: decodeURI(JSON.stringify(data)),
                            __a: 1,
                    });
                    loopMeRqChrome(Nmore);
                } else {
                    cb(null, data_fbid);
                }
            })
        }
        loopMeRqChrome(more);
    })
}

async function detailVideoPromise(id){
    return new Promise(function(solve){
        meRqChromeNonCookie('https://www.facebook.com/'+ id, function(err, $, body){
            if(err) return solve({err});
            var hdk= ',hd_src:"';
            var a= body.indexOf(hdk);
            if(a==-1) {
                hdk= ',sd_src:"';
                a= body.indexOf(hdk);
            }
            if(a==-1){
                require('fs').writeFileSync('./fb/coop/failedFB.html', body)
                return solve({err: 'not hd_src, sd_src'});
            }
            a+= hdk.length;
            const urlHd= body.substring(a, body.indexOf('"', a));
            solve({data: urlHd});
        })
    })
}

function scanVideos(opt){
    if(!opt.id) return;
    listVideos({
        id: opt.id
    }, function(err, data){
        if(data){
            (async function(){
                for(var i in data){
                    if(i!='0'){
                        var el= data[i];
                        var x= await detailVideoPromise(el);
                        if(x.data && !database[el]){
                            database[el]= true; save();
                            console.log('> download video:', el);
                            x= await download2(x.data, el, 'user.video.'+ opt.id);
                            //if(x.err) throw x.err;
                        } else if(database[el]){
                            //return console.log('> new feed')
                        }
                    }
                }
            })();
        }
    })
}

// scanImages({
//     id: '100009402376314'
// })

scanVideos({
    id: '100009402376314'
})

