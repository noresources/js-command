# Getting Started

## Program Description

The `ProgramBuilder` class is the simplest way to describe a new program with its options, positional arguments, and subcommands.

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
		'names': ['addition', 'add'], // The first name is the main name, others are aliases
		// Options can also be declared here
		'options': [{
			'type': 'switch',
			'names': ['r', 'round'],
			// This name will be used in the Input.options object instead of "round" from names.
			'property': 'roundOperands',
			'documentation': 'Round input numbers before adding'
		}, {
			'type': 'variadic',
			'names': ['exclude', 'x'],
			'documentation': 'Excludes those numbers from allowed input values.',
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

## Writing and Attaching Command Handlers

A command handler is a simple function that receives a unique `Input` argument.
The `Input` class holds the values of all options and positional arguments set on the command line.

Here is the main handler for the program described above.

```javascript
function main (input) {
	// If option.property is not user-defined,
	// The first long option name will be used as the property name for the option.
	if (input.options.verbose) {
		console.log ('This is the main program handler.');
	}
	
	console.log (input.options.messagePrefix, input.arguments[0]);
}
```
See the [CommandHandlerAndMiddlewares](tutorial) tutorial.


## Creating a Commander.js Program

For now, this package does not provide a command line parser by itself. It relies on a well-established parser like [Commander.js](https://www.npmjs.com/package/commander) for parsing.

Converting a `@noresources/command` program to a `Commander.js` command is done with a simple function call.

```javascript
import { createCommand } from '@noresources/command/commander'

const command = createCommand(builder.program);
command.parse ();
```

### Conversion Notes

*   The properties of `input.options` follow `@noresources/command` naming rules.
    *   `Commander.js` always uses the secondary (long) name.
    *   `@noresources/command` uses the name given by `Option.property` or the FIRST long option name.
*   When `input.arguments` is used as an array, it is a plain list of values, whereas `Commander.js` groups all values of the same variadic positional argument into an array. To obtain similar behavior in the `input.arguments` object, the `Positional` declaration must contain a `property` entry. In this case, `input.arguments.thePropertyName` will contain an array of values.