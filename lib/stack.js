'use strict';

const path = require('path');
const util = require('util');
const fs = require('fs');
const request = require('request');
const unzip = require('unzip2');
const archiver = require('archiver');
const Tools = require('./tools');
const readline = require('readline');
const AccountManager = require('./account');
const ProgressBar = require('progress');
const colors = require('colors');

module.exports = StackManager;

function StackManager(argument) {
  // body...
}
StackManager.initWithStack = function(name, stack) {
  var param = {
    "name": name,
    "stack": stack,
    "username": AccountManager.get().username,
    "userid": AccountManager.get().secret
  };
  var querystring = Object.keys(param).map(function(key) {
    return key + '=' + encodeURIComponent(param[key]);
  }).join('&');

  //查询服务器stack地址
  request(process.env.AICS_HOST + "/stack/query?" + querystring, function(error, response, body) {
    body = JSON.parse(body);
    // console.log(body);
    setupStack(name, body);
  });
}
var setupStack = function(name, stack) {
  var tmppath = Tools.mkdir("./" + name);
  if (!stack.url) {
    console.log('请求URL不合法')
    return;
  }
  var date = new Date();
  console.log(colors.green.bold("GET ") + stack.url);
  request({ uri: stack.url, gzip: true, method: 'GET' })
    .on('error', function(err) {
      console.log(err)
    })
    .on('response', function(response) {
      var len = parseInt(response.headers['content-length'], 10);
      var bar = new ProgressBar('    [:bar] :percent :etas', {
        complete: '=',
        incomplete: 'x',
        width: 50,
        total: len
      });
      response.on('data', function(chunk) {
        bar.tick(chunk.length);
      });
    })
    .pipe(fs.createWriteStream(tmppath + "/build.zip"))
    .on('close', function() {
      // console.log('close')
      fs.createReadStream(tmppath + "/build.zip")
        .pipe(unzip.Extract({
          path: tmppath
        }))
        .on("close", function() {
          // console.log('createReadStream close '+date.getTime());
        });
    });
}
