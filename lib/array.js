"use strict";
var D        = require('./utility').desc;
var isObject = require('./utility').isObject;
var sLoop    = require('./utility').sLoop;
var Type     = require('./genesis').Type;
var Data     = require('./genesis').Data;

module.exports = ArrayType;

// #########################################
// #########################################
// ### ArrayType constructor constructor ###
// #########################################
// #########################################


function ArrayType(name, type, length) {
  if (typeof name !== 'string') {
    length = type;
    type = name;
    name = type.name + 'x' + length;
  }
  var bytes = type.bytes * length;

  // ######################################
  // ### ArrayType instance constructor ###
  // ######################################

  function ArrayConstructor(buffer, byteOffset, val){
    if (!ctor.isInstance(this)) {
      return new ArrayConstructor(buffer, byteOffset, val);
    }
    if (Array.isArray(buffer)) {
      val = buffer;
      buffer = new Buffer(bytes);
      buffer.fill();
    } else if (buffer == null) {
      val = [];
      buffer = new Buffer(bytes);
      buffer.fill();
    } else if ('buffer' in buffer) {
      while (buffer.buffer) {
        buffer = buffer.buffer;
      }
    }
    Object.defineProperty(this, 'buffer', D._CW(new DataView(buffer, byteOffset || 0, bytes)));
    defineIndices(this, val);
  }

  var ctor = eval('(function '+name+'(){ return ArrayConstructor.apply(this, arguments) })');

  ctor.__proto__ = ArrayType.prototype;

  Object.defineProperties(ctor, {
    isInstance:  D._C_(isInstance),
    elementType: D.EC_(type),
    bytes:       D.EC_(bytes),
    count:       D._C_(length),
  });

  function isInstance(o){ return ctor.prototype.isPrototypeOf(o) }

  function defineIndices(target, values){
    values = values || [];
    sLoop(length, function(i){
      var block = new type(target.buffer, i * type.bytes, values[i]);
      Object.defineProperty(target, i, {
        enumerable: true,
        configurable: true,
        get: function(){ return block },
        set: function(v){ block.write(v) }
      });
    });
  }

  // ####################################
  // ### ArrayType instance prototype ###
  // ####################################

  ArrayConstructor.prototype = ctor.prototype = Object.create(ArrayType.prototype.prototype, {
    constructor: D._CW(ctor),
    dataType:    D.EC_('array'),
    bytes:       D.EC_(bytes),
    length:      D.EC_(length),
  });

  return ctor;
}


// ###################################
// ###################################
// ### Array constructor prototype ###
// ###################################
// ###################################

Type.call(ArrayType);



// ### Array instance prototype ###
ArrayType.prototype.prototype = {
  __proto__: Data.prototype,
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
  inspect: require('./utility').arrayInspect
};