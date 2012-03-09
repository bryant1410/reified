var ffi = require('../ffi');
var U = require('./utility');
var D = U.descriptor;
var Pointer = ffi.Pointer;

var Type = require('./genesis').Type;
var Data = require('./genesis').Data;

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

  var ctor = function(){}
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
    length:       D.ECW(length),
    bytes:        D.ECW(elemenType.bytes * length)
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
    var u = ctor._ElementType;
    var n = ctor._Length;
    var L = val.length;
    if (!(typeof L === 'number') || L !== n) {
      throw new TypeError('Length needs to be a number');
    }
    var R = ArrayReference(u, n);
    Array.apply(null, Array(n)).forEach(function(k,i){
      var V = val[i];
      var W = u._Convert(V);
      //var deRefed = W._Value['get' + ffi.TYPE_TO_POINTER_METHOD_MAP[W._DataType]](W);
      R._Value._putPointer(W, i * u.bytes);
    });
    return R;
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
    return ArrayReference(ctor, R);
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
    Array.apply(null, Array(ctor._Length)).forEach(function(s,i){
      var R = ctor._ElementType._Convert(val);
      this._putPointer(R, i * ctor._DataType.bytes);
    }, this);
  }


  return ctor;
}

// #######################################
// #######################################
// ### ArrayType constructor prototype ###
// #######################################
// #######################################

ArrayType.prototype = function(){ }

ArrayType.prototype.__proto__ = Type.prototype;

Object.defineProperties(ArrayType.prototype, {
  constructor: D._CW(ArrayType),
  repeat:      D._CW(repeat),
  prototype:   D.___(Object.create(Data.prototype, {
    constructor: D._CW(ArrayType.prototype),
    forEach:     D._CW(Array.prototype.forEach),
    //subarray TODO
  })),
});


function repeat(val){
  if (!U.isObject(this) || this._Class !== 'DataType' || this._DataType !== 'array') {
    throw new TypeError('Method is not generic');
  }
  var V = Object.create(this);
  Array.apply(null, Array(this._Length)).forEach(function(v,i){
    var R = this._ElementType._Convert(val);
    var deRefed = R._Value['get' + ffi.TYPE_TO_POINTER_METHOD_MAP[R._DataType]](val);
    V[i]._Value = new Pointer(ffi.sizeOf(deRefed));
    V[i]._Value._putPointer(deRefed);
  });
}




/**
 * Array data block instance. Pointer holder.
 */
function ArrayReference(type, n){
  var data = function(){}
  data.__proto__ = Data;

  return Object.defineProperties(data, {
    _Class:    D.___('Data'),
    _Value:    typeof n === 'number' ? D.___(new Pointer(type.bytes * n)) : n,
    _DataType: D.___(type),
  });
}

