var gulp = require('gulp'),
	browserify = require('browserify'),
	connect = require('gulp-connect'),
	fs = require('fs'),
	path = require('path');

const paths = {
	entry: './client/src/main.js',
	dist: './client/dist/',
	output: './client/dist/bomb_arena.min.js'
};

// Use native fs instead of gulp streams to avoid vinyl errors
function compile(done) {
	console.log('Bundling...');

	const bundler = browserify(paths.entry);

	// Ensure dist directory exists
	if (!fs.existsSync(paths.dist)) {
		fs.mkdirSync(paths.dist, { recursive: true });
	}

	// Bundle to file using fs
	bundler.bundle(function(err, buf) {
		if (err) {
			console.error('Browserify error:', err.toString());
			done(err);
			return;
		}

		fs.writeFile(paths.output, buf, function(writeErr) {
			if (writeErr) {
				console.error('Write error:', writeErr.toString());
				done(writeErr);
				return;
			}

			const sizeKB = (buf.length / 1024).toFixed(2);
			console.log(`Bundling complete: ${sizeKB} KB written to ${paths.output}`);
			done();
		});
	});
}

function connectServer() {
	return connect.server({
		root: [__dirname + '/client'],
		port: 9000,
		livereload: true
	});
}

// Watch task for development
function watch() {
	gulp.watch('client/src/**/*.js', compile);
}

// Export tasks
exports.compile = compile;
exports.connect = connectServer;
exports.watch = watch;
exports.default = gulp.series(compile, gulp.parallel(connectServer, watch));
