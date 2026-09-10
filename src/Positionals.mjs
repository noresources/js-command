'use strict';

/**
 * @file Defines core structures and logic for managing positional arguments
 */

import {
	transformParameterProperty
} from './utilities.mjs';

import {
	Parameter
} from './Parameters.mjs';

import {
	assertType,
	assertTypes,
	merge
} from '@noresources/core';

/**
 * @constant {object} POSITIONAL_TYPE
 * @description A static map containing string constants used globally to identify
 * the semantic type of a positional argument definition, namely whether it
 * represents a single fixed value or a sequence of values.
 * @property {('VALUE'|'VARIADIC')} VALUE - Identifier used for defining a single, fixed-value positional argument.
 * @property {('VALUE'|'VARIADIC')} VARIADIC - Identifier used for defining a variadic positional argument, which accepts zero or more inputs.
 */
export const POSITIONAL_TYPE = {
	'VALUE': 'value',
	'VARIADIC': 'variadic'
};

/**
 * @abstract
 * @class Positional
 * @description Base class providing the fundamental structure for any positional
 * argument within the parsing system. It holds the metadata necessary to map
 * the argument slot to a specific property in the resulting data object.
 *
 * @property {boolean} property - The string identifier corresponding to the property name in the output structure where the value will be stored.
 * @property {number} [min=0] - The minimum number of values that must satisfy this argument's constraints.
 * @property {number} [max=1] - The maximum number of values allowed for this argument (varies by concrete implementation).
 * @param {object} options - Configuration object passed during instantiation.
 */
export class Positional {
	constructor (options) {
		if (!(typeof options === 'object' && options)) {
			options = {};
		}
		this.property = options.property;
	}

	/**
	 * Coerce and validate a raw input value intended for a positional argument slot.
	 * This method delegates the actual transformation to the associated `Parameter` object.
	 * @param {mixed} value - The raw input value provided by the caller.
	 * @returns {mixed} A value that has been successfully coerced and validated against the parameter constraints.
	 */
	parse (value) {
		return value;
	}
}

/**
 * @class PositionalValue
 * @extends Positional
 * @description Represents a single, fixed-slot positional argument. This structure
 * is used when the parsing system is explicitly expected to consume exactly one
 * input value from the command line arguments.
 *
 * @property {Parameter} argument - The underlying type definition (e.g., string, number) that dictates the constraints of the expected single value.
 * @property {*} [default] - The fallback default value assigned to this parameter if no value is provided by the caller and the argument is not required.
 */
export class PositionalValue extends Positional {

	/**
	 * Initializes a new PositionalValue instance, configuring its type constraints and default values.
	 * @param {object} options - The configuration object for the positional argument.
	 * @param {* | undefined} [options.default=undefined] - The default value to assign if the argument is omitted during a function call.
	 * @param {Parameter | undefined} [options.argument=undefined] - The required type definition for the argument, adhering to the `Parameter` class structure.
	 * @throws {Error} If options.argument is not a valid Parameter object.
	 */
	constructor(options) {
		options = merge ({
			//'default': undefined,
			//'required': undefined,
			//'parameter': undefined
		}, options);

		assertTypes (options.parameter, ['undefined', Parameter], 'options.parameter');

		super (options);
		this.default = options.default;
		this.parameter = options.parameter;
		this._required = options.required;
	}

	/**
	 * Gets the predefined type constant for a single, fixed-value positional argument.
	 * @returns {('VALUE'|'VARIADIC')} The constant identifier 'value'.
	 */
	get type () {
		return POSITIONAL_TYPE.VALUE;
	}
	/**
	 * Determines if the positional value must be explicitly provided by the caller.
	 * It considers the argument required if the `_required` flag is set to true, or if no default value has been assigned.
	 * @returns {boolean} True if the value is mandatory (required).
	 */
	get required () {
		if (typeof this._required !== 'undefined') {
			return this._required ? true : false;
		}
		return (typeof this.default === 'undefined');
	}

	/**
	 * Sets the explicit required status of the positional value.
	 * @param {boolean} value - The new required state.
	 */
	set required (value) {
		this._required = value;
	}

	/**
	 * Gets the minimum expected count. For PositionalValue, this is always 1 if required, 0 otherwise.
	 * @returns {number} The minimum number of expected values (1 or 0).
	 */
	get min () {
		return this.required ? 1 : 0;
	}

	/**
	 * Gets the maximum allowed count. For PositionalValue, this is always 1.
	 * @returns {number} The maximum number of allowed values (always 1).
	 */
	get max () {
		return 1;
	}

	/**
	 * Parses and validates the input value against the defined parameter constraints.
	 * @param {mixed} value - The raw value from the input source.
	 * @returns {mixed} The processed and validated value.
	 */
	parse (value) {
		if (!(this.parameter instanceof Parameter)) {
			return value;
		}
		value = this.parameter.coerce(value);
		this.parameter.validate(value);
		return value;
	}
}

