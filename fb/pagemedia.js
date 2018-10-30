const {meRq, tryHdVideoId, HOST_BASIC, download, download2, database, save}= require('./rq');

function getlistImages(opt, cb){
    var id= ''+ opt.id;
    meRq((opt.id) ? 'https://mbasic.facebook.com/'+ id+ '/photos' : opt.url, function(err, $){
        if(err) return cb(err);
        if(opt.open1) return cb(null, $);
        var data= {next: '', images: [], videos: []};
        //var a = $("div[style^='text-align:center']").eq(0);
        $('#root>table>tbody>tr>td>div>a').each(function(i, el){
            var a= $(this).attr('href');
            if(a.includes('/photos/')) data.images.push(HOST_BASIC+ a);
        })
        if($('#m_more_item a').eq(0).attr('href'))
            data.next= HOST_BASIC+ $('#m_more_item a').eq(0).attr('href');
        cb(null, data);
    });
}

async function detailImg(opt){
    return new Promise(function(solve){
        meRq(opt.url, function(err, $){
            if(err) return solve({err});
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
            solve({data: data.origin});
        });
    })
}

function scanImages(opt){
    var turl= (opt.id) ? 'https://mbasic.facebook.com/'+ opt.id+ '/photos' : opt.url;
    if(!turl.includes('/photoset/pb.')){
        getlistImages({
            url: opt.url,
            id: opt.id,
            open1: true
        }, function(err, $){
            if(!err) {
                var x= $("a[href*='/photoset/pb.']").attr('href');
                if(x){
                    x= HOST_BASIC+ x;
                    return scanImages({url: x});
                }
            }
        })
        return;
    }
    getlistImages({url: opt.url}, function(er, dat){
        if(er) return console.error(er);
        var xPath= opt.id || opt.url.GetValue2('owner_id');
        console.log({xPath});
        (async function(){
            if(dat.images.length>0){
                for(var i in dat.images){
                    var el= dat.images[i] || '';
                    var idItem= el.split('/')[6];
                    if(el && !database[idItem] && idItem){
                        var x= await detailImg({url: el});
                        if(x.data){
                            database[idItem]= true; save();
                            console.log('> download image:', idItem);
                            x= await download(x.data, idItem, xPath);
                            if(x.err) throw x.err;
                        }
                    }
                    else if(database[idItem]){
                        return console.log('> new feed')
                    }
                }
            }
            if(dat.next) setTimeout(function(){
                scanImages({
                    url: dat.next
                })
            }, 3000)
        })();
    })
}

function getlistVideos(opt, cb){
    var id= ''+ opt.id;
    meRq((opt.id) ? 'https://mbasic.facebook.com/'+ id+ '/video_grid' : opt.url, function(err, $, body){
        if(err) return cb(err);
        if(body.startsWith('for (;;);')){
            body= body.replace('for (;;);', '');
            try{
                var a= JSON.parse(body);
                body= a["actions"][0].html || '';
                if(!body) throw new Error('body empty???');
            } catch(exbody){
                return cb(exbody);
            }
        }
        var data= {next: '', images: [], videos: []};
        $('td').each(function(i, el){
            var a= $(this).find('div a').eq(0).attr('href');
            if(a){
                if(a.includes('/video_redirect/')){
                    const idItem= a.GetValue2('id');
                    if(!data.videos.includes(idItem)) data.videos.push(idItem);
                };
                //if(a.includes('/video_redirect/')) data.videos.push(HOST_BASIC+ a);
            }
        })
        if($('#m_pages_finch_see_more_videos a').eq(0).attr('href'))
            data.next= HOST_BASIC+ $('#m_pages_finch_see_more_videos a').eq(0).attr('href');
        cb(null, data);
    })
}

function scanVideos(opt, xPath){
    getlistVideos({id: opt.id, url: opt.url}, function(er, dat){
        if(er) return console.error(er);
        xPath= xPath || dat.next.split('/')[3];
        console.log({xPath});
        (async function(){
            if(dat.videos.length>0){
                for(var i in dat.videos){
                    const idItem= dat.videos[i];
                    var tmp= await tryHdVideoId(idItem, false);
                    if(idItem && !database[idItem]){
                        var x= {data: tmp.data || undefined};
                        if(x.data){
                            database[idItem]= true;
                            save();
                            console.log('> download videos:', idItem);
                            x= await download2(x.data, idItem, xPath);
                            if(x.err) throw x.err;
                        }
                    } else if(database[idItem]){
                        return console.log('> new feed')
                    }
                }
            }
            if(dat.next) setTimeout(function(){
                scanVideos({
                    url: dat.next
                }, xPath)
            }, 3000)
        })();
    })
}

/*scanImages({
    id: 123456
})*/

scanVideos({
    //url: 'https://mbasic.facebook.com/123456/videos'
    //url: 'https://mbasic.facebook.com/123456/video_grid/'
    id: 123456
})