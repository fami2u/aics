var path = require('path');
var fs = require('fs');
var archiver = require('archiver');
var cjson = require('cjson');


module.exports = Tools;

function Tools() {

}
Tools.copy = function(src, dest) {
    var content = fs.readFileSync(src, 'utf8');
    fs.writeFileSync(dest, content);
}

Tools.mkdir = function(dir) {

    dir = path.resolve(dir);

    var paths = dir.replace("\\", "/").split("/");
    var root = "/";

    for (var i = 0; i < paths.length; i++) {
        root = root + "/" + paths[i];
        if (!fs.existsSync(root)) {
            fs.mkdirSync(root);
        }
    }

    return dir;
}
Tools.mkfile = function(filePath, contentFun) {

    filePath = path.resolve(filePath);

    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, contentFun());
    }
}
Tools.checkProject = function(){
    if (!fs.existsSync(path.resolve("./aics-project.json"))) {
        console.log("这不是一个AICS管理的项目。");
        process.exit(1);
    }
}
Tools.projectConfig = function(configPath){

    configPath = path.resolve(configPath);

    if (!fs.existsSync(configPath)) {
        console.log("未找到配置文件: "  + configPath);
        process.exit(1);

    }

    var json = cjson.load(configPath);


    return json;
}

Tools.updateProjectConfig = function(config){

    fs.writeFileSync(path.resolve("./aics-project.json"), JSON.stringify(config));
}

Tools.getAics = function() {

    var configPath = path.resolve(".aics/packages.json");

    return cjson.load(configPath);

}

Tools.setAics = function(name, version) {

    var configPath = path.resolve(".aics/packages.json");

    var json = cjson.load(configPath);

    json[name + "@" + version] = 1;

    fs.writeFileSync(configPath, JSON.stringify(json));

}