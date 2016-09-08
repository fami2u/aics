var path = require('path');
var util = require('util');
var fs = require('fs');
var request = require('request');
var qs = require('querystring');
var unzip = require('unzip');
var walk = require('walk-promise');
var md5 = require('md5');
var archiver = require('archiver');
var chalk = require('chalk');
var argv = require('minimist')(process.argv.slice(2));
var Tools = require('./tools');
var AccountManager = require('./account');

module.exports = ProjectManager;

function ProjectManager() {}

var packs = {};
ProjectManager.config = function() {
  var configPath = path.resolve('project.json');
  if (!fs.existsSync(configPath)) {
    console.log("not in a aics project ,frist run aics project init [name] ");
    process.exit(1);
  }
  var json = require(configPath);

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

/*
*简化了aics项目的构成合并项目和包的概念
*.aics 文件夹存放包描述文件列表
*.aics/tmp 临时目录用来打包或下载文件
*.aics-project.json 项目描述文件 
＊－－0.0.x 版本用来管理项目的包依赖关系
* ./aics/example.json 包描述文件
*/

ProjectManager.initProject = function(args) {
  fs.stat('.aics', function(err, stats) {
    if (!stats) {
      fs.mkdir(".aics");
      console.log('在当前目录创建.aics文件夹成功.\n')
    }
    var project = {
      "name": "",
      "stack": "",
      "type": "project",
      "version": "0.0.1",
      "summary": "",
      "git": "",
      "documentation": "README.md",
      "dependencies": {},
      "packages": {},
      "npm": {}
    }

    project.name = AccountManager.username + ":" + argv.p;
    fs.writeFile('.aics/project.json', JSON.stringify(project, null, 2), 'utf8', function(err) {
      if (err) {
        console.log('写入 .aics/project.json 错误')
      };
      console.log('创建 .aics/project.json 成功.')
      fs.writeFile('.aics/packages.json', "{}", 'utf8', function(err) {
        if (err) {
          console.log('写入 package.json 错误')
        };
        console.log('创建 .aics/packages.json 成功.')
      });
      fs.writeFile('README.md', "## " + argv.p, 'utf8', function(err) {
        if (err) {
          console.log('写入 README.md 错误')
        } else {
          console.log('创建 README.md 成功.')
        }
      });
    });
  })
}
ProjectManager.initWithSample = function(example) {
  var param = {
    "project": example
  };
  if (example.split(":").length > 1) {
    name = argv.e.split(":").pop();
  } else {
    console.log("\n项目名输入错误.\n");
    return;
  }
  request(process.env.AICS_HOST + "/project/info?" + qs.stringify(param), function(error, response, body) {
    console.log(body)
    body = JSON.parse(body);
    try {
      fs.stat('.aics', function(err, stats) {
        if (!stats) {
          fs.mkdir(".aics");
        }
      })
    } catch (e) {
      fs.mkdir(".aics");
    }

    fs.writeFile('README.md', body.documentation, 'utf8', function(err) {
      if (err) {
        console.log('写入 README.md 错误')
      } else {
        body.documentation = "README.md";
        fs.writeFile('.aics/project.json', JSON.stringify(body, null, 2), 'utf8', function(err) {
          if (err) {
            console.log('写入 .aics/project.json 错误');
          } else {

          }
        });
        console.log('\n' + chalk.green.bold('Success.') + '\n');
      }
    });
  });
}
ProjectManager.update = function(configname) {
  if (!configname) {
    var config = require(path.resolve(".aics") + "/project.json");
    console.log("更新项目依赖的代码包...");
    for (var pname in config.packages) {
      queryPackage(pname, config.packages[pname]);
    }

  } else if (configname == "--all") {
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
    configname = configname + ".depot.json";
    var config = Tools.projectConfig(".aics/" + configname);
    if (config.dependencies) {
      console.log("读取包配置文件: .aics/" + configname);
      for (var pname in config.dependencies) {
        queryPackage(pname, config.dependencies[pname]);
      }
    }
  }
}
ProjectManager.remove = function(name) {

}
ProjectManager.add = function(name) {
  var projConf;
  if (!name) {
    console.log(" 在 add 命令后添加您要添加的代码包名称。可以在http://codedepot.fami2u.com 寻找感兴趣的代码包");
    return;
  }
  //读取项目配置文件中的
  var config = Tools.getAics();
  if (typeof config[name] == "string") {
    console.log(chalk.green(name) + " has been Installd.");
    return;
  }
  //为当前项目添加包依赖
  var packageinfo = name.split("@");
  var param = {
    name: packageinfo.shift(),
    version: packageinfo.pop() || ""
  };
  request(process.env.AICS_HOST + "/package/info?" + qs.stringify(param), function(error, response, body) {
    if (body == "NONE") {
      console.log("Not Found: " + chalk.red(name));
    } else {
      var result = JSON.parse(body);
      config = Tools.projectConfig(path.resolve(".aics/project.json"));
      config.packages[name] = result.version;

      fs.writeFile(path.resolve(".aics/project.json"), JSON.stringify(config, null, 2), 'utf8', function(err, res) {
        setupPackage(result);
      });
      // setupPackage(result);
    }
  });
  // Tools.updateProjectConfig(config);
  // queryPackage(packageinfo[0], (packageinfo[1] ? packageinfo[1] : ""));
}

ProjectManager.publish = function(params) {
  var config = require(path.resolve('.aics/project.json'));
  if (!configCheck(config)) {
    console.log(chalk.red.bold("配置文件出错."));
    return;
  }
  fs.readFile(path.resolve(config.documentation), 'utf8', function(err, res) {
    config.documentation = res;
    config.creater = AccountManager.get().secret;
    var r = request.post(process.env.AICS_HOST + '/project/create?' + qs.stringify(config), function(err, httpResponse, body) {
      console.log(body);
    });
  })
}
queryPackage = function(name, version) {
  var _aics = Tools.getAics();
  if (_aics[name] == version) {
    console.log("代码包: " + name + "@" + version + " 已安装");
  } else {
    request(process.env.AICS_HOST + "/package/info?" + qs.stringify({
      name: name,
      version: version
    }), function(error, response, body) {
      if (body == "NONE") {
        console.log("未发现代码包: " + name);
      } else {
        var result = JSON.parse(body);
        var name = result.name;
        var version = result.version;
        setupPackage(result);
        for (var pname in result.dependencies) {
          queryPackage(pname, result.dependencies[pname]);
        }
      }
    });
    // Tools.setAics(name, version);
  }
}
setupPackage = function(packages) {
  console.log("Downloading  " + packages.name + "@" + packages.version + "...");
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
          var rootPath = path.resolve('.');
          // Tools.mergeFile(tmppath + '/packages', rootPath + '/.meteor/packages');
          fs.unlinkSync(tmppath + "/packages");
          walk(tmppath).then(function(files) {
            for (var i = 0; i < files.length; i++) {
              var file = files[i];
              var filename = file.name;
              if ((filename.indexOf(".") != 0) && (filename.indexOf("build.zip") == -1)) {
                exportFiles(packages, file, tmppath);
              }
            }
            console.log("已写入代码包文件: " + packages.name.replace("$", ":") + "@" + packages.version);
            Tools.setAics(packages.name, packages.version);
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
        // fs.unlinkSync(file.root + "/" + filename);
        if (err) {
          console.log(err);
        } else {
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
configCheck = function(config) {
  if (!config.stack) {
    console.log("project belong to some stack");
    return false;
  }
  if (!config.name) {
    console.log("project need a name");
    return false;
  }
  if (!config.version) {
    console.log("project need a version");
    return false;
  }
  if (!config.files) {
    console.log("project need a files list");
    return false;
  }

  return true;
}