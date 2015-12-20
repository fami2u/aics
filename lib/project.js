var path = require('path');
var fs = require('fs');
var archiver = require('archiver');
var Tools = require('../lib/tools');
var request = require('request');
var aicsConfig = require('../lib/config');


module.exports = ProjectManager;

function ProjectManager() {

}
ProjectManager.config = function() {

    var configPath = path.resolve('aics-project.json');

    if (!fs.existsSync(configPath)) {

        console.log("not in a aics project ,frist run aics project init [name] ");

        process.exit(1);
    }

    var json = cjson.load(configPath);


    if (!json.prototype) {
        console.log("project use some prototype");
        process.exit(1);
    }

    if (!json.name) {
        console.log("project need a name");
        process.exit(1);
    }

    if (!json.version) {
        console.log("project need a version");
        process.exit(1);
    }

    if (!json.packages) {
        console.log("project some packages");
        process.exit(1);
    }

    return json;
}
ProjectManager.init = function(name) {

    if(!name){
        console.log("error ,need a project name");
    }else{
        var hidePath = path.resolve("./.aics-packages");

        if (!fs.existsSync(hidePath)) {

            fs.mkdirSync(hidePath);

        }

        var configPath = path.resolve("./aics-project.json");
        
        if (!fs.existsSync(configPath)) {

            var exampleProjectJson = path.resolve(__dirname, '../example/aics-project.json');

            var content = fs.readFileSync(exampleProjectJson, 'utf8');

            fs.writeFileSync(configPath, content.replace("{{name}}",name));
        }

        console.log("project " + name + " is inited config in aics-project.json" );
    }
    

}



