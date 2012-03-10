var D            = require('./utility').desc;
var isObject     = require('./utility').isObject;
var Type         = require('./genesis').Type;
var Data         = require('./genesis').Data;
var NumericTypes = require('./numeric');
var StructBlock  = require('./blocks').StructBlock;
var sizeOf       = Data.sizeOf;

module.exports = StructType;


// ##########################################
// ##########################################
// ### StructType constructor constructor ###
// ##########################################
// ##########################################

function StructType(fields){

  // copy the input structure so we can put it on the ctor for display
  var bytes = 0;
  var copy = Object.keys(fields).reduce(function(ret,field){
    ret[field] = fields[field];
    bytes += fields[field].bytes;
    return ret;
  }, {});


  // #######################################
  // ### StructType instance constructor ###
  // #######################################

  var ctor = function StructConstructor(vals){
    return StructAllocate(Object.create(ctor.prototype), vals);
  }
  ctor.__proto__ = StructType.prototype;


  // Temporary ugly solution for internal properties
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
    if (isObject(val) && val._Class === 'Block') {
      if (val._DataType.IsSame(ctor)) {
        return val._Value;
      }
      throw new TypeError('Wrong data type');
    }
    if (!isObject(val)) {
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
   * Wrap block of data as array, inconsistent usages in the API =/
   */
  function Reify(block){
    return Object.create(ctor.prototype, {
      _Class:    D.___('Data'),
      _Value:    D.___(block),
      _DataType: D.___(ctor),
    });
  }



  // #####################################
  // ### StructType instance prototype ###
  // #####################################

  // Set up the accessors on the prototype for the time being
  Object.keys(fields).reduce(function(offset, name){
    var field = fields[name];
    var type = field._DataType;

    Object.defineProperty(ctor.prototype, name, {
      enumerable: true,
      configurable: true,
      get: function(){
        return field._Reify(this._Value[name], offset);
      },
      set: function(v){
        var R = field._Convert(v);
        this._Value[name].write(R._Value.read(), offset);
      }
    });
    return offset + field.bytes;
  }, 0);


  // Assign properties and allocate the data structure
  function StructAllocate(target, values){
    Object.defineProperties(target, {
      _Class:    D.___('Data'),
      _Value:    D.___(new StructBlock(ctor, values || {})),
      _DataType: D.___(ctor._DataType),
    });
    return target;
  }

  return ctor;
}
