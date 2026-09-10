'use strict';

/**
 * @class Input
 * @description Command line parsing result.
 *
 * @property {Array<Object>} commands - A read-only list of all recognized subcommands
 *                                    that the current command handler can delegate to. Each
 *                                    element represents a potential command structure.
 * @property {Object<string, any>} options - A mapping object containing all boolean flags
 *                                         and named options parsed from the command line
 *                                         (e.g., options.verbose, options.configPath).
 * @property {Object} arguments - A structured data representation of all positional
 *                               arguments provided by the user. This structure supports
 *                               access methods by both numerical index and defined semantic names.
 *
 * @property {number} arguments.length - The total, zero-based count of positional arguments
 *                                       that were successfully parsed and received.
 * @property {Iterable<string>} arguments.keys - An iterable (like a Set) containing the
 *                                                semantic names defined for all positional arguments.
 * @property {Array<{name: string, value: any}>} arguments.entries - An iterator yielding pairs
 *                                                             of positional name and the corresponding
 *                                                             values.
 *
 * @example
 * // To access the value of the third positional argument:
 * const thirdValue = input.arguments[2];
 *
 * // To check if the user provided a 'force' flag:
 * if (input.options.force) { ... }
 *
 * @since 1.0.0
 */
export class Input {
	constructor () {
		this.commands = [],
		this.options = {},
		this.arguments = [];
	}
}

export default Input;