var path = require('path');
var fs = require('fs');
var cjson = require('cjson');
var request = require('request');
var qs = require('qs');
var unzip = require('unzip');
var walkSync = require('walk-sync');
var md5 = require('md5');
var archiver = require('archiver');
var Tools = require('../lib/tools');
var aicsConfig = require('../lib/config');
var AccountManager = require('../lib/account');
var chalk = require("chalk");
var argv = require('minimist')(process.argv.slice(2));

module.exports = PackageManager;

function PackageManager() {}

PackageManager.publish = function(params) {
  if (argv.P) {
    var config = require(path.resolve('.aics/project.json'));
    publishToProject(config);
  } else if (argv.h) {
    console.log(chalk.red.bold("\nUsage:\n"));
    console.log("publish  [option]  <string>    发布当前目录下的所有自定义代码包或项目");
    console.log('option:')
    console.log(" <无option>                    发布当前目录下指定的代码包");
    console.log(" -P                            发布当前目录下的项目");
    return;
  } else {
    var trees = walkSync(path.resolve(".aics"), {
      globs: ['**/*.json'],
      directories: false
    });
    var depots = "";
    for (var i = 0; i < trees.length; i++) {
      trees[i].indexOf('.depot.json') >= 0 ? (depots += trees[i].split(".").shift() + ",") : ""
    }
    if (argv._.length < 2) {
      console.log("参数错误.可发布的代码包: " + depots)
      return;
    }
    var configPath = path.resolve('.aics/' + argv._.pop() + '.depot.json');
    fs.stat(configPath, function(err, stats) {
      if (err) console.log('并不存在这个代码包.可发布的代码包:' + depots)
      if (stats) {
        var config = require(configPath);
        publishToDepot(config, configPath);
      }
    })
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

publishToDepot = function(config, depotConfigPath) {
  if (!configCheck(config)) {
    console.log(chalk.red.bold("\n配置文件出错.\n"));
    return;
  }
  var account = AccountManager.get();
  var files = config.files;
  config.name = config.name.replace(":", "$");
  var tmppath = Tools.mkdir(path.resolve(".aics") + "/tmp/" + config.name);
  var zipPath = tmppath + '/build.zip';
  var output = fs.createWriteStream(zipPath);
  output.on('close', function() {
    config.name = config.name.replace("$", ":");
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
    if (!account.secret) {
      console.log("账户未设置.")
      return;
    }
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
publishToProject = function(config) {
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