/**
 * @class PositionalVariadic
 * @extends Positional
 * @description Represents a variadic positional argument, which allows the parsing
 * system to consume zero or more arguments into a list or array. This structure
 * is essential for handling variable numbers of inputs, such as lists of file paths or names.
 *
 * @property {Parameter} parameters - The underlying type definition that dictates the constraints of the elements within the received arguments array.
 * @property {number} min - The minimum required count of arguments that must be passed (this property is derived from the required state).
 * @property {number} [max] - The maximum number of arguments that are allowed to be consumed.
 */
export class PositionalVariadic extends Positional {
	/**
	 * Initializes a new PositionalVariadic instance.
	 * @param {object} options - Configuration options for the variadic argument.
	 * @param {number} [options.min=0] - The absolute minimum number of values that must be passed for this slot. Must be >= 0.
	 * @param {number} [options.max=undefined] - The maximum number of values that this argument is allowed to accept.
	 * @param {Parameter | undefined} [options.parameters=undefined] - The base type definition used to validate every value collected in this array.
	 * @throws {Error} If options.min is not a number or options.max is not a number.
	 */
	constructor(options) {
		options = merge ({
			'min': 0,
			//'max': undefined,
			//'arguments': undefined
		}, options);

		assertType (options.min, 'number', 'options.min');
		assertTypes(options.max, ['undefined', 'number'], 'options.max');
		assertTypes (options.parameters, ['undefined', Parameter], 'options.parameters');

		super (options);
		this.min = options.min;
		this.max = options.max;
		this.parameters = options.parameters;
	}

	/**
	 * Gets the predefined type constant for a variadic positional argument.
	 * @returns {('VALUE'|'VARIADIC')} The constant identifier 'variadic'.
	 */
	get type () {
		return POSITIONAL_TYPE.VARIADIC;
	}

	/**
	 * Checks if the variadic argument is mandatory.
	 * This is determined by whether the `min` count is greater than zero.
	 * @returns {boolean} True if at least one value is mandatory (min > 0).
	 */
	get required () {
		return this.min > 0;
	}

	/**
	 * Updates the minimum required count for this variadic argument.
	 * @param {boolean} value - If true, sets the minimum to at least 1; if false, sets it to 0.
	 */
	set required (value) {
		if (value) {
			this.min = Math.max(1, this.min);
		} else {
			this.min = 0;
		}
	}

