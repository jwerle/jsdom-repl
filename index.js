#!/usr/bin/env node

/**
 * Module dependencies
 */

var repl = require('repl')
  , dom = require('jsdom')
  , Batch = require('batch')
  , argv = require('minimist')(process.argv.slice(2))

var exit = process.exit;
var put = console.log.bind(console);
var tasks = new Batch().concurrency(1);
var runtime = null;
var window = null;

process.on('SIGINT', exit);

function help () {
  console.log("usage: jsdom-repl [-hV] [src] [--script=script]")
}

tasks.push(function (next) {
  var src = argv._[0] || '';

  if (argv.h || argv.help) {
    help();
    exit(0);
  } else if (argv.V || argv.version) {
    console.log("jsdom-repl v%s", require('./package').version);
    exit(0);
  }

  runtime = dom.env(src, [].concat(argv.script || []), ready);

  function ready (err, win) {
    if (err) {
      return next(err);
    }

    window = win;
    next();
  }
});

tasks.push(function (next) {
  var r = repl.start({
    prompt: 'dom> ',
    input: process.stdin,
    output: process.stdout,
    useGlobal: false,
    eval: oneval
  });

  r.context = window;
  window.console = console;

  r.on('exit', function () {
    put()
    put("bye : ]");
    exit(0)
  });

  function oneval (src, context, filename, done) {
    src = src.substr(1)
    src = src.substr(0, src.length - 1);
    try {
      var res = context.eval(src);
      done(null, res);
    } catch (e) {
      done(e);
    }
  }
});

tasks.end(function (err) {
  if (err) {
    console.error(err.message);
    exit(1);
  }
});
