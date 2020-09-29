/* global */
// https://tc39.es/ecma262/#assert
/*
  A step that begins with “Assert:” asserts an invariant condition of its algorithm.
  Such assertions are used to make explicit algorithmic invariants that would otherwise be implicit.
  Such assertions add no additional semantic requirements and hence need not be checked by an implementation.
  They are used simply to clarify algorithms.
*/
// eslint-disable-next-line no-unused-vars
function Assert(invariant) {
  if (!invariant) {
    throw new TypeError("Assert failed");
  }
}
