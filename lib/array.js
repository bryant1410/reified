var ffi = require('../ffi');
var U = require('./utility');
var D = U.descriptor;
var Pointer = ffi.Pointer;

var Type = require('./genesis').Type;
var Data = require('./genesis').Data;
var NumericTypes = require('./numeric');
var ArrayBlock = require('./blocks').ArrayBlock;

module.exports = ArrayType;


// #########################################
// #########################################
// ### ArrayType constructor constructor ###
// #########################################
// #########################################

function ArrayType(elementType, length) {

  // ######################################
  // ### ArrayType instance constructor ###
  // ######################################

  var ctor = function(val){
    ArrayReference(ctor, this, val);
  }
  ctor.__proto__ = ArrayType.prototype;

  Object.defineProperties(ctor, {
    _Class:       D.___('DataType'),
    _DataType:    D.___('array'),
    _ElementType: D.___(elementType),
    _Length:      D.___(length),
    _Convert:     D.___(Convert),
    _IsSame:      D.___(IsSame),
    _Reify:       D.___(Reify),
    elementType:  D.ECW(elementType),
    bytes:        D.ECW(elementType.bytes * length)
  });

  /**
   * Wrap an existing block of data as an array or alloc a block and put in a JS array
   */
  function Convert(val){
    if (U.isObject(val) && val._Class === 'Block') {
      if (val._DataType.IsSame(ctor)) {
        return val._Value;
      }
      throw new TypeError('Wrong data type');
    }
    if (!U.isObject(val)) {
      throw new TypeError('Primitive and wrong data type');
    }
    if (!(typeof val.length === 'number') || val.length !== ctor._Length) {
      throw new TypeError('Lengths needs to be same');
    }

    var vals = Array.apply(null, Array(ctor._Length)).map(function(k,i){
      return ctor._ElementType._Convert(val[i]);
    });
    return new ctor(vals);
  }

  function IsSame(u){
    return u._DataType === 'array' &&
           ctor._ElementType._IsSame(u._ElementType) &&
           ctor._Length === u._Length;
  }

  /**
   * Wrap block of data as array
   */
  function Reify(R){
    return Object.create(ctor.prototype, {
      _Class:    D.___('Data'),
      _Value:    D.___(R),
      _DataType: D.___(ctor),
      length:    D.E__(ctor._Length),
    });
  }



  // ####################################
  // ### ArrayType instance prototype ###
  // ####################################

  ctor.prototype.__proto__ = ArrayType.prototype.prototype;

  Object.defineProperties(ctor.prototype, {
    fill: D._CW(fill),
  });

  function fill(val){
    if (i.isObject(this) || thos._Class !== 'Data' || !this._DataType._IsSame(ctor)) {
      throw new TypeError('Method is not generic');
    }

    Array.apply(null, Array(this._Length)).forEach(function(v,i){
      var R = self._ElementType._Convert(val);
      self[i] = R._Value;
    }, this);
  }


  return ctor;
}

// #######################################
// #######################################
// ### ArrayType constructor prototype ###
// #######################################
// #######################################

ArrayType.prototype = function(){}

ArrayType.prototype.__proto__ = Type.prototype;

Object.defineProperties(ArrayType.prototype, {
  constructor: D._CW(ArrayType),
  repeat:      D.ECW(repeat),
  prototype:   D.___(Object.create(Data.prototype, {
    constructor: D._CW(ArrayType.prototype),
    forEach:     D.ECW(Array.prototype.forEach),
    //subarray TODO
  })),
});


function repeat(val){
  if (!U.isObject(this) || this._Class !== 'DataType' || this._DataType !== 'array') {
    throw new TypeError('Method is not generic');
  }
  var V = new this;
  V.fill(val);
  return V;
}



/**
 * Array data block instance. Pointer holder.
 */
function ArrayReference(type, data, val){
  var elementType = type._ElementType;
  var bytes = elementType.bytes;


  Object.defineProperties(data, {
    _Class:    D.___('Data'),
    _Value:    D.___(new ArrayBlock(elementType._DataType, type._Length)),
    _DataType: D.___(type),
    length:    D.___(type._Length),
  });

  Array.apply(null, Array(type._Length)).forEach(function(v,i){
    Object.defineProperty(data, i, {
      enumerable: true, configurable: true,
      get: function(){
        return elementType._Reify(data._Value[i]);
      },
      set: function(v){
        var R = elementType._Convert(v);
        data._Value[i].write(R._Value.deref());
      }
    });
    data[i] = val ? val[i] : 0;
  });

  return data;
}
