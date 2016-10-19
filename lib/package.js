'use strict';

const path = require('path');
const fs = require('fs-extra');
const cjson = require('cjson');
const request = require('request');
const walkSync = require('walk-sync');
const md5 = require('md5');
const archiver = require('archiver');
const Tools = require('./tools');
const AccountManager = require('./account');
const colors = require("colors");
const rp = require('request-promise');
const errors = require('request-promise/errors');
const jsdiff = require('diff');
const unzip = require('unzip2');
const readline = require('readline');

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
PackageManager.init = function(name) {
  var projectName = name;
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
  packageJson.readme = projectName + '-README.md';
  fs.outputJson('.aics/' + projectName + '.depot.json', packageJson, function(err) {
    console.log('创建 .aics/' + projectName + '.depot.json 成功.');
  })
  fs.outputFile('./' + projectName + '-README.md', "## " + projectName, function(err) {
    console.log('创建' + projectName + '-README.md 成功.')
  })
  fs.outputJson('.aics/packages.json', {}, function(err) {
    console.log('创建 .aics/packages.json 成功.')
  })
}

PackageManager.remove = function(name) {

  var packageName = name;
  var packTmpPath = packageName.replace(":", '/');
  var packagePathRoot = '.aics/local/' + packTmpPath;
  var modifyArray = [];

  //读取.aics目录
  !Tools.isExist(path.resolve(packagePathRoot), true) ? (process.exit(0)) : "";
  var tmpTrees = walkSync(path.resolve(packagePathRoot), {
    directories: false
  });
  for (var i = tmpTrees.length - 1; i >= 0; i--) {
    if (tmpTrees[i].indexOf('.zip') > 0) {
      continue;
    }
    // console.log("comparing - " + tmpTrees[i]);
    var org = Tools.isExist(packagePathRoot + "/" + tmpTrees[i]) && fs.readFileSync(packagePathRoot + "/" + tmpTrees[i])
    var orgmd5 = md5(org);
    var tar = Tools.isExist(tmpTrees[i], false) && fs.readFileSync(tmpTrees[i])
    var tarmd5 = md5(tar);
    if (tarmd5 == orgmd5) {
      console.log(colors.green(tmpTrees[i] + ' [x]'));
    } else {
      Tools.isExist(tmpTrees[i], true) ? (
        // console.log(colors.red.bold(tmpTrees[i]+' [?]')),
        modifyArray.push(tmpTrees[i])
      ) : "";
    }
  }

  // console.log("Compare Complate!");

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
    // Tools.confRemove(packageName);
    var packageConf = cjson.load(".aics/packages.json");
    delete packageConf[name.split("@").shift()];
    fs.writeJson(".aics/packages.json", packageConf, function(err) {
      console.log("删除成功")
    })
  } else {
    for (var i = modifyArray.length - 1; i >= 0; i--) {
      console.log(colors.red.bold(modifyArray[i]) + ' 被修改，请手动删除')
    }
  }

}

