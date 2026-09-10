'use strict';

/**
 * @file Options and command-line argument type descriptors.
 */

import {
	createDocumentation
} from './Documentation.mjs';

import {
	implode,
	merge
} from '@noresources/core';

/**
 * @class CoercionError
 * @description A specific error class used to signal that the raw input value
 * received during parameter parsing could not be successfully transformed (coerced)
 * into the required data type (e.g., attempting to parse 'abc' as a number).
 * This indicates a fundamental data type mismatch.
 * @extends {Error}
 * @example
 * throw new CoercionError("Invalid format for required integer.");
 */
export class CoercionError extends Error {}

/**
 * @class ValidationError
 *
 * @description A specific error class thrown when an argument value,
 * *after* successfully completing type coercion, still fails to meet predefined
 * structural or logical constraints.
 * Examples include string length violations, out-of-range numeric values,
 * or membership in an invalid enumeration set.
 * @extends {Error}
 * @example
 * throw new ValidationError("Input must be a positive number.");
 */
export class ValidationError extends Error {}

/**
 * @class Parameter
 * @description The abstract base class for defining structured command-line argument descriptors.
 * It serves as the core mechanism for encapsulating argument metadata, including
 * the expected type, custom coercion functions, and validation rules.
 * Subclasses are expected to extend this class and specialize the behavior.
 *
 * @property {string} type - The canonical identifier string representing the expected data type (e.g., 'string', 'number', 'integer').
 * @property {function} [coercer] - An optional function that transforms the raw input value into the intended type. It must accept one argument (the raw value).
 * @property {function} [validator] - An optional function executed after coercion to validate the resulting value against constraints. It must accept one argument (the coerced value).
 * @property {object} [documentation] - A structured object containing generated metadata derived from the parameter's configuration.
 * @abstract
 */
export class Parameter {
	/**
	 * Creates an argument descriptor instance.
	 * @param {string} type - The primary type identifier for the argument (e.g., 'string', 'boolean'). This defines the parameter's contract.
	 * @param {Object<string, any>} [descriptor={}] - An optional configuration object containing type-specific attributes (e.g., `minLength`, `minValue`) or custom methods (`coercer`, `validator`).
	 * @throws {Error} If essential type information is missing, though internal logic should prevent this.
	 */
	constructor (type, descriptor) {
		this.type = type || '*';
		this._documentation = undefined;
		if (typeof descriptor === 'object' && descriptor !== null) {
			for (const [name, value] of Object.entries(descriptor)) {
				/**
				 * @todo test if name is a setter instead of checking against "undefined"
				 */
				if (!(name in this) || (typeof this[name] === 'undefined')) {
					this[name] = value;
				}
			}
		}
	}

	/**
	 * Gets the parameter {Documentation} object.
	 *
	 * @returns {Documentation}
	 */
	get documentation () {
		return this._documentation;
	}

	
	/**
	* Sets the parameter documentation.
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
	 * Attempts to convert the raw input value into a data type appropriate for this parameter's contract.
	 * This function encapsulates the type coercion logic.
	 * @param {any} value - The raw, unparsed value received from the input source (e.g., command line).
	 * @returns {any} The value, successfully transformed and coerced into the target type.
	 * @throws {CoercionError} Thrown if the internal coercion mechanism fails to successfully convert the input value.
	 */
	coerce (value) {
		if (typeof this.coercer === 'function') {
			// Use apply to ensure 'this' context inside the coercer remains correct.
			return this.coercer.apply (this, [value]);
		}
		return value;
	}

	/**
	 * Validates the value against all defined constraints (e.g., minLength, maxLength, custom validators).
	 * This method is designed to be called ONLY after the `coerce()` method has successfully run.
	 * @param {any} value - The value that has already been coerced by the `coerce()` method.
	 * @throws {ValidationError} Thrown if the value violates any established constraints defined in the descriptor.
	 */
	validate (value) {
		if (typeof this.validator === 'function') {
			// Use apply to ensure 'this' context inside the validator remains correct.
			this.validator.apply (this, [value]);
		}
	}
}

/**
 * @class EnumerationParameter
 *
 * @extends {Parameter}
 *
 * @description A specialized argument descriptor used when the acceptable values
 * are restricted to a fixed list. This implementation adds logic to enforce
 * membership validation, checking if the coerced value is present within the defined `values` array.
 * @property {Array<any>} values - The fixed set of acceptable values for this parameter.
 */
export class EnumerationParameter  extends Parameter {
	/**
	 * Creates an EnumerationParameter instance.
	 *
	 * @param {Object} options - The configuration object.
	 * @param {Array<any>} options.values - The strict list of permissible values.
	 */
	constructor (options) {
		super ('enumeration', merge ({
			'values': []
		}, options));
	}

	/**
	 * Overrides the base validation to perform set membership checking.
	 * @param {any} value - The coerced value.
	 * @throws {ValidationError} Thrown if the value is not found within the defined `values` list.
	 */
	validate (value) {
		super.validate (value);
		if (!this.values.includes (value)) {
			const expected = implode (this.values, {
				'between': ', ',
				'betweenLast': ' or '
			});
			throw new ValidationError('Value must be one of ' + expected);
		}
	}
}

/**
 * @class StringParameter
 * @extends {Parameter}
 * @description A highly specialized argument type descriptor dedicated to string inputs.
 * It enforces string-specific constraints, primarily minimum and maximum character lengths.
 * This class ensures that all input intended to be a string is rigorously validated
 * for length and type consistency.
 *
 * @property {number} [minLength] - The minimum required length (inclusive). The string must have at least this many characters.
 * @property {number} [maxLength] - The maximum allowed length (exclusive of the upper bound). The string length must be less than this value.
 */
