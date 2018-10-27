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
})().catch(console.error);