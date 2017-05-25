const Namespace = require("./namespace");
const _ = require("lodash");

module.exports = function() {
	this.DEFAULT_NAMESPACE = "default";
	this.namespaces = {};
	this.connected = [];

	this.namespaces[this.DEFAULT_NAMESPACE] = new Namespace();

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
	this.onFast = function(event, handler) {
		namespace.listeners.push({
			type: event,
			handler: handler
		});
		return namespace;
	}
	this.once = namespace.once;
	this.onceFast = function(event, handler) {
		namespace.listeners.push({
			type: event,
			handler: handler,
			once: true
		});
		return namespace;
	}
	this.wait = namespace.wait;
	this.emit = function() {
		if (this.connected.length) _.each(this.connected, e => e.emit.apply(e, arguments));
		return namespace.emit.apply(this, arguments);
	};
	this.use = namespace.use;
	this.listener = namespace.getListeners;
	this.pipe = function(emitter) {
		this.connected.push(emitter);
	}

	return this;
}