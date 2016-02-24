#!/usr/bin/env node

var fs = require('fs');

(function() {
  fs.unlink('account.json', function(err, stats) {
    fs.writeFile('account.json', '{}', 'utf8', function() {
      console.log('create account.json Success.')
    });
  })
})();
