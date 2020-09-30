/* global Type */
// @ts-nocheck

// 25.6.1.6 #sec-ispromise
// eslint-disable-next-line no-unused-vars
function IsPromise(x) {
	if (Type(x) !== 'object') {
		return false;
	}
	if (typeof x._promise === 'undefined') {
		return false; // uninitialized, or missing our hidden field.
	}
// 	if (!('PromiseState' in x)) {
// 		return false;
// 	}
	return true;
}
