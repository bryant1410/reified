"use strict";

var D     = require('./utility').desc;
var sLoop = require('./utility').sLoop;
var Type  = require('./genesis').Type;
var Data  = require('./genesis').Data;
var ins   = require('./utility').inspect;
var color = require('./utility').color


module.exports = NumericType;


var types = {
     Int8: [1, function(x){ return ((x & 0x80000000) >> 24) | (x & 0x7f) }],
    UInt8: [1, function(x){ return (x >>> 0) & 0xff }],
    Int16: [2, function(x){ return ((x & 0x80000000) >> 16) | (x & 0x7fff) }],
   UInt16: [2, function(x){ return (x >>> 0) & 0xffff }],
    Int32: [4, function(x){ return x | 0 }],
   UInt32: [4, function(x){ return x >>> 0 }],
//    Int64: [8], //TODO
//   Uint64: [8], //TODO
    Float: [4, function(x){ return x }], //TODO
   Double: [8, function(x){ return x }], //TODO
};

var typedArrays = {};

function bits(n){ return Math.log(n) / Math.LN2 }

/**
 * Coerce to number when appropriate and verify number against type storage
 */
function checkType(type, val){
  if (val && val.DataType) {
    if (val.DataType === 'int64' || val.DataType === 'uint64') {
      if (type === 'int64' || type === 'uint64') {
        return val.buffer;
      } else {
        throw new RangeError(val + ' exceeds '+type+' capacity');
      }
    } else if (val.DataType === 'array' || val.DataType === 'struct') {
      if (val.bytes > types[type][0]) {
        throw new RangeError(val + ' exceeds '+type+' capacity');
      } else {
        val = val.reify();
      }
    } else {
      val = val.reify();
    }
  }
  if (isFinite(val)) {
    val = +val;
  } else {
    throw new TypeError('Invalid value for ' + type + ': ' + val.DataType);
  }
  if (val && bits(val) / 8 > types[type][0]) {
    throw new RangeError(val + ' exceeds '+type+' capacity');
  }
  return val;
}

/**
 * Reinterpret the bits underlying a value as another type
 */
function castToType(type, val){
  if (isFinite(val)) {
    return types[type][1](+val);
  } else if (val === Infinity || val !== val) { //NaN
    return 0;
  } else if (val && val.DataType === 'Int64' || val.DataType === 'Uint64') {
    // TODO this won't work
    return types[type][1](val);
  }
  throw new TypeError('Type not castable');
}




// ###############################
// ### NumericType Constructor ###
// ###############################

function NumericType(name, bytes){
  // annoying name mismatch between node's 'UInt' and TypedArray 'Uint'
  typedArrays[name] = global[name.replace('UI', 'Ui') + 'Array'];

  // ############################
  // ### NumericT Constructor ###
  // ############################

  function NumericT(buffer, offset, value){
    if (!NumericTInterface.isInstance(this)) {
      return typeof buffer === 'number' ? castToType(name, buffer) : new NumericT(buffer, offset, value);
    }

    if (typeof buffer === 'number' || !buffer) {
      value = buffer || 0;
      buffer = null;
    }
    this.rebase(buffer);
    this.realign(offset);

    if (value != null) {
      this.write(value);
    }
  }

  // ##########################
  // ### NumericT Interface ###
  // ##########################

  var NumericTInterface = eval('(function '+name+'(buffer, offset, values){ return new NumericT(buffer, offset, values) })');

  Object.defineProperties(NumericTInterface, {
    isInstance: D.ECW(function isInstance(o){ return NumericTData.isPrototypeOf(o) }),
    bytes:      D.EC_(bytes),
  });

  // #####################
  // ### NumericT Data ###
  // #####################

  var NumericTData = Object.create(NumericData, {
    constructor: D._C_(NumericTInterface),
    DataType:    D._C_(name),
    bytes:       D.EC_(bytes),
  });

  NumericT.__proto__ = NumericTInterface.__proto__ = NumericType.prototype;
  NumericT.prototype = NumericTInterface.prototype = NumericTData;

  return NumericTInterface;
}

Type.call(NumericType);

NumericType.prototype.inspect = require('./utility').numberTypeInspect;


NumericType.isInstance = function isInstance(o){ return NumericData.isPrototypeOf(o) }


// ########################
// ### NumericType Data ###
// ########################

var NumericData = {
  __proto__: Data,
  DataType: 'number',
  write: function write(v){ this.view[0] = checkType(this.DataType, v); return this },
  reify: function reify(){ return this.buffer ? this.view[0] : null },
  fill: function fill(v){ this.write(v || 0) },
  realign: function realign(offset){
    offset = offset || 0;
    Object.defineProperties(this, {
      offset: D._CW(offset),
      view: D._CW(new typedArrays[this.DataType](this.buffer, offset, 1))
    });
  },
  inspect: require('./utility').numberInspect,
};

NumericType.prototype.prototype = NumericData;




Object.keys(types).forEach(function(name){
  NumericType[name] = new NumericType(name, types[name][0]);
});
