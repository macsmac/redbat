//// THIS FILE IS CONCATENATED WITH gulp-obfuscator-js
(function (native_require, this_module) {

    // Blatantly stolen from the fantastic node-obfuscator project by Stephen Mathieson
    //     https://github.com/stephenmathieson/node-obfuscator/blob/master/lib/require.js

    // based on TJ Holowaychuk's commonjs require binding

    function require(p, root) {
        // third-party module?  use native require
        if ('.' != p[0] && '/' != p[0]) {
            return native_require(p);
        }

        root = root || 'root';

        var path = require.resolve(p);

        // if it's a non-registered json file, it
        // must be at the root of the project
        if (!path && /\.json$/i.test(p)) {
            return native_require('./' + require.basename(p));
        }

        var module = require.cache[path];

        if (!module) {
            try {
                return native_require(p);
            } catch (err) {
                throw new Error('failed to require "' + p + '" from ' + root +'\n' +
                                                err.message + '\n' + err.stack);
            }
        }

        if (!module.exports) {
            module.exports = {};
            module.call(module.exports, module, module.exports,
                require.relative(path));
        }

        return module.exports;
    }

    // same as node's `require`
    require.cache = {};

    // node's native `path.basename`
    require.basename = native_require('path').basename;

    require.resolve = function (path) {
        // GH-12
        if ('.' != path[0]) {
            return native_require.resolve(path);
        }

        var pathWithSlash = path.slice(-1) === '/' ? path : path + '/';
        var paths = [
            path,
            path + '.js',
            pathWithSlash + 'index.js',
            path + '.json',
            pathWithSlash + 'index.json'
        ];

        for (var i in paths) {
            var p = paths[i];
            if (require.cache[p]) {
                return p;
            }
        }
    };

    require.register = function (path, fn) {
        require.cache[path] = fn;
    };

    require.relative = function (parent) {
        function relative(p) {
            if ('.' != p[0]) {
                return require(p);
            }

            var path = parent.split('/');
            var segs = p.split('/');
            path.pop();

            for (var i in segs) {
                var seg = segs[i];
                if ('..' == seg) {
                    path.pop();
                } else if ('.' != seg) {
                    path.push(seg);
                }
            }

            return require(path.join('/'), parent);
        }

        relative.resolve = require.resolve;
        relative.cache = require.cache;
        return relative;
    };

    //// BEGIN ORIGINAL SOURCE

    // BEGIN FILE ./index.js
    require.register("./index.js", function (module, exports, require) {

const Namespace = require("./namespace");

module.exports = {
	EventEmitter: function() {
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
}
    });
    // END FILE

    // BEGIN FILE ./namespace.js
    require.register("./namespace.js", function (module, exports, require) {

const overload = require("overload-js");
const async = require("async");

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
		const data = [].slice.call(arguments, 1);

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
		return namespace.listeners.filter(function(e, i) {
			if (e.ttl && e.ttl < Date.now()) {
				namespace.listeners.splice(i, 1);
				return false;
			}

			if (e.once) {
				namespace.listeners.splice(i, 1);
			}

			return e.type.indexOf(query) !== -1;
		});
	}
	this.removeListener = function(query) {
		return namespace.listeners.splice(namespace.listeners.findIndex(e => e.type.indexOf(query) !== -1), 1);
	}
	this.executeListeners = function(type, data, callback) {
		const listeners = namespace.getListeners(type);
		const shouldCallWithNext = listeners.length > 1;

		if (!listeners.length) {
			return callback();
		}

		if (shouldCallWithNext) {
			async.eachSeries(listeners, function(listener, callback) {
				listener.handler.apply(listener, data.concat(function(error) {
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
    });
    // END FILE

    //// END OF ORIGINAL SOURCE
    this_module.exports = require("./index.js");
} (require, module));
