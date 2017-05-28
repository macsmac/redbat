const Namespace = require("./namespace");
const _ = require("lodash");

module.exports = function(options) {
	const emitter = this;

	options = _.defaults(options, {
		fast: false,
		defaultNamespace: "default",
		id: Math.random()
	});

	this._id = options.id;

	this.namespaces = {};

	this.namespaces[options.defaultNamespace] = new Namespace(this._id, emitter);

	this.namespace = function(name) {
		if (!name) return this.namespaces[options.defaultNamespace];

		if (!this.namespaces[name]) {
			return this.namespaces[name] = new Namespace(null, emitter);
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
	this.unpipe = namespace.unpipe;

	if (options.fast) {
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
