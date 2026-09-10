'use strict';

import { Parameter, createParameter } from './Parameters.mjs';

/**
 * @private
 */
export function transformParameterProperty (object, property) {
	if (!(typeof object === 'object' && object)) {
		return;
	}

	if (!(property in object)) {
		return false;
	}

	let a = object[property];
	if (a instanceof Parameter) {
		object[property]  = a;
		return true;
	}

	const factory = this.parameterFactory || createParameter;
	let type;
	let parameterOptions;

	if (typeof a === 'string') {
		type = a;
	} else if (typeof a === 'object' && a !== null) {

		type = a.type;
		parameterOptions = a;
	} else {

		return false;
	}

	object[property] = factory(type, parameterOptions);
	return true;
}