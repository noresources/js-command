'use strict';

import { test } from 'tape';
import Module from '../../src/Positionals.mjs';

test ('createPositional', function (t) {
	let cases = [{
		'descriptor': {
			'type': 'value',
		},
		'expected': {
			'class': Module.PositionalValue,
			'properties': {
				'required': true,
				'min': 1,
				'max': 1
			}
		}
	}, {
		'descriptor': {
			'type': 'value',
			'default': 'test'
		},
		'expected': {
			'class': Module.PositionalValue,
			'properties': {
				'default': 'test',
				'required': false,
				'min': 0,
				'max': 1
			}
		}
	}];
	
	cases.forEach (test => {
		const actual = Module.createPositional(test.descriptor);
		if (!test.expected) {
			return;
		}
		if (test.expected.class) {
			t.true (actual instanceof test.expected.class, 'class');
		}
		if (test.expected.properties) {
			for (const [property, value] of Object.entries(test.expected.properties)) {
				t.equal (actual[property], value, property + ' property');
			}
		}
	});
	t.end ();
});

function testDispatchPositionalValues(t, cases) {
	const positionals = [];
	const values = [];
	let actual;
	
	cases.forEach(test => {
		if (test.positional) {
			positionals.push(Module.createPositional(test.positional));
		}
		if (test.value) {
			values.push (test.value);
		}
		
		const label = (test.name ? (test.name + ' ') : '') + positionals.length + '/' + values.length;
		
		if (test.throws) {
			const expected = (typeof test.throws === 'object') ? test.throws : undefined;
			t.throws (function () {
				Module.createPositionalArgumentResult(positionals, values);
			}, expected, label);
			return;
		}
		
		if (test.dispatched) {
			actual = Module.createPositionalArgumentResult(positionals, values, {
				'dispatchOnly': true
			});
			actual = actual.map (e => {
				return e.values;
			});
			t.same (actual, test.dispatched, label);
		}
		if (test.expected) {
			actual = Module.createPositionalArgumentResult(positionals, values);
			if ('length' in test.expected) {
				t.equal (actual.length, test.expected.length, label + ' proxy length');
			}
		}
	});
}

test ('dispatch', function (t) {
	
	let cases = [{
		'name': 'Empty',
		'dispatched': [  ],
		'expected': {
			'length': 0
		}
	}, {
		'name': 'First required value',
		'positional': Module.createPositional({
			'type': 'value'
		}),
		'throws': {
			'message': 'Missing 1 required positional argument'
		}
	}, {
		'name': 'With one argument',
		'value': 'foo',
		'dispatched': [['foo']]
	}, {
		'name': 'Optional variadic',
		'positional': {
			'type': 'variadic'
		},
		'dispatched': [['foo'], []]
	}, {
		'name': 'Add another required positional',
		'positional': {
			'type': 'value',
			'required': true
		},
		'throws': true
	}, {
		'value': 'bar',
		'dispatched': [['foo'], [], ['bar']]
	} ];

	testDispatchPositionalValues(t, cases);
	
	cases = [{
		'name': 'Optional variadic',
		'positional': {
			'type': 'variadic'
		},
		'dispatched': [[]]
	}, {
		'name': 'Add one value',
		'value': 'one',
		'dispatched': [['one']]
	}, {
		'name': 'Add a second value',
		'value': 'two',
		'dispatched': [['one', 'two']]
	}, {
		'name': 'Add optional positional value',
		'positional': {
			'type': 'value',
			'default': 'N/A'
		},
		'dispatched': [['one', 'two'], []]
	}, {
		'name': 'Third argument',
		'value': 'three',
		'dispatched': [['one', 'two', 'three'], []]
	}, {
		'name': 'Add trailing required positional',
		'positional': {
			'type': 'value',
			'property': 'last'
		},
		'dispatched': [['one', 'two'], [], ['three']],
		'expected': {
			'last': 'three'
		}
	}];
	
	testDispatchPositionalValues(t, cases);
	
	t.end ();
});