# ☎ walk-promise
| <h4>❁ Overview</h4> |
| :--- |
| <br>Recursively find files from a list of paths using promises and return them along with file information. This allows you to easily integrate walk functionality into a project that is already using promises.<br><br> |
| <h4>❁ Documentation</h4> |
| <ul><li>See the [`WIKI`](https://github.com/bhoriuchi/walk-promise/wiki) for full documentation</li><li>And the [`Change Log`](https://github.com/bhoriuchi/walk-promise/wiki/Change-Log) for what's new!</li></ul> |
| <h4>❁ Usage</h4> |
| `var walk = require('walk-promise');`<br>`walk('/path/to/walk').then(function(files) {`<br>&nbsp;&nbsp;&nbsp;&nbsp;`console.log(files);`<br>`});` |
| <h4>❁ Output</h4> |
| [<br>&nbsp;&nbsp;&nbsp;&nbsp;{<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**root**: `String` *root path*<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**name**: `String` *file name*<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**stat**: `Object` *file stat object*<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;},<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;...<br>] |
| <h4>❁ Examples</h4> |
##### ☶ Basic example
Passing a full path as a string to walk
```js
var walk = require('walk-promise');

walk('/home/user/documents').then(function(files) {
	console.log(files);
});
```
##### ☶ With multiple files
Passing an array containing both full and relative paths
```js
var walk = require('walk-promise');

walk(['../lib', '/home/user/documents']).then(function(files) {
	console.log(files);
});
```