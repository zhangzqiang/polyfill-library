/* global */
// eslint-disable-next-line no-unused-vars
function isFunctionObject(O) {
    // Polyfill.io - Only function objects have a [[Call]] internal method. This means we can simplify this function to check that the argument has a type of function.
	return typeof O === 'function';
}
