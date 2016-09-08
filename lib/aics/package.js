var path = require('path');
var fs = require('fs');
var request = require('request');
var qs = require('qs');
var unzip = require('unzip');
var walkSync = require('walk-sync');
var md5 = require('md5');
var archiver = require('archiver');
var Tools = require('./tools');
var AccountManager = require('./account');
var chalk = require("chalk");
var cjson = require('cjson');
var argv = require('minimist')(process.argv.slice(2));
var util = require('util');

var Promise = require("bluebird");

module.exports = PackageManager;

function PackageManager() {}
PackageManager.showPackages = function(params) {
  var packges = Tools.getAics();
  var str = JSON.stringify(packges);
  str = str.replace('{', "").replace('}', "").replace(/\"/g, "").replace(/\,/g, "\n").replace(/\:(\d+\.\d+\.\d+)/g, "@$1");
  console.log("Packages has been Installed: ");
  console.log(str);
}
PackageManager.init = function(argument) {
  var projectName = argv._.pop();
  fs.stat('.aics', function(err, stats) {
    if (!stats) {
      fs.mkdir('.aics');
    }
    var packageJson = {
      "stack": "",
      "name": "",
      "version": "0.0.1",
      "summary": "",
      "git": "",
      "documentation": "README.md",
      "dependencies": {},
      "packages": [],
      "npm": {},
      "files": []
    }

    packageJson.name = AccountManager.get().username + ":" + projectName;
    fs.writeFile('.aics/' + projectName + '.depot.json', JSON.stringify(packageJson, null, 2), 'utf8', function(err) {
      if (err) {
        console.log('写入 .aics/' + projectName + '.depot.json 错误')
      };
      console.log('创建 .aics/' + projectName + '.depot.json 成功.')
      fs.writeFile('README.md', "## " + projectName, 'utf8', function(err) {
        if (err) {
          console.log('写入 README.md 错误')
        } else {
          console.log('创建 README.md 成功.')
        }
      });
    });
  })
}
PackageManager.remove = function(params) {
  var packageName = argv._.pop();
  var packTmpPath = packageName.replace(":", '/');
  var fulPath = '.aics/tmp/' + packTmpPath;
  var modifyArray = [];
  //读取.aics目录
  !Tools.isExist(path.resolve(fulPath), true) ? (process.exit(0)) : "";

  var tmpTrees = walkSync(path.resolve(fulPath), {
    directories: false
  });

  for (var i = tmpTrees.length - 1; i >= 0; i--) {
    if (tmpTrees[i].indexOf('.zip') > 0) {
      continue;
    }
    console.log("comparing - " + tmpTrees[i]);
    var org = Tools.isExist(fulPath + "/" + tmpTrees[i]) && fs.readFileSync(fulPath + "/" + tmpTrees[i])
    var orgmd5 = md5(org);
    var tar = Tools.isExist(tmpTrees[i], false) && fs.readFileSync(tmpTrees[i])
    var tarmd5 = md5(tar);
    if (tarmd5 == orgmd5) {
      console.log((tmpTrees[i]) + " no modify.")
    } else {
      Tools.isExist(tmpTrees[i], true) ? (
        console.log(chalk.red.bold(tmpTrees[i]) + " has been modify. "),
        modifyArray.push(tmpTrees[i])
      ) : "";
    }
  }
  console.log("Compare Complate!");
  if (modifyArray.length < 1) {
    for (var i = tmpTrees.length - 1; i >= 0; i--) {
      if (tmpTrees[i].indexOf('.zip') > 0) {
        continue;
      }
      var isExist = fs.existsSync(tmpTrees[i]);
      if (isExist) {
        fs.unlinkSync(tmpTrees[i]);
        console.log('Remove ' + tmpTrees[i] + " Complate.");

      }
    }
    Tools.confRemove(packageName);
  } else {
    for (var i = modifyArray.length - 1; i >= 0; i--) {
      console.log(chalk.red.bold(modifyArray[i]) + ' Has been Modify,Remove Manually')
    }
  }
}
PackageManager.publish = function(params) {
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
    if (err) console.log('可发布的代码包:' + depots)
  });

  var config = cjson.load(configPath);
  if (!preBuild(config)) {
    process.exit(1);
  }
  var account = AccountManager.get();
  config.secret = account.email;
  //验证是否可发布
  request.post({ url: process.env.AICS_HOST + '/package/verify', body: config, json: true }, function(err, httpResponse, body) {
    process.stdout.write('\n校验组件信息....');
    if (body.code > 0) {
      console.log(body.msg + '\n');
      console.log('编译组件:');
      if (!!body.data) {
        config.targetId = body.data.pid;
      } else {
        console.log("未知错误，请稍后再试");
        return;
      }
      //没有问题则发布包
      buildZip(config, function(path) {
        var r = request.post(process.env.AICS_HOST + '/package/upload', function(err, httpResponse, body) {
          var body = JSON.parse(body);
          var msg = (body.code > 0) ? "发布成功" : '发布失败'
          console.log(msg);
        })
        var form = r.form();
        form.append('zip', fs.createReadStream(path));
      })
    } else {
      console.log(body.msg);
    }
  })
}

