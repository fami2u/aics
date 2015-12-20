var path = require('path');
var fs = require('fs');
var archiver = require('archiver');
var uuid = require('uuid');
var cjson = require('cjson');


module.exports = Tools;

function Tools() {

}
Tools.copy = function(src, dest){
	var content = fs.readFileSync(src, 'utf8');
    fs.writeFileSync(dest, content);
}


Tools.account = function(){
	var config = path.resolve(__dirname, '../account.json');

	if (!fs.existsSync(config)) {

		console.log("need to login with aics account");

        process.exit(1);
    }

    var json = cjson.load(config);

    return json;
}
Tools.mkdir = function(path){

    var paths = path.replace("\\","/").split("/");
    var root = "/";
    for(var i = 0 ; i < paths.length ; i++){
        root = root + "/" +  paths[i];
        if (!fs.existsSync(root)) {
            fs.mkdirSync(root);
        }
    }
    
    return true;
}