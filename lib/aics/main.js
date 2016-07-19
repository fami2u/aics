// var ProjectManager = require('../lib/project');
// var PackageManager = require('../lib/package');
// var AccountManager = require('../lib/account');
// var help = require('../lib/help');
// var Tools = require('../lib/tools');
// var chalk = require('chalk');
// var aics = require('../package.json');
// var commander = require('commander');
// var argv = require('minimist')(process.argv.slice(2));

// if (!process.env.AICS_HOST) {
//   process.env.AICS_HOST = 'http://101.200.142.143';
// }

// module.exports = function() {
//   var controller = process.argv[2];
//   var havc = false;
//   if (controller == "adduser") {
//     havc = true;
//     AccountManager.adduser(function(err) {
//       if (err) {
//         console.log(err);
//       }
//     });
//   }

//   if (controller == "-v") {
//     havc = true;
//     console.log("version: " + aics.version);
//   }
//   if (controller == "-u") {
//     havc = true;
//     var account = AccountManager.get();
//     if (!account.username) {
//       console.log('账户未设置');
//       console.log('请使用aics adduser 添加账户');
//       return;
//     }
//     console.log(account.username);
//   }
//   if (controller == "-h") {
//     havc = true;
//     help.default();
//   } else if (controller == "init") {
//     havc = true;
//     if (argv.p) {
//       ProjectManager.initProject(process.argv);
//       return;
//     }
//     if (argv.e) {
//       ProjectManager.initWithSample(argv.e);
//       return;
//     }
//     PackageManager.init(process.argv);
//   } else if (controller == "add") {
//     Tools.checkProject();
//     havc = true;
//     ProjectManager.add(process.argv[3]);
//   } else if (controller == "update") {
//     Tools.checkProject();
//     havc = true;
//     ProjectManager.update(process.argv[3]);
//   } else if (controller == "publish") {
//     Tools.checkProject();
//     havc = true;
//     if (argv.p) {
//       ProjectManager.publish(process.argv);
//     } else {
//       PackageManager.publish(process.argv);
//     }
//   } else if (controller == "remove") {
//     Tools.checkProject();
//     havc = true;
//     PackageManager.remove(process.argv);
//   } else if (controller == "packages") {
//     Tools.checkProject();
//     havc = true;
//     PackageManager.showPackages(process.argv);
//   } else if (controller == "addfile") {
//     havc = true;
//     PackageManager.addfile(process.argv[3], process.argv[4]);
//   } else if (controller == "lsfiles") {
//     havc = true;
//     PackageManager.files(process.argv[3]);
//   } else if (controller == "merge") {
//     havc = true;
//     Tools.mergeFile('/Users/tf/workspace/blog/.meteor/packages', '/Users/tf/workspace/test/.meteor/packages', false);
//   }
//   if (!havc) {
//     help.default();
//   }

// }