	/**
	 * Parses and validates a raw input value within the context of a variadic argument.
	 * Note: This function typically runs during consumption, not the initial parsing phase.
	 * @param {any} value - A single raw value item.
	 * @returns {any} The single value, having been coerced and validated.
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

/**
 * Internal utility function to automatically infer the positional argument type
 * (Value or Variadic) when the type is not explicitly defined in the options object.
 * This function is strictly internal and should not be called externally.
 * @private
 * @param {object} [options] - The configuration options object to inspect for type clues.
 * @returns {('VALUE'|'VARIADIC')} The detected type of the positional argument.
 */
function autodetectType (options) {
	if ('type' in options) {
		return options.type;
	}

	for (const property of ['parameter', 'default']) {
		if (property in options) {
			return POSITIONAL_TYPE.VALUE;
		}
	}

	for (const property of ['parameters', 'min', 'max']) {
		if (property in options) {
			return POSITIONAL_TYPE.VARIADIC;
		}
	}

	return POSITIONAL_TYPE.VALUE;
}

/**
 * Creates and initializes a specific positional argument object, either PositionalValue or PositionalVariadic,
 * based on the provided type descriptor and configuration options.
 *
 * @param {object | string} type - The explicit type identifier. This can be a string ('value', 'variadic') or a configuration object which must contain a 'type' property.
 * @param {object} [options] - The options object containing detailed configuration parameters for the positional argument (e.g., default values, min/max constraints).
 * @returns {PositionalValue | PositionalVariadic} A fully initialized instance of the correct positional argument class.
 * @throws {Error} If the provided type identifier cannot be resolved or handled by this function.
 */
export function createPositional(type, options) {
	if (typeof type === 'object') {
		options = type;
		type = type.type;
	}

	if (typeof type === 'undefined') {
		type = autodetectType(options || {});
	}


	switch (type) {
	case POSITIONAL_TYPE.VALUE: {
		transformParameterProperty.apply (this, [options, 'parameter']);
		return new PositionalValue(options);
	}
	case POSITIONAL_TYPE.VARIADIC: {
		transformParameterProperty.apply (this, [options, 'parameters']);
		return new PositionalVariadic(options);
	}
	}
	throw new Error ('Invalid positional argument type ' + type);
}

/**
 * @param {Array<Positional>} positionals - An array of Positional objects defining the expected argument slots.
 * @param {Array<any>} values - The raw array of values received from the caller.
 * @param {object} [options] - Optional settings to control the dispatch process.
 * @param {boolean} [options.dispatched=false] - The {values} argument is already dispatched
 * @param {boolean} [options.dispatchOnly=false] - If true, the function will only match values to positional slots and return the intermediate dispatch state, without creating the final result object. Useful for debugging.
 * @param {boolean} [options.skipValidation=false] - If true, the system will bypass all internal validation checks (e.g., type coercion checks) during the argument processing phase.
 * @returns {Proxy} A Proxy object that mimics an array-like structure for the collection of all received values.
 * @throws {Error} If the number of values provided does not match the minimum required count, or if too many values are provided for the current structure.
 */
export function createPositionalArgumentResult(positionals, values, options) {
	options = merge ({}, options);
	const dispatched =  options.dispatched
		? Array.from (values)
		: dispatchPositionalValues(positionals, values, options);
				
	if (options.dispatchOnly) {
		return dispatched;
	}
	
	
	const object = {};
	const array = [];
	dispatched.forEach((e, i) => {
		const p = positionals[i];
		if (e.values.length == 0) {
			if ('default' in p) {
				e.values.push (p.default);
			}
		}
		if (e.property) {
			object[e.property] = (p.type == POSITIONAL_TYPE.VALUE)
				? e.values[0]
				: e.values;

		}


		e.values.forEach (v => array.push (v));
	});


	return new Proxy ({
		object,
		array
	}, {
		has (o, k) {
			return (k == 'length')
				|| [Symbol.iterator,
					'keys', 'entries', 'values',
					'length'].includes (k);
		},
		get (o, k) {
			if (k in o.object) {
				return  o.object[k];
			}

			if (typeof k === 'symbol') {
				switch (k) {
				case Symbol.iterator: return o.array[k];
				}
			}
			
			if (!isNaN(k)) {
				if (k < 0 || k >= o.array.length) {
					throw new RangeError (k + ' is not a valid offset. Expected [0, ' + o.array.length + ']');
				}
				return o.array[k];
			}


			switch (k) {
			case 'length':
			case 'values': {
				return o.array[k];
			}
			case 'entries':
			case 'keys': {
				return Object[k](o.object);
			}
			}
		}
	});
}

/**
 * Dispatches raw values into the positional argument slots based on minimum requirements and maximum capacities.
 * This function handles the core logic of matching inputs to defined slots.
 * @param {Array<Positional>} positionals - The array of positional definitions.
 * @param {Array<any>} values - The input array of raw values.
 * @param {object} [options] - Optional parameters, including `skipValidation`.
 * @returns {Array<{property: string, values: Array<any>}>} A list of intermediate dispatch objects, each containing the target property name and the collected values.
 * @throws {Error} If the number of input values is insufficient (less than required minimum) or excessive.
 */
function dispatchPositionalValues (positionals, values, options) {
	let min = 0;
	const dispatched = [];
	positionals.forEach (p => {
		min += p.min;
		dispatched.push ({
			'property': p.property,
			'values': []
		});
	});

	if (values.length < min) {
		const c = min - values.length;
		throw new Error ('Missing ' + (min - values.length)
		+ ' required positional argument' + ((c != 1) ? 's' : '') );
	}

	if (positionals.length == 0) {
		if (values.length) {
			throw new Error ('Too many positional argument values');
		}
		return dispatched;
	}
	if (values.length == 0) {
		return dispatched;
	}

	let sp = 0;
	let ep = positionals.length - 1;
	const P = Array.from (positionals);
	const V = Array.from (values);
	let p;
	let v;


	while (P.length
		&& V.length
		&& (p = P[0])
		&& (dispatched[sp].values.length < p.min)
	) {
		v = V.shift();
		if (!options.skipValidation) {
			v = p.parse (v);
		}

		dispatched[sp].values.push (v);
		if (dispatched[sp].values.length >= p.min) {
			P.shift();
			++sp;
		}
	}


	while (P.length
		&& V.length
		&& (ep > sp)
		&& (p = P[P.length - 1])
		&& (dispatched[ep].values.length < p.min)
	) {
		v = V.pop();
		dispatched[ep].values.push (v);
		if (dispatched[ep].values.length >= p.min) {
			P.pop();
			--ep;
		}
	}


	while (P.length && V.length) {
		if (dispatched[sp].values.length >= P[0].max) {
			P.shift();
			++sp;
			continue;
		}
		dispatched[sp].values.push (V.shift());
	}

	if (V.length) {
		throw new Error ('Too many positional argument values');
	}
	if (P.length) {
		let remainingRequired = 0;
		P.forEach(p => {
			remainingRequired += p.min;
		});
		if (remainingRequired) {
			throw new Error ('Too few positional argument values');
		}
	}

	return dispatched;
}

export default {
	Positional,
	PositionalValue,
	PositionalVariadic,
	createPositional,
	createPositionalArgumentResult,
};