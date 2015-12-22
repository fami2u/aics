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

ProjectManager.init = function() {

    /*
    *简化了aics项目的构成合并项目和包的概念
    *.aics 文件夹存放包描述文件列表
    *.aics/tmp 临时目录用来打包或下载文件
    *.aics-project.json 项目描述文件 
    ＊－－0.0.x 版本用来管理项目的包依赖关系
    * ./aics/example.json 包描述文件
    */

    Tools.mkdir(".aics/tmp");

    Tools.mkfile("./aics-project.json", function() {

        var exampleProjectJson = path.resolve(__dirname, '../example/aics-project.json');

        return fs.readFileSync(exampleProjectJson, 'utf8');
    });

    Tools.mkfile(".aics/example.depot.json", function() {

        var exampleProjectJson = path.resolve(__dirname, '../example/example-package.json');

        return fs.readFileSync(exampleProjectJson, 'utf8');
    });

    Tools.mkfile(".aics/packages.json", function() {
        return "{}";
    });

    console.log("AICS 项目已完成初始化。");
    console.log("＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝项目结构说明＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝");
    console.log(".aics-project.json             项目配置文件，管理代码包依赖关系");
    console.log("./aics                         代码包配置列表及相关文件存放");
    console.log("./aics/tmp                     临时目录");
    console.log("./aics/example.depot.json            代码包配置例子文件,可以包含多个");
    console.log("./aics/packages.json           已倒入的所有代码包及版本信息");

    console.log("访问 fami2u.com 或 aics.io 或详细配置信息.");




}

ProjectManager.update = function(configname) {


    if (!configname) {
        //更新项目的依赖
        var config = Tools.projectConfig("./aics-project.json");

        console.log("更新项目依赖的代码包: aics-project.json");


        for (var pname in config.dependencies) {

            queryPackage(pname, config.dependencies[pname]);

        }

    } else if (configname == "-all") {
        //更新所有包
        //遍历.aics下的json文件
        walk(path.resolve(".aics")).then(function(files) {

            for (var i = 0; i < files.length; i++) {

                var file = files[i];

                if (file.name.indexOf(".depot.json") > 0) {
                    //确定是包文件
                    console.log("读取包配置文件: .aics/" + file.name);

                    var config = Tools.projectConfig(".aics/" + file.name);

                    if (config.dependencies) {
                        for (var pname in config.dependencies) {

                            queryPackage(pname, config.dependencies[pname]);

                        }
                    }
                }

            }

        });


    } else{

        //指定包更新
        configname = configname.replace(".depot.json", "") + ".depot.json";

        var config = Tools.projectConfig(".aics/" + configname);



        if (config.dependencies) {

            //确定是包文件
            console.log("读取包配置文件: .aics/" + configname);

            for (var pname in config.dependencies) {

                queryPackage(pname, config.dependencies[pname]);

            }
        }

    }

}


ProjectManager.add = function(name) {

    if (!name) {

        console.log(" 在 add 命令后添加您要添加的代码包名称。可以在http://code-depot.cc 寻找感兴趣的代码包");

    } else {
        //读取项目配置文件中的
        var config = Tools.projectConfig("./aics-project.json");
        //为当前项目添加包依赖

        var packageinfo = name.split("@");

        config.dependencies[packageinfo[0]] = (packageinfo[1] ? packageinfo[1] : "");

        Tools.updateProjectConfig(config);

        queryPackage(packageinfo[0], (packageinfo[1] ? packageinfo[1] : ""));

    }

}

queryPackage = function(name, version) {

    var _aics = Tools.getAics();

    if (_aics[name + "@" + version]) {

        console.log("代码包: " + name + " 已安装");

    } else {

        console.log("正在验证: " + name + "@" + version);

        var param = {
            "name": name,
            "version": version
        };

        request(aicsConfig.host + "/packageInfo?" + qs.stringify(param), function(error, response, body) {
            if (body == "NONE") {
                console.log("未发现代码包: " + name);
            } else {
                var result = JSON.parse(body);
                setupPackage(name, result.version);
                for (var pname in result.dependencies) {
                    queryPackage(pname, result.dependencies[pname]);
                }
            }
        });

        Tools.setAics(name, version);

    }
}

setupPackage = function(name, version) {
    console.log("正在下载:  " + name + "@" + version);

    var param = {
        "name": name,
        "version": version
    };

    //判断临时文件夹是否存在
    var tmppath = Tools.mkdir(".aics/tmp" + "/" + name + "@" + version);

    request(aicsConfig.host + "/packageDownload?" + qs.stringify(param))
        .pipe(fs.createWriteStream(tmppath + "/build.zip"))
        .on('close', function() {
            fs.createReadStream(tmppath + "/build.zip")
                .pipe(unzip.Extract({
                    path: tmppath
                }))
                .on("close", function() {

                    walk(tmppath).then(function(files) {


                        for (var i = 0; i < files.length; i++) {

                            var file = files[i];
                            var filename = file.name;

                            if ((filename.indexOf(".") != 0) && (filename.indexOf("build.zip") == -1)) {
                                exportFiles(file, tmppath);
                            }

                        }

                        console.log("已写入代码包文件: " + name);

                    });


                });


        });



}

exportFiles = function(file, tmppath) {

    var filename = file.name;

    var fileroot = file.root;

    var filepath = path.resolve(fileroot.replace(tmppath, "./"));

    Tools.mkdir(filepath);

    // console.log(file.root + "/" + filename + "@" + version);

    if (fs.existsSync(filepath + "/" + filename)) {

        var org = fs.readFileSync(file.root + "/" + filename)
        var orgmd5 = md5(org);
        var tar = fs.readFileSync(filepath + "/" + filename)
        var tarmd5 = md5(org);

        if (tarmd5 != orgmd5) {

            fs.writeFile(filepath + "/" + filename + "@" + version, org, function(err) {
                //删除临时文件

                fs.unlinkSync(file.root + "/" + filename);
                if (err) {
                    console.log(err);
                } else {
                    console.log("代码包中的文件于本地不一致： " + filepath + "/" + filename + " in " + name + "@" + version);
                }
            });

        } else {
            //删除临时文件
            fs.unlinkSync(file.root + "/" + filename);
        }
    } else {
        fs.createReadStream(file.root + "/" + filename)
            .pipe(fs.createWriteStream(filepath + "/" + filename))
            .on("close", function() {
                //删除临时文件
                fs.unlinkSync(file.root + "/" + filename);
            });
    }
}
