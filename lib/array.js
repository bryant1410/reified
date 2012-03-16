"use strict";
var D        = require('./utility').desc;
var isObject = require('./utility').isObject;
var sLoop    = require('./utility').sLoop;
var Type     = require('./genesis').Type;
var Data     = require('./genesis').Data;

module.exports = ArrayType;

// #############################
// ### ArrayType Constructor ###
// #############################

function ArrayType(name, MemberType, length) {
  if (typeof name !== 'string') {
    length = MemberType || 0;
    MemberType = name || Type;
    name = MemberType.name + 'x'+length;
  }
  var bytes = MemberType.bytes * length;

  // ###########################
  // ### ArrayT Constructor ###
  // ###########################

  function ArrayT(buffer, offset, values){
    if (Array.isArray(buffer)) {
      values = buffer;
      buffer = new Buffer(bytes);
      buffer.fill();
    } else if (buffer == null) {
      buffer = new Buffer(bytes);
      buffer.fill();
    } else if ('buffer' in buffer) {
      while (buffer.buffer) {
        buffer = buffer.buffer;
      }
    }

    Object.defineProperties(this, {
      buffer: D._CW(buffer),
      offset: D._CW(offset || 0)
    });

    // define indice accessors and create Data instances to view the data through
    sLoop(length, function(i){
      var block = new MemberType(buffer, this.offset + i * MemberType.bytes, values ? values[i] : null);
      Object.defineProperty(this, i, {
        enumerable: true,
        configurable: true,
        get: function(){ return block },
        set: function(v){ block.write(v) }
      });
    }.bind(this));
  }

  // ########################
  // ### ArrayT Interface ###
  // ########################

  var ArrayTInterface = eval('(function '+name+'(buffer, offset, values){ return new ArrayT(buffer, offset, values) })');

  Object.defineProperties(ArrayTInterface, {
    isInstance: D.EC_(function isInstance(o){ return ArrayTData.isPrototypeOf(o) }),
    memberType: D._C_(MemberType),
    bytes:      D.EC_(bytes),
    count:      D.EC_(length),
  });

  // ###################
  // ### ArrayT Data ###
  // ###################

  var ArrayTData = Object.create(ArrayData, {
    constructor: D._C_(ArrayTInterface),
    bytes:       D.EC_(bytes),
    length:      D.EC_(length),
  });


  ArrayT.__proto__ = ArrayTInterface.__proto__ = ArrayType.prototype;
  ArrayT.prototype = ArrayTInterface.prototype = ArrayTData;

  return ArrayTInterface;
}

Type.call(ArrayType);

ArrayType.prototype.inspect = require('./utility').arrayTypeInspect;

// ######################
// ### ArrayType Data ###
// ######################

var ArrayData = {
  __proto__: Data.prototype,
  DataType: 'array',
  forEach: Array.prototype.forEach,
  reduce: Array.prototype.reduce,
  map: Array.prototype.map,

  reify: function reify(){
    return this.map(function(item){
      return item.reify();
    })
  },

  write: function write(value, index){
    if (value == null) throw new TypeError('Tried to write nothing');
    index = isFinite(index) ? +index : 0;
    if (isFinite(value)) {
      return this[index].write(value);
    }
    if ('length' in value) {
      while (index < this.length && offset < value.length) {
        this[index++].write(value[offset++]);
      }
    }
  },

  fill: function fill(val){
    val = val || 0;
    for (var i=0; i < this.length; i++) {
      this[i] = val;
    }
  },

  realign: function realign(offset){
    this.offset = offset || 0;
    this.view = new typedArrays[this.DataType](this.buffer, this.offset, 1);
  },

  rebase: function rebase(buffer, offset){
    if (buffer == null) {
      buffer = new Buffer(offset);
      offset = 0;
    } else {
      while (buffer.buffer) buffer = buffer.buffer;
    }
    this.buffer = buffer;
    this.realign(offset);
  },

  inspect: require('./utility').arrayInspect
};

ArrayType.prototype.prototype = ArrayData;
