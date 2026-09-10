'use strict';

/**
 * @constant {object} Verbosity - Configuration object defining the levels of logging detail.
 * @description This object provides a counter-based system to control how verbose the application should be.
 * It is typically used to increment or check logging levels.
 * @example
 * // Example usage:
 * // let currentVerbosity = Verbosity.default;
 * // if (currentVerbosity >= 1) { console.log("Detailed debug information."); }
 * @property {string} type - The underlying type mechanism ('counter').
 * @property {number} default - The starting default count, typically 0.
 * @property {Array<string>} names - An array of common aliases for this setting (e.g., ['verbosity', 'v']).
 * @type {object}
 */
export const Verbosity = {
	'type': 'counter',
	'documentation': 'Verbosity level',
	'initial': 0,
	'names': ['verbosity', 'v']
};

/**
 * @constant {object} Verbose - Configuration object defining a boolean flag for high detail logging.
 * @description When this flag is active (true), the application should output maximum detail,
 * including debug messages and advanced tracing information.
 * @property {string} type - The underlying type mechanism ('switch').
 * @property {Array<string>} names - An array of common aliases for this setting (e.g., ['verbose', 'v']).
 * @type {object}
 */
export const Verbose = {
	'type': 'switch',
	'documentation': 'Verbose mode',
	'names': ['verbose', 'v']
};

/**
 * @constant {object} Quiet - Configuration object defining a boolean flag to suppress non-essential logging.
 * @description When this flag is active (true), the application should run in minimal output mode.
 * This setting is used to silence routine messages, only showing critical errors.
 * @property {string} type - The underlying type mechanism ('switch').
 * @property {Array<string>} names - An array of common aliases for this setting (e.g., ['quiet', 'q']).
 * @type {object}
 */
export const Quiet = {
	'type': 'switch',
	'documentation': 'Quiet mode',
	'names': ['quiet', 'q']
};

export default {
	Verbosity,
	Verbose,
	Quiet
};