const EventEmitter2 = require("eventemitter2").EventEmitter2;
const EventEmitterRedBat = require("./build").EventEmitter;

const Benchmark = require("benchmark");
const suite = new Benchmark.Suite();

const emitter2 = new EventEmitter2();
const emitterrb = new EventEmitterRedBat();

suite
	.add("once#EventEmitter2", function() {
		emitter2.once("test", function() {
		});
		emitter2.emit("test");
	})
	.add("once#EventEmitterRedBat", function() {
		emitterrb.onceFast("test", function() {
		}).emit("test");
	})
	.on("cycle", function(event) {
		console.log(String(event.target));
	})
	.on("complete", function() {
		console.log("Fastest is " + this.filter("fastest").map("name"));
	})
	.run({
		async: true
	});