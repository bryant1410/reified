"use strict";

var util = require('util');

module.exports = {
  isObject: isObject,
  sLoop: sLoop,
  desc: desc,
  inspect: ins,
  color: color,
  enableColor: false,
  MAKE_ALL_ENUMERABLE: function makeEnumerable(){ desc.allEnumerable = true },
  bytes: bytes,
  bits: bits
};

function isObject(o){ return Object(o) === o }

function sLoop(n, cb){ return Array.apply(null, Array(n)).map(Function.call.bind(cb), this); }

function bits(n){ return Math.log(n) / Math.LN2 }
function bytes(n){ return ((bits(n) / 8) | 0) + 1 }


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


function color(text, name, brackets){
  if (module.exports.enableColor) {
    return colors[name][0]+text+colors[name][1];
  } else {
    return brackets ? brackets[0]+text+brackets[1] : text;
  }
}

names.forEach(function(n){
  color[n] = function(t, b){ return color(t, n, b) }
})

function ins(object, depth, hidden, colors){
  module.exports.enableColor = require('repl').disableColor === false// || true;
  return util.inspect(object, hidden, depth||6, colors);
}

function indent(str, amount){
  var space = Array((amount||2)+1).join(' ');
  return str.split('\n').map(function(line){ return space+line }).join('\n');
}

function strlen(str){
  return str.replace(/\033\[(?:\d+;)*\d+m/g, '').length;
}

function pad(str, len){
  len -= strlen(str||'') + 1;
  return str + Array(len > 1 ? len : 1).join(' ');
}

function maxLength(array){
  if (!Array.isArray(array)) {
    if (!isObject(array)) throw new TypeError('Max length called on non-object ' + array);
    array = Object.keys(array);
  }
  return array.reduce(function(max, item){ return Math.max(max, strlen(''+item)) }, 0);
}


module.exports.numberInspect = function inspect(){
  return color.magenta(this.DataType, '<>')+' '+color.bmagenta(this.reify());
}

module.exports.numberTypeInspect = function inspect(){
  return color.bmagenta(this.name, '‹›');
}

module.exports.arrayInspect = function inspect(depth){
  var fields = util.inspect(this.map(function(item){ return item }), false, depth-1);
  var sep = strlen(fields) > 60 ? '\n' : ' ';
  return color.yellow(this.constructor.name, '<>')+sep+fields;
}

module.exports.arrayTypeInspect = function inspect(depth){
  var label = color.byellow(this.name, '‹›') + color.bblue('('+this.bytes+'b)');
  var memberType = util.inspect(this.memberType, depth-1);
  if (~memberType.indexOf('\n') || strlen(memberType) > 60) {
    label += '\n';
    memberType = indent(memberType).slice(2);
  } else {
    label + ' '
  }
  return label+'[ '+this.count+' '+memberType+' ]';
}

module.exports.structInspect = function inspect(depth){
  var length = 0;
  var fields = this.constructor.names.map(function(field){
    field = [field, util.inspect(this[field], false, depth-1)];
    length += strlen(field[0]) + strlen(field[1]);
    return field;
  }, this);

  var label = color.cyan(this.constructor.name, '<>');
  if (length > 60) {
    var max = maxLength(this.constructor.names)+4;
    return label + '\n| '+fields.map(function(field){ return pad(field[0]+': ', max) + field[1] }).join('\n| ');
  } else {
    return label+' { '+fields.map(function(field){ return field.join(': ') }).join(' | ') + ' }';
  }
}

module.exports.structTypeInspect = function inspect(depth){
  var length = 0;
  var fields = this.names.map(function(field){
    field = [color.bwhite(field), util.inspect(this.fields[field], false, depth-1)];
    length += strlen(field[0]) + strlen(field[1]);
    return field;
  }, this);

  var label = color.bcyan(this.name, '‹›') + color.bblue('('+this.bytes+'b)');
  if (length > 60) {
    var max = maxLength(this.names)+4;
    return label+'\n| '+fields.map(function(field){ return pad(color.bwhite(field[0]+':'), max) + field[1] }).join('\n| ');
  } else {
    return label+' { '+fields.map(function(field){ return color.bwhite(field[0]+': ')+field[1] }).join(' | ') + ' }';
  }
}

module.exports.bitfieldInspect = function inspect(depth){
  var label = color.green(this.constructor.name || 'Bitfield', '‹›');
  var flags = Object.keys(this.flags);
  if (!flags.length) {
    return label + '['+this+']';
  } else {
    var max = maxLength(this.flags)+4;
    return '{ '+label +'\n  ' + flags.map(function(flag, index){
      return pad(color.bwhite(flag+':'), max) + color.green(this[flag]);
    }, this).join(',\n  ') + ' }';
  }
}

module.exports.bitfieldTypeInspect = function inspect(depth){
  var label = color.bgreen(this.name || 'Bitfield', '‹›') + color.bblue('('+this.bytes*8+'bit)');
  var flags = Object.keys(this.flags);
  if (!flags.length) {
    return label;
  } else {
    return label+'\n'+flags.map(function(flag){
      return '  '+pad(color.bgreen('0x'+this.flags[flag].toString(16)), Math.log(this.bytes+1.3)*10|0) + flag;
    }, this).join('\n');
  }
}