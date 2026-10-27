'use strict';

import {
	transformParameterProperty
} from './utilities.mjs';

import {
	merge,
	toCamelCase,
	isTraversable,
	assertType,
	assertTypes
} from '@noresources/core';

import {
	createDocumentation
} from './Documentation.mjs';

import {
	Parameter
} from './Parameters.mjs';


/**
 * @typedef {Object.<string, string>} OptionTypeMap
 *
 * @description Defines all recognized, predefined.
 *
 * types for command line options.
 * @readonly
 */
export const OPTION_TYPE = {
	/**
	 * @type {string}
	 * @description Represents the 'SWITCH' type.
	 * Used for boolean flags; true if present,
	 * false if absent.
	 */
	'SWITCH': 'switch',
	/**
	 * @type {string}
 * @description Represents the 'COUNTER' type.
	 * Used for options whose values should be incremented
	 * during parsing.
	 */
	'COUNTER': 'counter',
	/**
	 * @type {string}
	 * @description Represents the 'VALUE' type.
	 * Used for options requiring exactly one argument.
	 */
	'VALUE': 'value',
	/**
	 * @type {string}
 * @description Represents the 'VARIADIC' type.
	 * Used for options accepting zero or more arguments.
	 */
	'VARIADIC': 'variadic'
};


/**
 * @class Option
 *
 * @abstract
 * @description The base class for all command line
 * option types. It provides the common interface and
 * state management (like names, required status)
 * that all specialized option classes must inherit.
 */
export class Option {
	/**
	 * Creates an instance of Option. Initializes the
	 * base properties required for any option type.
	 *
	 * @param {Object} options - A configuration object.
	 * @param {string} options.property - The canonical
	 * name property TO USE in A COMMAND LINE PARSING RESULT OBJECT.
	 * @PARAM ôARRAY<STRING> [OPTIONS.NAME] - AN ARRAY OF NAMES THAT CAN BE USED IN THE COMMAND LINE TO REPRESENT THE OPTION.
	 * @param {boolean} [options.required] - A flag
	 * indicating if the option must be present.
	 *
	 * @throws {Error} If required types within options
	 * are invalid (e.g., property is not a string).
	 */
	constructor (options) {
		if ( ! (typeof options === 'object' && options)) {
			options = {};
		}

		assertTypes(options.property, ['string', 'undefined'], 'options.property');
		this.property = options.property;

		if (typeof options.documentation !== 'undefined') {
			this.documentation = options.documentation;
		}

		this._names = [];
		if (isTraversable(options.names)) {
			for (const name of options.names) {
				assertType(name, 'string', 'options.names[]');
				this._names.push (name);
			}
		}

		this.required = options.required ? true : false;
	}

	/**
	 * @returns {string} The constant identifier for
	 * this option's type.
	 * @throws {Error} Always throws, as subclasses
	 * are required to implement this getter.
	 */
	get type () {
		throw new Error (this.constructor.name + ' must override type getter.');
	}

	/**
	 * @returns {Array<string>} An immutable array
	 * containing all possible names (flags).
	 */
	get names () {
		return this._names;
	}

	/**
	 * @returns {string} The standardized property name.
	 * This name is determined by properties set during
	 * construction, falling back to flag names.
	 */
	get property () {
		if (typeof this._property == 'string') {
			return this._property;
		}
		let fallback;
		for (const n of this._names) {
			if (n.length > 1) {
				return toCamelCase(n);
			}
			if (!fallback) {
				fallback = n;
			}
		}

		return fallback;
	}

	/**
	 * Programmatically sets the property name.
	 *
	 * @param {string} value - The desired property name.
	 * @throws {Error} If the provided value is not a string.
	 */
	set property (value) {
		assertTypes(value, ['string', 'undefined'], 'value');
		this._property = value;
	}

	
	/**
	 * Gets the option {Documentation} object.
	 *
	 * @returns {Documentation}
	 */
	get documentation () {
		return this._documentation;
	}

	/**
	 * Sets the option documentation.
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

	/**
	 * Coerces the raw input value into the correct data
	 * type and validates it against the option's rules.
	 *
	 * @param {mixed} value - The raw value supplied by the
	 * command line parser.
	 * @returns {mixed} The coerced and validated value.
	 */
	parse (value) {
		return value;
	}
}

