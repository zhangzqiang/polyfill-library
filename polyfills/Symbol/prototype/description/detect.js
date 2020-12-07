'description' in self.Symbol.prototype && (function () {
	try {
		return typeof (self.Symbol()).description === "undefined";
	} catch (_) {
		return false;
	}
}())
