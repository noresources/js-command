'use strict';

import { test } from 'tape';
import Module from '../../src/Documentation.mjs';

test ('create', function (t) {
	const tests = [
		{
			'name': 'string',
			'content': 'It\'s something',
			'class': Module.Documentation,
			'abstract': 'It\'s something',
			'details': undefined
		}
	];
	
	for (const test of tests) {
		const actual = {
			
		};
		try {
			actual.object = Module.createDocumentation(test.content);
		} catch (error) {
			actual.object;
		}
		t.equal (typeof actual.object, 'object', test.name + ' - ' + 'Result is an object');
		t.equal (actual.object.constructor.name, test.class.name, test.name + ' - ' + 'Result class');
		for (const property of ['abstract', 'details']) {
			t.equal (actual.object[property], test[property], test.name + ' - ' + property);
		}
		
	}
	
	t.end();
});
