
var walk = require('../lib/walk');


walk(['./dir1', '../lib']).then(function(files) {
	console.log(files);
});