preBuild = function(config) {
  if (config.files.length <= 0) {
    console.log('空的组件,请检查后重新上传');
    return false;
  }
  return true;
}
afterBuild = function(config) {

}

buildZip = function(config, cb) {
  if (!configCheck(config)) {
    console.log(chalk.red.bold("配置文件出错.\n"));
    return;
  }
  var depotPath = config.name.split(':');
  var tmppath = Tools.mkdir(path.resolve(".aics") + "/tmp/" + depotPath.join('/'));
  var zipPath = tmppath + '/' + config.targetId + '.zip';

  var files = config.files;
  var packages = config.packages;
  var tmpArr = [];
  tmpArr.push("\n\n# imports froms " + config.name);
  packages = tmpArr.concat(packages).join('\n');
  var output = fs.createWriteStream(zipPath);
  output.on('close', function() {
    process.stdout.write('\n编译完成...');
    cb(zipPath);
  });

  //生成archiver对象，打包类型为zip
  var zipArchiver = archiver('zip');

  //将打包对象与输出流关联
  zipArchiver.pipe(output);

  if (!files.length) {
    console.log('\n组件必须包含文件,程序退出.\n');
    process.exit(1);
  }
  for (var i = 0; i < files.length; i++) {
    console.log((" + ") + files[i]);
    if (!fs.existsSync(path.resolve(files[i]))) {
      console.log("没有找到文件 \n " + config.name + " --> " + files[i]);
      process.exit(1);
    }
    //将被打包文件的流添加进archiver对象中
    zipArchiver.append(fs.createReadStream(files[i]), {
      'name': files[i]
    });
  }
  //add packages to zip
  zipArchiver.append(new Buffer(packages), {
    'name': 'packages'
  });
  //打包
  zipArchiver.finalize();
}
upload = function(path) {

  }
  // publishToDepot = function(config, depotConfigPath) {
  //   var depotPath = config.name.split(':');
  //   var tmppath = Tools.mkdir(path.resolve(".aics") + "/tmp/" + depotPath.join('/'));
  //   var zipPath = tmppath + '/build.zip';

//   var account = AccountManager.get();
//   var files = config.files;
//   var packages = config.meteor.packages;
//   var tmpArr = [];
//   tmpArr.push("\n\n# imports froms " + config.name);
//   packages = tmpArr.concat(packages).join('\n');
//   // var packages
//   var output = fs.createWriteStream(zipPath);
//   output.on('close', function() {
//     config.name = config.name.replace("$", ":");
//     var r = request.post(process.env.AICS_HOST + '/package/upload', function(err, httpResponse, body) {
//       console.log(httpResponse)
//       fs.unlinkSync(zipPath);
//     });
//     var form = r.form();
//     if (!account.email) {
//       console.log("账户未设置.")
//       return;
//     }
//     config.secret = account.email
//     config.markdown = "";
//     if (fs.existsSync(path.resolve(config.documentation))) {
//       config.markdown = fs.readFileSync(path.resolve(config.documentation), { encoding: 'utf8' });
//     }
//     form.append('config', JSON.stringify(config));
//     form.append('zip', fs.createReadStream(path.resolve(zipPath)));
//   });
// }

PackageManager.addfile = function(name, file) {
  if (!name || !file) {
    console.log('\nerror.\n');
    return;
  }

  var config = null,
    trees = [];
  try {
    var paths = path.resolve('.aics/' + name + '.depot.json');
    var states = fs.statSync(paths);
    if (states) {
      config = cjson.load(paths);
    }
  } catch (e) {
    console.log("代码包配置文件不存在.");
    return;
  }

  try {
    var states = fs.statSync(file);
    if (states) {
      if (states.isDirectory()) {
        var trees = walkSync(file, {
          directories: false
        });
        for (var i = trees.length - 1; i >= 0; i--) {
          trees[i] = file + "/" + trees[i];
        };
        config.files = config.files.concat(trees);
      } else {
        config.files = config.files.concat(file);
      }

      config.files = Array.from(new Set(config.files));
      fs.writeFile(path.resolve('.aics/' + name + '.depot.json'), JSON.stringify(config, null, 2), 'utf8', function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("\nComplate!\n");
        }
      });
    }
  } catch (e) {
    console.log(file + "不存在.");
    return;
  }

}
PackageManager.files = function(name) {
  if (!name) {
    console.log('\nerror.\n');
    return;
  }
  try {
    var paths = path.resolve('.aics/' + name + '.depot.json');
    var states = fs.statSync(paths);
    if (states) {
      config = cjson.load(paths);
      config.files.map(function(file) {
        console.log(util.inspect(file, {
          colors: true
        }));
      })
    }
  } catch (e) {
    if (e) {
      throw e;
    }
    console.log("代码包配置文件不存在.");
    return;
  }
}
configCheck = function(config) {
  if (!config.stack) {
    console.log("package belong to some stack");
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