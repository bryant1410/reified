"use strict";

var D       = require('./utility').desc;
var sLoop   = require('./utility').sLoop;
var bits    = require('./utility').bits;
var genesis = require('./genesis');
var initNumeric = require('./genesis').initType.bind(NumericType);


module.exports = NumericType;


var types = {
     Int8: 1,
    UInt8: 1,
    Int16: 2,
   UInt16: 2,
    Int32: 4,
   UInt32: 4,
//    Int64: 8, //TODO
//   Uint64: 8, //TODO
    Float: 4,
   Double: 8,
};

var typedArrays = {};


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

  NumericT.bytes = bytes;

  // ##########################
  // ### NumericT Interface ###
  // ##########################

  var NumericTInterface = initNumeric(name, NumericT);


  // #####################
  // ### NumericT Data ###
  // #####################

  var writer = 'write'+name;
  var reader = 'read'+name;

  Object.defineProperties(NumericTInterface.prototype, {
    DataType:    D._C_(name),
    write:       D._C_(function write(v){ this.buffer[writer](checkType(this.DataType, v), this.offset); return this; }),
    reify:       D._C_(function reify(){ return this.buffer[reader](this.offset) }),
  });

  return NumericTInterface;
}

genesis.Type.call(NumericType);

NumericType.prototype.inspect = require('./utility').numberTypeInspect;



// ########################
// ### NumericType Data ###
// ########################

var NumericData = {
  __proto__: genesis.Data,
  DataType: 'number',
  fill: function fill(v){ this.write(v || 0) },
  realign: function realign(offset){
    Object.defineProperty(this, 'offset', D._CW(offset ||  0));
  },
  inspect: require('./utility').numberInspect,
};

NumericType.prototype.prototype = NumericData;




Object.keys(types).forEach(function(name){
  NumericType[name] = new NumericType(name, types[name]);
});
