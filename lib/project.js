var path = require('path');
var fs = require('fs');
var cjson = require('cjson');
var request = require('request');
var qs = require('querystring');
var unzip = require('unzip');
var walk = require('walk-promise');
var md5 = require('md5');
var archiver = require('archiver');
var readline = require('readline');
var chalk = require('chalk');
var walkSync = require('walk-sync');


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
    var rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    process.stdin.setEncoding('utf8');
    var arr = [{
            name: 'prototype',
            display: ' Prototype',
            type: 'string',
            aft: ':'
        }, {
            name: 'name',
            display: ' package-name',
            type: 'string',
            aft: ':'
        }, {
            name: 'version',
            display: ' version',
            type: 'string',
            aft: ':'
        }, {
            name: 'summary',
            display: ' summary',
            type: 'string',
            aft: ':'
        }, {
            name: 'documentation',
            display: ' docs URL',
            type: 'string',
            aft: ':'
        }, {
            name: 'git',
            display: ' git URL',
            type: 'string',
            aft: ':'
        }

    ];
    var projectConf = {};
    var i = 0;

    function waitForInput(arr) {
        if (i < arr.length) {
            rl.question(chalk.green(arr[i]['display'] + ":"), function(answer) {
                projectConf[arr[i]['name']] = answer;
                //todo: check value
                i++;
                waitForInput(arr);
            })
        } else {
            rl.close();
            projectConf.dependencies = {};
            projectConf.files = [];
            projectConf.database = {};
            // console.log(projectConf);

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

            fs.writeFile('.aics/example.depot.json', JSON.stringify(projectConf), 'utf8', function(err) {
                if (err) {
                    console.log(err);
                } else {
                    console.log("\nComplate! 😀 \n");
                }

            });

        }

    }
    waitForInput(arr);
    /*
    *简化了aics项目的构成合并项目和包的概念
    *.aics 文件夹存放包描述文件列表
    *.aics/tmp 临时目录用来打包或下载文件
    *.aics-project.json 项目描述文件 
    ＊－－0.0.x 版本用来管理项目的包依赖关系
    * ./aics/example.json 包描述文件
    */
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


    } else {

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

ProjectManager.addfile = function(file) {
    fs.stat(file, function(err,stats){
        if(stats.isDirectory()){
            var trees = walkSync(file,{ directories: false});
            var config = require(path.resolve('.aics/example.depot.json'));
            if(config.files<1){
                config.files = trees;
            }else{
                 config.files = config.files.concat(trees);
            }
                        fs.writeFile(path.resolve('.aics/example.depot.json'), JSON.stringify(config), 'utf8', function(err) {
                if (err) {
                    console.log(err);
                } else {
                    console.log("\nComplate! 😀 \n");
                }

            });
        }else{

        }
    });
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
                setupPackage(result);
                for (var pname in result.dependencies) {
                    queryPackage(pname, result.dependencies[pname]);
                }
            }
        });

        Tools.setAics(name, version);

    }
}

setupPackage = function(packages) {

    console.log("正在下载:  " + packages.name + "@" + packages.version);

    //判断临时文件夹是否存在
    var tmppath = Tools.mkdir(".aics/tmp" + "/" + packages.name + "@" + packages.version);


    request(packages.url)
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
                                exportFiles(packages, file, tmppath);
                            }


                        }

                        console.log("已写入代码包文件: " + packages.name);

                    });


                });


        });



}

exportFiles = function(packages, file, tmppath) {


    var filename = file.name;

    var fileroot = file.root;

    var filepath = path.resolve(fileroot.replace(tmppath, "./"));

    Tools.mkdir(filepath);

    // console.log(file.root + "/" + filename + "@" + version);

    if (fs.existsSync(filepath + "/" + filename)) {

        var org = fs.readFileSync(file.root + "/" + filename)
        var orgmd5 = md5(org);
        var tar = fs.readFileSync(filepath + "/" + filename)
        var tarmd5 = md5(tar);

        if (tarmd5 != orgmd5) {

            fs.writeFile(filepath + "/" + filename + "@" + packages.version, org, function(err) {
                //删除临时文件

                fs.unlinkSync(file.root + "/" + filename);
                if (err) {
                    console.log(err);
                } else {
                    console.log("代码包中的文件于本地不一致： " + filepath + "/" + filename + " in " + packages.name + "@" + packages.version);
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
