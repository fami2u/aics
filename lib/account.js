var path = require('path');
var fs = require('fs');
var cjson = require('cjson');
var Tools = require('../lib/tools');
var request = require('request');
var aicsConfig = require('../lib/config');
var qs = require('querystring');



module.exports = Account;

function Account() {

}
Account.get = function() {

    configPath = path.resolve(path.resolve(__dirname, '../account.json'));

    if (!fs.existsSync(configPath)) {
        console.log("需要AICS帐号，使用命令 aics adduser [email] 或访问 http://fami2u.com");
        process.exit(1);

    }

    var json = cjson.load(configPath);

    return json;
}
Account.adduser = function(username) {

    console.log("输入AICS帐户的密码");

    process.stdin.setEncoding('utf8');

    process.stdin.on('readable', function() {
        var chunk = process.stdin.read();
        if (chunk !== null) {
            var param = {
                "username": username,
                "password": chunk.replace("\n", "")
            };
            request(aicsConfig.host + "/account?" + qs.stringify(param), function(error, response, body) {
                if (!error && response.statusCode == 200) {
                    if (body == "ERROR") {
                        console.log("system error try again later .. ");
                    } else if (body == "NONE") {
                        console.log("帐号不存在。详情请访问 http://fami2u.com ");
                    } else if (body == "PWD") {
                        console.log("密码错误。详情请访问 http://fami2u.com ");
                    } else {
                        var account = JSON.stringify({
                            'secret': body.trim(),
                            'username': username,
                        });
                        fs.writeFile(path.resolve(__dirname, '../account.json'), account, function(err) {
                            if (err)
                                console.log("错误 " + err);
                            else
                                console.log("账户已更新");
                        });
                    }

                }
            })
            process.stdin.end();
        }
    });

}
