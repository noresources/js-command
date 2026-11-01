# Input usage

Considering the following program definition

```javascript
program.name('demo')
	.option({ // Program-space switch option
		names: ['verbose', 'v']
	})
	.command ()
		.name('command')
		.option ({
			names: [output', 'o'],
			parameter: 'string'
		})
		.command()
			.name ('add') // sub command of "command"
			.option ({
				names: ['priority', 'p',
				parameter: 'integer']
			}).positional ({
				type: 'value',
				property: 'label'
			}).positional ({
				type: 'variadic',
				parameters: 'string'
			}).handle(add)
````

## Command ancestors

```bash
node demo.mjs command add -- 'Some meta command' foo --bar
```

The {@link Input#commands} will contains 3 elements:
* `input.commands[0]` - The `depo` {@link Program}.
* `input.commands[1]` - The `command` {@link Command}.
* `input.commands[2]` - The `add`{@link Command}.

## Option propagation

```bash
node demo.mjs --verbose command --output cmd.txt add --priority 2 -- 'Smaller than a foot' foo baz baz
```
The {@link input#options} will report all options set on the command line

```bash
{
	verbose: true,
	output: 'cmd.txt',
	priority: 2
}
```

## Positional arguments

```bash
node demo.mjs command add -- 'Explaining arguments property' print This 'is not' so complex
```

### As a list of falues
The `Symbol.iterator` and {@link Input#values values()} function both iterates on each individual positional argument values.
```javascript
for (const a of input.arguments) {
	console.log (a)
}
// Of
for (const a of input.arguments.values()) {
	console.log (a)
}
// Or
input.arguments.forEach (function (a, i) {
	console.log (a)
})
```
Outpus
```bash
Explaining input.arguments
print
This 
is not
so
complex
```

### Array access

The first positional defines a property name, so it is accessible via the `label`property
```javascript
console.log ('The name of the task', input.arguments.label)
// -> "Explaining the input.arguments"
```
***Note: *** {@link Positional#property} may shadow {@PositionalArgumentContainer} properties. In this case, use `Reflect.get(input.arguments, 'hiddenProperty')` to access the shadowed member.

The second positional does not define a property and is variadic.
Its value array is accessible via its offset position
```javascript
const task = input.arguments[1]
// task = Array ['print', 'This', 'is not', 'so', 'complex' ]
```

## Tips
To transform `input.arguments`to a regular array.
```javascript
const array = Array.from(input.arguments)
```
To transform it to a plain object
```javascript
const object = {}
for (const [k, v] of input.arguments.entries()) {
	object[k] = v
}
````

