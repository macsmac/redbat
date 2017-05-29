const overload = require("overload-js");
const async = require("async");
const _ = require("lodash");

const o = overload.o;

const Namespace = function(id, emitter) {
	const namespace = this;

	this.listeners = [];
	this.middlewares = [];
	this.catches = [];
	this.connected = [];

	this._id = id || Math.random();

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
		.args(o.any(RegExp, String, Array), Function).use((type, handler) => namespace._on(type, 0, false, handler))
		.args(o.any(RegExp, String, Array), Number, Function).use((type, ttl, handler) => namespace._on(type, ttl, false, handler));
	this.once = overload()
		.args(o.any(RegExp, String, Array), Function).use((type, handler) => namespace._on(type, 0, true, handler))
		.args(o.any(RegExp, String, Array), Number, Function).use((type, ttl, handler) => namespace._on(type, ttl, true, handler));
	this.wait = (type, ttl) => namespace._on(type, ttl, true, undefined);

	this.delete = function(query) {
		namespace.getListeners(query, true);
		return namespace;
	}

	this.pipe = function() {
		[].push.apply(namespace.connected, namespace.namespacifyAll(arguments));
		return namespace;
	}

	this.unpipe = function(target) {
		target = namespace.namespacify(target);

		_.each(namespace.connected, function(e, i) {
			if (e._id === target._id) {
				namespace.connected.splice(i, 1);
			}
		});
	}

	this.onFast = function(event, handler) {
		namespace.listeners.push({
			type: event,
			handler: handler
		});
		return namespace;
	}
	this.onceFast = function(event, handler) {
		namespace.listeners.push({
			type: event,
			handler: handler,
			once: true
		});
		return namespace;
	}

	this.emit = function(type) {
		const args = _.slice(arguments);
		const data = _.slice(args, 1);

		_.each(namespace.connected, e => e && e.emit.apply(e.namespace ? e.namespace() : e, args));

		namespace.executeMiddlewares(type, data, function(error) {
			if (namespace.triggerError(type, data, error)) return; // probably should refactor this
			namespace.executeListeners(type, data, function(error) {
				namespace.triggerError(type, data, error);
			});
		});

		return namespace;
	}

	this.emitFast = function(type) {
		const data = _.slice(arguments, 1);

		_.each(namespace.listeners, function(listener) {
			if (typeof listener.type === "string" ? listener.type === type : _.indexOf(listener.type, type) !== -1) {
				listener.handler.apply(namespace, data);
			}
		});
	}

	this.use = function(handler) {
	 	namespace.middlewares.push(handler);

	 	return namespace;
	}
	this.catch = function(handler) {
		namespace.catches.push(handler);

		return namespace;
	}

	this.getListeners = function(query, del) {
		return _.filter(namespace.listeners, function(e, i) {
			if (!e) {
				return false;
			}

			if (e.once) {
				namespace.listeners.splice(i, 1);
			}

			/*if (!e.ttl && e.type === query) {
				return true;
			}*/

			if (e.ttl && e.ttl < Date.now()) {
				namespace.listeners.splice(i, 1);
				return false;
			}

			var ok;

			if (e.type instanceof RegExp) {
				ok = e.type.test(query);
			} else if (Array.isArray(e.type)) {
				ok = _.indexOf(e.type, query) !== -1;
			} else {
				ok = e.type === query;
			}

			if (ok && del) {
				namespace.listeners.splice(i, 1);
			}

			return ok;
		});
	}

	this.executeListeners = function(type, data, callback) {
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
				callback(error || null);
			});
		} else {
			if (data.length < 2) { // just for optimization, want to beat eventemitter2 lol
				return listeners[0].handler(data[0]);
			}

			callback(listeners[0].handler.apply(listeners[0], data));
		}
	}
	this.executeChain = function(chain, getArgs, handlerExecuted, callback) {
		if (!chain.length) return callback();

		async.eachSeries(chain, function(handler, callback) {
			const next = function(error) {
				callback(error || null);
			}

			const result = handler.apply(namespace, getArgs(handler, next));

			handlerExecuted(handler, result, next);
		}, callback);
	}
	this.executeMiddlewares = function(type, data, callback) {
		namespace.executeChain(
			namespace.middlewares,
			(handler, next) => [type, data, handler.length > 2 ? next : undefined],
			function(handler, result, next) {
				if (handler.length < 3) {
					next(result);
				}
			},
			callback
		);
	}
	this.triggerError = function(type, args, error) {
		if (!error) return;
		if (!namespace.catches.length) throw error;

		namespace.executeChain(
			namespace.catches,
			(handler, next) => [type, args, error, next],
			function(handler, result, next) {
				if (handler.length < 4) {
					next(result); // lol, this will fall in recursion if error handler will also end with error
				}
			},
			function() {} // dummy function
		);

		return true;
	}

	this.namespacifyAll = function(data) {
		return _.map(data, namespace.namespacify);
	}
	this.namespacify = function(query) {
		if (query instanceof Namespace) {
			return query;
		} else {
			return emitter.namespace(query);
		}
	}
	this.namespace = emitter.namespace;

	return this;
}

module.exports = Namespace;
