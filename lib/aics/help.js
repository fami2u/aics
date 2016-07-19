module.exports = Help;

function Help() {}

Help.init = function() {

}
Help.add = function() {

}
Help.update = function() {

}
Help.publish = function() {
  console.log(chalk.red.bold("\nUsage:\n"));
  console.log("publish  [option]  [string]    发布当前目录下的所有自定义代码包或项目");
  console.log('option:')
  console.log(" <无option>                    发布当前目录下指定的代码包");
  console.log(" -P                            发布当前目录下的项目");
}
Help.remove = function() {

}
Help.addfile = function() {

}
Help.merge = function() {

}
Help.adduser = function() {

}
Help.default = function() {
  console.log();
  console.log("Usage:");
  console.log('      aics [command] [option] [args]')
  console.log("      init  package                              将当前目录初始化为AICS package项目");
  console.log("      init  project [--example] name             将当前目录初始化为AICS project项目");
  console.log("      adduser                                    使用AICS账号登录");
  console.log("      addfile                                    添加文件到当前包");
  console.log("      add package:name                           为当前项目添加包");
  console.log("      update                                     更新依赖包");
  console.log("      publish                                    发布当前目下的所有自定义包");
}