/**
 * @class SwitchOption
 * @extends {Option}
 * @description Represents a simple boolean flag. When
 * this option is encountered, the associated value is
 * strictly a boolean: true if present, false if absent.
 * This is the standard mechanism for flags like
 * `--verbose` or `--dry-run`.
 */
export class SwitchOption extends Option {
	/**
	 * Creates a SwitchOption instance.
	 *
	 * @param {Object} options - Configuration options
	 * passed to the base Option class.
	 * @constructor
	 */
	constructor (options) {
		super (options);
	}

	/**
	 * @returns {string} The constant representing the
	 * SWITCH type.
	 */
	get type() {
		return OPTION_TYPE.SWITCH;
	}

	/**
	 * Executes the parsing logic for a Switch option.
	 * It converts the presence of the flag into a boolean.
	 *
	 * @param {mixed} value - The raw input value (typically
	 * a truthy value if present).
	 * @returns {boolean} True if the flag was provided,
	 * false otherwise.
	 */
	parse (value) {
		return value ? true : false;
	}
}

/**
 * @class CounterOption
 * @extends {Option}
 * @description Represents a numeric counter. This
 * option tracks recurrence; the value is incremented
 * each time the option is used. Common usage is
 * for tracking options like `--port` or `--retries`.
 *
 * @param {Object} options - Configuration object.
 * @param {number} [options.initial=0] - The starting
 * integer value before any arguments are processed.
 *
 * @throws {Error} If the `initial` value provided
 * is not a number.
 */
export class CounterOption extends Option {
	/**
	 * Creates a CounterOption instance.
	 *
	 * @param {Object} options - Configuration object.
	 * @constructor
	 */
	constructor (options) {
		options = merge ({
			'initial': 0
		}, options);

		assertType(options.initial, 'number', 'options.initial');

		super (options);
		this.initial = options.initial;
	}

	/**
	 * @returns {string} The constant representing the
	 * COUNTER type.
	 */
	get type () {
		return OPTION_TYPE.COUNTER;
	}

	/**
	 * Parses the input value, ensuring it is a valid
	 * integer.
	 *
	 * @param {mixed} value - The raw string input from
	 * the command line argument.
	 * @returns {number} The integer value parsed from the input.
	 * @throws {Error} If the provided value cannot be
	 * successfully parsed into an integer.
	 */
	parse (value) {
		value = parseInt (value);
		if (isNaN(value)) {
			throw new Error ('Could not convert value to integer');
		}
		return value;
	}
}

/**
 * @class ValueOption
 * @extends {Option}
 * @description Represents a standard option requiring
 * one mandatory associated value. This option relies on
 * a separate {@link Parameter} descriptor to manage data
 * type, validation rules, and coercion logic for the value.
 *
 * @param {Object} options - Configuration object.
 * @param {Parameter} options.parameter - The required
 * descriptor instance defining the value's structure.
 *
 * @throws {Error} If the `parameter` descriptor is missing
 * or is not a valid Parameter object.
 */
export class ValueOption extends Option {
	/**
	 * Creates a ValueOption instance.
	 *
	 * @param {Object} options - The configuration object.
	 * @param {mixed} [options.default=undefined] - An optional
	 * default value to use if the option is not provided.
	 * @param {Parameter} [options.parameters] - The parameter
	 * descriptor, used to validate and coerce the input value.
	 *
	 * @throws {Error} If the `parameter` descriptor is missing.
	 */
	constructor (options) {
		options = merge({
			//'defaul': undefined,
			//'parameter': undefined
		}, options);

		assertTypes(options.parameter, ['undefined', Parameter], 'options.parameter');

		super (options);
		this.default = options.default;
		this.parameter = options.parameter;
	}

	/**
	 * @returns {string} The constant representing the VALUE type.
	 */
	get type() {
		return OPTION_TYPE.VALUE;
	}

	/**
	 * Executes the parsing logic. The value is coerced
	 * and then validated against the associated
	 * Parameter descriptor.
	 *
	 * @param {mixed} value - The raw value provided by
	 * the command line.
	 * @returns {mixed} The fully coerced and validated value.
	 */
	parse (value) {
		if (!(this.parameter instanceof Parameter)) {
			return value;
		}
		value = this.parameter.coerce (value);
		this.parameter.validate(value);
		return value;
	}
}

