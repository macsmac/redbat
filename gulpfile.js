const gulp = require("gulp");
const concat = require("gulp-concat-js");

gulp.task("js", function() {
	return gulp.src("./src/**/*.js")
		.pipe(concat({
			target: "index.js",
			entry: "./index.js"
		}))
		.pipe(gulp.dest("./build"));
});

gulp.task("default", ["js"]);