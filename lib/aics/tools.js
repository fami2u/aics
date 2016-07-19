var path = require('path');
var fs = require('fs');
var readline = require('readline');
var chalk = require("chalk");
module.exports = Tools;

function Tools() {}

Tools.copy = function(src, dest) {
    var content = fs.readFileSync(src, 'utf8');
    fs.writeFileSync(dest, content);
}
Tools.mergeFile = function(src, dest, override) {
    var buffer = fs.readFileSync(dest, 'UTF-8');
    const rl = readline.createInterface({
        input: fs.createReadStream(src)
    });
    rl.on('line', (line) => {
          if(!buffer.includes(line)){
            fs.appendFile(dest, '\n'+line, 'utf8', function (argument) {
              console.log("+"+chalk.green.bold(line))
            });
          }
    });
}
Tools.packs = {};
Tools.mkdir = function(dir) {
    // dir = path.resolve(dir);
    // var paths = dir.replace(/\\/g, "/").split("/");
    // var root = paths[0];
    dir = path.resolve(dir);
    var paths = dir.split(path.sep);
    paths[paths.length - 1] = paths[paths.length - 1].replace(":", "$");
    var root = paths[0];

    for (var i = 1; i < paths.length; i++) {
        root = root + path.sep + paths[i];
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
    fs.writeFileSync(path.resolve("./project.json"), JSON.stringify(config));
}
Tools.getAics = function() {
    var configPath = require(path.resolve(".aics/packages.json"));
    return configPath;
}
Tools.setAics = function(name, version) {
    var configPath = require(path.resolve(".aics/packages.json"));
    configPath[name] = version;
    fs.writeFileSync(path.resolve(".aics/packages.json"), JSON.stringify(configPath, null, 2));
}
Tools.confRemove = function(name) {
    var packageConf = require(path.resolve(".aics/packages.json"));
    var projConf = require(path.resolve(".aics/project.json"));

    delete packageConf[name.split("@")[0]];
    delete projConf.packages[name.split("@")[0]];

    fs.writeFileSync(path.resolve(".aics/packages.json"), JSON.stringify(packageConf, null, 2));
    fs.writeFileSync(path.resolve(".aics/project.json"), JSON.stringify(projConf, null, 2));
}
Tools.isExist = function(path, showLog) {
    try {
        var states = fs.statSync(path);
        if (states) {
            return true;
        } else {
            return false;
        }
    } catch (e) {
        showLog ? console.log(path + ' is not Exist.') : "";
        return false;
    }
}
