import test from 'ava';
import assert from 'assert'

import Account from '../lib/account';
import Package from '../lib/package';
import Project from '../lib/project';


/**
 * account.js
 */

test('checkUsername', t => {
	var usernameReg = /^\w+[\w\s]+\w+$/;
  assert(usernameReg.test("qin123") === true)
});

