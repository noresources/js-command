'use strict';

import {
	assertTypes
} from '@noresources/core';

/**
 * @class Documentation
 * @description Represents a structured descriptor for documenting software components, . This object holds two distinct fields: a brief, punchy summary
 * (the abstract) and a detailed, contextual explanation.
 * @property {string} abstract - A concise, single-line summary of the component's function. This is typically used in quick listings.
 * @property {string | undefined} details - A comprehensive, multi-line description providing in-depth usage context, requirements, and side effects.
 */
export class Documentation {
	constructor () {
		this.abstract = '';
		this.details = undefined;
	}

	/**
	 * @description Serializes the structured documentation descriptor into a single, human-readable string.
	 * This method concatenates the primary abstract description and the detailed context,
	 * ensuring proper formatting for consumption by logging systems or UI rendering.
	 * @returns {string} The complete, formatted documentation string, combining abstract and details.
	 */
	toString () {
		let s = this.abstract || '';
		if (typeof this.details === 'string') {
			s += '\n' + this.details;
		}
		return s;
	}
}

/**
 * @description Factory function designed to instantiate a Documentation object from various input formats.
 * It provides a crucial mechanism for normalizing data, allowing documentation to be defined
 * either as a single raw string or a pre-structured JavaScript object.
 * @param {string | object} content - The raw content used to build the descriptor. If a string, the first line is assigned to 'abstract'; the rest is 'details'. If an object, the 'abstract' and 'details' properties are used directly.
 * @returns {Documentation} A fully initialized and structured instance of the Documentation class, ready for use.
 * @throws {Error} Throws an assertion error if the provided 'content' parameter is not of type string or object.
 */
export function createDocumentation (content) {
	assertTypes (content, ['string', 'object'], 'content');
	const d = new Documentation;
	if (typeof content === 'string') {
		const lines = content.split('\n');
		d.abstract = lines.shift();
		if (lines.length) {
			d.details = lines.join('\n');
		}
	} else if (typeof content == 'object') {
		d.abstract = content.abstract || '';
		d.details = content.details;
	}

	return d;
}

export default {
	Documentation,
	createDocumentation
};