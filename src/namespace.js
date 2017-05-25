const overload = require("overload-js");
const async = require("async");
const _ = require("lodash");

const o = overload.o;

module.exports = function() {
	const namespace = this;

	this.listeners = [];
	this.middlewares = [];

	this._on = function(type, ttl, once, handler) {
		var _resolve;
		var noHandler = !handler;

		if (noHandler) {
			handler = function() { 
				_resolve(_.slice(arguments));
			}
		}

		const listener = {
			type: type,
			ttl: ttl ? ttl + Date.now() : null,
			handler: handler,
			once: once
		}

		namespace.listeners.push(listener);

		return noHandler ? (new Promise(function(resolve, reject) {
			_resolve = function(args) {
				resolve.apply(namespace, args);
			}
		})) : namespace;
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
	this.wait = (type, ttl) => namespace._on(type, ttl, true, undefined);

	this.emit = function(type) {
		const data = _.slice(arguments, 1);

		namespace.executeMiddlewares(type, data, function() {
			namespace.executeListeners(type, data);
		});

		return namespace;
	}

	this.use = function(handler) {
	 	namespace.middlewares.push(handler);

	 	return namespace;
	}

	this.getListeners = function(query) {
		return _.filter(namespace.listeners, function(e, i) {
			if (!e) {
				return false;
			}

			if (e.once) {
				namespace.listeners.splice(i, 1);
			}

			if (!e.ttl && e.type === query) {
				return true;
			}

			if (e.ttl && e.ttl < Date.now()) {
				namespace.listeners.splice(i, 1);
				return false;
			}

			return typeof e.type === "object" ? _.indexOf(e.type, query) !== -1 : e.type === query;
		});
	}
	/*this.removeListener = function(query) {
		return namespace.listeners.splice(namespace.listeners.findIndex(e => e.type.indexOf(query) !== -1), 1);
	}*/
	this.executeListeners = function(type, data) {
		const listeners = namespace.getListeners(type);
		const shouldCallWithNext = listeners.length > 1;

		if (!listeners.length) {
			return;
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
			});
		} else {
			if (!data.length || data.length === 1) { // just for optimization, want to beat eventemitter2 lol
				return listeners[0].handler(data[0]);
			}

			listeners[0].handler.apply(listeners[0], data);
		}
	}
	this.executeMiddlewares = function(type, data, callback) {
		if (!namespace.middlewares.length) return callback();

		async.eachSeries(namespace.middlewares, function(handler, callback) {
			const next = function(error) {
				callback(error || null);
			}
			const args = [type, data, handler.length > 2 ? next : undefined];

			handler.apply(namespace, args);

			if (handler.length === 2) next();
		}, callback);
	}

	return this;
}