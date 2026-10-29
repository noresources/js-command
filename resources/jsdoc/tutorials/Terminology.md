# Terminology and naming conventions


## Terminology

Program
: The main container object holding commands, options and positional arguments.

Command
: An action of a program.

Option
: A named command modifier assiciated with zero, one or more values.

Positional
: A value whose meaning depends on its position on the command line.

Parameter
: Describe the expected value type for an option value of a positional argument

Argument
: A value given to an option value or a positional argument.

Command Handler
: A function that is invoked after command line arguments parsing to process the desired command action.

Middleware
: A function to invoke before the command handler.

## Naming conventions

In commands, options and positionals descriptors,

* `name`  defines the name of the command or option as it appears on the command line.
	The `name` value is preferably a kebab-case word. It must not contains spaces and should only contains alphanumerical characters and hyphens in most cases.
* `property` defines the object property name that will hold the element or its value(s). 
	The `property` name must be a valid Javascript identifier. It is preferably written in camelCase.
	When the `property`is not set, the `name` of the object is used instead.
* `parameter(s)`  describes the expected value type of an option value or positional argument.

