var path = require('path');
var fs = require('fs');
var cjson = require('cjson');
var request = require('request');
var qs = require('querystring');
var unzip = require('unzip');
var walkSync = require('walk-sync');
var md5 = require('md5');
var archiver = require('archiver');
var Tools = require('../lib/tools');
var aicsConfig = require('../lib/config');
var AccountManager = require('../lib/account');
var chalk = require("chalk");


module.exports = PackageManager;

function PackageManager() {

}

PackageManager.publish = function(params) {

    if (params.length == 3) {
        publishTo([]);
    } else if (params.length == 4) {
        var type = params[3];
        publishTo([type]);

    } else if (params.length == 5) {
        var type = params[3];
        var name = params[4];
        publishTo([type, name]);
    } else {
        console.log(chalk.red.bold("\nError Command!\n"));
        console.log("publish                                             发布当前目录下的所有自定义包和项目");
        console.log("       --package                                    发布当前目录下的所有自定义包");
        console.log("       --project                                    发布当前目录下的所有项目");
        console.log("       --package  username:package                  发布当前目录下的自定义包和项目");
        console.log("       --project  username:project                  发布当前目录下的项目\n");
        return;
    }
}

function publishTo(args) {
    var trees = walkSync(path.resolve(".aics"), {
        globs: ['**/*.json'],
        directories: false
    });
    var type = name = null;
    //node aics plulish
    if (args.length < 1) {
        //发布全部的包 遍历.aics下的json文件
        for (var i = 0; i < trees.length; i++) {
            var fileName = trees[i];
            if (fileName.indexOf("packages.json") >= 0) {
                continue;
            }
            if (fileName.indexOf("depot") >= 0) {
                var config = require(path.resolve(".aics") + "/" + fileName);
                publishToDeopt(config, path.resolve(".aics") + "/" + fileName);
            }
            if (fileName.indexOf("project") >= 0) {
                // console.log("publish project " + fileName);
                var config = require(path.resolve(".aics") + "/" + fileName);
                publishProject(config);
            }
            // }
        }
    } else {
        //node aics plulish --project fami:fami
        args.length > 1 ? (type = args[0], name = args[1]) : (type = args[0]);
        for (var i = 0; i < trees.length; i++) {
            var fileName = trees[i];
            if (fileName.indexOf("packages.json") >= 0) {
                continue;
            }
            if (!name) {
                if (fileName.indexOf("depot") >= 0 && type == "--package") {
                    // console.log('publish ' + type + " " + fileName);
                    var config = require(path.resolve(".aics") + "/" + fileName);
                    publishToDeopt(config, path.resolve(".aics") + "/" + fileName);
                }
                if (fileName.indexOf("project") && type == "--project") {
                    // console.log('publish ' + type + " " + fileName);
                    var config = require(path.resolve(".aics") + "/" + fileName);
                    publishProject(config);
                }
            } else {
                if (fileName.indexOf("depot") >= 0 && type == "--package" && fileName.indexOf(name) >= 0) {
                    var config = require(path.resolve(".aics") + "/" + name + ".depot.json");
                    publishToDeopt(config, path.resolve(".aics") + "/" + name + ".depot.json");
                }
                if (fileName.indexOf("project") && type == "--project" && fileName.indexOf(name) >= 0) {
                    var config = require(path.resolve(".aics") + "/" + name + ".project.json");
                    publishProject(config);
                }
            }
        }
    }
}
configCheck = function(config) {

    if (!config.prototype) {
        console.log("package belong to some prototype");
        return false;
    }
    if (!config.name) {
        console.log("package need a name");
        return false;
    }

    if (!config.version) {
        console.log("package need a version");
        return false;
    }
    if (config.type != "project") {
        if (!config.files) {
            console.log("package need a files list");
            return false;
        }
    }

    return true;
}

publishToDeopt = function(config, depotConfigPath) {
    if (!configCheck(config)) {
        console.log(chalk.red.bold("\n配置文件出错.\n"));
        return;
    }
    var account = AccountManager.get();
    var files = config.files;
    var tmppath = Tools.mkdir(path.resolve(".aics")+"/tmp/" + config.name);
    var zipPath = tmppath + '/build.zip';
    var output = fs.createWriteStream(zipPath);
    output.on('close', function() {
        var r = request.post(aicsConfig.host + '/package/upload', function(err, httpResponse, body) {
            if (body == "ERROR") {
                console.log("系统错误请稍候重试 .. ");
            } else if (body == "NOPROTOTYPE") {
                console.log("未发现这个原型 " + config.prototype);
            } else if (body == "MISSNAME") {
                console.log("错误的代码包名称 account:name " + config.name);
            } else if (body == "MISSVERSION") {
                console.log("版本已经存在，请更新version " + config.name + "");
            } else if (body.indexOf("REPEAT") >= 0) {
                console.log("文件名在在原型内重复 : " + config.name + ":" + body.split(":")[1]);
            } else if (body == "SUCCESS") {
                console.log("Success! http://codedepot.fami2u.com/package=" + config.name);
            }
            // console.log(body);
            fs.unlinkSync(zipPath);
        });
        var form = r.form();
        form.append('secret', account.secret);
        form.append('config', fs.createReadStream(path.resolve(depotConfigPath)));
        form.append('zip', fs.createReadStream(path.resolve(zipPath)));

        if (config.documentation) {
            if (fs.existsSync(path.resolve(config.documentation))) {
                form.append('markdown', fs.createReadStream(path.resolve(config.documentation)));
            }
        }
    });
    //生成archiver对象，打包类型为zip
    var zipArchiver = archiver('zip');
    //将打包对象与输出流关联
    zipArchiver.pipe(output);
    for (var i = 0; i < files.length; i++) {
        if (!fs.existsSync(path.resolve(files[i]))) {
            console.log("未发现文件: " + config.name + " -->" + files[i]);
            process.exit(1);
        }
        //将被打包文件的流添加进archiver对象中
        zipArchiver.append(fs.createReadStream(files[i]), {
            'name': files[i]
        });
    }
    //打包
    zipArchiver.finalize();
}
publishProject = function(config) {
    if (!configCheck(config)) {
        console.log(chalk.red.bold("配置文件出错."));
        return;
    }
    fs.readFile(path.resolve(config.documentation), 'utf8', function(err, res) {
        config.documentation = res;
        config.creater = AccountManager.get().secret;
        var r = request.post(aicsConfig.host + '/project/create?' + qs.stringify(config), function(err, httpResponse, body) {
            console.log(body);
        });
    })
}
