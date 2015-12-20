var path = require('path');
var fs = require('fs');
var cjson = require('cjson');
var request = require('request');
var qs = require('querystring');
var unzip = require('unzip');
var walk = require('walk-promise');
var md5 = require('md5');

var Tools = require('../lib/tools');
var aicsConfig = require('../lib/config');


module.exports = UpdateManager;

function UpdateManager() {

}
UpdateManager.checkDependenciesConfig = function() {
    var configPath = path.resolve('aics-package.json');

    if (!fs.existsSync(configPath)) {
        configPath = path.resolve('aics-project.json');
        if (!fs.existsSync(configPath)) {
            console.log("not in a aics package or project ");
            process.exit(1);
        }
    }
    var json = cjson.load(configPath);

    if (!json.dependencies) {
        console.log("not find dependencies");
        process.exit(1);
    }


    return json;
}
UpdateManager.getAics = function() {

    var tmp = path.resolve('.aics-packages');

    if (!fs.existsSync(tmp)) {
        fs.mkdirSync(tmp);
    }

    var _aics = tmp + "/.packages";

    if (!fs.existsSync(_aics)) {
        fs.writeFileSync(_aics, "{}");
        return {};
    } else {
        return cjson.load(_aics);
    }

}
UpdateManager.setAics = function(name, version) {

    var tmp = path.resolve('.aics-packages');

    if (!fs.existsSync(tmp)) {
        fs.mkdirSync(tmp);
    }
    var _aics = tmp + "/.packages";
    var json = cjson.load(_aics);
    json[name + "@" + version] = 1;
    fs.writeFileSync(_aics, JSON.stringify(json));

}
UpdateManager.add = function(name) {

    if (!name) {
        console.log("add command need a package name ");
    } else {
        var config = this.checkDependenciesConfig();
        console.log("update package dependencies");
        var packageinfo = name.split("@");
        queryPackage(packageinfo[0], (packageinfo[1] ? packageinfo[1] : ""));
    }


}
UpdateManager.update = function() {
    var config = this.checkDependenciesConfig();
    console.log("update package dependencies");
    for (var pname in config.dependencies) {
        queryPackage(pname, config.dependencies[pname]);
    }

}

queryPackage = function(name, version) {
    var _aics = UpdateManager.getAics();
    if (_aics[name + "@" + version]) {
        console.log("package " + name + " installed");
    } else {
        console.log("check " + name + "@" + version);
        var param = {
            "name": name,
            "version": version
        };

        request(aicsConfig.host + "/packageInfo?" + qs.stringify(param), function(error, response, body) {
            if (body == "NONE") {
                console.log("not found package :" + name);
            } else {
                var result = JSON.parse(body);
                setupPackage(name, result.version);
                for (var pname in result.dependencies) {
                    queryPackage(pname, result.dependencies[pname]);
                }
            }
        });
        UpdateManager.setAics(name, version);


    }
}
setupPackage = function(name, version) {
    console.log("download  " + name + "@" + version);
    var param = {
        "name": name,
        "version": version
    };

    //判断临时文件夹是否存在
    var tmppath = path.resolve('.aics-packages') + "/" + name + "@" + version;

    if (!fs.existsSync(tmppath)) {
        fs.mkdirSync(tmppath);
    }

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
                                exportFiles(file,tmppath);
                            }



                        }

                        console.log("package file " + name + " is writed");

                    });


                });


        });



}
exportFiles = function(file,tmppath) {

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
                    console.log("different file " + filepath + "/" + filename + " in " + name + "@" + version);
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
