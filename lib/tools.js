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
Tools.packs = {};
Tools.mkdir = function(dir) {
    
    dir = dir.replace(":", "-");
    dir = path.resolve(dir);
    var paths = dir.replace(/\\/g, "/").split("/");
    var root = paths[0];

    for (var i = 1; i < paths.length; i++) {
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
Tools.checkProject = function() {
    if (!fs.existsSync(path.resolve(".aics"))) {
        console.log("\nNot a aics projcet.\n");
        process.exit(1);
    }
}
Tools.projectConfig = function(configPath) {
    configPath = path.resolve(configPath);
    if (!fs.statSync(configPath)) {
        console.log("未找到配置文件: " + configPath);
        process.exit(1);
    }
    return require(configPath);
}

Tools.updateProjectConfig = function(config) {
    fs.writeFileSync(path.resolve("./aics-project.json"), JSON.stringify(config));
}
Tools.getAics = function() {
    var configPath = require(path.resolve(".aics/packages.json"));
    return configPath;
}
Tools.setAics = function(name, version) {
    var configPath = require(path.resolve(".aics/packages.json"));
    configPath[name + "@" + version] = 1;
    fs.writeFileSync(path.resolve(".aics/packages.json"), JSON.stringify(configPath, null, 4));
}
