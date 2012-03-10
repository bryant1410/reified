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
var NumericTypes = require('./numeric');
var canonical    = require('./genesis').canonical;

module.exports = {
  Block: Block,
  NumberBlock: NumberBlock,
  ArrayBlock: ArrayBlock,
  StructBlock: StructBlock,
  sizeOf: sizeOf,
  Reference: Reference,
};




function sizeOf(type){
  if (typeof type === 'string' && type in NumericTypes) {
    type = NumericTypes[type];
  }
  if (isObject(type) && 'bytes' in type) {
    return type.bytes;
  }
}



// temporary just to make this easier

var buf = Buffer.prototype;
var bufferFunctions = Object.getOwnPropertyNames(buf).reduce(function(ret,name){
  if (typeof buf[name] === 'function') {
    var value = buf[name];
    if (name.slice(0,4) === 'read' || name.slice(-5) === 'Slice') return ret;
    if (name.slice(0,5) === 'write') {
      name = name.slice(5);
      value = { read: buf['read'+name], write: buf['write'+name] };
    }
    if (name.slice(-5) === 'Write') {
      name = name.slice(0,-5);
      value = { read: buf[name+'Slice'], write: buf[name+'Write'] };
    }
    ret[name.toLowerCase()] = ret[name] = value;
    if (name.slice(-2) === 'BE') {
      ret[name.slice(0,-2)] = ret[name.toLowerCase().slice(0,-2)] = value;
    }
  }
  return ret;
}, function Buffer(){ return global.Buffer.apply(this, arguments) })


// temporary ugliness until this is structured beter
function accessorsFor(type){
  var canontype = canonical(type);
  if ((canontype && canontype.name in bufferFunctions)) {
    return bufferFunctions[canontype.name];
  } else if (type && type.name in bufferFunctions) {
    return bufferFunctions[type.name];
  } else if (canontype in bufferFunctions) {
    return bufferFunctions[canontype];
  } else if (type._DataType) {
    return (function(type, elementType){
      var length = type.bytes / type._DataType.bytes;
      var writer = function(val){
        sLoop(type._Length, function(i){
          var R = elementType._Convert(i);
          type[i] = R._Value;
        });
      }
      var reader = function(){
        return sLoop(type._Length, function(v,i){
          return type[i].deref();
        });
      }
      return { read: reader, write: writer };
    })(type, type.elementType)
  }
}


/**
 * A Reference is an opaque value that is the vehicle for indiration, like pointers, without doing anything about
 * managing data types. Rough concept and just to get something in here to replace pointers for pure JS implementation.
 */
function Reference(type, offset, buffer){
  var accessors = accessorsFor(type);
  var reader = accessors.read;
  var writer = accessors.write;
  var offset = 0;
  var self = this;
  this.offset = offset;
  this.type = canonical(type) || type;

  this.deref = function deref(){
    this.offset = 0;
    return reader.call(buffer, this.offset, false);
  }
  this.write = function write(v){
    writer.call(buffer, v, this.offset, false);
  }
  this.cast = function cast(type){
    return new Reference(type, this.offset, buffer);
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
  //toString: function(){ return '[object Data]' },
  //valueOf: function(){ return 'deref' in this ? this.deref() : null }
}




/**
 * A block is supposed to be the actual allocated memory chunk for a given type.
 * These are more like reference managers currently.
 */

function Block(){}
Block.prototype = {
  constructor: Block,
  toString: function toString(){ return '[object Block]' }
}


function NumberBlock(type, val, buffer){
  if (val instanceof NumberBlock) return val.cast(type);
  buffer = buffer || new Buffer(type.name);

  Object.defineProperties(this, { type: D.ECW(type) });
  var ref = new Reference(type, val, buffer);
  //this.valueOf = ref.deref;
}

NumberBlock.prototype = Object.create(Block.prototype, {
  cast: D._CW(function cast(type){
    return new NumberBlock(type, this.clone());
  }),
});


function ArrayBlock(type, val, buffer){
  buffer = buffer || new Buffer(type.bytes);
  if (val > 0) {
    var length = val;
    val = [];
  } else {
    var length = val.length;
  }
  Object.defineProperties(this, {
    type:   D.ECW(type),
    length: D.___(length),
    bytes:  D.___(type.bytes)
  });
  this[0] = new Reference(type, val || length, new Buffer(this.bytes));
  this[0].write(val ? val[0] : 0);
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
