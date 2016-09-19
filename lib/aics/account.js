'use strict';

var path = require('path');
var fs = require('fs');
var request = require('request');
var qs = require('querystring');
var argv = require('minimist')(process.argv.slice(2));
var read = require('read')
module.exports = Account;

function Account() {}
Account.get = function() {
    var user;
    try {
        user = JSON.parse(fs.readFileSync(process.env.HOME + "/account.json", 'utf8'));
    } catch (e) {
        user = {};
    }
    return user;
};
Account.adduser = function(cb) {
    var u = {
        e: '',
        p: ''
    }
    var fns = [readEmail, readPassword, save]

    loop()

    function loop(er) {
        if (er) return cb(er)
        var fn = fns.shift()
        if (fn) return fn(u, loop)
        cb()
    }
};
Account.createUser = function(cb) {
    var u = {
        e: '',
        p: '',
        n: ''
    }
    var fns = [readEmail, readPassword, readUsername, save]

    loop()

    function loop(er) {
        if (er) return cb(er)
        var fn = fns.shift()
        if (fn) return fn(u, loop)
        cb()
    }
}

function readUsername(u, cb) {

    read({ prompt: 'Username:', default: '' }, function(err, e) {
        if (err) {
            return cb(err.message === "cancelled" ? err.message : err)
        }
        var error = checkUsername(e);
        if (!error) {
            return readUsername(u, cb);
        }
        u.n = e;
        createUser(u, cb)
    })

}

function createUser(u, cb) {
    var requesturl = process.env.AICS_HOST + "/account/create?" + qs.stringify(u);
    console.log(requesturl)
    request(requesturl, function(error, response, body) {
        if (error) throw error;
        body = JSON.parse(body);
        console.log(body.code)
        if (body.code > 0) {
            var user = {
                secret: body.data._id,
                username: u.n,
                email: u.e
            }
            console.log('user accounts create successfully!')
            fs.writeFile(process.env.HOME + "/account.json", JSON.stringify(user), function(err, res) {
                if (err) throw err;
                console.log("帐户已更新")
            })
        } else {
            console.log(body.msg)
        }
    });
}

function checkUsername(str) {
    var usernameReg = /^\w+[\w\s]+\w+$/;
    return usernameReg.test(str) ? true : false;

}

function readEmail(u, cb) {
    read({ prompt: 'Email: ', default: '' }, function(er, e) {
        if (er) {
            return cb(er.message === 'cancelled' ? er.message : er)
        }
        var error = checkEmail(e)
        if (error) {
            return readEmail(u, cb)
        }
        if (!e) {
            return readPassword(u, cb)
        }
        u.e = e;
        cb(er)
    })
}

function checkEmail(str) {
    var email = /^([\w-_]+(?:\.[\w-_]+)*)@((?:[a-z0-9]+(?:-[a-zA-Z0-9]+)*)+\.[a-z]{2,6})$/i;
    return email.test(str) ? false : true;
}


function readPassword(u, cb) {
    read({ prompt: 'Password: ', silent: "true", replace: "*" }, function(er, un) {
        if (er) {
            return cb(er.message === 'cancelled' ? er.message : er)
        }
        if (!un) {
            return save(u, cb)
        }
        u.p = un
        cb(er)
    })
}

function save(u, cb) {
    var param = {
        email: u.e,
        password: u.p
    };
    var requesturl = process.env.AICS_HOST + "/account?" + qs.stringify(param);
    request(requesturl, function(error, response, body) {
        if (error) throw error;
        var json = JSON.parse(body);
        if (json.code === 200) {
            fs.writeFile(process.env.HOME + "/account.json", JSON.stringify(json.data), function(err, res) {
                if (err) throw err;
                console.log("帐户已更新")
            })
        } else {
            console.log(json.msg)
        }
    });
}
