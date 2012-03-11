/**
 * According to the ES6 Wiki:
 *    "This spec introduces a new, spec-internal block datatype, intuitively representing a contiguously allocated block of binary data.
 *     Blocks are not ECMAScript values and appear only in the program store (aka heap)."
 *
 * This file has rather more than that. The data sources are largely encapsulated by Node Buffers, or Array Buffers, or FFI buffers
 * or whatever it is you're doing. But we still need to manage these chunks of memory because they aren't being given form otherwise.
 */


var D            = require('./utility').desc;
var isObject     = require('./utility').isObject;
var sLoop        = require('./utility').sLoop;
var Type         = require('./genesis').Type;
var Data         = require('./genesis').Data;
var Block        = require('./genesis').Block;
var NumericTypes = require('./numeric');

module.exports = {
  Block:       Block,
  NumberBlock: NumberBlock,
  StructBlock: StructBlock,
  ArrayBlock:  ArrayBlock,
  Reference:   Reference,
  sizeOf:      sizeOf,
};




function sizeOf(type){
  if (typeof type === 'string' && type in NumericTypes) {
    type = NumericTypes[type];
  }
  if (isObject(type) && 'bytes' in type) {
    return type.bytes;
  }
}


/**
 * A Reference is an opaque value that is the vehicle for indiration, like pointers, without doing anything about
 * managing data types. Rough concept and just to get something in here to replace pointers for pure JS implementation.
 */
function Reference(type, offset, buffer){
  var offset = 0;

  this.deref = function deref(){
    this.offset = 0;
    return new type(buffer, offset);
  }
  this.write = function write(v){
    if (Object(v) === v && ('_Value' in v)) {
      buffer[arguments[0]].apply(buffer, [].slice.call(arguments, 1));
    }
  }
  this.cast = function cast(type){
    return new Reference(type, offset, buffer);
  }
  this.clone = function clone(){
    var ret = Object.create(Reference.prototype);
    Object.getOwnPropertyNames(self).forEach(function(prop){
      ret[prop] = self[prop];
    });
    addNext(ret);
    return ret;
  }

  // simplifies arrays
  function addNext(o){
    o.next = function next(v){
      var ret = self.clone();
      ret.offset = (offset += type.bytes);
      if (v) ret.write(v);
      return ret;
    }
  }
  addNext(this);
}

Reference.prototype = {
  constructor: Reference,
}



function NumberBlock(type, val, buffer){
  if (val instanceof NumberBlock) return val.cast(type);
  buffer = buffer || new Buffer(type.name);
  Object.defineProperties(this, { type: D.ECW(type) });
  var ref = new Reference(type, val, buffer);
}

NumberBlock.prototype = Object.create(Block.prototype, {
  cast: D._CW(function cast(type){
    return new NumberBlock(type, this.clone());
  }),
});


function ArrayBlock(type, val, buffer){
  if (val > 0) {
    var length = val;
    val = [];
  } else {
    var length = val.length;
  }
  buffer = buffer || new Buffer(type.bytes);
  Object.defineProperties(this, {
    type:   D.ECW(type),
    length: D.___(length),
    bytes:  D.___(type.bytes)
  });
  sLoop(length, function(i){
    this[i] = new Reference(this.type, i, buffer);
    this[i].write.call(buffer, 0);
  });
}

ArrayBlock.prototype = {
  __proto__: Block.prototype,
  constructor: ArrayBlock
};


function StructBlock(type, val, buffer){
  buffer = buffer || new Buffer(type.bytes);
  var self = this;
  Object.keys(type.fields).reduce(function(offset, field){
    self[field] = new Reference(type.fields[field], offset, buffer);
    return offset + self[field].bytes;
  }, 0);
}

StructBlock.prototype = {
  __proto__: Block.prototype,
  constructor: StructBlock
};
