/* global Completion */
// eslint-disable-next-line no-unused-vars
function NormalCompletion(argument) {
    // 1. Return Completion { [[Type]]: normal, [[Value]]: argument, [[Target]]: empty }.
    return new Completion({ Type: 'normal', Value: argument, Target: undefined });
}
