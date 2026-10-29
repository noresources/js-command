'use string';

import {
	ProgramBuilder
}  from '../index.mjs';

import {
	createCommand
} from '../src/commander/adapters.mjs';

// Main command handler
function main (input) {
	// If option.property is not user-defined,
	// The first long option nmae will be used as property name for the option.
	if (input.options.verbose) {
		console.log ('This is the main program handler.');
	}
	
	console.log (input.options.messagePrefix, input.arguments[0]);
}

function addition (input) {
	let value = input.options.initial;
	const operands = [value];
		
	// Use Input.arguments as an array
	for (let a of input.arguments) {
		if (input.options.roundOperands) {
			a = Math.round(a);
		}

		if (Array.isArray (input.options.exclude)) {
			if (input.options.exclude.includes(a)) {
				console.warn ('Skipping', a, 'value. Not allowed.');
				continue;
			}
		}
		
		value += a;
		operands.push (a);
	}
	
	console.log (operands.join(' + '),  '=', value);
}

function dump (input) {
		console.log('Commands');
		input.commands.forEach (c => {
			console.log ('•', c.name);
		});
	
	console.log ('Options');
	for (const [name, value] of Object.entries(input.options) ) {
		console.log('-', name, typeof value, value);
	}
	
	console.log ('Arguments')
	for (const a of input.arguments) {
		console.log ('+', typeof a, a)
	}
	
	const standard = ['commands', 'options', 'arguments'];
	Object.keys (input).forEach (name => {
		if (standard.includes (name)) {
			return;
		}
		console.log (name, input[name]);
	});
}

// 1. Describe the program
const builder = new ProgramBuilder;

builder.name('getting-started')
	.version ('o.1.0')
	.option ({
		'type': 'switch',
		// Basic boolean switch option
		'names': ['v', 'verbose'],
		'documentation': 'Display more stuff.'
	}).option({
		// Single value option
		'type': 'value',
		'names': ['m', 'prefix'],
		// User defined option map property name (see main function)
		'property': 'messagePrefix',
		'default': 'Hello'
	}).positional ({
		'documentation': 'Something'
	}).handler (main) // The main program handler
	.command ({
		'names': ['addition', 'add'], // First name is the main name, others are aliases
		// Options can also be declared here
		'options': [{
			'type': 'switch',
			'names': ['r', 'round'],
			// This name will be used in Input.options object instead of "round" from names.
			'property': 'roundOperands',
			'documentation': 'Round input numbers before adding'
		}, {
			'type': 'variadic',
			'names': ['exclude', 'x'],
			'documentation': 'Excludes those number from allowed input values.',
			'parameters': 'number' // A short way to define parameter constraints
		}]
	}).option ({
		'type': 'value',
		'names': ['initial'],
		'documentation': 'Initial value',
		// "parameter" is singular for single value option and plural for variadic (see above)
		'parameter': 'integer',
		'default': 1
	}).positional ({
		'type': 'variadic',
		'parameters': 'number',
		'documentation': 'All the values to add to initial value.'
	}).handler(addition);
	
builder.command ({
	names: ['foo'],
	'handler': dump
}).command ({
	names: ['bar'],
	'handler': dump
}).command ({
	names: ['baz'],
		'handler': dump
});
	
// 2. Export to Commander.js
	
const command = createCommand(builder.program);
command.parse ();

// 3. Run
// node GettingStarted.mjs "dear coder"
// node GettingStarted.mjs --verbose 'dear coder !'
