'description' in self.Symbol.prototype && (function () {
	try {
		return (self.Symbol()) === "undefined";
	} catch (_) {
		return false;
	}
}())
