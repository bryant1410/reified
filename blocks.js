var ffi = require('../ffi');
var D = require('./utility').descriptor;
var Pointer = ffi.Pointer;

var Type = require('./genesis').Type;
var Data = require('./genesis').Data;
var Block = require('./genesis').Block;

module.exports = {
  NumberBlock: NumberBlock,
  ArrayBlock: ArrayBlock
}


var NumericTypes = require('./numeric');



var refs = {};

function pointerHandler(type, ptr){
  if (!(type in refs)) {
    var name = ffi.TYPE_TO_POINTER_METHOD_MAP[type];
    refs[type] = function(ptr){
      return { get: function(){ return ptr['get'+name]() },
               set: function(v){ ptr['put'+name](v) } };
    }
  }
  return refs[type](ptr);
}

function NumberBlock(type, val){
  if (val instanceof NumberBlock) return val.cast(type);
  var self = this;
  var ptr = Pointer.isPointer(val) ? val : Pointer.alloc(type, val || 0);
  var accessors = pointerHandler(type, ptr);
  this.write = accessors.set;
  this.deref = accessors.get;
  this.type = type;
  this.get = function(){ return self }
  this.clone = function(){ return new NumberBlock(type, ptr.clone()) }
  this.cast = function(type){ return new NumberBlock(t, ptr.clone()) }
}
NumberBlock.__proto__ = Block;






function ArrayBlock(type, length, vals){
  if (type._Class === 'DataType') {
    type = type._ElementType._DataType;
  }
  var bytes = ffi.sizeOf(type);
  var ptr = Pointer.isPointer(vals) ? vals : new Pointer(bytes * length);
  var blockType = type in NumericTypes ? NumberBlock : null;
  var self = this;
  this.type = type;
  this.length = length;
  this.get = function(){ return self };
  this.clone = function(){ return new ArrayBlock(type, length, ptr) };

  Array.apply(null, Array(length)).forEach(function(v,i){
    self[i] = new blockType(type, ptr.seek(i * bytes));
  });
}


ArrayBlock.__proto__ = Block;