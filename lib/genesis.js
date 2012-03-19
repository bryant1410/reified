"use strict";

var D          = require('./utility').desc;
var sLoop      = require('./utility').sLoop;
var isObject   = require('./utility').isObject;
var inspectors = require('./utility').inspectors;
var ViewBuffer = require('./buffer');

var hasProto = !!Function.__proto__;
var types = {};


module.exports = {
  Type: Type,
  Subtype: Subtype,
  lookupType: lookupType,
  types: types,
};



function registerType(name, type){
  if (!(name in types) && name.length) types[name] = type;
  return type;
}

function lookupType(name){
  if (typeof name === 'string') {
    if (!(name in types)) throw new Error('Type not found "'+name+'"');
    return types[name];
  } else if (name && name.Class === 'Type') {
    return name;
  } else {
    throw new Error ('Tried to lookup non-string non-type: '+name);
  }
}


// ########################
// ### Genesis for Type ###
// ########################

function Type(ctor, proto){
  ctor.prototype = eval('(function Empty'+ctor.name.replace(/Type$/,'T')+'(){})');
  if (hasProto) {
    ctor.prototype.__proto__ = Type;
  } else {
    copy(Type, ctor.prototype);
  }
  ctor.prototype.constructor = ctor,
  ctor.prototype.inspect = inspectors.Type[ctor.name],
  proto.inspect = inspectors.Data[ctor.name];
  ctor.prototype.prototype = copy(proto, Object.create(Data));
}

copy({
  Class: 'Type',
  toString: function toString(){ return '[object Type]' },
  array: function array(n){ return new (require('./array'))(this, n) },
  isInstance: function isInstance(o){ return this.prototype.isPrototypeOf(o) },
}, Type);

function Subtype(name, bytes, ctor){
  try { var iface = Function(name+'Constructor', 'return function '+name+'(buffer, offset, values){ return new '+name+'Constructor(buffer, offset, values) }')(ctor); }
  catch (e) { throw name }
  if (name) registerType(name, iface);

  if (hasProto) {
    iface.__proto__ = this.prototype;
  } else {
    copy(this, iface);
  }

  ctor.bytes = bytes;
  ctor.prototype.bytes = bytes;
  ctor.prototype = iface.prototype = copy(ctor.prototype, Object.create(this.prototype.prototype));
  ctor.prototype.constructor = iface;
  return copy(ctor, iface);
}


// ########################
// ### Genesis for Data ###
// ########################

var Data = Type.prototype = {
  Class: 'Data',
  toString: function toString(){ return '[object Data]' },
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
};


function copy(from, to, hidden){
  Object[hidden ? 'getOwnPropertyNames' : 'keys'](from).forEach(function(key){
    var desc = Object.getOwnPropertyDescriptor(from, key);
    desc.enumerable = false;
    Object.defineProperty(to, key, desc);
  });
  return to;
}