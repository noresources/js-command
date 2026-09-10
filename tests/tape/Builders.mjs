'use strict';

import { test } from 'tape';
import { CommandBuilder, ProgramBuilder } from '../../src/Builders.mjs';

test ('Command', function (t) {
	
	const cb = new CommandBuilder;
	let c;
	
	t.equal (typeof cb.object, 'object', 'command property');
	t.equal (cb.object.constructor.name, 'Command', 'command property type');
	t.equal (cb.object.names.length, 0, 'No names');
	
	cb.aliases ('bar', 'baz')
		.name('foo');
	c = cb.object;
	t.equal (c.names.length, 3, 'Names and aliases count');
	t.same (c.names, ['foo', 'bar', 'baz'], 'Names');
	t.equal (c.name, 'foo', 'Main name');
	t.same (c.aliases, ['bar', 'baz'], 'Aliases');
	
	
	cb.option ({
		'type': 'value',
		'names': ['port', 'p'],
		'parameter': 'number'
	}).positional ({
		/* automatic type = value */
	}).positional ({
		'min': 2
	});
	
	c = cb.object;
	
	t.equal (c.options.length, 1, 'Number of options');
	t.equal (c.positionals.length, 2, 'Number of positional arguments');
	
	const a = c.positionals[0];
	t.equal(typeof a, 'object', 'First positional argument');
	t.equal (a.constructor.name, 'PositionalValue', 'First positional argument is a PositionalValue');
	
	const b = c.positionals[1];
	t.equal (b.constructor.name, 'PositionalVariadic', 'Second positional argument is variadic');
	
	t.end();
});

test ('Program', function(t) {
	const pb = new ProgramBuilder;
	pb.version ('1.2.3');
	
	t.equal (typeof pb.program, 'object', 'program property');
	
	const p = pb.program;
	t.equal (p.constructor.name, 'Program', 'program property class');
		
	t.equal (p.version, '1.2.3', 'Program version');
	
	t.end();
});
