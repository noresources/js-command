'use strict';

import {test} from 'tape';
import Options from '../../../src/Options.mjs';
import * as adapter from '../../../src/commander/adapters.mjs';

const OPTION = {
	'switch': Options.createOption ({
		'type': 'switch',
		'documentation': 'Simple switch',
		'names': ['s', 'switch']
	}),
	'counter': Options.createOption ({
		'type': 'counter',
		'default': 2,
		'names': ['count', 'c', 'i', 'increment']
	})
};

test ('line', function (t) {
	
	const cases = [
		{
			'option': OPTION.switch,
			'expected': ['s', 'switch']
		}, {
			'option': OPTION.counter,
			'expected': ['c', 'count']
		}, {
			'option': OPTION.switch,
			'excludes': ['switch'],
			'expected': ['s']
		}, {
			'option': OPTION.counter,
			'excludes': ['c', 'i'],
			'expected': ['count', 'increment']
		}
	];
	
	cases.forEach(test => {
		const excludes = test.excludes || [];
		const label = test.option.constructor.name + ' - ' + excludes.join(', ');
		const actual = adapter.selectOptionNames(test.option, excludes, label);
		t.same (actual, test.expected ,label);
		
	});
	
	t.end();
});
