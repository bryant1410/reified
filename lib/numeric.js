/**
 * The standard C-Types set of numeric types also form the foundation for the ES6 API. Striaghtforward 
 * and useful for a lot of different situstions. As implemented here they are kind of boxed values that
 * automatically handle the details and also handle their interfacing with higher level constructs automatically.
 */

var D               = require('./utility').desc;
var bitsFor         = require('./utility').bitsFor;
var sLoop           = require('./utility').sLoop;
var Type            = require('./genesis').Type;
var Data            = require('./genesis').Data;
var NumberBlock     = require('./blocks').NumberBlock;
var ArrayType       = require('./array');
var sizeOf          = require('./blocks').sizeOf;
var Reference       = require('./blocks').Reference;


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

Object.keys(types).forEach(function(type, i){
  exports[type.toLowerCase()] = setupDataType(type);
});



/**
 * Template reused below.
 */
function NumericType(v){
  var x = type._Cast(v);
  var R = new NumberBlock(name, x);
  return type._Reify(R);
}


/**
 * This function ecapsulates the setup for both the Type and Data of a given number type
 */
function setupDataType(name){

  // #########################################
  // ### Numeric Type instance constructor ###
  // #########################################

  var type = eval(('('+NumericType+')').replace('NumericType', name));
  type.__proto__ = Type;

  /**
   * Takes a value and returns a wrapped Data reference
   */
  function Convert(val){
    if (typeof val === 'boolean') {
      val = new NumberBlock(type, +val);
    } else if (val._DataType === 'int64' || val._DataType === 'uint64') {
      val = val._Value;
    } else if (typeof val === 'number') {
      val = new NumberBlock(type, val);
    } else {
      throw new TypeError('Invalid value');
    }
    return val;
    //return Reference(val);
  }

  function IsSame(u){
    // Not quite clear on this one yet
    // return type === u._DataType;  ?
    // - or -
    // return type._DataType === u._DataType._DataType;  ?
    // - or -
    return type._DataType === u._DataType;
  }

  /**
   * Converts another type to this one, returning the value or wrapped 64 bit value
   */
  function Cast(val){
    if (typeof n === 'string' && n > 0) n = +n;
    try {
      var V = type._Convert(val);
      return V._Value.read();
    } catch (e) {}

    if (val === Infinity || val !== val) { //NaN
      return 0;
    } else if (typeof val === 'number') {
      return type._CCast(val);
    } else if (val._DataType._DataType === 'int64' || val._DataType._DataType === 'uint64') {
      return type._CCast(val._Value);
    }
    throw new TypeError('Type not castable');
  }

  /**
   * Similar to C++ reinterpret_cast. Doesn't modify byte structure, just rewraps it as another type.
   */
  function CCast(n) {
    if (typeof n === 'string' && n > 0) n = +n;
    var byteSize = bitsFor(n) / 8;
    if (byteSize > type.bytes) throw new RangeError('This many bytes is too big, get less bytes');
    return new NumberBlock(name, n);
  }

  /**
   * Turn a reference back into a normal js value (or still wrapped in the case of 64 bit ints)
   */
  function Reify(R) {
    var x = R ? R.deref() : null;
    if (name === 'uint64' || name === 'int64') {
      return Reference(new NumberBlock(name, x));
    } else {
      return x;
    }
  }

  /**
   * Most of these functions (any with `_`) would ostensibly not be directly exposed to JS, rather be triggered
   * during various proxies for normal js'ish usage. This is a prime target for wrapping using Harmony Proxies.
   */
  Object.defineProperties(type, {
    _DataType: D.___(name),
    _Convert:  D.___(Convert),
    _Cast:     D.___(Cast),
    _CCast:    D.___(CCast),
    _Reify:    D.___(Reify),
    _IsSame:   D.___(IsSame),
    bytes:     D.E__(types[name])
  });

  return type;
}


