var ffi = require('../ffi');
var D = require('./utility').descriptor;
var Pointer = ffi.Pointer;

var Type = require('./genesis').Type;
var Data = require('./genesis').Data;
var Block = require('./genesis').Block;

module.exports = {
  NumberBlock: NumberBlock,
  ArrayBlock: ArrayBlock,
  StructBlock: StructBlock,
  pointerMethods: pointerMethods
};


var NumericTypes = require('./numeric');


function pointerMethods(type, pointerName){
  var get = Pointer.prototype['get'+pointerName];
  var set = Pointer.prototype['put'+pointerName];
  accessors[type] = {
    get: function(p){ return get.call(p) },
    set: function(p, v){ return set.call(p, v) }
  };
}


var accessors = {};


function getBlockType(type){
  return type in NumericTypes ? NumberBlock : '_ElementType' in type ? ArrayBlock : StructBlock;
}

function NumberBlock(type, val){
  if (val instanceof NumberBlock) return val.cast(type);
  var ptr = Pointer.isPointer(val) ? val : Pointer.alloc(type, val || 0);
  Object.defineProperties(this, {
    pointer: D.___(ptr),
    type: D.ECW(type),
  });
}

NumberBlock.prototype = Object.create(Block, {
  write: D._CW(function write(v){ accessors[this.type].set(this.pointer, v) }),
  deref: D._CW(function deref(){ return accessors[this.type].get(this.pointer) }),
  clone: D._CW(function clone(){ return new NumberBlock(this.type, this.pointer.clone()) }),
  cast:  D._CW(function cast(type){ return new NumberBlock(type, this.pointer.clone()) }),
});


function ArrayBlock(type, length, vals){
  if (type._Class === 'DataType') {
    type = type._ElementType._DataType;
  }
  var bytes = Data.sizeOf(type);
  var ptr = Pointer.isPointer(vals) ? vals : new Pointer(bytes * length);
  var blockType = getBlockType(type);

  Object.defineProperties(this, {
    type:      D.ECW(type),
    pointer:   D.___(ptr),
    length:    D.___(length),
  });

  Array.apply(null, Array(length)).forEach(function(v,i){
    this[i] = new blockType(type, ptr.seek(i * bytes));
  }, this);
}


ArrayBlock.prototype = Object.create(Block, {
  clone: D._CW(function clone(){ return new ArrayBlock(this.type, this.length, this.pointer.clone()) }),
});


function StructBlock(type, vals){
  var ptr = Pointer.isPointer(vals) ? vals : new Pointer(type.bytes);
  Object.defineProperties(this, {
    pointer: D.___(ptr),
  });
  var self = this;
  Object.keys(type.fields).reduce(function(offset, field){
    var dataType = type.fields[field]._DataType;
    var blockType = getBlockType(dataType);
    self[field] = new blockType(dataType, ptr.seek(offset));
    if (vals) self[field].write(vals[field]);
    return offset + type.fields[field].bytes;
  }, 0);
}