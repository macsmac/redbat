const overload = require("overload-js");
const async = require("async");
const _ = require("lodash");

const o = overload.o;

module.exports = function() {
	const namespace = this;

	this.listeners = [];
	this.middlewares = [];

	this._on = function(type, ttl, once, handler) {
		if (!Array.isArray(type)) {
			type = [type];
		}

		const listener = {
			type: type,
			ttl: ttl ? ttl + Date.now() : null,
			handler: handler,
			once: once
		}

		namespace.listeners.push(listener);

		return namespace;
	}
	/*
		Probably should refactor this ;-;
		My eyes are bleeding when I'm reading it
		(My fingers where bleeding when I was writing this)
		Please refactor it for me

		:: Can't find how to do it even in overloadjs doc
	*/
	this.on = overload()
		.args(o.any(String, Array), Function).use((type, handler) => namespace._on(type, 0, false, handler))
		.args(o.any(String, Array), Number, Function).use((type, ttl, handler) => namespace._on(type, ttl, false, handler));
	this.once = overload()
		.args(o.any(String, Array), Function).use((type, handler) => namespace._on(type, 0, true, handler))
		.args(o.any(String, Array), Number, Function).use((type, ttl, handler) => namespace._on(type, ttl, true, handler));

	this.emit = function(type, callback) {
		const data = _.slice(arguments, 1);

		namespace.executeMiddlewares(type, data, function() {
			namespace.executeListeners(type, data, function() {
				if (typeof callback === "function") {
					callback();
				}
			});
		});

		return namespace;
	}

	this.use = function(handler) {
	 	namespace.middlewares.push(handler);

	 	return namespace;
	}

	this.getRandomID = function() {
		return Math.round(Math.random() * 1000000);
	}
	this.getListeners = function(query) {
		return _.filter(namespace.listeners, function(e, i) {
			if (!e) {
				return false;
			}

			if (e.ttl && e.ttl < Date.now()) {
				namespace.listeners.splice(i, 1);
				return false;
			}

			if (e.once) {
				namespace.listeners.splice(i, 1);
			}

			return _.indexOf(e.type, query) !== -1;
		});
	}
	/*this.removeListener = function(query) {
		return namespace.listeners.splice(namespace.listeners.findIndex(e => e.type.indexOf(query) !== -1), 1);
	}*/
	this.executeListeners = function(type, data, callback) {
		const listeners = namespace.getListeners(type);
		const shouldCallWithNext = listeners.length > 1;

		if (!listeners.length) {
			return callback();
		}

		if (shouldCallWithNext) {
			async.eachSeries(listeners, function(listener, callback) {
				listener.handler.apply(listener, _.concat(data, function(error) {
					callback(error || null);
				}));
			}, function(error) {
				if (error) {
					throw error;
				}

				callback();
			});
		} else {
			listeners[0].handler.apply(listeners[0], data);

			callback();
		}
	}
	this.executeMiddlewares = function(type, data, callback) {
		async.eachSeries(namespace.middlewares, function(handler, callback) {
			handler(data, function(error) {
				callback(error || null);
			});
		}, callback);
	}

	return this;
}