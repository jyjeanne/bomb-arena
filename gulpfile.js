var gulp = require('gulp'),
	browserify = require('browserify'),
	watchify = require('watchify'),
	buffer = require('vinyl-buffer'),
	connect = require('gulp-connect'),
	source = require('vinyl-source-stream');

const paths = {
	entry: './client/src/main.js',
	dist: './client/dist/'
};

// Gulp 4: Use function for compile task
function compile(done) {
	var bundler = browserify(paths.entry, watchify.args);

	var bundle = function() {
		console.log('Bundling...');
		return bundler
			.bundle()
			.on('error', function(err) {
				console.error(err.toString());
				this.emit('end');
			})
			.pipe(source('bomb_arena.min.js'))
			.pipe(buffer())
			// Skip uglify - doesn't support ES6
			.pipe(gulp.dest(paths.dist))
			.pipe(connect.reload());
	};

	bundler = watchify(bundler);
	bundler.on('update', function() {
		console.log('File changed, rebundling...');
		bundle();
	});
	bundler.on('log', console.log);

	return bundle();
}

function connectServer() {
	return connect.server({
		root: [__dirname + '/client'],
		port: 9000,
		livereload: true
	});
}

// Gulp 4: Export tasks
exports.compile = compile;
exports.connect = connectServer;
exports.default = gulp.parallel(connectServer, compile);
