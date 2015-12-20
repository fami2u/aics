var path = require('path');
var fs = require('fs');
var archiver = require('archiver');
var Tools = require('../lib/tools');
var request = require('request');
var aicsConfig = require('../lib/config');


module.exports = PackageManager;

function PackageManager() {

}

PackageManager.create = function(name) {

    if(!name){
        console.log("error ,need a package name");
    }else{

        var packagePath = path.resolve(name);

        if (!fs.existsSync(packagePath)) {
            fs.mkdirSync(packagePath);
        }

        var hidePath = packagePath + "/.aics-packages";

        if (!fs.existsSync(hidePath)) {

            fs.mkdirSync(hidePath);

        }

        var configPath = packagePath + "/aics-package.json";
        
        
        if (!fs.existsSync(configPath)) {

            var exampleJson = path.resolve(__dirname, '../example/aics-package.json');

            var content = fs.readFileSync(exampleJson, 'utf8');

            fs.writeFileSync(packagePath, content.replace("{{name}}",name));
        }

        console.log("package " + name + " is inited config in aics-package.json" );
    }


}
PackageManager.config = function() {

    var configPath = path.resolve('aics-package.json');

    if (!fs.existsSync(configPath)) {

        console.log("not in a aics package ,frist run aics package create [name] ");

        process.exit(1);
    }

    var json = cjson.load(configPath);


    if (!json.prototype) {
        console.log("package belong to some prototype");
        process.exit(1);
    }

    if (!json.name) {
        console.log("package need a name");
        process.exit(1);
    }

    if (!json.version) {
        console.log("package need a version");
        process.exit(1);
    }

    if (!json.files) {
        console.log("package need a files list");
        process.exit(1);
    }

    return json;
}

PackageManager.publish = function() {

    var config = this.config();

    var account = Tools.account();

    // console.log(config.files);

    var files = config.files;

    var zipPath = 'build.zip';
    //创建一最终打包文件的输出流
    var output = fs.createWriteStream(zipPath);
    //监听打包完毕
    output.on('close', function() {
        var r = request.post(aicsConfig.host + '/packageUpload', function(err, httpResponse, body) {
            if (body == "ERROR") {
                console.log("system error try again later .. ");
            } else if (body == "NOPROTOTYPE") {
                console.log("no prototype named " + config.prototype);
            } else if (body == "MISSNAME") {
                console.log("miss package name ,should be account:name " + config.name);
            } else if (body == "MISSVERSION") {
                console.log("version is exists update the version");
            } else if (body.indexOf("REPEAT") == 0) {
                console.log("files repeat : " + body.split(":")[1]);
            } else if (body == "SUCCESS") {
                console.log("publish success ! ")
            }
            // console.log(body);
            fs.unlinkSync(zipPath);
        });

        var form = r.form();
        form.append('secret', account.secret);
        form.append('config', fs.createReadStream(path.resolve('aics-package.json')));
        form.append('zip', fs.createReadStream(path.resolve('build.zip')));
        if (config.documentation) {
            if (fs.existsSync(config.documentation)) {
                form.append('markdown', fs.createReadStream(path.resolve(config.documentation)));
            }
        }
    });
    //生成archiver对象，打包类型为zip
    var zipArchiver = archiver('zip');
    //将打包对象与输出流关联
    zipArchiver.pipe(output);
    for (var i = 0; i < files.length; i++) {
        console.log("package: " + files[i]);
        //将被打包文件的流添加进archiver对象中
        zipArchiver.append(fs.createReadStream(files[i]), {
            'name': files[i]
        });
    }
    //打包
    zipArchiver.finalize();



}
