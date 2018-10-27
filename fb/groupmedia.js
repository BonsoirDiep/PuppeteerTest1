const {saveUser, meRq, meRqChrome, HOST_BASIC, download, download2, database, save}= require('./rq');


function getlist(opt, cb){
    var id= ''+ opt.id;
    meRq((opt.id) ? 'https://mbasic.facebook.com/media/set/?set=g.'+ id+ '&type=1&v' : opt.url, function(err, $, body){
        if(err) return cb(err);
        var data= {next: '', images: [], videos: []};
        $('#thumbnail_area a').each(function(i, el){
            var a= $(this).attr('href');
            if(a.includes('/photo.php?')) data.images.push(HOST_BASIC+ a);
            else data.videos.push(HOST_BASIC+ a);
        })
        if($('#m_more_item a').eq(0).attr('href'))
            data.next= HOST_BASIC+ $('#m_more_item a').eq(0).attr('href');
        cb(null, data);
    })
}

function getdetail(opt, cb){
    meRq(opt.url, function(err, $, body){
        if(err) return cb(err);
        var data= {thumb: [], origin: ''};
        $('#objects_container img').each(function(i, el){
            var a= $(this).attr('src');
            if(!a.includes('/static.xx.fbcdn.net/')) data.thumb.push(a);
        })
        data.origin= data.thumb[0];
        var a= $('div#m_story_permalink_view > div').html();
        if(a){
            var idx1= a.indexOf('/video_redirect/');
            a= a.substring(idx1, a.indexOf('\"', idx1));
            a= HOST_BASIC+ a;
            data.video= a;
        }
        /*const k1= 'content_owner_id_new&quot;:&quot;';
        if(body.includes(k1)){
            var a= body.indexOf(k1)+ k1.length;
            data.videoUser= body.substring(a, body.indexOf('&quot;', a));
        }*/
        cb(null, data);
    })
}

async function detailVideoPromise(id){
    return new Promise(function(solve){
        meRqChrome('https://www.facebook.com/'+ id, function(err, $, body){
            if(err) return solve({err});
            const hdk= ',hd_src:"';
            var a= body.indexOf(hdk);
            if(a==-1){
                require('fs').writeFileSync('./fb/coop/failedFB.html', body)
                return solve({err: 'not hd_src'});
            }
            a+= hdk.length;
            const urlHd= body.substring(a, body.indexOf('"', a));
            var k1= 'profileID:"', idUser;
            if(body.includes(k1)){
                a= body.indexOf(k1)+ k1.length;
                idUser= body.substring(a, body.indexOf('"', a));
            }

            solve({data: urlHd, idUser: idUser});
        })
    })
}
async function detailImagePromise(opt){
    return new Promise(function(solve){
        getdetail(opt, function(err, data){
            if(err) return solve({err});
            return solve({data: data.origin});
        })
    })
}


function scanVideos(opt, xPath){
    getlist({id: opt.id, url: opt.url}, function(er, dat){
        if(er) return console.error(er);
        xPath= xPath || dat.next.GetValue2('set');
        (async function(){
            var newFeed= 0;
            if(dat.images.length>0){
                for(var i in dat.images){
                    var el= dat.images[i];
                    const idItem= el.GetValue2('fbid');
                    const idUser= el.GetValue2('id');
                    saveUser(idUser);
                    if(el && !database[idItem]){
                        var x= await detailImagePromise({url: el});
                        if(x.data){
                            database[idItem]= true; save();
                            console.log('> download image');
                            x= await download(x.data, idItem, xPath);
                            if(x.err) throw x.err;
                        }
                    }
                    else if(database[idItem]){
                        newFeed++;
                    }
                }
            }
            if(dat.videos.length>0){
                for(var i in dat.videos){
                    var el= dat.videos[i];
                    const idItem= el.GetValue2('id');


                    if(el && !database[idItem]){
                        var x= await detailVideoPromise(idItem);
                        if(x.data){
                            database[idItem]= true; save();
                            console.log('> download video');
                            x= await download2(x.data, idItem, xPath);
                            if(x.err) throw x.err;
                        }
                        if(x.idUser) saveUser(x.idUser);
                    }
                    else if(database[idItem]){
                        newFeed++;
                    }
                }
            }
            if(newFeed>= (dat.videos.length+ dat.images.length)){
                return console.log('> new feed');
            }
            if(dat.next) setTimeout(function(){
                scanVideos({
                    url: dat.next
                }, xPath)
            }, 3000)
        })();
    })
}

scanVideos({
    //id: 1234
    url: 'https://mbasic.facebook.com/media/set/?set=g.123&s=12&refid=56'
})