'use strict';

import {
	merge
} from '@noresources/core';

import {
	createOption,
	Option
} from './Options.mjs';

import {
	Parameter,
	createParameter
} from './Parameters.mjs';

import {
	createPositional,
	Positional,
	PositionalValue
} from './Positionals.mjs';

import {
	Command,
	Program
} from './Command.mjs';


/**
 * Internal function to process and register a command descriptor with the builder.
 * This method abstracts the logic of determining if the input is a Command object
 * or a raw descriptor object before adding it to the builder's structure.
 * @param {CommandBaseBuilder} builder - The CommandBuilder instance managing the current context.
 * @param {object} descriptor - The raw or instantiated command definition object.
 * @private
 */
function addCommand (builder, descriptor) {
	let c;
	let b;
	if (descriptor instanceof Command) {
		c = descriptor;
		b = new CommandBuilder(c, builder.parent);
	} else {
		const argument = merge ({}, descriptor);

		delete argument.options;
		delete argument.positionals;
		delete argument.commands;

		c = new Command(argument);
		b = new CommandBuilder(c, builder.parent);

		if ( Array.isArray(descriptor.options) ) {
			for (const o of descriptor.options) {
				addOption(b, o);
			}
		}

		if ( Array.isArray(descriptor.positionals) ) {
			for (const p of descriptor.positionals) {
				addParameter(b, p);
			}
		}

		if ( Array.isArray(descriptor.commands) ) {
			for (const cd of descriptor.commands) {
				addCommand(b, cd);
			}
		}

	}
	builder._object.commands.push (c);
	builder._commands.push (b);
	return b;
}

function addOption (builder, descriptor) {
	const o = (descriptor instanceof Option)
		? descriptor
		: builder.optionFactory(descriptor);
	builder._object.options.push (o);
}

function addParameter (builder, descriptor) {
	let p;
	if (descriptor instanceof Parameter) {
		descriptor = new PositionalValue({
			'parameter': descriptor
		});
	}

	p = (descriptor instanceof Positional)
		? descriptor
		: builder.positionalFactory(descriptor);

	builder._object.positionals.push (p);
}

/**
 * @class CommandBaseBuilder
 * @description Base class providing common chaining methods (like `command`, `option`, `positional`)
 * and property accessors for command structures. It is designed to be extended by
 * `CommandBuilder` or `ProgramBuilder` to define specific program or command behavior.
 * @property {object} _object - The underlying representation (Command or Program) being configured.
 * @property {Array<CommandBuilder|ProgramBuilder>} _commands - Internal array tracking child builders.
 */
class CommandBaseBuilder {
	/**
	 * @constructor
	 * @param {object} object - The root data structure (e.g., Command object) that this builder is manipulating.
	 */
	constructor(object) {
		this._object = object;
		this._commands = [];
	}


	/**
	 * @command
	 * @description Attaches a new command definition to the current builder's context.
	 * This method allows for the creation of nested commands (subcommands) within the current scope.
	 * @param {Command | object} descriptor - The definition of the new command. This can be a fully
	 * instantiated Command object or a raw configuration object containing options, positionals, and subcommands.
	 * @returns {CommandBuilder} A new instance of the builder specifically for the newly created subcommand, allowing for further configuration chaining.
 */
	command (descriptor) {
		return addCommand(this, descriptor);
	}

	/**
	 * @option
	 * @description Configures and registers an option (flag or argument) on the current command definition.
	 * Options define optional arguments that the command can consume.
	 * @param {object} descriptor - The option definition object. This object dictates the name, type, and optionality of the argument.
	 * @returns {CommandBaseBuilder} The current instance of the builder, enabling method chaining.
	 */
	option (descriptor) {
		addOption(this, descriptor);
		return this;
	}

	/**
	 * @positional
	 * @description Configures and registers a required positional parameter for the current command.
	 * Positional parameters are arguments provided by the user that do not have a name (e.g., file names in 'git checkout <file>').
	 * @param {object} descriptor - The positional parameter definition. This defines constraints like type or description.
	 * @returns {CommandBaseBuilder} The current instance of the builder, enabling method chaining.
	 */
	positional (descriptor) {
		addParameter(this, descriptor);
		return this;
	}

	/**
	 * @handler
	 * @description Sets the primary execution handler for this command structure.
	 * This function will be invoked by the runtime when the command is executed.
	 * @param {function(object): void} callback - The callback function that receives the parsed arguments/context and performs the core logic. It is expected to not return a value.
	* @returns {CommandBaseBuilder} The current builder instance, allowing for method chaining.
	 * @notes If the handler is set, it provides the final action for this command chain.
	 */
	handler (callback) {
		this._object.handler = callback;
		return this;
	}

	/**
	 * @property {function(): function} parameterFactory
	 * @description The function used internally to create Parameter objects.
	 * @returns {function} The parameter creation function.
	 */
	get parameterFactory () {
		return this._parameterFactory || createParameter;
	}

	/**
	 * @property {function(): function} optionFactory
	 * @description The function used internally to create Option objects.
	 * @returns {function} The option creation function.
	 */
	get optionFactory () {
		return this._optionFactory;
	}

	/**
	 * @property {function(): function} positionalFactory
	 * @description The function used internally to create PositionalValue objects.
	 * @returns {function} The positional value creation function.
	 */
	get positionalFactory () {
		return this._positionalFactory;
	}