PackageManager.publish = function(name) {
  var packageRoot = path.resolve(".aics");
  var packages = fs.readdirSync(packageRoot)
    .map(pkgName => ({ name: pkgName, root: path.join(packageRoot, pkgName) }))
    .filter(pkg => pkg.name.endsWith("depot.json"))

  if (!name) {
    console.log("参数错误,请填写需要发布的代码包");
    return;
  }
  var configPath = path.resolve('.aics/' + name + '.depot.json');
  var config = null;
  var account = AccountManager.get();

  fs.access(configPath, function(err) {
    if (err) {
      console.log('代码包配置文件不存在');
      return;
    }
    config = fs.readJsonSync(configPath);
    config.user = account.secret;
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
        .then(buildZip)
        .then(uploadZip)
        .catch(
          function(reason) {
            console.log(reason.message);
          })
    });
  });
}
var buildZip = function(config) {
  // console.log('===============step 2===============');
  // console.log(obj);
  return new Promise(function(resolve, reject) {
    // var config = config;
    var depotPath = config.name.split(':');
    var tmppath = Tools.mkdir(path.resolve(".aics") + "/tmp/" + depotPath.join('/'));
    var zipPath = tmppath + '/' + config.version + '.zip';
    var files = config.files;
    var packages = config.packages;
    var output = fs.createWriteStream(zipPath);
    output.on('close', function() {
      console.log(colors.green.bold("[1/2] ") + '编译完成...');
      resolve({ zipPath: zipPath, config: config });
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
  var config = obj.config;
  var postUrl = "?stack=" + config.stack + "&name=" + config.name + "&version=" + config.version + "&user=" + config.user;
  // console.log('===============step 3===============');
  var options = {
    method: 'POST',
    url: process.env.AICS_HOST + '/package/upload' + postUrl,
    transform: function(body, response, resolveWithFullResponse) {
      body = JSON.parse(body);
      return body;
    }
  }
  var req = rp(options);
  var form = req.form();
  form.append('querys', JSON.stringify(config));
  form.append('zip', fs.createReadStream(obj.zipPath));
  req.then(function(body) {
    // console.log(body);
    // var msg = (body.code > 0) ? body.msg;
    console.log(colors.green.bold("[2/2] ") + body.msg);
    // fs.unlinkSync(obj.zipPath);
  }).catch(errors.TransformError, function(reason) {
    console.log(reason.message);
  })
}
PackageManager.addfile = function(file, name) {
  if (!name || !file) {
    console.log('   参数错误.\n');
    console.log('   Example');
    console.log('   aics addfile README.md depot # 添加文件README.md 到 depot 组件包\n');
    return;
  }

  try {
    var paths = path.resolve('.aics/' + name + '.depot.json');
    var config = fs.readJsonSync(paths);
  } catch (e) {
    console.log("不存在文件名为" + name + '.depot.json 的配置文件');
    return;
  }
  try {
    var states = fs.statSync(file);
    if (states.isDirectory()) {
      var trees = walkSync(file, {
        directories: false
      });
      // file = (/^.\//,'').test(file)?file.replace('./',''):file;
      file = (/\/$/).test(file) ? file : file += "/";
      for (var i = trees.length - 1; i >= 0; i--) {
        //过滤不需要添加的文件
        if (trees[i].indexOf('.DS_Store') > 0) {
          continue;
        }
        trees[i] = file + trees[i];
      };
      config.files = config.files.concat(trees);
    } else {
      config.files = config.files.concat(file);
    }
    config.files = Array.from(new Set(config.files));
    fs.writeFile(path.resolve('.aics/' + name + '.depot.json'), JSON.stringify(config, null, 2), 'utf8', function(err) {
      if (err) {
        console.log("写入配置文件出错,请检查目录权限,并重试");
      } else {
        console.log(JSON.stringify(config.files, null, 2))
        console.log(colors.green.bold(config.files.length + " 个文件已添加.\n"));
      }
    });
  } catch (e) {
    console.log(colors.yellow.bold(file) + " 不存在.");
    return;
  }
}

PackageManager.updatePackage = function(name) {
  var hasVersion = name.indexOf("@") > 0 ? true : false;
  var packageinfo = name.split("@")
    console.log(packageinfo)
  var param = {
    name: packageinfo.shift(),
    version: hasVersion?packageinfo.pop():"",
    username: AccountManager.get().username,
    userid: AccountManager.get().secret
  };
  var querystring = Object.keys(param).map(function(key) {
    return key + '=' + encodeURIComponent(param[key]);
  }).join('&');
  fs.readJson('.aics/packages.json', function(err, conf) {
    if (conf[param.name]) {
      request(process.env.AICS_HOST + "/package/info?" + querystring, function(error, response, body) {
        if (error) {
          console.log(error);
        }
        if (body == "NONE") {
          console.log("Not Found: " + colors.red(name));
          return;
        } else {
          var result = JSON.parse(body);
          conf[result.name] = result.version;
          fs.outputJson(path.resolve(".aics/packages.json"), conf, function(err) {
            setupPackage(result);
          });
        }
      });
    }
  });
}
PackageManager.add = function(name) {
  // var config = fs.readJsonSync(path.resolve(".aics/packages.json"));
  var projConf;
  if (!name) {
    console.log(" 在 add 命令后添加您要添加的代码包名称。可以在 http://aics.fami2u.com 寻找感兴趣的代码包");
    return;
  }

  fs.readJson('.aics/packages.json', function(err, config) {
      if (!config) {
        config = {};
      }
      var packageinfo = name.split("@");
      var param = {
        name: packageinfo.shift(),
        version: packageinfo.pop() || "",
        username: AccountManager.get().username,
        userid: AccountManager.get().secret
      };
      var querystring = Object.keys(param).map(function(key) {
        return key + '=' + encodeURIComponent(param[key]);
      }).join('&');
      request(process.env.AICS_HOST + "/package/info?" + querystring, function(error, response, body) {
        if (error) {
          console.log(error);
        }
        if (body == "NONE") {
          console.log("Not Found: " + colors.red(name));
          return;
        } else {
          var result = JSON.parse(body);
          if (config[name] === result.version) {
            console.log(name + "@" + result.version + " 已安装");
            return;
          }
          config[result.name] = result.version;
          fs.outputJson(path.resolve(".aics/packages.json"), config, function(err) {
            setupPackage(result);
            var depends = result.depend;
            if (depends) {
              Object.keys(depends).map(function(key) {
                queryPackage(key, depends[key])
              })
            }
          });
        }
      });
    })
    // fs.access('.aics/', fs.R_OK, (err) => {
    //   if (err) {
    //     fs.mkdirSync('.aics');
    //   }
    //   fs.access('.aics/packages.json', fs.R_OK | fs.W_OK, (err) => {
    //     if (err) {
    //       var config = {};
    //       fs.writeFileSync('.aics/packages.json', JSON.stringify(config, null, 2));
    //     }

  //     //读取项目配置文件中的
  //     var config = fs.readJsonSync(path.resolve(".aics/packages.json"));

  //     var packageinfo = name.split("@");
  //     var param = {
  //       name: packageinfo.shift(),
  //       version: packageinfo.pop() || "",
  //       username: AccountManager.get().username,
  //       userid: AccountManager.get().secret
  //     };
  //     var querystring = Object.keys(param).map(function(key) {
  //       return key + '=' + encodeURIComponent(param[key]);
  //     }).join('&');
  //     request(process.env.AICS_HOST + "/package/info?" + querystring, function(error, response, body) {
  //       if (error) {
  //         console.log(error);
  //       }
  //       if (body == "NONE") {
  //         console.log("Not Found: " + colors.red(name));
  //         return;
  //       } else {
  //         var result = JSON.parse(body);
  //         if (config[name] === result.version) {
  //           console.log(name + "@" + result.version + " 已安装");
  //           return;
  //         }
  //         config[result.name] = result.version;
  //         fs.writeFile(path.resolve(".aics/packages.json"), JSON.stringify(config, null, 2), 'utf8', function(err, res) {
  //           setupPackage(result);
  //           var depends = result.depend;
  //           if (depends) {
  //             Object.keys(depends).map(function(key) {
  //               queryPackage(key, depends[key])
  //             })
  //           }
  //         });
  //       }
  //     });
  //   });
  // });
}
var queryPackage = function(name, version) {

  var packageJson = fs.readJsonSync(path.resolve('.aics/packages.json'));
  //判断依赖的包是否已经存在
  if (packageJson[name] === version) {
    console.log(name + "@" + version + " 已安装");
    return;
  }
  var pname = name;
  var params = {
    name: pname,
    version: version,
    username: AccountManager.get().username,
    userid: AccountManager.get().secret
  }
  var querystring = Object.keys(params).map(function(key) {
    return key + '=' + encodeURIComponent(params[key]);
  }).join('&');
  request(process.env.AICS_HOST + "/package/info?" + querystring, function(error, response, body) {
    if (body == "NONE") {
      console.log("未发现代码包: " + pname);
      return;
    } else {
      var result = JSON.parse(body);
      var rname = result.name;
      var rversion = result.version;
      setupPackage(result);
      var depends = result.depend;
      if (depends) {
        Object.keys(depends).map(function(key) {
          queryPackage(key, depends[key])
        })
      }

    }
  });

}
var setupPackage = function(packages) {

  console.log("Downloading  " + packages.name + "@" + packages.version + " ...");
  var packagePath = packages.name.split(':');
  //判断临时文件夹是否存在
  var tmppath = Tools.mkdir(".aics/local" + "/" + packagePath.join('/'));
  if (!packages.url || packages.url.indexOf('http://') < 0) {
    console.log('请求URL不合法')
    return;
  }
  request(packages.url)
    .on('error', function(err) {
      console.log(err)
    })
    .pipe(fs.createWriteStream(tmppath + "/" + packages.version + ".zip"))
    .on('close', function() {
      fs.createReadStream(tmppath + "/" + packages.version + ".zip")
        .pipe(unzip.Extract({
          path: tmppath
        }))
        .on("close", function() {
          var trees = walkSync(tmppath, {
            directories: false
          });
          for (var i = 0; i < trees.length; i++) {
            var file = trees[i];
            if (file.indexOf(".zip") < 0 && file.indexOf("packages") < 0 && file.indexOf(".DS_Store") < 0) {
              exportFiles(packages, file, tmppath);
            }
          }
          console.log("已写入代码包文件: " + packages.name.replace("$", ":") + "@" + packages.version);
          Tools.setAics(packages.name, packages.version);
          if (packages.depend) {
            putDepend(packages.depend);
          }
          if (packages.packages) {
            putPacks(packages.packages);
          }
          if (packages.npms) {
            putNpms(packages.npms);
          }
        });
    });
}

var putDepend = function(e) {
  var dependPath = '.aics/packages.json';
  fs.ensureFile(dependPath, (err) => {
    var config = fs.readJsonSync(dependPath);
    Object.keys(e).map(function(key) {
      if (!config[key]) {
        config[key] = e[key];
      }
    })
    fs.outputJsonSync(dependPath, config);
  });
}

var putPacks = function(packs) {
  var meteorPathRoot = '.meteor/packages';
  fs.ensureFile('.meteor/packages', (err) => {
    var oldPackages = [];
    const rl = readline.createInterface({
      input: fs.createReadStream(meteorPathRoot)
    });

    rl.on('line', (line) => {
      oldPackages.push(line);
    });
    rl.on('close', () => {
      packs.forEach(function(item) {
        var isInclude = oldPackages.join(',').indexOf(item);
        if (isInclude < 0) {
          fs.appendFile(meteorPathRoot, '\n' + item, 'utf8', function(argument) {
            console.log("+" + colors.green.bold(item))
          });
        }
      })
    });
  });
}
var putNpms = function(e) {
  var npmRootPath = './package.json';
  fs.readJson(npmRootPath, (err, json) => {
    if (!json) {
      json = {};
      json.dependencies = {};
    }
    Object.keys(e).map(function(key) {
      if (!json.dependencies[key]) {
        json.dependencies[key] = e[key];
      }
    })
    fs.outputJsonSync(npmRootPath, json);
  });
}

var exportFiles = function(packages, file, tmppath) {
  if (fs.existsSync(file)) {
    var org = fs.readFileSync(tmppath + "/" + file, 'utf8');
    var orgmd5 = md5(org);
    var tar = fs.readFileSync(file, 'utf8')
    var tarmd5 = md5(tar);
    if (tarmd5 != orgmd5) {
      fs.outputFile(file + "@" + packages.version, org, function(err) {
        // console.log(err) // => null
        // fs.writeFile(file + "@" + packages.version, org, function(err) {
        //删除临时文件
        // fs.unlinkSync(file.root + "/" + filename);
        if (err) {
          console.log(err);
        } else {
          // jsdiff.applyPatch(source, patch[, options])
          // console.log(jsdiff.parsePatch(jsdiff.createPatch('patch', org, tar, 'header1', 'header2')));

          // console.log(jsdiff.applyPatch(tar, jsdiff.structuredPatch('patch', 'patch2', org, tar, 'header1', 'header2'), {
          //   compareLine: function(lineNumber, line, operation, patchContent) {
          //     console.log(patchContent)
          //   }
          // }))
          console.log("代码包中的文件于本地不一致: " + file + " in " + packages.name + "@" + packages.version);
        }
      });

    } else {
      //删除临时文件
      // fs.unlinkSync(file.root + "/" + filename);
    }

  } else {
    fs.copy(tmppath + "/" + file, file, function(err) {
      if (err) return console.error(err)
    })
  }
}
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
  if (!config.summary) {
    console.log("package need a summary");
    return false;
  }
  return true;
}
