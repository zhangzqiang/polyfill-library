'isSealed' in Object && (function () {
    try {
        Object.isSealed('foo');
        return true;
    } catch (error) {
        return false;
    }
}())
