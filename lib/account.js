var path = require('path');
var fs = require('fs');
var request = require('request');
var qs = require('querystring');
var inquirer = require('inquirer');
var aicsConfig = require('../lib/config');

module.exports = Account;

/**
 * [Account description]
 * 用户登录注册
 */
function Account() {}

Account.get = function() {
  var configPath = path.resolve(path.resolve(__dirname, '../account.json'));
  if (!fs.existsSync(configPath)) {
    console.log("需要AICS帐号，使用命令 aics adduser [email] 或访问 http://fami2u.com");
    process.exit(1);
  }
  var json = require(configPath);
  return json;
};
Account.adduser = function() {
  var email;
  var password;
  inquirer.prompt({
    name: "email",
    type: 'input',
    message: "Email"
  }, function(answer) {
    email = answer.email;
    inquirer.prompt({
      name: "password",
      type: 'password',
      message: "Password"
    }, function(answer) {
      password = answer.password;
      var param = {
        email: email,
        password: password
      };
      var requestURL = aicsConfig.host + "/account?" + qs.stringify(param);
      request(requestURL, function(error, response, body) {
        if (!error && response.statusCode === 200) {
          if (body === "ERROR") {
            console.log("system error try again later .. ");
          } else if (body === "NONE") {
            console.log("帐号不存在。详情请访问 http://fami2u.com ");
          } else if (body === "PWD") {
            console.log("密码错误。详情请访问 http://fami2u.com ");
          } else {
            var res = body.trim();
            fs.writeFile(
              path.resolve(__dirname, '../account.json'), res,
              function(err) {
                if (err) {
                  console.log("错误 " + err);
                } else {
                  console.log("账户已更新");
                }
              });
          }
        }
      });
    });
  });
};
