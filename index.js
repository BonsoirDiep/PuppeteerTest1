const path = require('path');
const GPhotos = require('./gphotos-cookie').default;

const gphotos = new GPhotos({});

(async () => {
  /*await gphotos.login();
  const album = await gphotos.fetchAllPhotoList();
  console.log(album);*/

  await gphotos.login();
  const filePath= __dirname+ '/test.jpg'
  const photo = await gphotos.upload(filePath);
  const album = await gphotos.searchOrCreateAlbum('TestAlbum');
  await album.addPhoto(photo);
})().catch(error=>{
    console.error(error);
    process.exit();
});

async function up(filePath, albumName){
    try {
        const photo = await gphotos.upload(filePath);
        const album = await gphotos.searchOrCreateAlbum(albumName);
        var x= await album.addPhoto(photo);
        return {data: photo};
    } catch(err){
        return {err};
    }
}

module.exports= {
    gphotos,
    up,
    sleep: async function(s){
        return new Promise(r=> setTimeout(r, s* 1000))
    }
}