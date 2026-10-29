# Command handlers and middlewares

A {@link Program} and each of its {@link Command}s can have multiple middlewares and a single command handler.

These functions are invoked in the following way:

1. Command line is parsed and a {@link Input} instance is created and populated.
2. All middlewares from the main program are invoked, receiving the {@link Input} instance as a single argument.
3. If the target endpoint is a program subcommand, invoke all middlewares of parent commands and the target command receiving the same input argument.
4. Finally, invoke the target endpoint command handler with the input argument.

The default `thisArg` context passed to middlewares and the command handler is the {@link Program} or {@link Command} that holds the function.

## Middlewares

Middlewares are used to alter the {@link Input} instance object before being passed to the final command handler.

***Example***

```javascript
function factoryMiddleware (input) {
	if (input.options.withCoffee) {
		input.drink = new Cup('coffee')
	} else {
		input.drink = new Bottle('water')
	}
}
```

## Command handler

The command handler executes the main logic of the command.
It receives the {@link Input} instance, possibly modified by all invoked middlewares.

```javascript
function handler (input) {
	input.drink.consume(input.arguments.quantity)
	return 0
}
```