/**
 * @class VariadicOption
 * @extends {Option}
 * @description Represents an option capable of accepting
 * a variable number of associated values (a list). This
 * mechanism is designed to collect multiple inputs
 * (like filenames or paths) into a single array.
 *
 * @param {Object} options - Configuration object.
 * @param {number} [options.min=0] - The minimum number
 * of values that must be provided. Must be 0 or greater.
 * @param {Parameter} [options.parameters] - The descriptor
 * defining the type and validation rules for each element.
 *
 * @throws {Error} If the `parameters` descriptor is
 * missing or is not a valid Parameter object.
 */
export class VariadicOption extends Option {
	/**
	 * Creates a VariadicOption instance.
	 *
	 * @param {Object} options - Configuration object.
	 * @constructor
	 */
	constructor (options) {
		options = merge ({
			'min': 0
		}, options);

		assertType(options.min, 'number', 'options.min');
		assertTypes (options.parameters, ['undefined', Parameter], 'options.parameters');

		super (options);
		this.min = options.min;
		this.parameters = options.parameters;
	}

	/**
	 * @returns {string} The constant representing the
	 * VARIADIC type.
	 */
	get type () {
		return OPTION_TYPE.VARIADIC;
	}

	/**
	 * Parses the input values, collecting them and
	 * ensuring each value adheres to the rules defined
	 * in the Parameter descriptor.
	 *
	 * @param {Array<mixed>} value - The array of raw values
	 * provided by the command line.
	 * @returns {Array<mixed>} The array of values after
	 * successful coercion and validation.
	 */
	parse (value) {
		if (!(this.parameters instanceof Parameter)) {
			return value;
		}
		value = this.parameters.coerce (value);
		this.parameters.validate(value);
		return value;
	}
}

function autodetectType (options) {
	const mapping = [
		['parameters', OPTION_TYPE.VARIADIC],
		['parameter', OPTION_TYPE.VALUE],
		['initial', OPTION_TYPE.COUNTER],
		['default', OPTION_TYPE.VALUE],
		['min', OPTION_TYPE.VARIADIC],
		['max', OPTION_TYPE.VARIADIC]
	];
	
	let t;
	for (const m of mapping) {
		const [name, type] = m;
		if (typeof options[name] !== 'undefined') {
			if (typeof t === 'string' && (t != type)) {
				throw new Error ('Ambiguous option descriptor. Could be ' + t + ' or ' + type);
			}
			t = type;
		}
	}
	
	return t || OPTION_TYPE.SWITCH;
}

/**
 * @function createOption
 * @description A factory function that creates and
 * configures the appropriate option instance based on
 * the provided type and configuration. This handles the
 * runtime instantiation of Option subclasses.
 *
 * @param {(string|Object)} type - The type of option
 * to create. This can be a raw string constant
 * (e.g., 'switch') or a configuration object.
 * @param {Object} [options] - Optional configuration
 * object, containing settings for the option's
 * behavior (e.g., names, required status).
 *
 * @returns {SwitchOption|CounterOption|ValueOption|VariadicOption}
 * A fully initialized and configured option instance.
 *
 * @throws {Error} If the provided option type is
 * unrecognized or unsupported by this factory.
 */
export function createOption () {
	let type = arguments[0];
	let options = arguments[1] || {};

	if (typeof type === 'object') {
		options = type;
		type = options.type;
	}

	if (typeof type !== 'string') {
		type = autodetectType(options || {});
	}
	
	switch (type) {
	case OPTION_TYPE.SWITCH: return new SwitchOption (options);
	case OPTION_TYPE.COUNTER: return new CounterOption(options);
	case OPTION_TYPE.VALUE: {
		transformParameterProperty.apply (this, [options, 'parameter']);
		return new ValueOption (options);
	}
	case OPTION_TYPE.VARIADIC: {
		transformParameterProperty.apply (this, [options, 'parameters']);
		return new VariadicOption(options);
	}
	default:
		throw new Error ('Invalid option type: ' + type);
	}
}

export default {
	OPTION_TYPE,
	Option,
	SwitchOption,
	CounterOption,
	ValueOption,
	VariadicOption,
	createOption
};