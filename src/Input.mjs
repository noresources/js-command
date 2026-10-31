'use strict';

import {
	PositionalArgumentContainer
} from './Positionals.mjs';

/**
 * @class Input
 *
 * @description Command line parsing result.
 *
 * @property {Array<CommandBase>} commands - List of parent and target command. The first element of the list should be the main {Program}. The last element is the targetted {CommandBase}.
 * @property {object} options - Combined options map.
 * @property {Proxy<PositionalArgumentContainer>} arguments - Targetted {CommandBase} positional arguments.
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
		this.arguments = (new PositionalArgumentContainer).createProxy;
	}
}

export default Input;