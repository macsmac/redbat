const Namespace = require("./namespace");

module.exports = function() {
	this.DEFAULT_NAMESPACE = "default";
	this.namespaces = {};

	this.namespace = function(name) {
		if (!name) return this.namespaces[this.DEFAULT_NAMESPACE];

		if (!this.namespaces[name]) {
			return this.namespaces[name] = new Namespace();
		} else {
			return this.namespaces[name];
		}
	}

	this.namespaces[this.DEFAULT_NAMESPACE] = new Namespace();

	this.on = this.namespace().on;
	this.once = this.namespace().once;
	this.emit = this.namespace().emit;
	this.use = this.namespace().use;
	this.listener = this.namespace().getListeners;

	return this;
}