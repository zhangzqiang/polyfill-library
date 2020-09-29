/* global Completion */
// eslint-disable-next-line no-unused-vars
function ThrowCompletion(argument) {
    // 1. Return Completion { [[Type]]: throw, [[Value]]: argument, [[Target]]: empty }.
    return new Completion({ Type: 'throw', Value: argument, Target: undefined });
}
