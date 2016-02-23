var ProjectManager = require('../lib/project');
var PackageManager = require('../lib/package');
var AccountManager = require('../lib/account');
var Tools = require('../lib/tools');
var chalk = require('chalk');
var aics = require('../package.json');

module.exports = function() {
    var controller = process.argv[2];
    var havc = false;
    if (controller == "adduser") {
        havc = true;
        AccountManager.adduser();
    }
    if (controller == "-v") {
        havc = true;
        console.log("version: " + aics.version);
    }
    if (controller == "-u") {
        havc = true;
        var account = AccountManager.get();
        if(!account.username){
            console.log('账户未设置');
            console.log('请使用aics adduser 添加账户');
            return;
        }
        console.log(account.username);
    }
    if (controller == "-h") {
        havc = true;
        console.log("\nAICS CLI v" + aics.version);
        console.log("\ncode easy,code no repeat.\n");
        console.log("Usage: aics task args");
        console.log("init  package                              将当前目录初始化为AICS package项目");
        console.log("init  project [--example] name             将当前目录初始化为AICS project项目");
        console.log("adduser                                    使用AICS账号登录");
        console.log("addfile                                    添加文件到当前包");
        console.log("add package:name                           为当前项目添加包");
        console.log("update                                     更新依赖包");
        console.log("publish                                    发布当前目下的所有自定义包");
    } else if (controller == "init") {
        havc = true;
        ProjectManager.init(process.argv);
    } else if (controller == "add") {
        Tools.checkProject();
        havc = true;
        ProjectManager.add(process.argv[3]);
    } else if (controller == "update") {
        Tools.checkProject();
        havc = true;
        ProjectManager.update(process.argv[3]);
    } else if (controller == "publish") {
        Tools.checkProject();
        havc = true;
        PackageManager.publish(process.argv);
    } else if (controller == "-dev") {
        havc = true;
        process.env.DEBUG = 1;
        console.log("已设置成开发模式");
    } else if (controller == "-online") {
        havc = true;
        process.env.DEBUG = 0;
        console.log("已设置成生产模式");
    } else if (controller == "config") {
        havc = true;
        var aicsConfig = require('../lib/config');
    } else if (controller == "addfile") {
        havc = true;
        ProjectManager.addfile(process.argv[3], process.argv[4]);
    } else if (controller == "lsfiles") {
        havc = true;
        ProjectManager.files(process.argv[3]);
    }
    if (!havc) {
        console.log("\nAICS CLI v" + aics.version);
        console.log("\ncode easy,code no repeat.\n");
        console.log("Usage: aics task args");
        console.log("init  package                              将当前目录初始化为AICS package项目");
        console.log("init  project [--example] name             将当前目录初始化为AICS project项目");
        console.log("register                                   注册用户");
        console.log("adduser                                    使用AICS账号登录");
        console.log("addfile                                    添加文件到当前包");
        console.log("add package:name                           为当前项目添加包");
        console.log("update                                     更新依赖包");
        console.log("publish                                    发布当前目下的所有自定义包");
    }
}
