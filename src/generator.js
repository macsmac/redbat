const EventEmitter = require("./eventemitter");

module.exports = function() {
	var self = this;

	this.methods = {};
	
	this.Generator = function() {
		var gen = this;

		EventEmitter.apply(this);

		Object.keys(self.methods).forEach(function(method) {
			if (gen[method]) {
				throw new Error("Method '" + method + "' already exists");
			}

			gen[method] = self.methods[method];
		});
	}	
}