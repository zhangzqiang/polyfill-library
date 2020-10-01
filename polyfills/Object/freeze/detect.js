'freeze' in Object && (function() {
    try {
        Object.freeze('1');
        return true;
    } catch (err) {
        return false;
    }
}())
