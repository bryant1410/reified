"use strict";

/**
 * This file includes the highest level interfaces that are part of the ES6 spec. They're pretty much useless for our purposes
 * But they set the inheritance stage and are part of the API so they're here.
*/

var D     = require('./utility').desc;
var sLoop = require('./utility').sLoop;



module.exports = {
  Type: Type,
  Data: Data,
};


var ArrayType = require('./array');


var Class = function toString(){ return '[object '+this.Class+']' };

// #########################################
// ### Genesis for the Constructor Types ###
// #########################################

function Type(){
  this.__proto__ = Type;
  this.prototype = eval('(function Empty'+this.name.replace(/Type$/,'T')+'(){})');
  this.prototype.__proto__ = this;
  Object.defineProperty(this.prototype, 'constructor', D._C_(this));
}

Object.defineProperties(Type, {
  Class:    D._C_('Type'),
  toString: D._CW(Class),
  bytes:    D._C_(0)
});

Type.prototype = Data;



// ######################################
// ### Genesis for the Instance Types ###
// ######################################

function Data(){ throw new Error('Abstract function called') }

Object.defineProperties(Data, {
  Class:    D._C_('Data'),
  toString: D._CW(Class),
  array:    D.ECW(array),
  rebase:   D.ECW(rebase),
});

function array(n){ return new ArrayType(this, n) }

function rebase(buffer){
  if (buffer == null) {
    buffer = new Buffer(this.bytes);
  } else {
    while (buffer.buffer) buffer = buffer.buffer;
  }
  Object.defineProperty(this, 'buffer', D._CW(buffer));
}