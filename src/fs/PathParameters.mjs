'use strict';

import { Parameter, ValidationError } from '../Parameters.mjs';
import { merge } from '@noresources/core';
import { existsSync, statSync } from 'fs';

export class ExistingPathParameter extends Parameter {
	constructor (options, subtype) {
		super (subtype, merge ({
			
		}));
	}
	
	validate (value) {
		super.validate(value);
		if (!existsSync(value)) {
			throw new ValidationError (value + ' does not exists.');
		}
		
		if (!['existing-file', 'existing-directory'].includes (this.type)) {
			return;
		}
		const stat = statSync(value);
		if (this.type == 'existing-file') {
			if (!stat.isFile()) {
				throw new ValidationError(value + ' is not a regular file.');
			}
		} else if (this.type == 'existing-directory') {
			if (!stat.isDirectory()) {
				throw new ValidationError(value + ' is not a directory.');
			}
		}
		
	}
}

export function createPathParameter () {
	let type = arguments[0];
	let options = arguments[1] || {};
	
	if (typeof type === 'object') {
		options = type;
		type = options.type;
	}
	
	switch (type) {
	case 'existing-file':
	case 'existing-directory':
	case 'existing-path':
		return new ExistingPathParameter (options, type);
	}
}

export default {
	ExistingPathParameter
};