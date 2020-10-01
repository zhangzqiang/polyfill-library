'isFrozen' in Object && (function() {
    try {
        Object.isFrozen('1');
        return true;
    } catch (err) {
        return false;
    }
}())
