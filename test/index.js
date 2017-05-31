const redbat = require("../src");
const assert = require("assert");
const EventEmitter = redbat.EventEmitter;

var emitter;

describe("Init", function() {
	it("Should create EventEmitter instance", function(next) {
		emitter = new EventEmitter();

		assert.ok(emitter);

		next();
	});

	it("EventEmitter should have some id", function(next) {
		assert.ok(emitter._id);

		next();
	});

	it("EventEmitter should have same id with default namespace", function(next) {
		assert.equal(emitter.namespace()._id, emitter._id);

		next();
	});
});

describe("Namespaces", function() {
	it("namespace() should return default namespace", function(next) {
		assert.ok(emitter.namespace());

		next();
	});

	it("namespace() should create and return new namespace", function(next) {
		assert.ok(emitter.namespace("namespace1"));

		next();
	});

	it("on,once,emit,use methods should exist", function(next) {
		assert.ok(emitter.on);
		assert.ok(emitter.once);
		assert.ok(emitter.emit);
		assert.ok(emitter.use);

		next();
	});

	it("Should pipe events from namespace 'foo' to 'bar'", function(next) {
		emitter.namespace("foo")
			.pipe(
				emitter.namespace("bar")
					.on("test", function() {
						next();
					})
			)
			.emit("test")
	});

	it("Should unpipe events from namespace '1' to '2'", function(next) {
		emitter.namespace("2")
			.on("test", function() {
				next();
			});

		emitter.namespace("1")
			.pipe(emitter.namespace("2"))
			.emit("test")
			.unpipe(emitter.namespace("2"))
			.emit("test");
	});

	it("Should remove namespaces in EventEmitter", function() {
		const emitter2 = new redbat.EventEmitter();

		["a", "z", "e", "r", "t", "y"].map(emitter2.namespace);

		emitter2.reset("all");

		assert.equal(Object.keys(emitter2.namespaces).length, 1);
	});

	it("Should reset all namespaces in EventEmitter", function() {
		const emitter2 = new redbat.EventEmitter();

		["a", "z", "e", "r", "t", "y"].map(n => emitter2.namespace(n).wait("test"));

		emitter2.reset("namespaces");

		assert.equal(Object.keys(emitter2.namespaces).length, 7);
		assert.equal(emitter2.namespace("e").listeners.length, 0);
	});

	it("Should freeze and unfreeze namespace 'bled'", function(next) {
		emitter.namespace("bled").on("test", function() {
			assert.ok(false);
		}).freeze().emit("test").unfreeze().on("testo", function() {
			next();
		}).emit("testo");
	});

	it("Should freeze event '999'", function(next) {
		emitter.on("999", function() {
			assert.ok(false);
		}).on("888", function() {
			next();
		}).freeze("999").emit("999").emit("888");
	});
});

describe("Listeners", function() {
	beforeEach(function() {
		emitter.namespace().listeners = [];
	});

	it("Should create and call listener once", function(next) {
		emitter.once("event2", function() {
			assert.ok(false);
		}).once("event1", function(a, b) {
			assert.ok(a);
			assert.ok(b);
			next();
		}).emit("event1", 1, 2).emit("event1", 1, 2);
	});

	it("Should call listener twice", function(next) {
		var i = 0;

		emitter.on("event1", function() {
			i++;

			if (i == 2) {
				next();
			}
		}).emit("event1").emit("event1");
	});

	it("Should call sequence of 2 listeners with next", function(next) {
		var s = [];

		emitter.on("ev", function(nextm) {
			s.push(1);
			nextm();
		}).on("ev", function(nextm) {
			s.push(2);

			assert.equal(s.join(""), "12");

			nextm();
			next();
		}).emit("ev");
	});

	it("Listener should expire after 100 milliseconds", function(next) {
		var s = [];

		emitter.on("ttl", 100, function() {
			s.push(1);
		}).emit("ttl");

		setTimeout(function() {
			emitter.emit("ttl");
			assert.equal(s.join(""), "1");
			next();
		}, 200);
	});

	it("Listener should be triggered by ev1,ev2 events", function(next) {
		emitter.on(["ev1", "ev2"], function(s) {
			if (s) {
				next();
			}
		}).emit("ev1").emit("ev2", 1);
	});

	it("Listener should be triggered by ev(any symbol here) / regexp testing", function(next) {
		emitter.on(/ev./, function() {
			next();
		})
		.on("another", function() {
			assert.ok(false);
		})
		.emit("ev9");
	});
});

describe("Middlewares", function() {
	beforeEach(function() {
		emitter.namespace().middlewares = [];
		emitter.namespace().listeners = [];
		emitter.namespace().catches = [];
	});

	it("Should call sequence of 2 middlewares with type 'just an event'", function(next) {
		var s = [];

		emitter.use(function(type, args, nextm) {
			assert.equal(type, "just an event");
			s.push(1);
			setTimeout(() => nextm(), 250);
		});
		emitter.use(function(type, args, nextm) {
			s.push(2);
			setTimeout(() => nextm(), 250);
		});
		emitter.on("just an event", function() {
			assert.equal(s.join(""), "12");
			next();
		}).emit("just an event");
	});

	it("Should call sequence of 2 middlewares without next", function(next) {
		var s = [];

		emitter.use(function(type, args) {
			s.push(1);
		});
		emitter.use(function(type, args) {
			s.push(2);
		});
		emitter.on("just an event", function() {
			assert.equal(s.join(""), "12");
			next();
		}).emit("just an event");
	});

	it("Should process and handle middleware error", function(next) {
		emitter
			.use(function(type, args, next) {
				next("test");
			})
			.catch(function(type, args, error, _next) {
				assert.equal(type, "test");
				assert.equal(error, "test");
				assert.ok(_next);

				_next();
				next();
			})
			.emit("test", 1, 2);
	});

	it("Should throw middleware error", function(next) {
		try {
			emitter
				.use(function(type, args, next) {
					next("test");
				})
				.emit("test", 1, 2);
		} catch(e) {
			assert.equal(e, "test");

			next();
		}
	});
});
