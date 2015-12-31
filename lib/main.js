var ProjectManager = require('../lib/project');
var PackageManager = require('../lib/package');
var AccountManager = require('../lib/account');
var Tools = require('../lib/tools');
var chalk = require('chalk');

module.exports = function() {

    var controller = process.argv[2];
    var havc = false;
    if (controller == "adduser") {
        havc = true;
        if (process.argv[3]) {
            AccountManager.adduser(process.argv[3]);
        } else {
            console.log("error , like 'aics adduser youname@email.com'");
        }
    }
    if (controller == "-v") {
        havc = true;
        console.log("version 0.0.1");
    }
    if (controller == "-u") {
        havc = true;
        var account = AccountManager.get();
        console.log(account.username);
    }
    if (controller == "-h") {
        havc = true;
        console.log("\nAICS CLI v0.0.5");
        console.log("\ncode easy,code no repeat.\n");
        console.log("Usage: aics task args");
        console.log("init                                    将当前目录初始化为AICS项目");
        console.log("register                                注册用户");
        console.log("adduser                                   使用AICS账号登录");
        console.log("addfile                                 添加文件到当前包");
        console.log("add [package name]                      为当前项目添加包");
        console.log("update                                  更新依赖包");
        console.log("publish                                 发布当前目下的所有自定义包");
    } else if (controller == "init") {
        havc = true;
        ProjectManager.init();
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
        PackageManager.publish(process.argv[3]);
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
        console.log(aicsConfig);
    } else if (controller == "addfile") {
        havc = true;
        ProjectManager.addfile(process.argv[3]);
    }
    if (!havc) {
        console.log(chalk.red.bold('\nNo Commander.\n'));
        console.log("AICS CLI v0.0.5");
        console.log("\ncode easy,code no repeat.\n");
        console.log("Usage: aics task args");
        console.log("init                                    将当前目录初始化为AICS项目");
        console.log("register                                注册用户");
        console.log("adduser                                   使用AICS账号登录");
        console.log("addfile                                 添加文件到当前包");
        console.log("add [package name]                      为当前项目添加包");
        console.log("update                                  更新依赖包");
        console.log("publish                                 发布当前目下的所有自定义包");
    }
}