	/**
	 * @setter
	 * @description Overrides the default parameter creation mechanism, allowing advanced customization of parameter behavior.
	 * @param {function} parameterFactory - The custom function to be used by the builder to construct parameters.
	 * @throws {Error} If the provided `parameterFactory` is not a function.
	 */
	set parameterFactory (parameterFactory) {
		if (typeof parameterFactory !== 'function') {
			throw new Error ('Invalid parameter factory. Parameter is not a function');
		}
		this._parameterFactory = parameterFactory;
		const thisArg = {parameterFactory};
		this._optionFactory = createOption.bind (thisArg);
		this._positionalFactory = createPositional.bind(thisArg);
	}
}

/**
 * @class CommandBuilder
 * @extends CommandBaseBuilder
 * @description Represents a single, specific command within the overall application structure.
 * This builder manages the configuration (name, aliases, options, subcommands) of one command
 * and provides the interface to manipulate it before it is instantiated.
 */
export class CommandBuilder extends CommandBaseBuilder {
	/**
	 * @constructor
	 * @param {Command | CommandBuilder | ProgramBuilder} command - The existing Command or builder object this context is operating on.
	 * @param {CommandBuilder|ProgramBuilder} parent - The parent builder context that contains this command.
	 * @description Initializes the command builder. The parent reference is critical for hierarchical traversal (e.g., finding the root Program).
	 */
	constructor (command, parent) {
		super (command || new Command );
		this._parent = parent;
		this.parameterFactory = (parent)
			? (parent.parameterFactory || createParameter)
			: createParameter;

	}

	/**
	 * @property {Command} object
	 * @description Getter that exposes the underlying Command object that this builder is configuring.
	 * @returns {Command} The actual Command instance, allowing inspection or modification of its state.
	 */
	get object () {
		return this._object;
	}

	/**
	 * @property {ProgramBuilder|null} program
	 * @description Traverses up the chain of builders (CommandBuilder -> ProgramBuilder) to locate the root ProgramBuilder.
	 * @returns {ProgramBuilder|null} The root ProgramBuilder instance, or null if the command has no ancestor program.
	 */
	get program () {
		let p = this.parent;
		while (p && p.parent) {
			p = p.parent;
		}
		return p;
	}

	/**
	 * @property {CommandBuilder|ProgramBuilder|null} parent
	 * @description Getter that provides a reference to the immediate parent builder in the hierarchy.
	 * @returns {CommandBuilder|ProgramBuilder|null} The parent builder instance, used for traversing up the command structure.
	 */
	get parent () {
		return this._parent;
	}

	/**
	 * @description Sets the main executable name for this command. If a command with this name already exists, it will be overwritten.
	 * @param {string} name - The desired, primary name for this command.
	 * @returns {CommandBuilder} The current CommandBuilder instance, facilitating method chaining.
	 * @throws {Error} Throws an error if the provided name is not a string or is an empty string.
	 */
	name (name) {
		if (typeof name !== 'string') {
			throw new Error ('String expected. Got ' + (typeof name));
		}
		if (name.length == 0) {
			throw new Error ('Invalid empty name');
		}
		const i = this._object.names.indexOf (name);
		if (i == 0) {
			return this;
		}
		if (i > 0) {
			this._object.names.splice(i, 1);
		}
		this._object.names.unshift(name);
		return this;
	}

	/**
	 * @description Adds one or more aliases (alternative keywords) to the command, allowing multiple ways to invoke the same functionality.
	 * @param {...string} aliases - A variable list of alternative names (aliases) that can map to this command.
	* @returns {CommandBuilder} The current CommandBuilder instance, allowing for continuous method calls.
	 * @throws {Error} Throws an error if any provided alias is not a string or is an empty string.
	 */
	aliases () {
		for (const a of arguments) {
			if (Array.isArray(a)) {
				this.aliases(...a);
				continue;
			}
			if (typeof a !== 'string') {
				throw new Error ('String expected. Got ' + (typeof a));
			}
			if (a.length == 0) {
				throw new Error ('Invalid empty name.');
			}
			if (this._object.names.includes (a)) {
				continue;
			}

			this._object.names.push (a);
		}
		return this;
	}


} /* CommandBuilder */

/**
 * @class ProgramBuilder
 * @extends CommandBaseBuilder
 * @description Represents the root configuration object for the entire application.
 * This builder is used to set global properties of the program, such as the name and version.
 */
export class ProgramBuilder extends CommandBaseBuilder {
	/**
	 * @constructor
	 * @description Initializes the ProgramBuilder, setting up the root Program object.
	 */
	constructor () {
		super ( new Program );
		this.parameterFactory = createParameter;
	}

	/**
	 * @property {Program} program
	 * @description Getter that exposes the underlying Program object that this builder is configuring.
	 * @returns {Program} The actual Program instance, representing the application's definition.
	 */
	get program () {
		return this._object;
	}

	/**
	 * @description Sets the main name under which the application is recognized.
	 * @param {string} name - The name of the application program.
	 * @returns {ProgramBuilder} The current ProgramBuilder instance, enabling method chaining.
	 */
	name (name) {
		this._object.name = name;
		return this;
	}

	/**
	 * @description Sets the version number metadata for the program, which is used in version reporting.
	 * @param {number|string} version - The version identifier for the program (e.g., "1.0.0" or 1).
	 * @returns {ProgramBuilder} The current ProgramBuilder instance, allowing for method chaining.
	 */
	version (version) {
		this._object.version = version;
		return this;
	}
} /* Program Builder */

export default {
	CommandBuilder,
	ProgramBuilder
};