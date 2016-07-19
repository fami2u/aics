// var ProjectManager = require('../lib/project');
// var PackageManager = require('../lib/package');
// var Account = require('../lib/account');
// var program = require('commander');

// if (!process.env.AICS_HOST) {
//   process.env.AICS_HOST = 'http://101.200.142.143';
// }


// module.exports = function() {

//   //show aics cli base info
//   program
//     .version('0.0.38');

//   program
//     .command('adduser')
//     .description('登录aics cli')
//     .action(function(env, options) {
//       Account.adduser();
//     }).on('--help', function() {
//       console.log('  说明:');
//       console.log();
//       console.log('    在*.fami2u.com注册过的账号可直接登录');
//       console.log();
//     });

//   program
//     .command('whoami')
//     .description('显示aics cli信息')
//     .action(function(env, options) {
//       var user = Account.get();
//       console.log(user.username);
//     })

//   program
//     .command('init')
//     .description('生成aics配置文件')
//     .option('-p, --project <name>', 'change the working directory')
//     .option('-e, --example <name>', 'change the working directory')
//     .action(function(options) {
//       if (options.project) {
//         ProjectManager.initProject(process.argv);
//         return;
//       }

//       if (options.example) {
//         ProjectManager.initWithSample(options.example);
//         return;
//       }
//       PackageManager.initPackage(process.argv);
//     }).on('--help', function() {
//       console.log('  说明:');
//       console.log();
//       console.log('    生成aics配置文件');
//       console.log();
//     });

//   program
//     .command('add [packagename]')
//     .description('登录aics系统')
//     .action(function(env, options) {
//       Account.adduser();
//     }).on('--help', function() {
//       console.log('  说明:');
//       console.log();
//       console.log('    在*.fami2u.com注册过的账号可直接登录');
//       console.log();
//     });

//   program
//     .command('update')
//     .option('-all, --chdir <path>', 'change the working directory')
//     .description('登录aics系统')
//     .action(function(env, options) {
//       Account.adduser();
//     }).on('--help', function() {
//       console.log('  说明:');
//       console.log();
//       console.log('    在*.fami2u.com注册过的账号可直接登录');
//       console.log();
//     });

//   program
//     .command('publish')
//     .option('-p, --project <PROJECTNAME>', '发布解决方案（项目）')
//     .description('发布aics项目或组件')
//     .action(function(options) {
//       if (options.project) {
//         ProjectManager.publish();
//         return;
//       }
//       PackageManager.publish();

//     }).on('--help', function() {
//       console.log('  说明:');
//       console.log();
//       console.log('    在*.fami2u.com注册过的账号可直接登录');
//       console.log();
//     });

//   program
//     .command('remove [packagename]')
//     .description('登录aics系统')
//     .action(function(env, options) {
//       Account.adduser();
//     }).on('--help', function() {
//       console.log('  说明:');
//       console.log();
//       console.log('    在 *.fami2u.com 注册过的账号可直接登录');
//       console.log();
//     });

//   program
//     .command('addfile')
//     .option('-f, --file <path>', '添加文件到组件')
//     .option('-t, --target <name>', '添加到的组件名称')
//     .description('添加文件到组件')
//     .action(function(options) {
//       PackageManager.addfile(options.target, options.file);
//     }).on('--help', function() {
//       console.log('  说明:');
//       console.log();
//       console.log('    在*.fami2u.com注册过的账号可直接登录');
//       console.log();
//     });

//   program
//     .command('lsfile')
//     .option('-t, --target <name>', '组件名称')
//     .description('登录aics系统')
//     .action(function(options) {
//       PackageManager.files(options.target);
//     }).on('--help', function() {
//       console.log('  说明:');
//       console.log();
//       console.log('    在*.fami2u.com注册过的账号可直接登录');
//       console.log();
//     });

//   program.parse(process.argv);

// }
