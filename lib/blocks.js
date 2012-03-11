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
var Block        = require('./genesis').Block;
var NumericTypes = require('./numeric');
var Reference    = require('./reference');

module.exports = {
  NumberBlock: NumberBlock,
  StructBlock: StructBlock,
  ArrayBlock:  ArrayBlock,
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



// ################################################################
// ### Direct interface on top of backing store for NumberTypes ###
// ################################################################

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


// ###############################################################
// ### Direct interface on top of backing store for ArrayTypes ###
// ###############################################################

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


// ################################################################
// ### Direct interface on top of backing store for StructTypes ###
// ################################################################

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
