# @noresources/command

A lightweight command line interface definition package focusing on reusability, extensibility and a clean API.

## Installation

```
npm install --save @noresources/command
```

## Features

* Plain object based command component descriptors
	* Program
	* Command, subcommands
	* Option
	* Positional
	* Parameter (option and positional argument value type)
* Chain-based program builder API
* Exporter to well-known command packages
	* [Commander.js](https://github.com/tj/commander.js/)

## Examples

### Component descriptors

Commands, options and positional arguments can be declared using a simple plain javascript object.

```javascript
export const Verbosity = {
	'type': 'counter',
	'documentation': 'Verbosity level',
	'initial': 0,
	'names': ['verbosity', 'v']
};
```

Then, a factory function will creates the correct class instance.

```javascript
import { createOption } from "@noresources/command"
const option = createOption(Verbosity);
```
### Builder API

The `ProgramBuilder` class provides a fluent interface to define the whole program interface using method chaining.

```javascript
import { ProgramBuilder } from "@noresources/command"

const builder = new ProgramBuilder;
builder.name('chatbot')
	.version('1.2.3')
	.option(Verbosity) // out option descriptor presented above.
	.positional({
		documentation: 'Some text to insert in conversation'
	}).handler(function (input) {
			if (input.options.verbosity > 2) console.log('Bark bark')
			if (input.arguments.length)
				console.log (input.arguments[0])
			console.log ('This program is not really meaningful'),
	})
```
### Exporter to commander.js

For now, this package does not provide a command line parser by itself. It relies on well established parser [Commander.js](https://www.npmjs.com/package/commander)a to for parsing. 

Converting a `@noresources/command` program to a `Commander.js` command is made with a simple function call.

```javascript
import {	createCommand } from '@noresources/command/commander'

const command = createCommand(builder.program); // assuming builder is the ProgramBuilder instance defined above.
command.parse ();
``` 
Note that the `commander` package is not included in `@noresources/command` package dependencies. You have to install it manually to usie this feature.

