// @ts-nocheck
/* global CreateMethodProperty Type SameValue ToString ToObject */
(function (global) {
	'use strict'; //so that ({}).toString.call(null) returns the correct [object Null] rather than [object Window]

	var originalDefineProperty = Object.defineProperty;
	var created = Object.create(null);
	function generateName(desc) {
		desc = '@@' + String(desc);
		var postfix = 0;
		while (created['Symbol(' + desc + (postfix || '')+')']) ++postfix;
		desc += postfix || '';
		var name = desc;
		return name;
	}

	function copyAsNonEnumerable(descriptor) {
		var newDescriptor = Object.create(descriptor);
		newDescriptor.enumerable = false;
		return newDescriptor;
	}

	// Internal constructor (not one exposed) for creating Symbol instances.
	// This one is used to ensure that `someSymbol instanceof Symbol` always return false
	function SymbolValue(description) {
		Object.defineProperties(this, {
			Description: { configurable: false, enumerable: false, value: generateName(description), writable: false },
			Value: { configurable: false, enumerable: false, value: description, writable: false }
		});
		var that = Object.setPrototypeOf(this, Symbol.prototype);
		originalDefineProperty(that, 'constructor', { configurable: true, enumerable: false, value: Symbol, writable: true });
		created[that] = { enumerable: false };
		Object.freeze(that);
		var ie11BugWorkaround;
		var descriptor = {
			enumerable: false,
			configurable: true,
			get: undefined,
			set: function (value) {
				// https://github.com/medikoo/es6-symbol/issues/12
				if (ie11BugWorkaround) {
					return;
				}
				ie11BugWorkaround = true;
				setDescriptor(this, that, {
					enumerable: false,
					configurable: true,
					writable: true,
					value: value
				});
				created[that].enumerable = true;
				if (this === Object.prototype) {
					created[that].internal = true;
				}
				ie11BugWorkaround = false;
			}
		};
		try {
			originalDefineProperty(Object.prototype, that, descriptor);
		} catch (e) {
			Object.prototype[that] = descriptor.value;
		}
		return that;
	}
	function setDescriptor(o, key, descriptor) {
		var protoDescriptor = Object.getOwnPropertyDescriptor(Object.prototype, key);
		delete Object.prototype[key];
		originalDefineProperty(o, key, descriptor);
		if (o !== Object.prototype) {
			originalDefineProperty(Object.prototype, key, protoDescriptor);
		}
	}
	function Symbol(/*description*/) {
		var description = arguments[0];
		// 1. If NewTarget is not undefined, throw a TypeError exception.
		if (this instanceof Symbol) {
			throw new TypeError('Symbol is not a constructor');
		}
		// 2. If description is undefined, let descString be undefined.
		var descString;
		if (description === undefined) {
			descString = undefined;
		} else {
			// 3. Else, let descString be ? ToString(description).
			descString = ToString(description);
		}
		// 4. Return a new unique Symbol value whose [[Description]] value is descString.
		return new SymbolValue(descString);
	}

	function thisSymbolValue(value) {
		// 1. If Type(value) is Symbol, return value.
		if (Type(value) === 'symbol') {
			return value;
		}
		// 2. If Type(value) is Object and value has a [[SymbolData]] internal slot, then
		if (Type(value) === 'object' && 'SymbolData' in value) {
			// a. Let s be value.[[SymbolData]].
			var s = value.SymbolData;
			// b. Assert: Type(s) is Symbol.
			// Assert(Type(s) === 'Symbol');
			// c. Return s.
			return s;
		}
		// 3. Throw a TypeError exception.
		throw TypeError(value + ' is not a symbol');
	}

	// 19.4.3.3.1 #sec-symboldescriptivestring
	function SymbolDescriptiveString(sym) {
		// Assert(Type(sym) === 'Symbol');
		var desc = sym.Description;
		if (Type(desc) === 'undefined') {
			desc = '';
		}
		return 'Symbol(' + desc + ')';
	}

	// #sec-symbol.prototype.tostring
	CreateMethodProperty(Symbol.prototype, 'toString', function toString() {
		// 1. Let sym be ? thisSymbolValue(this value).
		var sym = thisSymbolValue(this);
		// 2. Return SymbolDescriptiveString(sym).
		return SymbolDescriptiveString(sym);
	});

	// #sec-symbol.prototype.description
	try {
		originalDefineProperty(Symbol.prototype, 'description', {
			set: undefined,
			enumerable: false,
			configurable: true,
			get: function description() {
				// 1. Let s be the this value.
				var s = this;
				// 2. Let sym be ? thisSymbolValue(s).
				var sym = thisSymbolValue(s);
				// 3. Return sym.[[Description]].
				return sym.Value;
			}
		});
	} catch (error) {
		// we must be IE 8 which does not support getters
	}

	// #sec-symbol.prototype.valueof
	CreateMethodProperty(Symbol.prototype, 'valueOf', function valueOf() {
		// 1. Return ? thisSymbolValue(this value).
		return thisSymbolValue(this);
	});

	// #sec-symbol.prototype-@@toprimitive
	CreateMethodProperty(Symbol.prototype, 'toPrimitive', function toPrimitive() {
		// 1. Return ? thisSymbolValue(this value).
		return thisSymbolValue(this);
	});

	var GlobalSymbolRegistry = [];
	CreateMethodProperty(Symbol, 'for', function (key) {
		// 1. Let stringKey be ? ToString(key).
		var stringKey = ToString(key);
		// 2. For each element e of the GlobalSymbolRegistry List, do
		for (var i = 0; i < GlobalSymbolRegistry.length; i++) {
			var e = GlobalSymbolRegistry[i];
			// a. If SameValue(e.[[Key]], stringKey) is true, return e.[[Symbol]].
			if (SameValue(e.Key, stringKey) === true) {
				return e.Symbol;
			}
		}
		// 3. Assert: GlobalSymbolRegistry does not currently contain an entry for stringKey.
		// 4. Let newSymbol be a new unique Symbol value whose [[Description]] value is stringKey.
		var newSymbol = new SymbolValue(stringKey);
		// 5. Append the Record { [[Key]]: stringKey, [[Symbol]]: newSymbol } to the GlobalSymbolRegistry List.
		GlobalSymbolRegistry.push({ Key: stringKey, Symbol: newSymbol });
		// 6. Return newSymbol.
		return newSymbol;
	});

	var originalPropertyIsEnumerable = Object.prototype.propertyIsEnumerable;
	CreateMethodProperty(Object.prototype, 'propertyIsEnumerable', function propertyIsEnumerable(key) {
		if (Type(key) === 'symbol') {
			return created[key].enumerable;
		} else {
			return originalPropertyIsEnumerable.call(this, key);
		}
	});

	var strictModeSupported = (function(){ 'use strict'; return this; }).call(null) === null;
	var originalToString = Object.prototype.toString;
	CreateMethodProperty(Object.prototype, 'toString', function toString() {
		if (!strictModeSupported) {
			// https://github.com/Financial-Times/polyfill-library/issues/164#issuecomment-486965300
			// Polyfill.io this code is here for the situation where a browser does not
			// support strict mode and is executing `Object.prototype.toString.call(null)`.
			// This code ensures that we return the correct result in that situation however,
			// this code also introduces a bug where it will return the incorrect result for
			// `Object.prototype.toString.call(window)`. We can't have the correct result for
			// both `window` and `null`, so we have opted for `null` as we believe this is the more
			// common situation.
			if (this === window) {
				return '[object Null]';
			}
		}
		var str = originalToString.call(this);
		if (Type(this) === 'symbol') {
			return '[object Symbol]';
		} else {
			return str;
		}
	});

	var originalGetOwnPropertyNames = Object.getOwnPropertyNames;
	CreateMethodProperty(Object, 'getOwnPropertyNames', function getOwnPropertyNames(o) {
		return originalGetOwnPropertyNames(o).filter(function filterOutSymbols(name) {
			return !Object.prototype.hasOwnProperty.call(created, name);
		});
	});

	CreateMethodProperty(Object, 'getOwnPropertySymbols', function getOwnPropertySymbols(O) {
		// 1. Return ? GetOwnPropertyKeys(O, symbol).
		return GetOwnPropertyKeys(O, 'symbol');
	});

	// #sec-getownpropertykeys
	function GetOwnPropertyKeys(O, type) {
		// 1. Let obj be ? ToObject(O).
		var obj = ToObject(O);
		// 2. Let keys be ? obj.[[OwnPropertyKeys]]().
		var keys = originalGetOwnPropertyNames(obj);
		// 3. Let nameList be a new empty List.
		var nameList = [];
		// 4. For each element nextKey of keys in List order, do
		keys.forEach(function(nextKey) {
			// a. If Type(nextKey) is Symbol and type is symbol or Type(nextKey) is String and type is string, then
			if ((type === 'symbol' && created[nextKey] && created[nextKey].internal) || Type(nextKey) === type) {
				// i. Append nextKey as the last element of nameList.
				nameList.push(nextKey);
			}
		});
		return nameList;
	}
	CreateMethodProperty(Symbol, 'keyFor', function keyFor(sym) {
		// 1. If Type(sym) is not Symbol, throw a TypeError exception.
		if (Type(sym) !== 'symbol') {
			throw TypeError(sym + ' is not a symbol');
		}
		// 2. For each element e of the GlobalSymbolRegistry List, do
		for (var i = 0; i < GlobalSymbolRegistry.length; i++) {
			var e = GlobalSymbolRegistry[i];
			// a. If SameValue(e.[[Symbol]], sym) is true, return e.[[Key]].
			if (SameValue(e.Symbol, sym) === true) {
				return e.Key;
			}
		}
		// 3. Assert: GlobalSymbolRegistry does not currently contain an entry for sym.
		// 4. Return undefined.
		return undefined;
	});

	CreateMethodProperty(Object, 'defineProperty', function defineProperty(o, key, descriptor) {
		var uid = '' + key;
		if (created[uid]) {
			setDescriptor(o, uid, descriptor.enumerable ? copyAsNonEnumerable(descriptor) : descriptor);
			created[uid].enumerable = Boolean(descriptor.enumerable);
			if (o === Object.prototype) {
				created[uid].internal = true;
			}
		} else {
			originalDefineProperty(o, key, descriptor);
		}
		return o;
	});

	// Export the object
	try {
		CreateMethodProperty(global, 'Symbol', Symbol);
	} catch (e) {
		// IE8 throws an error here if we set enumerable to false.
		// More info on table 2: https://msdn.microsoft.com/en-us/library/dd229916(v=vs.85).aspx
		global.Symbol = Symbol;
	}
})(self);
