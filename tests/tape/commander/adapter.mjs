'use strict';

import {test} from 'tape';
import Options from '../../../src/Options.mjs';
import * as adapter from '../../../src/commander/adapters.mjs';
import { ProgramBuilder } from '../../../src/Builders.mjs';

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

function commandStackTestHandler(input) {
	input.commands.shift(); // main program
	
	const label = 'Command stack ' + this.expected.join(', ');
	const actual = input.commands.map(c => c.name);
	
	this.t.same (actual, this.expected, label);
}

function commandStackTestMakeCommandDescriptor (t, list) {
	const ctx = {
		t,
		'expected': list
	};
	const names = [ list[list.length - 1] ];
	const handler = commandStackTestHandler.bind(ctx);
	return {
		names,
		handler
	};
}

test ('Command stack', function (t) {
	const b = new ProgramBuilder;
	b.name ('test');
	const list = [];
	let c = b;
	for (const name of ['foo', 'bar', 'baz']) {
		list.push (name);
		c = c.command ( commandStackTestMakeCommandDescriptor(t, Array.from (list)) );
		const command = adapter.createCommand (b.program);
		command.parse (list, {
			'from': 'user'
		});
	}
		
	t.end ();
});


test ('Option name mapping', function (t) {
	
	const cases = [
		{
			'label': 'No conflicts',
			
			'names': ['foo', 'f'],
			
			'excludes': [],
			
			'long': '--foo',
			'short': '-f'
		}, {
			'label': 'Fully conflicting',
			
			'names': ['f', 'foo'],
			'excludes': ['foo', 'f'],
			
			'throws': true
		}, {
			'label': 'Partial conflict',
			
			'names': ['foo', 'f'],
			'excludes': ['f'],
			'long': '--foo',
			'short': undefined
		}, {
			'label': 'Fallback to kebabized property',
			
			'property': 'theBar',
			'names': ['foo', 'f'],
			'excludes': ['f', 'foo'],
			
			'long': '--the-bar'
		}
	];
	
	cases.forEach(test => {
		const option = new Options.SwitchOption ({
			'names': test.names,
			'property': test.property
		});
		
		const assertion = test.throws
			? t.throws
			: t.doesNotThrow;
			
		let actual;
		assertion.apply(t, [function () {
			actual = adapter.createOption(option, {
				'names': test.excludes || []
			});
		}, test.label]);
		if (!actual) {
			return;
		}
		for (const p of ['long', 'short']) {
			if (test[p]) {
				t.equal (actual[p], test[p], test.label + ' - '+p+' name');
			}
		}
		
	});
	
	t.end ();
});
