/* global Type ToPrimitive */
// 7.1.3. ToNumber ( argument )
// The abstract operation ToNumber takes argument argument. It converts argument to a value of type Number according to Table 11:
//Table 11: ToNumber Conversions
/*
|----------------------------------------------------------------------------------------------------------------------------------------------------|
|  Argument Type |	Result
| Undefined		 |	Return NaN.
| Null			 |	Return +0.
| Boolean		 |	If argument is true, return 1. If argument is false, return +0.
| Number		 |	Return argument (no conversion).
| String		 |	See grammar and conversion algorithm below.
| Symbol		 |	Throw a TypeError exception.
| BigInt		 |	Throw a TypeError exception.
| Object		 | Apply the following steps:
|    				Let primValue be ? ToPrimitive(argument, hint Number).
|					Return ? ToNumber(primValue).
|----------------------------------------------------------------------------------------------------------------------------------------------------|
*/
function ToNumber(argument) { // eslint-disable-line no-unused-vars
	var type = Type(argument);
	switch (type) {
		case 'undefined':
			return NaN;
		case 'null':
			return 0;
		case 'boolean':
			if (argument === true) {
				return 1;
			}
			return 0;
		case 'number':
			return argument;
		case 'string':
			return Number(argument);
		case 'symbol':
			throw TypeError('can\'t convert symbol to number');
		case 'object': {
			var primValue = ToPrimitive(argument, 'Number');
			return ToNumber(primValue);
		}
	}
}
