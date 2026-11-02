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

/**
 * @param {function} [...factories] - List of factory functions to invoke sequentially until an object is created.
 *
 * @returns {function}  Factory function
 
*/
export function factoryChain () {
	const factory = function () {
		let errors = [];
		const args = Array.from (arguments);
		for (const f of this.factories) {
			try {
				const result = f.apply(this.context,  args );
				if (typeof result === 'object' && result) {
					return result;
				}
			} catch (error) {
				errors.push (error);
			}
		}
		
		throw new Error ('Could not create Parameter instance', {
			'cause': errors
		});
	};
	
	const thisArg = {
		'context': this,
		'factories': Array.from(arguments)
	};
	
	return factory.bind (thisArg);
}

export default {
	factoryChain,
	transformParameterProperty
};