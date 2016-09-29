'use strict';

var inquirer = require('inquirer');
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
var jsdiff = require('diff');
var unzip = require('unzip2');
var walk = require('walk-promise');
var readline = require('readline');
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


  var questions = [{
    type: 'input',
    name: 'first_name',
    message: 'What\'s your first name'
  }, {
    type: 'input',
    name: 'last_name',
    message: 'What\'s your last name',
    default: function() {
      return 'Doe';
    }
  }, {
    type: 'input',
    name: 'phone',
    message: 'What\'s your phone number',
    validate: function(value) {
      var pass = value.match(/^([01]{1})?[\-\.\s]?\(?(\d{3})\)?[\-\.\s]?(\d{3})[\-\.\s]?(\d{4})\s?((?:#|ext\.?\s?|x\.?\s?){1}(?:\d+)?)?$/i);
      if (pass) {
        return true;
      }
      return 'Please enter a valid phone number';
    }
  }];

  inquirer.prompt(questions).then(function(answers) {
    console.log(JSON.stringify(answers, null, 2));
  });

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
      console.log('创建 .aics/' + projectName + '.depot.json 成功.');
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
  var packages = fs.readdirSync(packageRoot)
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
  // console.log('===============step 3===============');
  var options = {
    method: 'POST',
    url: process.env.AICS_HOST + '/package/upload',
    transform: function(body, response, resolveWithFullResponse) {
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
    fs.unlinkSync(obj.zipPath);
  }).catch(errors.TransformError, function(reason) {
    console.log(reason.message);
  })
}

PackageManager.addfile = function(name, file) {
  if (!name || !file) {
    console.log('   参数错误.\n');
    console.log('   Example');
    console.log('   aics addfile -f README.md -t depot # 添加文件README.md 到 depot 组件包\n');
    return;
  }

  try {
    var paths = path.resolve('.aics/' + name + '.depot.json');
    var config = cjson.load(paths);
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
      for (var i = trees.length - 1; i >= 0; i--) {

        //过滤不需要添加的文件
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
        console.log("写入配置文件出错,请检查目录权限,并重试");
      } else {
        console.log(JSON.stringify(config.files, null, 2))
        console.log(chalk.green.bold(config.files.length + " 个文件已添加.\n"));
      }
    });
  } catch (e) {
    console.log(chalk.yellow.bold(file) + " 不存在.");
    return;
  }
}
PackageManager.updatePackage = function(args) {
  var filter = "";
  args = Array.prototype.slice.call(args);
  args.length > 1 ? (filter = args.pop() + '.depot.json') : (filter = 'depot.json');
  var packageRoot = path.resolve(".aics");
  const packages = fs.readdirSync(packageRoot)
    .map(pkgName => ({ name: pkgName, root: path.join(packageRoot, pkgName) }))
    .filter(pkg => pkg.name.endsWith(filter))
    .forEach(pkg => {
      var conf = cjson.load(root);
      queryPackage(pname, config.depend[pname]);

    })
  console.log(packages)
  return;
  walk(path.resolve(".aics")).then(function(files) {
    for (var i = 0; i < files.length; i++) {
      var file = files[i];
      if (file.name.indexOf(".depot.json") > 0) {
        //确定是包文件
        console.log("读取包配置文件: .aics/" + file.name);
        var config = Tools.projectConfig(".aics/" + file.name);
        if (config.depend) {
          for (var pname in config.depend) {
            queryPackage(pname, config.depend[pname]);
          }
        }
      }
    }
  });
}

