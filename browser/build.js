var fs = require('fs');

function load(name){ return fs.readFileSync(name, 'utf8') }

var wrapper = load('./wrapper.js');

var libs = [
  'utility',
  'buffer',
  'genesis',
  'numeric',
  'struct',
  'array',
  'bitfield',
  'index'
].map(function(name){
  return wrap('./'+name, load('../lib/'+name+'.js'));
});

function wrap(name, code){
  return wrapper.replace(/\/\*NAME\*\//g, name).replace(/\/\*CONTENT\*\//g, code);
}

libs.unshift(wrap('events', load('./event-emitter2.js')));


var output = [
  'var reified = function(global, imports){',
  libs.join('\n\n'),
  'return imports["./index"];',
  '}(this, {});',
  'if (typeof module !=="undefined") module.exports = reified'
].join('\n');

fs.writeFileSync('../reified-browser.js', output);

console.log(require('../reified-browser'));