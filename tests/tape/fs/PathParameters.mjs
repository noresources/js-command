'use strict';

import {test} from 'tape';
import * as Module from '../../../src/fs/PathParameters.mjs';
import {Parameter, createParameter} from '../../../src/Parameters.mjs';
import {factoryChain} from '../../../src/utilities.mjs';
import { dirname } from 'path';

const __filename = (new URL(import.meta.url)).pathname;
const __dirname = dirname (__filename);

test('existing-path', function (t) {
	const cases = [{
		'label': 'Non existing path',
		'options': {
			'type': 'existing-path'
		},
		'throws': true,
		'value': '/foo-bar/bar_foo/mamamala/tchouktchouk.pitch'
	}, {
		'label': 'This test file should validate',
		'options': {
			'type': 'existing-file'
		},
		'value': __filename
	}, {
		'label': 'This test directory should validate.',
		'options': {
			'type': 'existing-directory'
		},
		'value': __dirname
	}, {
		'label': 'This file is not a directory',
		'options': {
			'type': 'existing-file'
		},
		'value': __dirname,
		'throws': true
	}];
	
	cases.forEach(test => {
		const f = test.throws ? t.throws : t.doesNotThrow;
		f.apply(t, [function() {
			const p = Module.createPathParameter (test.options);
			p.validate (test.value);
		}, test.label || test.options.type]);
	});
	t.end ();
});

test ('factoryChain', function (t) {
	
	const factory = factoryChain(Module.createPathParameter, createParameter);
	
	const cases = [{
		'type': 'existing-file',
		'class': Module.ExistingPathParameter
	}, {
		'type': 'string',
		'class': Parameter
	}];
	
	cases.forEach (test => {
		const p = factory (test.type);
		t.true(p instanceof test.class, test.type + ' gives a ' + test.class.name);
	});
	
	t.end ();
});