/*
This file is not finished
*/

const redbat = require("../src");
const assert = require("assert");
const EventEmitter = redbat.EventEmitter;

var emitter;

describe("Init", function() {
	it("Should create EventEmitter instance", function() {
		emitter = new EventEmitter();

		assert.ok(emitter);
	});
});

describe("Namespaces", function() {
	it("namespace() should return default namespace", function() {
		assert.ok(emitter.namespace());
	});

	it("namespace() should create and return new namespace", function() {
		assert.ok(emitter.namespace("namespace1"));
	});

	it("on,once,emit,use methods should exist", function() {
		assert.ok(emitter.on);
		assert.ok(emitter.once);
		assert.ok(emitter.emit);
		assert.ok(emitter.use);
	});
});

describe("Listeners", function() {
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

	it("Listener should expire after 100 milliseconds", function(next) {
		emitter.on("ttl", 100, function() {
			next();
		}).emit("ttl");

		setTimeout(() => emitter.emit("ttl"), 200);
	});
});

/*
TODO: add a lot more tests .-.
*/