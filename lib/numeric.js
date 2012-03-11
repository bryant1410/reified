/**
 * The standard C-Types set of numeric types also form the foundation for the ES6 API. Striaghtforward 
 * and useful for a lot of different situstions. As implemented here they are kind of boxed values that
 * automatically handle the details and also handle their interfacing with higher level constructs automatically.
 */

var D           = require('./utility').desc;
var bitsFor     = require('./utility').bitsFor;
var sLoop       = require('./utility').sLoop;
var Type        = require('./genesis').Type;
var NumberBlock = require('./blocks').NumberBlock;
var Reference   = require('./reference');


var types = {
     Int8: 1,
    UInt8: 1,
    Int16: 2,
   UInt16: 2,
    Int32: 4,
   Uint32: 4,
    Int64: 8,
   UInt64: 8,
  Float32: 4,
  Float64: 8,
};


/**
 * Most of these functions (any with `_`) would ostensibly not be directly exposed to JS, rather be triggered
 * during various proxies for normal js'ish usage. This is a prime target for wrapping using Harmony Proxies.
 */
var DataTypeProto = Object.create(Type, {
  _Convert:  D._C_(Convert),
  _Cast:     D._C_(Cast),
  _CCast:    D._C_(CCast),
  _Reify:    D._C_(Reify),
  _IsSame:   D._C_(IsSame),
});



Object.keys(types).forEach(function(type, i){
  exports[type.toLowerCase()] = setupDataType(type);
});



/**
 * Template reused below.
 */
function NumericType(value, buffer){
  var x = type._Cast(v);
  var R = new NumberBlock(name, value, buffer);
  return type._Reify(R);
}

// #########################################
// ### Numeric Type instance constructor ###
// #########################################


function setupDataType(name){
  var type = eval(('('+NumericType+')').replace('NumericType', name));
  type.__proto__ = DataTypeProto;

  return Object.defineProperties(type, {
    _DataType: D._C_(name.toLowerCase()),
    bytes:     D.EC_(types[name])
  });
}

/**
 * Takes a value and returns a wrapped Data reference
 */
function Convert(val){
  if (typeof val === 'boolean') {
    val = new NumberBlock(this, +val);
  } else if (val._DataType === 'int64' || val._DataType === 'uint64') {
    val = val._Value;
  } else if (typeof val === 'number') {
    val = new NumberBlock(this, val);
  } else {
    throw new TypeError('Invalid value');
  }
  return new Reference(val);
}

function IsSame(compare){
  return type._DataType === compare._DataType;
}

/**
 * Converts another type to this one, returning the value or wrapped 64 bit value
 */
function Cast(val){
  if (typeof n === 'string' && n > 0) n = +n;
  try {
    var V = this._Convert(val);
    return V._Value.read();
  } catch (e) {}

  if (val === Infinity || val !== val) { //NaN
    return 0;
  } else if (typeof val === 'number') {
    return this._CCast(val);
  } else if (val._DataType._DataType === 'int64' || val._DataType._DataType === 'uint64') {
    return this._CCast(val._Value);
  }
  throw new TypeError('Type not castable');
}

/**
 * Similar to C++ reinterpret_cast. Doesn't modify byte structure, just rewraps it as another type.
 */
function CCast(n) {
  if (typeof n === 'string' && n > 0) n = +n;
  var byteSize = bitsFor(n) / 8;
  if (byteSize > this.bytes) throw new RangeError('This many bytes is too big, get less bytes');
  return new NumberBlock(this, n);
}

/**
 * Turn a reference back into a normal js value (or still wrapped in the case of 64 bit ints)
 */
function Reify(R) {
  var x = R ? R.deref() : null;
  if (this.name === 'UInt64' || this.name === 'Int64') {
    return Reference(new NumberBlock(this, x));
  } else {
    return x;
  }
}


