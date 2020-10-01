'isExtensible' in Object && (function() {
    try {
        Object.isExtensible('1');
        return true;
    } catch (err) {
        return false;
    }
}())
