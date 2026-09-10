'use strict';

import { test } from 'tape';
import {Command} from '../../src/Command.mjs';

test ('Constructor', function (t) {
	const c = new Command({
		'names': ['do', 'make']
	});
	t.true(Array.isArray(c.names), 'Name array');
	t.equal (c.names.length, 2, 'Name count');
	t.same (c.names, ['do', 'make'], 'Names');
	t.equal (c.name, 'do', 'Main name');
	t.same (c.aliases, ['make'], 'Aliases');
	t.end ();
});
