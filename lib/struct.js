var ffi = require('../ffi');
var U = require('./utility');
var D = U.descriptor;
var Pointer = ffi.Pointer;

var Type = require('./genesis').Type;
var Data = require('./genesis').Data;
var NumericTypes = require('./numeric');
var StructBlock = require('./blocks').StructBlock;
var sizeOf = Data.sizeOf;

module.exports = StructType;



function StructType(fields){

  var ctor = function(vals){
    return StructReference(ctor, this, vals);
  }
  ctor.__proto__ = StructType.prototype;

  var bytes = 0;

  var copy = Object.keys(fields).reduce(function(ret,field){
    ret[field] = fields[field];
    bytes += fields[field].bytes;
    return ret;
  }, {});

  Object.defineProperties(ctor, {
    _Class:     D.___('DataType'),
    _DataType:  D.___('struct'),
    _Convert:   D.___(Convert),
    _IsSame:    D.___(IsSame),
    _Reify:     D.___(Reify),
    fields:     D.ECW(Object.freeze(copy)),
    bytes:      D.ECW(bytes)
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

    var vals = Object.keys(val).reduce(function(ret, field){
      ret[field] = ctor.fields[field]._Convert(val[field]);
      return ret;
    }, {});

    return new ctor(vals);
  }

  function IsSame(u){
    return ctor === u;
  }

  /**
   * Wrap block of data as array
   */
  function Reify(R){
    return Object.create(ctor.prototype, {
      _Class:    D.___('Data'),
      _Value:    D.___(R),
      _DataType: D.___(ctor),
    });
  }

  return ctor;
}


function StructReference(type, data, vals){
  var fields = type.fields;
  var bytes = type.bytes;

  Object.defineProperties(data, {
    _Class:    D.___('Data'),
    _Value:    D.___(new StructBlock(type, vals)),
    _DataType: D.___(type._DataType),
  });

  Object.keys(fields).reduce(function(offset, field){
    var currField = fields[field];
    Object.defineProperty(data, field, {
      enumerable: true, configurable: true,
      get: function(){
        return currField._Reify(data._Value[field]);
      },
      set: function(v){
        var R = currField._Convert(v);
        data._Value[field].write(R._Value.deref());
      }
    });
    data[field] = vals ? vals[field] : 0;
    return offset + currField.bytes;
  }, 0);

  return data;
}