PackageManager.add = function(name) {
  var projConf;
  if (!name) {
    console.log(" 在 add 命令后添加您要添加的代码包名称。可以在 http://aics.fami2u.com 寻找感兴趣的代码包");
    return;
  }

  fs.access('.aics/', fs.R_OK, (err) => {
    if (err) {
      fs.mkdirSync('.aics');
    }
    fs.access('.aics/packages.json', fs.R_OK | fs.W_OK, (err) => {
      if (err) {
        var config = {};
        fs.writeFileSync('.aics/packages.json', JSON.stringify(config, null, 2));
      }

      //读取项目配置文件中的
      var config = require(path.resolve(".aics/packages.json"));
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
          console.log("Not Found: " + chalk.red(name));
          return;
        } else {
          var result = JSON.parse(body);
          config[result.name] = result.version;
          fs.writeFile(path.resolve(".aics/packages.json"), JSON.stringify(config, null, 2), 'utf8', function(err, res) {
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
    });
  });
}
var queryPackage = function(name, version) {
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
      var name = result.name;
      var version = result.version;
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
  var tmppath = Tools.mkdir(".aics/tmp" + "/" + packagePath.join('/') + "@" + packages.version);
  if (!packages.url || packages.url.indexOf('http://') < 0) {
    console.log('请求URL不合法')
    return;
  }
  request(packages.url)
    .on('error', function(err) {
      console.log(err)
    })
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
              if (filename.indexOf("build.zip") < 0 && filename.indexOf("packages") < 0 && filename.indexOf(".DS_Store") < 0) {
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
    });
}

var putDepend = function(e) {
  var dependPath = path.resolve('.aics/packages.json');
  fs.access(dependPath, fs.R_OK | fs.W_OK, (err) => {
    var config = {};
    if (err) {
      console.log(JSON.stringify(config, null, 2))
      fs.writeFileSync(dependPath, JSON.stringify(config, null, 2), { encoding: 'utf8' });
    }
    config = cjson.load(dependPath);
    Object.keys(e).map(function(key) {
      if (!config[key]) {
        config[key] = e[key];
      }
    })
    fs.writeFileSync(dependPath, JSON.stringify(config, null, 2), 'utf8', function() {
      console.log(config)
    });
  });
}

var putPacks = function(packs) {
  var meteorPathRoot = path.resolve('.meteor/packages');
  fs.access(meteorPathRoot, fs.R_OK | fs.W_OK, (err) => {
    if (err) {
      fs.mkdirSync('.meteor');
      fs.writeFileSync('.meteor/packages', "", { encoding: 'utf8' });
    }
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
            console.log("+" + chalk.green.bold(item))
          });
        }
      })
    });
  });
}
var putNpms = function(e) {
  var npmRootPath = path.resolve('package.json');
  fs.access(npmRootPath, fs.R_OK | fs.W_OK, (err) => {
    var config = {};
    if (err) {
      config.dependencies = {};
      fs.writeFileSync(npmRootPath, JSON.stringify(config, null, 2), { encoding: 'utf8' });
    }
    config = cjson.load(npmRootPath);
    Object.keys(e).map(function(key) {
      if (!config.dependencies[key]) {
        config.dependencies[key] = e[key];
      }
    })
    fs.writeFileSync(npmRootPath, JSON.stringify(config, null, 2), 'utf8');
  });
}

var exportFiles = function(packages, file, tmppath) {
  var filename = file.name;
  var fileroot = file.root;
  var filepath = path.resolve(fileroot.replace(tmppath, "./"));
  Tools.mkdir(filepath);
  if (fs.existsSync(filepath + "/" + filename)) {
    var org = fs.readFileSync(file.root + "/" + filename, 'utf8');
    // console.log(org);
    var orgmd5 = md5(org);
    var tar = fs.readFileSync(filepath + "/" + filename, 'utf8')
    var tarmd5 = md5(tar);

    if (tarmd5 != orgmd5) {
      fs.writeFile(filepath + "/" + filename + "@" + packages.version, org, function(err) {
        //删除临时文件
        // fs.unlinkSync(file.root + "/" + filename);
        if (err) {
          console.log(err);
        } else {
          // jsdiff.applyPatch(source, patch[, options])
          // console.log(jsdiff.parsePatch(jsdiff.createPatch('patch', org, tar, 'header1', 'header2')));

          console.log(jsdiff.applyPatch(tar,jsdiff.structuredPatch('patch','patch2', org, tar, 'header1', 'header2'),{
            compareLine:function (lineNumber, line, operation, patchContent) {
            console.log(patchContent)
          }}))
            console.log("代码包中的文件于本地不一致: " + filepath + "/" + filename + " in " + packages.name + "@" + packages.version);
        }
      });

    } else {
      //删除临时文件
      // fs.unlinkSync(file.root + "/" + filename);
    }
  } else {
    fs.createReadStream(file.root + "/" + filename)
      .pipe(fs.createWriteStream(filepath + "/" + filename))
      .on("close", function() {
        //删除临时文件
        // fs.unlinkSync(file.root + "/" + filename);
      });
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
