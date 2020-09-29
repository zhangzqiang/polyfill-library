/* global OrdinaryCreateFromConstructor, ToString, CreateMethodProperty */
// @ts-nocheck
(function (global) {
    // #sec-aggregate-error-constructor
    function AggregateError() {
        var errors = arguments[0];
        var message = arguments[1];
        // 1. If NewTarget is undefined, let newTarget be the active function object, else let newTarget be NewTarget.
        var newTarget
        if (this === undefined) {
            newTarget = AggregateError;
        } else {
            newTarget = this;
        }
        // 2. Let O be ? OrdinaryCreateFromConstructor(newTarget, "%AggregateError.prototype%", « [[ErrorData]] »).
        var O = OrdinaryCreateFromConstructor(newTarget, AggregateError.prototype, ['ErrorData']);
        // 3. If message is not undefined, then
        if (message !== undefined) {
            // a. Let msg be ? ToString(message).
            var msg = ToString(message);
            // b. Perform ! CreateMethodProperty(O, "message", msg).
            CreateMethodProperty(O, 'message', msg);
        }
        // 4. Let errorsList be ? IterableToList(errors).
        var errorsList = errors;
        // 5. Perform ! DefinePropertyOrThrow(O, "errors", Property Descriptor { [[Configurable]]: true, [[Enumerable]]: false, [[Writable]]: true, [[Value]]: ! CreateArrayFromList(errorsList) }).
        Object.defineProperty(O, 'errors', {
            configurable: true,
            enumerable: false,
            writable: true,
            value: errorsList
        });

        // 6. Return O.
        return O;
    }

    global.AggregateError = AggregateError;
}(self));
