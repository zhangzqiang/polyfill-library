'preventExtensions' in Object && (function () {
    try {
        Object.preventExtensions('foo');
        return true;
    } catch (error) {
        return false;
    }
}())
