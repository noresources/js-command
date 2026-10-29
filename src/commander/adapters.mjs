'use strict';

/**
 * @file Commander.js adapter functions
 */

import {
	toCamelCase
} from '@noresources/core';
import {
	Command,
	Program
} from '../Command.mjs';
import {
	OPTION_TYPE
} from '../Options.mjs';
import {
	Input
} from '../Input.mjs';
import {
	createPositionalArgumentResult,
	POSITIONAL_TYPE
} from '../Positionals.mjs';

import * as commander from 'commander';

function copyContext (context) {
	const ctx = {
		'names': [],
		'properties': new Map(),
		'commands': []
	};
	
	if (context.names) {
		context.names.forEach (n => {
			ctx.names.push(n);
		});
	}
	
	if (context.properties) {
		for (const [n, v] of context.properties.entries()) {
			ctx.properties.set (n, v);
		}
	}
	
	if (context.commands) {
		context.commands.forEach (c => {
			ctx.commands.push(c);
		});
	}
	
	return ctx;
}

/**
 * @description Commander.js command handler adapter.
 * This function is designed to act as the final execution handler for a command.
 * It gathers positional arguments, processes options, and invokes the
 * registered handler function, passing a fully populated Input object.
 * @function commandHandler
 * @returns {number} The result of the handler invocation, typically used as the process exit code.
 * @throws {Error} Throws an error if unexpected positional arguments are encountered.
 */
function commandHandler() {
	const input = new Input;
	const array = Array.from (arguments);
	const cmd = array.pop();
	/* options */ array.pop();
	const options = cmd.optsWithGlobals();

	let command = this.context;
	if (array.length) 	 {
		const positionals = command.positionals;
		if (!positionals) {
			/**
			 * @todo Better message
			 */
			throw new Error ('Unexpected positional argument(s)');
		}

		const dispatched = [];
		for (let i = 0; i < Math.min(positionals.length, array.length); ++i) {
			const p = positionals[i];
			let a = array[i];
			
			if (p.type == POSITIONAL_TYPE.VALUE) {
				a = p.parse (a);
			} else if (p.type == POSITIONAL_TYPE.VARIADIC) {
				if (!Array.isArray(a)) {
					throw new Error ('Array expected');
				}
				a = a.map(v => p.parse(v));
			}
			
			dispatched.push ({
				'property': p.property,
				'values': Array.isArray(a) ? a : [a]
			});
		}
		input.arguments = createPositionalArgumentResult(positionals, dispatched, {
			'dispatched': true
		});
	}

	if (Array.isArray (this.commands)) {
		this.commands.forEach (a => input.commands.push (a));
	} else if (this.command) {
		input.commands.push(this.command);
	}

	for (const e of Object.entries (options)) {
		let [name, value] = e;
		const option = this.options.get (name);
		name = option.property;

		if (option.type == OPTION_TYPE.VARIADIC) {
			const list = [];
			value.forEach (v => {
				v = option.parse (v);
				list.push(v);
			});
			value = list;
		} else {
			value = option.parse (value);
		}

		input.options[name] = value;
	}

	const contextArg = this.context || {};
	return this.handler.apply (contextArg, [input]);
}

/**
 * @description Determines the display names (short, long, alternate) for a given option
 *              while ensuring no internal naming conflicts exist.
 * @param {Option} option The option object whose names need to be resolved.
 * @param {Array<string>} excludes A list of names that should not be used due to prior conflicts.
 * @returns {Array<string>} An array containing the usable, resolved names for the option.
 */
export function selectOptionNames (option, excludes) {
	let short;
	let long;
	let alt;
	const names = [];

	for (const n of option.names) {
		if (excludes.includes(n)) {
			continue;
		}
		if (n.length > 1) {
			if (!long) {
				long = n;
				continue;
			}

			if (!alt) {
				alt = n;
				continue;
			}

			continue;

		}

		if (short) {
			continue;
		}

		short = n;
	}
	if (short) {
		names.push(short);
	}
	if (long) {
		names.push(long);
	}

	if (alt && names.length < 2) {
		names.push (alt);
	}
	return names;
}

/**
 * @description Constructs the standard '--name' or '-n' declaration string for a given option,
 *              including parameter declarations for required or optional arguments.
 * @param {Option} option The option object defining the parameter structure.
 * @param {Array<string>} names A list of resolved names for the option (e.g., ['o', 'output']).
 * @returns {string} The complete CLI parameter declaration line (e.g., "--output <value>" or "output [...]").
 */
export function buildOptionLine(option, names) {
	let line = names.map (n => {
		return ((n.length == 1) ? '-' : '--') + n;
	}).join(', ');

	if (option.type == OPTION_TYPE.VALUE) {
		line += ' ' + buildParameterDeclaration(option.parameter, {
			'required': option.require
		});
	} else if (option.type == OPTION_TYPE.VARIADIC) {
		line += ' ' + buildParameterDeclaration(option.parameters, {
			'multiple': true,
			'required': option.required
		});
	}
	return line;
}

