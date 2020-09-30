/* global GetMethod, Symbol, Call, Type, GetV, ArrayIterator */
// 7.4.1. GetIterator ( obj [ , method ] )
// The abstract operation GetIterator with argument obj and optional argument method performs the following steps:
var GetIterator = (function () {
	function isArgumentsObject(value) {
		var str = Object.prototype.toString.call(value);
		var isArgs = str === '[object Arguments]';
		if (!isArgs) {
			isArgs = str !== '[object Array]' &&
				value !== null &&
				typeof value === 'object' &&
				typeof value.length === 'number' &&
				value.length >= 0 &&
				Object.prototype.toString.call(value.callee) === '[object Function]';
		}
		return isArgs;
	}
	return function GetIterator(obj /*, method */) {
		// eslint-disable-line no-unused-vars
		// 1. If method is not present, then
		// a. Set method to ? GetMethod(obj, @@iterator).
		var method = arguments.length > 1 ? arguments[1] : GetMethod(obj, Symbol.iterator);
		// 2. Let iterator be ? Call(method, obj).
		if (method) {
			var iterator = Call(method, obj);
		} else if (isArgumentsObject(obj)){
			// special case support for `arguments`
			iterator = new ArrayIterator(obj, 'value');
		}
		// 3. If Type(iterator) is not Object, throw a TypeError exception.
		if (Type(iterator) !== 'object') {
			throw new TypeError('bad iterator');
		}
		// 4. Let nextMethod be ? GetV(iterator, "next").
		var nextMethod = GetV(iterator, 'next');
		// 5. Let iteratorRecord be Record {[[Iterator]]: iterator, [[NextMethod]]: nextMethod, [[Done]]: false}.
		var iteratorRecord = Object.create(null);
		iteratorRecord['[[Iterator]]'] = iterator;
		iteratorRecord['[[NextMethod]]'] = nextMethod;
		iteratorRecord['[[Done]]'] = false;
		// 6. Return iteratorRecord.
		return iteratorRecord;
	};
})();
