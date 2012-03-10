var D            = require('./utility').desc;
var isObject     = require('./utility').isObject;
var sLoop        = require('./utility').sLoop;
var Type         = require('./genesis').Type;
var Data         = require('./genesis').Data;
var NumericTypes = require('./numeric');
var ArrayBlock   = require('./blocks').ArrayBlock;


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

  var ctor = function ArrayConstructor(values){
    return ArrayAllocate(ctor, Object.create(ctor.prototype), values);
  }
  ctor.__proto__ = ArrayType.prototype;
  ctor.prototype.__proto__ = ArrayType.prototype.prototype;

  /* Ugly temporary solution until implementing Proxies or something */
  Object.defineProperties(ctor, {
    _Class:       D.___('DataType'),
    _DataType:    D.___('array'),
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
    if (isObject(val) && val._Class === 'Block') {
      if (val._DataType.IsSame(ctor)) {
        return val._Value;
      }
      throw new TypeError('Wrong data type');
    }
    if (!isObject(val)) {
      throw new TypeError('Primitive and wrong data type');
    }
    if (!(typeof val.length === 'number') || val.length !== ctor._Length) {
      throw new TypeError('Lengths needs to be same');
    }

    var vals = sLoop(ctor._Length, function(i){
      return ctor.elementType._Convert(val[i]);
    });
    return new ctor(vals);
  }

  function IsSame(u){
    return u._DataType === 'array' &&
           ctor.elementType._IsSame(u.elementType) &&
           ctor._Length === u._Length;
  }

  /**
   * Wrap block of data as array. The Spec seems to be contradictive because some times
   * Reify means to completely deref to JS native, and sometimes not???
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

  Object.defineProperties(ctor.prototype, {
    fill: D._CW(fill),
  });

  function fill(val){
    if (i.isObject(this) || thos._Class !== 'Data' || !this._DataType._IsSame(ctor)) {
      throw new TypeError('Method is not generic');
    }
    sLoop(this._Length, function(i){
      var R = self.elementType._Convert(val);
      self[i] = R._Value;
    });
  }


  sLoop(ctor._Length, function(i){
    Object.defineProperty(ctor.prototype, i, {
      enumerable: true,
      configurable: true,
      get: function(){
        return ctor.elementType._Reify(this._Value[i]);
      },
      set: function(v){
        var R = ctor.elementType._Convert(v);
        this._Value[i] && this._Value[i].write(R._Value ? R._Value.deref() : 0);
      }
    });
  });

  return ctor;
}

// ###################################
// ###################################
// ### Array constructor prototype ###
// ###################################
// ###################################

ArrayType.prototype = function ArrayTypeSingleton(){}
ArrayType.prototype.__proto__ = Type.prototype;

Object.defineProperties(ArrayType.prototype, {
  constructor: D._CW(ArrayType),
  repeat:      D.ECW(repeat),
});


// ### Array instance prototype ###
ArrayType.prototype.prototype = Object.create(Data.prototype, {
  constructor: D._CW(ArrayType.prototype),
  forEach:     D.ECW(Array.prototype.forEach),
  //subarray TODO
});


function repeat(val){
  if (!isObject(this) || this._Class !== 'DataType' || this._DataType !== 'array') {
    throw new TypeError('Method is not generic');
  }
  var V = new this(val);
  V.fill(val);
  return V;
}



/**
 * Allocate both the memory and the structure for an array.
 * Most of this is a temporary ugly solution to filling out
 * "internal" properties that shouldn't be exposed. Need Proxies.
 */
function ArrayAllocate(ctor, target, values){

  Object.defineProperties(target, {
    _Class:    D.___('Data'),
    _Value:    D.___(new ArrayBlock(ctor, values)),
    _DataType: D.___(ctor),
    length:    D.___(ctor._Length),
  });

  return target;
}
