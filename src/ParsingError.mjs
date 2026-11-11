'use strict';

/**
 * Error thrown by {@link Option} and {@link Positional} when attempting to parse argument value.
 *
 * @property {Error} cause - The {@CoercionError} or {@link ValidationError} that produces the error.
 */
export class ParsingError extends Error {}

export default ParsingError;
