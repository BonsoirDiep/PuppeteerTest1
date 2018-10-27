var a= require('./ck.json');

var ck= {};
a.forEach(el=>{
    var b= el.domain;
    if(b.startsWith('.')) b= b.substr(1);
    ck[b]= ck[b] || {};
    var c= ck[b];
    c[el.path]= c[el.path] || {};
    c= c[el.path];
    c[el.name]= c[el.name] || {};
    c= c[el.name];
    /**
     * "key": "NID",
        "value": "141=CXQ17bEaSu7vyYZ372uX3AUdKYnswwvbbp1OzggLI...",
        "expires": "2019-04-22T06:48:03.000Z",
        "domain": "google.com",
        "path": "/",
        "httpOnly": true,
        "hostOnly": false,
        "creation": "2018-10-21T06:48:04.375Z",
        "lastAccessed": "2018-10-21T06:48:07.686Z"
     */
    c.key= el.name;
    c.value= el.value;
    c.domain= b;
    if(el.expirationDate) c.expires= (new Date(el.expirationDate * 1000)).toISOString();
    c.path= el.path;
    c.httpOnly= el.httpOnly;
    c.hostOnly= el.hostOnly;
    //c.creation= 1;
    //c.lastAccessed= 1;
})


require('fs').writeFileSync('./gphotos-cookie/gphotos.json', JSON.stringify(ck));
