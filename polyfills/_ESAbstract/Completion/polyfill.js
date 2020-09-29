/* global */
// eslint-disable-next-line no-unused-vars
function Completion(init) {
    if (this instanceof Completion) {
        this.Type = init.Type;
        this.Value = init.Value;
        this.Target = init.Target;
    } else {
        // 1. Assert: completionRecord is a Completion Record.
        // Assert(init instanceof Completion);
        // 2. Return completionRecord as the Completion Record of this abstract operation.
        return init;
    }
}
