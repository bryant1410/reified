"use strict";

var D     = require('./utility').desc;
var sLoop = require('./utility').sLoop;

module.exports = {
  Type: Type,
  Data: Data,
};


var ArrayType = require('./array');


var Class = function toString(){ return '[object '+this.Class+']' };

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
  Class:    D._C_('Type'),
  toString: D._CW(Class),
  bytes:    D._C_(0),
  array:    D.ECW(function array(n){ return new ArrayType(this, n) }),
});

Type.prototype = Data;



// ########################
// ### Genesis for Data ###
// ########################

function Data(){ throw new Error('Abstract function called') }

Object.defineProperties(Data, {
  Class:    D._C_('Data'),
  toString: D._CW(Class),
  rebase:   D.ECW(rebase),
});



function rebase(buffer){
  if (buffer == null) {
    buffer = new Buffer(this.bytes);
  } else {
    while (buffer.buffer) buffer = buffer.buffer;
  }
  Object.defineProperty(this, 'buffer', D._CW(buffer));
}