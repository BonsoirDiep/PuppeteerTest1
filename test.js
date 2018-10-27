const path = require('path');
const uploadTool= require('./index');


(async () => {
  await uploadTool.sleep(3);
  const filePath= __dirname+ '/test.jpg'
  var x= await uploadTool.up(filePath, 'TestAlbum');
  if(x.err) return console.log(x.err);
  console.log(x.data);
})().catch(console.error);