/**
 * @description Builds the formal parameter declaration string (e.g., 'value', '<value>', or '[value]')
 * @param {Parameter} parameter The parameter definition object.
 * @param {object} options The options object containing metadata about how the parameter should be rendered.
 * @param {boolean} [options.multiple] - Flag indicating if the argument can accept multiple values (...).
 * @returns {string} The formatted declaration string ready to be appended to the command line argument list.
 */
export function buildParameterDeclaration (parameter, options) {
	let declaration = options.name
		|| (parameter && (parameter.hint || parameter.type))
		|| 'value';


	if (options.multiple) {
		declaration += '...';
	}
	if (options.required) {
		declaration = '<' + declaration + '>';
	} else {
		declaration = '[' + declaration + ']';
	}

	return declaration;
}

/**
 * @description Creates a fully configured commander.Option object from a resource-defined Option.
 *              This function ensures correct naming conventions and property mapping before instantiation.
 * @param {Option} option The internal Option object to convert and use.
 * @param {object} context The context containing necessary state, such as existing name mappings.
 * @param {Array<string>} [context.names] - A list of option names already consumed by other options during the current build phase.
 * @param {Map<string, Option>} [context.properties] - A map tracking the conversion from commander property names back to the Option object.
 * @returns {commander.Option} A ready-to-use commander.js Option instance, complete with arguments and defaults.
 * @throws {commander.Error} Throws if the option cannot be assigned a unique name.
 */
export function createOption (option, context) {
	if (!context) {
		context = {};
	}
	const excludes = Array.isArray(context.names) ? context.names : [];
	const names = selectOptionNames(option, excludes);
	if (names.length == 0) {
		throw new commander.Error('Missing or conflicting option names');
	}

	const longName = names[names.length - 1];
	const commanderProperty = (longName.length > 1)
		? toCamelCase(longName)
		: longName;
	if (!(context.properties instanceof Map)) {
		context.properties = new Map;
	}
	context.properties.set (commanderProperty, option);

	names.forEach(n => {
		excludes.push (n);
	});
	if (!context.names) {
		context.names = excludes;
	}

	const line = buildOptionLine(option, names);

	let description = '';
	if (option.documentation) {
		description = option.documentation.toString();
	}

	const co = new commander.Option (line, description);
	if (option.required === true) {
		co.required = true;
	}
	if (typeof option.default !== 'undefined') {
		co.default (option.default);
	}
	return co;
}

/**
 * @description Creates a commander.Argument object from a resource-defined Positional argument.
 *              This handles both simple value arguments and variadic argument lists.
 * @param {Positional} positional The internal Positional argument definition object.
 * @returns {commander.Argument} A fully configured commander.js Argument instance.
 */
export function createPositional (positional) {
	let declaration;
	if (positional.type == POSITIONAL_TYPE.VALUE) {
		declaration = buildParameterDeclaration(positional.parameter, {
			'name': positional.name,
			'required': positional.required
		});
	} else if (positional.type == POSITIONAL_TYPE.VARIADIC) {
		declaration = buildParameterDeclaration(positional.parameters, {
			'multiple': true,
			'name': positional.name,
			'required': positional.required
		});
	}
	let description = '';
	if (positional.documentation) {
		description = positional.documentation.toString();
	}
	const a = new commander.Argument (declaration, description, positional.default);
	return a;
}


/**
 * @description Creates a complete commander.Command object from a resource-defined Command structure.
 *              This orchestrates the adding of options, positional arguments, and nested commands.
 * @param {Command} command The internal Command object that defines the command's structure.
 * @param {object} context The shared context required for building child commands and options.
 * @returns {object} The resulting commander.js Command instance.
 */
export function createCommand (command, context) {
	if (!(typeof context == 'object' && context)) {
		context = {
			'commands': []
		};
	}
	
	context.commands.push(command);
	
	const cmd = new commander.Command ();
	cmd.name (command.name);
	if (command instanceof Command) {
		cmd.aliases (command.aliases);
	} else if (command instanceof Program) {
		cmd.version (command.version);
	}

	if (command.documentation) {
		cmd.description (command.documentation.toString());
	}

	command.options.forEach (o => {
		cmd.addOption (createOption(o, context));
	});

	command.positionals.forEach(a => {
		cmd.addArgument( createPositional(a) );
	});

	command.commands.forEach (c => {
		const ctx = copyContext (context);
		cmd.addCommand( createCommand(c, ctx) );
	});


	const handler = command.handler;
	if (typeof handler === 'function') {
		const ctx = {
			'context': command,
			handler,
			'options': context.properties,
			'commands': context.commands
		};
		cmd.action (commandHandler.bind (ctx));
	}

	return cmd;
}

export default {
	createCommand,
	createOption,
	createPositional
};