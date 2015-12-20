/**
 * @author Branden Horiuchi <bhoriuchi@gmail.com>
 * 
 * @description
 * An implementation of walk using promises
 * 
 * 
 */
var promise = require('bluebird');
var fs      = require('fs');
var path    = require('path');
promise.promisifyAll(fs);


/**
 * Recursively gets file information from a root directory
 * @param {(String|String[])} currentPath - Path or paths to directories/files to walk
 * @returns {Promise} Promise that resolves to an array of file data
 */
function walk(currentPath) {
	
	return fs.statAsync(currentPath).then(function(stat) {
		if (stat.isFile()) {
			return {
				root: path.resolve(path.dirname(currentPath)),
				name: path.basename(currentPath),
				stat: stat
			};
		}
		else if (stat.isDirectory()) {
			return fs.readdirAsync(currentPath).map(function(fileName) {
				return walk(path.join(currentPath, fileName));
			})
			.reduce(function(a, b) {
				return a.concat(b);
			}, []);
		}
	})
	.caught(function () {
		return null;
	});	
}


// export the module as a function
module.exports = function(path) {
	
	// set the path as an array if it is not one
	path = Array.isArray(path) ? path : [path];
	
	return promise.map(path, walk).reduce(function(a, b) {
		return a.concat(b);
	}, []);
};