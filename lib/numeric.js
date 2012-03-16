"use strict";

var D     = require('./utility').desc;
var sLoop = require('./utility').sLoop;
var Type  = require('./genesis').Type;
var ins   = require('./utility').inspect;
var color = require('./utility').color


module.exports = Numeric;


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

var typeMap = {};
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



// #####################################
// ### Parent for numeric references ###
// #####################################

function Numeric(type, buffer, offset, val){
  if (!Numeric.isBlock(this) && typeof buffer === 'number') {
    // Call with number -> `cast(type, number)`
    return castToType(type, buffer);

  } else if (type in typeMap) {
    // Call/construct specified type -> `new BlockType`
    return new typeMap[type](buffer, offset, val);

  } else if (Numeric.isBlock(type)) {
    // Call with existing block -> `block.reify()`
    return type.reify();
  }
}

Numeric.isBlock = function isBlock(o){
  return Numeric.prototype.isPrototypeOf(o);
}



// ###############################################
// ### Parent prototype for numeric references ###
// ###############################################

Numeric.prototype = Object.defineProperties({}, {
  Class:      D._C_('Block'),
  DataType:   D.EC_('Empty'),
  toString:   D._CW(function toString(){ return '[object Block]' }),
  inspect:    D._CW(require('./utility').numberInspect),
  write:      D.ECW(function write(v){ this.view[0] = checkType(this.DataType, v); return this }),
  reify:      D.ECW(function reify(){ return this.buffer ? this.view[0] : null }),
  fill:       D.ECW(function fill(v){ this.write(v || 0) }),
  realign:    D.ECW(realign),
  rebase:     D.ECW(rebase),
});




function realign(offset){
  this.offset = offset || 0;
  this.view = new typedArrays[this.DataType](this.buffer, this.offset, 1);
}

function rebase(buffer, offset){
  if (buffer == null) {
    buffer = new Buffer(offset);
    offset = 0;
  } else {
    while (buffer.buffer) buffer = buffer.buffer;
  }
  this.buffer = buffer;
  this.realign(offset);
}


// loop to build constructor and prototype for each numeric
Object.keys(types).forEach(function(type){
  // annoying name mismatch between node's 'UInt' and TypedArray 'Uint'
  typedArrays[type] = global[type.replace('UI', 'Ui') + 'Array'];
  var bytes = types[type][0];

  // ########################################
  // ### Constructor for specific numeric ###
  // ########################################

  function NumericType(buffer, offset, value){
    if (!Numeric.isBlock(this)) {
      return typeof buffer === 'number' ? castToType(type, buffer) : new NumericType(buffer, offset, value);
    }

    if (typeof buffer === 'number' || !buffer) {
      value = buffer || 0;
      this.rebase(null, bytes);
    } else {
      this.rebase(buffer, offset);
    }

    if (value != null) {
      this.write(value);
    }
  }

  // shell named function for public ctor
  var ctor = eval('(function '+type+'(){ return NumericType.apply(this, arguments) })');
  ctor.__proto__ = Type;

  Object.defineProperties(ctor, {
    bytes:       D._C_(bytes),
    isInstance:  D._CW(function isInstance(o){ return NumericType.prototype.isPrototypeOf(o) }),
    inspect:     D._CW(require('./utility').numberTypeInspect),
  });


  // ######################################
  // ### Prototype for specific numeric ###
  // ######################################

  ctor.prototype = NumericType.prototype = Object.create(Numeric.prototype, {
    constructor: D._C_(ctor),
    DataType:    D._C_(type),
    bytes:       D._C_(bytes),
  });

  typeMap[type] = typeMap[type.toLowerCase()] = NumericType;
  Numeric[type] = ctor;
});

