const Namespace = require("./namespace");
const _ = require("lodash");

module.exports = function(fast) {
	this._id = Math.random();

	this.DEFAULT_NAMESPACE = "default";
	this.namespaces = {};

	this.namespaces[this.DEFAULT_NAMESPACE] = new Namespace(this._id);

	this.namespace = function(name) {
		if (!name) return this.namespaces[this.DEFAULT_NAMESPACE];

		if (!this.namespaces[name]) {
			return this.namespaces[name] = new Namespace();
		} else {
			return this.namespaces[name];
		}
	}

	const namespace = this.namespace();

	this.on = namespace.on;
	this.onFast = namespace.onFast;
	this.once = namespace.once;
	this.onceFast = namespace.onceFast;
	this.wait = namespace.wait;
	this.emit = namespace.emit;
	this.emitFast = namespace.emitFast;
	this.use = namespace.use;
	this.listener = namespace.getListeners;
	this.pipe = namespace.pipe;

	if (fast) {
		delete this.on;
		delete this.use;
		delete this.once;
		delete this.emit;
		delete this.pipe;
		this.on = this.onFast;
		this.once = this.onceFast;
		this.emit = this.emitFast;
	}

	return this;
}
