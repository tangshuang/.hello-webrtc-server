var gulp = require('gulp')
var bufferify = require('gulp-bufferify')
var babel = require('gulp-babel')

gulp.src('src/hello-webrtc-server.js')
  .pipe(babel())
  .pipe(bufferify(function(content) {
    content = content.replace(/Object\.defineProperty\(exports,[\s\S]+?\);/gm, '')
    content = content.replace('exports.default = HelloWebRTCServer;', 'module.exports = HelloWebRTCServer;\n')
    return content
  }))
  .pipe(gulp.dest('dist'))