export class StringParameter extends Parameter {
	/**
	 * Creates a StringParameter descriptor.
	 * @param {Object} options - Configuration options containing string constraints.
	 * @param {number} [options.minLength] - The minimum acceptable length (default is 0).
	 * @param {number} [options.maxLength] - The maximum acceptable length (exclusive upper bound).
	 */
	constructor (options) {
		super('string', merge ({
			'minLength': 0
		}, options));
	}

	/**
	 * Overrides the base coercion mechanism to guarantee that the final value is a string.
	 * This is critical for enforcing string-based constraints.
	 * @param {any} value - The raw input value received.
	 * @returns {string} The value, guaranteed to be a string representation of the input.
	 */
	coerce (value) {
		return super.coerce(value).toString();
	}

	/**
	 * Executes advanced validation, checking the length of the string
	 * against the `minLength` and `maxLength` properties.
	 * @param {string} value - The coerced string value.
	 * @throws {ValidationError} Thrown if the string's length falls outside the configured boundaries.
	 */
	validate (value) {
		super.validate(value);

		if (typeof this.minLength === 'number') {
			if (value.length < this.minLength) {
				throw new ValidationError (`String length must be at least ${this.minLength}`);
			}
		}

		if (typeof this.maxLength === 'number') {
			if (value.length >= this.maxLength) {
				throw new ValidationError (`Value length cannot exceed ${this.maxLength}`);
			}
		}
	}
}

/**
 * @class NumberParameter
 * @extends {Parameter}
 * @description A type descriptor specialized for numeric data types (float).
 * It handles the parsing of raw inputs (which might be strings) into IEEE 754 floating-point numbers
 * and validates the resulting number against explicit `minValue` and `maxValue` constraints.
 * @param {Object} options - Configuration options containing numerical constraints.
 * @param {string} [subtype='number'] - A specific numerical type ('number' for float, 'integer' for integer).
 */
export class NumberParameter extends Parameter {
	/**
	 * Creates a NumberParameter instance.
	 * @param {Object} options - Options including constraints like `minValue` or `maxValue`.
	 * @param {string} subtype - The specific sub-type ('number' or 'integer').
	 */
	constructor (options, subtype) {
		super (subtype || 'number', merge ({
			'validator': Number.isFinite,
			'minValue': undefined,
			'maxValue': undefined
		}, options));
		this._parserFunction = parseFloat;
	}

	/**
	 * Overrides base coercion to perform floating-point parsing.
	 * @param {any} value - The raw input value.
	 * @returns {number} The successfully parsed number.
	 * @throws {CoercionError} If the parsing attempt results in NaN.
	 */
	coerce (value) {
		const number = this._parserFunction(super.coerce(value));
		if (isNaN(number)) {
			throw new CoercionError('Could not coerce ' + (typeof value) + ' to number');
		}
		return number;
	}

	/**
	 * Validates the numeric value against the configured minimum and maximum bounds.
	 * This must be called after successful coercion.
	 * @param {number} value - The coerced numeric value.
	 * @throws {ValidationError} Thrown if the value is outside the [minValue, maxValue] range.
	 */
	validate (value) {
		super.validate(value);
		if (typeof this.minValue === 'number') {
			if (value < this.minValue) {
				throw new ValidationError ('Value must be at least ' + this.minValue);
			}
		}
		if (typeof this.maxValue === 'number') {
			if (value > this.maxValue) {
				throw new ValidationError ('Value must be at most ' + this.maxValue);
			}
		}
	}
}

/**
 * @class IntegerParameter
 * @extends {NumberParameter}
 * @description A highly specialized numeric type descriptor that enforces strict integer constraints.
 * It inherits all floating-point range checking from {@link NumberParameter} and overrides
 * the parsing function to use `parseInt`, ensuring that fractional parts are discarded
 * during the initial type transformation.
 */
export class IntegerParameter extends NumberParameter {
	/**
	 * Creates an IntegerParameter instance.
	 * @param {Object} options - Configuration options, inheriting from NumberParameter.
	 */
	constructor(options) {
		super(merge({
			'validator': Number.isInteger
		}, options), 'integer');
		this._parserFunction = parseInt;
	}
}

/**
 * @function createParameter
 * @description Creates and initializes a type-specific parameter descriptor instance.
 * This factory function abstracts away the instantiation logic, intelligently
 * determining and returning the correct implementation (e.g., {@link Parameter},
 * {@link StringParameter}) based on the provided type specification.
 *
 * @param {string | {type: string}} type - The parameter type definition. This can be a simple type string (e.g., 'string') or an object containing a type property (e.g., `{type: 'string'}`).
 * @param {Object} [options={}] - An optional configuration object containing all type-specific constraints (e.g., `minLength`, `minValue`).
 * @returns {Parameter | StringParameter} A fully initialized descriptor instance suitable for argument validation.
 * @throws {Error} Thrown if the specified type is unknown or unhandled by the current module.
 * @global
 */
export function createParameter () {
	let type = arguments[0];
	let options = arguments[1];

	if (typeof type === 'object') {
		options = type;
		type = type.type;
	}

	switch (type) {
	case 'enumeration': return new EnumerationParameter(options);
	case 'string': return new StringParameter(options);
	case 'integer': return new IntegerParameter(options);
	case 'float':
	case 'number':
		return new NumberParameter(options);
	}
	return new Parameter(type, options);
}

export default {
	createParameter,
	Parameter,
	EnumerationParameter,
	StringParameter,
	NumberParameter,
	IntegerParameter
};