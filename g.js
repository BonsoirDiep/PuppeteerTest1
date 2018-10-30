var lzma = require("lzma");

function get_hrtime(start){
    var diff;
    if (start) {
        diff = process.hrtime(start);
        return  (diff[0] * 1e9 + diff[1]) / 1000000;
    }
    return process.hrtime();
}
/*

/// To compress:
///NOTE: mode can be 1-9 (1 is fast and pretty good; 9 is slower and probably much better).
///NOTE: compress() can take a string or an array of bytes.
///      (A Node.js Buffer or a Uint8Array instance counts as an array of bytes.)
my_lzma.compress(string || byte_array, mode, on_finish(result, error) {}, on_progress(percent) {});

/// To decompress:
///NOTE: By default, the result will be returned as a string if it decodes as valid UTF-8 text;
///      otherwise, it will return a Uint8Array instance.
my_lzma.decompress(byte_array, on_finish(result, error) {}, on_progress(percent) {});

*/
var a= "Hello World";
var mode= 1;

a= Buffer.from(lzma.compress(a, mode)).toString('base64');
console.log({a});
lzma.compress(a, mode, function(res){
    var text= Buffer.from(res);
    console.log('> compress text:', text.toString('base64'))
}, function(percent) {
    console.log ( "> compressing: " + (percent * 100) + "%"  );
});


function test(str){
    var deco_start = get_hrtime();
    var result= Buffer.from(str, 'base64');
    lzma.decompress(result, function (result) {
        var deco_speed = get_hrtime(deco_start);
        console.log("Decompression time:", deco_speed + " ms");
        console.log("\t> decompressed: " + result);
    }, function (percent) {
        console.log ( "\t> decompressing: " + (percent * 100) + "%"  );
    });
}
function test2(str){
    var result= Buffer.from(str, 'base64');
    var res= lzma.decompress(Buffer.from(result, 'base64'));
    console.log({res}) 
}
var g= 'XQAAAAJZBAAAAAAAAAAeHMqHyTY4PyKmqfkwr6ooCXSIMxPQ7ojYR153HqZD3W+keVdvwyoyd+luwncAk7A/7oAPeOKvbSdlLmZdwzwqHv2U4R5BMVBqEEQyHVavbQNUzdZ4YzboBvRD67IfsUOob0p1vAvJXVxcfZD+NRmeLewOFJARSMbcVHEuzyKhpB0ddaMOWfhSjWBCbhcSro8tk5xcbHFJP6R1SvYb5q9Wm60ujABIFIQgUweOQKHMGNNIvtSp53WcZ4g1LVmDpa66gp54JdkmkmgRYCxIIpw9QDF6h6fPXVJP3rMPHArHAokmMyO+F2z0TnQuwkK/eF4MCqcJN69Sb70a6yLxGf0wBFlN6zpA8pbMnelMlU5h+3WSW47MB5DD554vTpaWmeYMXUujmwJP4Gr0CfsL0s4xUaKxbP135XtWZgZiIR8aU11IWzi8Oa6dRG8c0AcypzMYMDpTK6E0mhqBY1XJ0WGSfnM6HmxPciN8lAv3S1GP61KvbcQTKKK31YFIFezs3vfyHtmlVs19reitSthHIWOrVMwLmu2XpLO9VaS7aADmDwQDIgCZw2URIqIfFW0zlV9yl9T/slNh3P4gM64=';

test(g);
test2(g);


var ba= Buffer.from('XinChao').toString('base64');
console.log({ba});
ba= Buffer.from(ba, 'base64').toString();
console.log({ba});