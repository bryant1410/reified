"use strict";

var D     = require('./utility').desc;
var sLoop = require('./utility').sLoop;
var isObject = require('./utility').isObject;
var ViewBuffer = require('./buffer');

var types = { };


module.exports = {
  Type: Type,
  initType: initType,
  lookupType: lookupType,
  types: types,
};



function registerType(name, type){
  if (!(name in types) && name.length) types[name] = type;
  return type;
}

function lookupType(name){
  return (typeof name === 'string' && name) ? types[name] : name;
}


// ########################
// ### Genesis for Type ###
// ########################

function Type(ctor, proto){
  ctor.__proto__ = Type;
  ctor.prototype = eval('(function Empty'+ctor.name.replace(/Type$/,'T')+'(){})');
  ctor.prototype.__proto__ = ctor;
  Object.defineProperties(ctor.prototype, {
    constructor: D._C_(ctor),
    inspect:     D._CW(require('./utility').inspectors.Type[ctor.name]),
  });
  ctor.prototype.prototype = proto;
  ctor.prototype.prototype.__proto__ = Type.prototype;
  ctor.prototype.prototype.inspect = require('./utility').inspectors.Data[ctor.name];
}

Object.defineProperties(Type, {
  Class:      D._C_('Type'),
  toString:   D._CW(function toString(){ return '[object Type]' }),
  array:      D.ECW(function array(n){ return new (require('./array'))(this, n) }),
  isInstance: D.ECW(function isInstance(o){ return this.prototype.isPrototypeOf(o) }),
});

function initType(name, bytes, ctor){
  var iface = Function(name+'Constructor', 'return function '+name+'(buffer, offset, values){ return new '+name+'Constructor(buffer, offset, values) }')(ctor);
  if (iface.__proto__) {
    ctor.__proto__ = iface.__proto__ = this.prototype;
  } else {
    Object.getOwnPropertyNames(Type).filter(function(prop){
      return !Function.prototype.hasOwnProperty(prop);
    }).forEach(function(prop){
      Object.defineProperty(iface, prop, Object.getOwnPropertyDescriptor(Type, prop));
    });
  }

  Object.defineProperty(iface, 'bytes', D._C_(bytes));

  ctor.prototype = iface.prototype = Object.create(this.prototype.prototype, {
    constructor: D._CW(iface),
    bytes: D._C_(bytes),
  });
  if (name) registerType(name, iface);
  return iface;
}


// ########################
// ### Genesis for Data ###
// ########################

var Data = Type.prototype = {
  rebase: function rebase(buffer){
    if (buffer == null) {
      buffer = new ViewBuffer(this.bytes);
      buffer.fill(0);
    } else {
      while (buffer.buffer) buffer = buffer.buffer;
      buffer = ViewBuffer.isInstance(buffer) ? buffer : new ViewBuffer(buffer);
    }
    Object.defineProperty(this, 'buffer', D._CW(buffer));
  },
  clone: function clone(){
    return new this.constructor(this.buffer, this.offset);
  },
  copy: function copy(buffer, offset){
    var copied = new this.constructor(buffer, offset);
    this.buffer.copy(copied.buffer, copied.offset, this.offset, this.offset + this.bytes);
    return copied;
  }
}

Object.defineProperties(Data, {
  Class:    D._C_('Data'),
  toString: D._CW(function toString(){ return '[object Data]' }),
});