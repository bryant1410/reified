"use strict";

var D     = require('./utility').desc;
var sLoop = require('./utility').sLoop;
var ViewBuffer = require('./buffer');

var types = { };


module.exports = {
  Type: Type,
  Data: Data,
  register: register,
  lookup: lookup,
  types: types
};


var ArrayType = require('./array');



function register(name, type){
  if (!(name in types) && name.length) types[name] = type;
  return type;
}

function lookup(name){
  return (typeof name === 'string' && name) ? types[name] : name;
}


// ########################
// ### Genesis for Type ###
// ########################

function Type(){
  this.__proto__ = Type;
  this.prototype = eval('(function Empty'+this.name.replace(/Type$/,'T')+'(){})');
  this.prototype.__proto__ = this;
  Object.defineProperty(this.prototype, 'constructor', D._C_(this));
}

Object.defineProperties(Type, {
  Class:      D._C_('Type'),
  toString:   D._CW(function toString(){ return '[object Type]' }),
  bytes:      D._C_(0),
  array:      D.ECW(function array(n){ return new ArrayType(this, n) }),
  isInstance: D.ECW(function isInstance(o){ return this.prototype.isPrototypeOf(o) })
});

Type.prototype = Data;



// ########################
// ### Genesis for Data ###
// ########################

function Data(){ throw new Error('Abstract function called') }

Object.defineProperties(Data, {
  Class:    D._C_('Data'),
  toString: D._CW(function toString(){ return '[object Data]' }),
  rebase:   D.ECW(rebase),
});



function rebase(buffer){
  if (buffer == null) {
    buffer = new ViewBuffer(this.bytes);
  } else {
    while (buffer.buffer) buffer = buffer.buffer;
    buffer = ViewBuffer.isInstance(buffer) ? buffer : new ViewBuffer(buffer);
  }
  Object.defineProperty(this, 'buffer', D._CW(buffer));
}