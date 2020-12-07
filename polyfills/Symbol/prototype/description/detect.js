'description' in self.Symbol.prototype && (function () {
	try {
		return (self.Symbol()).description === "undefined";
	} catch (_) {
		return false;
	}
}())
