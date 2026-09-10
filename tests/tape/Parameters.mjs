'use strict';

import { test } from 'tape';
import Module from '../../src/Parameters.mjs';

test ('Factory', function (t) {

	
	const anObject = {
		'name': 'Doe'
	};

	const tests = [
		{
			'class': Module.Parameter
		}, {
			'type': 'enumeration',
			'options': {
				'values': ['foo', 'bar', 'baz']
			},
			'class': Module.EnumerationParameter,
			'validate': [{
				'value': 'bar',
				'valid': true
			}, {
				'value': 'meta',
				'valid': false
			}]
		}, {
			'type': 'string',
			'class': Module.StringParameter,
			'validates': [{
				'value': 'Hello',
				'coerced': 'Hello',
				'valid': true
			}, {
				'value': anObject,
				'coerced': anObject.toString(),
				'result': true
			}]
		},
		{
			'type': 'string',
			'options': {
				'maxLength': 3
			},
			'class': Module.StringParameter,
			'validates': [{
				'value': 'ABCD',
				'error': {
					'name': 'ValidationError'
				}
			}]
		},
		{
			'type': 'number',
			'options': {},
			'class': Module.NumberParameter,
			'validates': [{
				'value': 'notANumber',
				'error': {
					'name': 'CoercionError'
				}
			}]
		},
		{
			'type': 'number',
			'options': {
				'minValue': 10
			},
			'class': Module.NumberParameter,
			'validates': [{
				'value': 5,
				'error': {
					'name': 'ValidationError'
				}
			}]
		},
		{
			'type': 'integer',
			'options': {},
			'class': Module.IntegerParameter,
			'validates': [{
				'value': 3.9,
				'coerced': 3,
				'result': true // Coercion handles it, validation doesn't check decimals
			}]
		},
		{
			'type': 'integer',
			'options': {
				'minValue': 1
			},
			'class': Module.IntegerParameter,
			'validates': [{
				'value': 0.5,
				'error': {
					'name': 'ValidationError'
				}
			}]
		}
	];

	for (const test of tests) {
		const className = test.class.name;
		let argument;
		try {
			argument = Module.createParameter(test.type, test.options);
		} catch (error) {
			argument = error;
			console.error (error.message);
		}

		t.equal (argument.constructor.name, className, test.type + ' gives a ' + className);
		if (Array.isArray (test.validates)) {

			test.validates.forEach (V => {
				let coerced;
				let result = false;

				try {
					coerced = argument.coerce (V.value);
					argument.validate (coerced);
					result = true;
				} catch (error) {
					result = error;
				}

				const label = argument.constructor.name + ' | ' + (typeof V.value) + ' ' + V.value;

				if ('error' in V) {
					t.true (result instanceof Error, label + ' | Validation throws Error');
					t.equal (result.constructor.name, V.error.name, label + ' | Error class');
					return;
				}

				if ('coerced' in V) {
					const f = (typeof V.coerced == 'object') ? 'same' : 'equal';
					t[f] (coerced, V.coerced, label + ' | coerced value');
				}
			});
		} /* validates */

		if (Array.isArray (test.properties)) {
			test.properties.forEach (p => {
				const label = argument.constructor.name + '.' + p.name;
				const actual = argument[p.name];

				t.false(typeof actual === 'undefined', label + ' is defined');

				if (p.toString) {
					console.debug ('P', p.name, actual);
					t.equal (actual.toString(), p.expected, label + ' to string');
				}
			});
		}
	} // cases */

	t.end ();
});
