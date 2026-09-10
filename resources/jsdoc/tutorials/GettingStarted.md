# Getting Started

## Describe program

The {ProgramBuilder} class is the simplest way to describe a new program with its options, positional arguments and sub commands.

```javascript
import { ProgramBuilder } from "@noresources/command"

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
	
```

## Writing and attaching command handlers

A  command handler is a simple function that will receive a unique {Input} argument.
The {Input} class hods the values of all options and positional arguments set on the command line.

Here is the main handler of the program described above.

```javascript
function main (input) {
	// If option.property is not user-defined,
	// The first long option nmae will be used as property name for the option.
	if (input.options.verbose) {
		console.log ('This is the main program handler.');
	}
	
	console.log (input.options.messagePrefix, input.arguments[0]);
}
```

## Create Commander.js program

For now, this package does not provide a command line parser by itself. It relies on well established parser [Commander.js](https://www.npmjs.com/package/commander)a to for parsing. 

Converting a `@noresources/command` program to a `Commander.js` command is made with a simple function call.

```javascript
import {	createCommand } from '@noresources/command/commander'

const command = createCommand(builder.program);
command.parse ();
``` 

### Conversion notes

* `input.options` properties follows `@noresources/command` naming rules.
	* `Commander.js` always use the secondary (long) name
	* `@noresources/command` uses the name given by `Option.property` or the FIRST long option name.
* `input.arguments` used as an array is a plain list of values whereas `Commander.js` groups all values of a same variadic positional argument to an array.
		To obtain a similar behavior in the `input.arguments` object, the {Positional} declaration must contain a `property` entry. In this case, `input.arguments.thePropertyName` will contain an array of values.

