var util = require('util');

"use strict";

module.exports = {
  isObject: isObject,
  sLoop: sLoop,
  desc: desc,
  inspect: ins,
  color: color,
  enableColor: !require('repl').disableColors,
  MAKE_ALL_ENUMERABLE: function makeEnumerable(){ desc.allEnumerable = true },
};

function isObject(o){ return Object(o) === o }

function sLoop(n, cb){ return Array.apply(null, Array(n)).map(Function.call.bind(cb), this); }



function desc(flags, value){
  return {
    value        : value,
    enumerable   : desc.allEnumerable || Boolean(flags & ENUMERABLE),
    configurable : Boolean(flags & CONFIGURABLE),
    writable     : Boolean(flags & WRITABLE),
  };
}

var PRIVATE      = 0,
    ENUMERABLE   = 1,
    CONFIGURABLE = 2,
    READONLY     = 3,
    WRITABLE     = 4,
    FROZEN       = 5,
    HIDDEN       = 6,
    NORMAL       = 7;

function attachFlags(o){
  o.___ = desc.bind(null, PRIVATE     );
  o.E__ = desc.bind(null, ENUMERABLE  );
  o._C_ = desc.bind(null, CONFIGURABLE);
  o.EC_ = desc.bind(null, READONLY    );
  o.__W = desc.bind(null, WRITABLE    );
  o.E_W = desc.bind(null, FROZEN      );
  o._CW = desc.bind(null, HIDDEN      );
  o.ECW = desc.bind(null, NORMAL      );
}

attachFlags(desc);



var names = [ 'black',   'red',      'green',  'yellow',
              'blue',    'magenta',  'cyan',   'white',
              'bblack',  'bred',     'bgreen', 'byellow',
              'bblue',   'bmagenta', 'bcyan',  'bwhite', ];

var colors = {};
var esc = '\u001b[';
for (var i = 16; i-- > 0;) {
  colors[names[i]] = [esc+(i > 7 ? '1;':'')+(i%8+30)+'m',
                      esc+(i > 7 ?'2;':'')+'39m']
}
for (var i = 0; i++ < 8;) {
  names.push('bg'+names[i]);
  colors['bg'+names[i]] = [esc+(i+40)+'m', esc+'49m']
}
for (var i = 0; i++ < 8;) {
  names.push('bg'+names[i+8]);
  colors['bg'+names[i+8]] = [esc+(i+100)+'m', esc+'25;49m']
}


function color(text, name){
  return module.exports.enableColor ? colors[name][0]+text+colors[name][1] : text;
}

names.forEach(function(name){
  var wrap = colors[name];
  color[name] = function(text){ return module.exports.enableColor ? wrap[0]+text+wrap[1] : text }
  color['L'+name] = function(text){ return module.exports.enableColor ? wrap[0]+text : text }
  color['R'+name] = function(text){ return module.exports.enableColor ? text+wrap[1] : text }
})

function ins(object, depth, hidden, colors){
  if (colors === false) module.exports.enableColor = colors;
  return indent(util.inspect(object, hidden, depth||6, colors), (6-depth)*2||0);
}

function indent(str, amount){
  return !~str.indexOf('\n') ? str : str.split('\n').map(function(line){ return Array(amount+1).join(' ')+line }).join('\n').replace(/^  /, '');
}

function strlen(str){
  return str.replace(/\033\[(?:\d+;)*\d+m/g, '').length;
}


module.exports.arrayInspect = function(){

  var depths = [ 'bmagenta', 'magenta', 'red',  'bred'];

  return function inspect(depth){
    var length = 0;
    var fields = this.map(function(item){
       item = ins(item, depth-1);
       length += strlen(item);
       return item;
     }, this);

    var sep = length > 60 ? '\n  ' : ' ';
    return '[ '+color[depths[6-depth]||'bblack']('<'+this.constructor.name+'>')+sep+fields.join(','+sep)+' ]';
  }
}();
//'«'++'»'
module.exports.structInspect = function(){

  var depths = [ 'bcyan', 'cyan', 'bblue',  'blue'];
  var namescolors = ['byellow', 'yellow', 'bgreen', 'green'];

  return function inspect(depth){
    var length = 0;
    var fields = this.constructor.names.map(function(field){
       field = color[depths[6-depth]||'bblack'](field+': ') + ins(this[field], depth-1);
       length += strlen(field);
       return field;
     }, this);

    var sep = length > 60 ? '\n  ' : ' ';
    return '{ '+color[namescolors[6-depth]||'bblack']('<'+this.constructor.name+'>')+sep+fields.join(','+sep)+' }';
  }
}();

module.exports.numberInspect = function inspect(){
  return color.magenta('<'+this.dataType+' '+color.bmagenta(this.reify())+color.magenta('>'))
}

module.exports.numberTypeInspect = function inspect(){
  return color.magenta('['+this.name+': '+this.bytes+'b]');
}

module.exports.structTypeInspect = function inspect(depth){
  var length = 0;
  var fields = this.names.map(function(field){
     field = field+': ' + ins(this.fields[field], depth-1);
     length += strlen(field);
     return field;
   }, this);
  var sep = length > 60 ? '\n  ' : ' ';
  return '{ ['+this.name+': '+this.bytes+'b]'+sep+fields.join(','+sep)+' }';
}