var path = require('path');
var fs = require('fs');
var uuid = require('uuid');
var cjson = require('cjson');
var Tools = require('../lib/tools');
var request = require('request');
var aicsConfig = require('../lib/config');
var qs = require('querystring');



module.exports = Account;

function Account() {

}
Account.adduser = function(username) {

    console.log("your password for aics acccount:" + username);

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
                        console.log("account is miss");
                    } else if (body == "PWD") {
                        console.log("pwd is miss");
                    } else {
                        var account = JSON.stringify({
                            'secret': body.trim()
                        });
                        fs.writeFile(path.resolve(__dirname, '../account.json'), account, function(err) {
                            if (err)
                                console.log("fail " + err);
                            else
                                console.log("chanage user");
                        });
                    }


                }
            })



            process.stdin.end();
        }

    });




}
