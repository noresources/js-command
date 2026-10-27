'use strict';

import { test } from 'tape';
import { merge } from '@noresources/core';
import Module from '../../src/Options.mjs';

/**
* Testing options constructions with default values.
* The "properties" property in test elements defines to properties of the class instance to check.
*/
test ('createOption with default options', function (t) {
	const list = [{
		'type': Module.OPTION_TYPE.SWITCH,
		'class': Module.SwitchOption
	}, {
		'type': Module.OPTION_TYPE.COUNTER,
		'class': Module.CounterOption,
		'properties': {
			'initial': 0
		}
	}, {
		'type': Module.OPTION_TYPE.VALUE,
		'class': Module.ValueOption,
		'properties': {
			'parameter': undefined
		}
	}, {
		'type': Module.OPTION_TYPE.VARIADIC,
		'class': Module.VariadicOption,
		'properties': {
			'parameters': undefined,
			'min': 0,
			'max': undefined
		}
	}];
	
	for (const item of list) {
		const object = Module.createOption (item.type);
		t.true (object instanceof item.class, item.type + ' gives a ' + item.class.name);
		for (const [property, value] of Object.entries (item.properties || {})) {
			const f = (typeof value == 'object') ? 'same' : 'equal';
			t[f] (object[property], value, item.class.name + '.' + property + ' = ' + value);
		}
	}
	
	t.end ();
});

/**
* Verify that Option class constructor is called and initialize the class instance properties the same way in all sub classes
*/
test ('Base class constructor', function (t) {
	['switch', 'counter', 'value', 'variadic']
		.forEach (type => {
			const option = Module.createOption({
				type,
				'names': ['o', 'option'],
				'property': 'theOption',
				'documentation': 'This is something useful'
			});
			t.equal (option.type, type, type + ' type');
			t.equal(option.names.length, 2, type + ' name count');
			t.same (option.names, ['o', 'option'], type + ' names');
			t.equal (typeof option.documentation, 'object', type + ' documentation object');
			t.equal (option._documentation.toString(), 'This is something useful', type + ' documentation');
			t.equal (option.property, 'theOption', type + ' property');
		});
	t.end ();
		
});

/**
* Check the value of the Option.property instance property depending on presence of a user-defined property value and types of noption names
*/
test ('Property', function(t) {
	const cases = [
		{
			'label': 'user-defined property',
			'names': ['-p', '--whatever'],
			'property': 'theRealName',
			'expected': 'theRealName'
		}, {
			'label': 'Long option as-is',
			'names': ['f', 'file'],
			'expected': 'file'
		}, {
			'label': 'Long option camel cased',
			'names': ['F', 'file-name'],
			'expected': 'fileName'
		}, {
			'label': 'Short option (never touched)',
			'names': ['S'],
			'expected': 'S'
		}
	];
	
	const classes = [Module.SwitchOption, Module.CounterOption, Module.ValueOption, Module.VariadicOption];
	cases.forEach(test => {
		const r =  Math.floor(Math.random() * 1000)  % classes.length;
		const C = classes[r];
		const option = new C(test);
		t.equal (option.property, test.expected, test.label + ' (' + C.constructor.name + ')');
	});
	
	t.end ();
});

test ('createOption - Auto detect type', function(t) {
	
	const cases = [{
		'options': {},
		'class': Module.SwitchOption
	}, {
		'options': {
			'parameter': 'integer'
		},
		'class': Module.ValueOption
	},{
		'options': {
			'parameters': 'enumeration'
		},
		'class': Module.VariadicOption
	}, {
		'options': {
			'default': 'Paf !'
		},
		'class': Module.ValueOption
	}, {
		'options': {
			'initial': 12
		},
		'class': Module.CounterOption
	}, {
		'options': {
			'parameters': 'string',
			'default': 'Variadic or Value ?!'
		},
		'throws': true
	}, {
		'options': {
			'parameters': 'enumeration',
			'min': 2
		},
		'class': Module.VariadicOption
	}];
	
	cases.forEach(test => {
		const options = merge ({
			'names': ['n', 'name']
		}, test.options);
		
		if (test.throws) {
			t.throws( function() {
				Module.createOption(options);
			});
			return;
		}
		
		t.doesNotThrow (function () {
			const option = Module.createOption(options);
			t.equal (option.constructor.name, test.class.name, 'Created class name');
		}, 'createOption called with ' + Object.keys(test.options).join(', '));
	});
	
	t.end();
});
