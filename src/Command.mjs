'use strict';

/**
 * @file Defines the core structural components for building command-line interface (CLI) applications.
 * This module provides the foundational classes (CommandBase, Command, Program) necessary to manage
 * command hierarchy, configure metadata, and handle command execution logic within a robust JS application.
 * It centralizes the management of command names, aliases, and execution handlers.
 */

import { createDocumentation } from './Documentation.mjs';

/**
 * @class CommandBase
 * @description Provides a foundational base class for defining command structures within the CLI.
 * This base class handles common utilities such as documentation caching, managing command arguments,
 * and attaching specific command execution handlers.
 */
class CommandBase {
	/**
	 * Creates an instance of CommandBase.
	 * @param {object} [options] - Initialization options provided during construction.
	 * @param {object} [options.documentation] - Optional initial, raw documentation string. This string is processed to create the internal documentation object.
	 * @param {function} [options.handler] - The primary function object responsible for handling command execution. This function contains the actual business logic.
	 */
	constructor (options) {
		if (!options) {
			options = {};
		}
		this.documentation = options.documentation;
		this.options = [];
		this.commands = [];
		this.positionals = [];

		if (typeof options.handler === 'function') {
			this.handler = options.handler;
		}
	}

	/**
	 * Gets the command documentation.
	 *
	 * @returns {Documentation}
	 */
	get documentation () {
		return this._documentation;
	}

	/**
	* Sets the command documentation.
	*
	* The input value is normalized to a {Documentation} object.
	*
	* @param {Documentation|string|undefined value - User-defined documentation.
	* 	If undefined, the documentation object is cleared.
	*/
	set documentation (value) {
		if (!value) {
			this._documentation = undefined;
			return;
		}

		this._documentation = createDocumentation(value);
	}
	
	get handler () {
		return this._handler;
	}


	/**
	 * Attaches the primary handler function responsible for executing the command logic.
	 * This handler is the core logic execution entry point that dictates the command's behavior when invoked.
	 * @param {function} handler - The callable function object that encapsulates the complete command execution logic.
	 * @returns {void}
	 * @throws {Error} Throws an Error if the provided 'handler' argument is not a valid function type.
	 */
	set handler (handler) {
		if (typeof handler !== 'function') {
			throw new Error ('Invalid handler argument. A function object is expected.');
		}
		this._handler = handler;
	}
}

/**
 * @class Command
 * @extends {CommandBase}
 * @description Represents a single, executable command unit within the CLI program structure.
 * This class is responsible for defining the command's unique identifier(s), managing aliases,
 * and providing a specialized interface on top of CommandBase.  larger application ecosystem.
 */
export class Command extends CommandBase {
	/**
	 * Creates an instance of Command, setting up its formal primary name and registering callable aliases.
	 * @param {object} options - Command initialization options.
	 * @param {Array<string>} [options.names] - An optional array of names. The first element MUST be the primary command name, while subsequent elements serve as secondary aliases for execution convenience.
	 */
	constructor (options) {
		if (!options) {
			options = {};
		}
		super (options);
		this.names = [];
		if (Array.isArray (options.names)) {
			options.names.forEach(n => {
				this.names.push (n);
			});
		}
	}

	/**
	 * Retrieves the primary, canonical name of the command.
	 * This name is defined by the first element provided during construction and is the primary identifier used for invocation.
	 * @returns {string} The main name used to execute the command (e.g., 'user'). This string cannot be empty.
	 */
	get name () {
		return this.names[0];
	}

	/**
	 * Retrieves an array of recognized aliases for this command.
	 * These are supplementary names that can be used interchangeably with the main command name.
	 * @returns {Array<string>} An array containing all secondary aliases registered for this command. This array may be empty.
	 */
	get aliases () {
		return this.names.slice (1);
	}
}

/**
 * @class Program
 *
 * @extends {CommandBase}
 * @description Represents the root executable container for the entire CLI application.
 * This class establishes the global context of the application, holding critical metadata
 * such as the application name and version. It functions as the primary organizational entry point
 * from which all sub-commands are registered, managed, and ultimately executed.
 */
export class Program extends CommandBase {
	/**
	 * Creates an instance of Program, setting up the global application metadata that defines the CLI interface.
	 * @param {object} [options] - Program configuration options.
	 * @param {string} [options.name] - The official, user-facing name of the entire program (e.g., 'mytool'). This is used in help output.
	 * @param {string} [options.version] - The current, semantic version string of the application (e.g., '1.0.0').
	 */
	constructor (options) {
		if (!options) {
			options = {};
		}
		super (options);
		this.name = (typeof options.name === 'string') ? options.name : 'undefined';
		this.version = (typeof options.version === 'string') ? options.version :  '1.0.0';
	}
}

export default {
	Command,
	Program
};
