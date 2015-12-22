var path = require('path');
var fs = require('fs');
var cjson = require('cjson');
var request = require('request');
var qs = require('querystring');
var unzip = require('unzip');
var walk = require('walk-promise');
var md5 = require('md5');
var archiver = require('archiver');

var Tools = require('../lib/tools');
var aicsConfig = require('../lib/config');
var AccountManager = require('../lib/account');


module.exports = PackageManager;

function PackageManager() {

}



PackageManager.publish = function(configname) {


    if (!configname) {
        //发布全部的包
        //遍历.aics下的json文件
        walk(path.resolve(".aics")).then(function(files) {

            for (var i = 0; i < files.length; i++) {

                var file = files[i];

                if (file.name.indexOf(".depot.json") > 0) {
                    //确定是包文件
                    console.log("读取包配置文件: .aics/" + file.name);

                    var config = Tools.projectConfig(".aics/" + file.name);

                    if (configCheck(config)) {

                        publishToDeopt(config,".aics/" + file.name);

                    }
                }

            }

        });

    } else {
        //发布指定包 

        configname = configname.replace(".depot.json", "") + ".depot.json";



        var config = Tools.projectConfig(".aics/" + configname);

        if (configCheck(config)) {

            publishToDeopt(config,".aics/" + configname);

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

    if (!config.files) {
        console.log("package need a files list");
        return false;
    }

    return true;
}

publishToDeopt = function(config,depotConfigPath) {


    var account = AccountManager.get();

    // console.log(config.files);

    var files = config.files;

    var tmppath = Tools.mkdir(".aics/tmp" + "/" + config.name);

    var zipPath = tmppath + '/build.zip';

    //创建一最终打包文件的输出流
    var output = fs.createWriteStream(zipPath);
    //监听打包完毕
    output.on('close', function() {
        var r = request.post(aicsConfig.host + '/packageUpload', function(err, httpResponse, body) {
            if (body == "ERROR") {
                console.log("系统错误请稍候重试 .. ");
            } else if (body == "NOPROTOTYPE") {
                console.log("未发现这个原型 " + config.name + ":" + config.prototype);
            } else if (body == "MISSNAME") {
                console.log("错误的代码包名称 account:name " + config.name);
            } else if (body == "MISSVERSION") {
                console.log("版本已经存在，请更新version " + config.name + "");
            } else if (body.indexOf("REPEAT") == 0) {
                console.log("文件名在在原型内重复 : " + config.name + ":" + body.split(":")[1]);
            } else if (body == "SUCCESS") {
                console.log("发布成功 ! 详情访问 http://code-depot.cc/package=" + config.name)
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
        console.log("代码包文件: " + files[i]);
        //将被打包文件的流添加进archiver对象中
        zipArchiver.append(fs.createReadStream(files[i]), {
            'name': files[i]
        });
    }
    //打包
    zipArchiver.finalize();
}
