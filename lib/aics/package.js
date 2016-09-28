'use strict';

var path = require('path');
var fs = require('fs');
var request = require('request');
var walkSync = require('walk-sync');
var md5 = require('md5');
var archiver = require('archiver');
var Tools = require('./tools');
var AccountManager = require('./account');
var chalk = require("chalk");
var cjson = require('cjson');
var argv = require('minimist')(process.argv.slice(2));
var rp = require('request-promise');
var errors = require('request-promise/errors');
module.exports = PackageManager;

function PackageManager() {

};

PackageManager.showPackages = function(params) {
  var packges = Tools.getAics();
  var str = JSON.stringify(packges);
  str = str.replace('{', "").replace('}', "").replace(/\"/g, "").replace(/\,/g, "\n").replace(/\:(\d+\.\d+\.\d+)/g, "@$1");
  console.log("Packages has been Installed: ");
  console.log(str);
}
PackageManager.init = function(argument) {
  var projectName = argv._.pop();
  fs.access('.aics', function(err) {
    if (err) {
      fs.mkdir('.aics');
    }
    var packageJson = {
      "stack": "",
      "name": "",
      "version": "0.0.1",
      "summary": "",
      "git": "",
      "readme": "README.md",
      "depend": {},
      "packages": [],
      "npms": {},
      "files": []
    }
    packageJson.name = AccountManager.get().username + ":" + projectName;
    fs.writeFile('.aics/' + projectName + '.depot.json', JSON.stringify(packageJson, null, 2), 'utf8', function(err) {
      if (err) {
        console.log('写入 .aics/' + projectName + '.depot.json 错误');
        return;
      };
      console.log('创建 .aics/' + projectName + '.depot.json 成功.')
      fs.writeFile('README.md', "## " + projectName, 'utf8', function(err) {
        if (err) {
          console.log('写入 README.md 错误')
        } else {
          console.log('创建 README.md 成功.')
        }
      });
      fs.writeFile('.aics/packages.json', JSON.stringify({}, null, 2), 'utf8', function(err) {
        if (err) {
          console.log('写入 .aics/packages.json 错误')
        } else {
          console.log('创建 .aics/packages.json 成功.')
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
PackageManager.publish = function() {
  var packageRoot = path.resolve(".aics");
  const packages = fs.readdirSync(packageRoot)
    .map(pkgName => ({ name: pkgName, root: path.join(packageRoot, pkgName) }))
    .filter(pkg => pkg.name.endsWith("depot.json"))

  if (argv._.length < 2) {
    console.log("参数错误,请填写需要发布的代码包");
    return;
  }
  var configPath = path.resolve('.aics/' + argv._.pop() + '.depot.json');
  var config = null;
  var account = AccountManager.get();

  fs.access(configPath, function(err) {
    if (err) {
      console.log('代码包配置文件不存在');
      return;
    }
    config = cjson.load(configPath);
    if (!config.readme) {
      config.readme = "README.md";
      }
      fs.access(path.resolve(config.readme), fs.R_OK | fs.W_OK, (err) => {
        if (err) {
          fs.writeFileSync(path.resolve(config.readme), "no readme.");
        }
        config.readme = fs.readFileSync(path.resolve(config.readme), { 'encoding': 'utf8' });

        if (config.files.length < 0) {
          return;
        }
        var pack = new Promise(function(resolve, reject) {
          if (configCheck(config)) {
            resolve(config);
          } else {
            reject("配置文件检查不通过");
          }
        });
        pack
          .then(verify)
          .then(buildZip)
          .then(uploadZip)
          .catch(
            function(reason) {
              console.log(reason.message);
            })
      });
  });
}
var verify = function(config) {
  // console.log('===============step 1===============');
  console.log('\n校验组件信息....');
  var options = {
    method: 'POST',
    url: process.env.AICS_HOST + '/package/verify',
    body: config,
    json: true,
    transform: function(body, response, resolveWithFullResponse) {
      // console.log(!!body.data.pid);
      if (!!body.data.pid) {
        config.targetId = body.data.pid;
        return {
          body: body,
          conf: config
        };
      } else {
        throw new Error('验证失败，请增加版本号再提交');
      }
    }
  }
  return rp(options)
}
var buildZip = function(obj) {
  // console.log('===============step 2===============');
  // console.log(obj);
  return new Promise(function(resolve, reject) {
    var config = obj.conf;
    var depotPath = config.name.split(':');
    var tmppath = Tools.mkdir(path.resolve(".aics") + "/tmp/" + depotPath.join('/'));
    var zipPath = tmppath + '/' + config.name + "#" + config.version + '.zip';
    var files = config.files;
    var packages = config.packages;

    var output = fs.createWriteStream(zipPath);
    output.on('close', function() {
      console.log('\n编译完成...');
      resolve({ zipPath: zipPath, config: obj.conf });
    });
    //生成archiver对象，打包类型为zip
    var zipArchiver = archiver('zip');
    zipArchiver.on('error', reject);
    //将打包对象与输出流关联
    zipArchiver.pipe(output);

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
    // zipArchiver.append(new Buffer(packages), {
    //   'name': 'packages'
    // });
    //打包
    zipArchiver.finalize();
  })
}

var uploadZip = function(obj) {
  // console.log(obj);
  // console.log('===============step 3===============');
  var options = {
    method: 'POST',
    url: process.env.AICS_HOST + '/package/upload',
    transform: function(body, response, resolveWithFullResponse) {
      // console.log(body);
      body = JSON.parse(body);
      return body;
    }
  }
  var req = rp(options);
  var form = req.form();
  form.append(obj.config.targetId, fs.createReadStream(obj.zipPath));
  req.then(function(body) {
    // console.log(body);
    var msg = (body.code > 0) ? "发布成功" : "发布失败";
    console.log(msg);
  }).catch(errors.TransformError, function(reason) {
    console.log(reason.message);
  })
}

PackageManager.addfile = function(name, file) {
    console.log(file);
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
            if (trees[i].indexOf('.DS_Store') > 0) {
              continue;
            }
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
            console.log(config.files)
            console.log("\nComplate!\n");
          }
        });
      }
    } catch (e) {
      console.log(file + "不存在.");
      return;
    }
  }
  // PackageManager.files = function(name) {
  //     if (!name) {
  //         console.log('\nerror.\n');
  //         return;
  //     }
  //     try {
  //         var paths = path.resolve('.aics/' + name + '.depot.json');
  //         var states = fs.statSync(paths);
  //         if (states) {
  //             config = cjson.load(paths);
  //             config.files.map(function(file) {
  //                 console.log(util.inspect(file, {
  //                     colors: true
  //                 }));
  //             })
  //         }
  //     } catch (e) {
  //         if (e) {
  //             throw e;
  //         }
  //         console.log("代码包配置文件不存在.");
  //         return;
  //     }
  // }
var configCheck = function(config) {
  if (!config.stack) {
    console.log("package need a stack");
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
