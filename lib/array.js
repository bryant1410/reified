"use strict";
var D          = require('./utility').desc;
var isObject   = require('./utility').isObject;
var sLoop      = require('./utility').sLoop;
var Type       = require('./genesis').Type;
var lookupType = require('./genesis').lookupType;
var initArrayT = require('./genesis').initType.bind(ArrayType);

module.exports = ArrayType;

// #############################
// ### ArrayType Constructor ###
// #############################

function ArrayType(name, MemberType, length) {
  if (typeof name !== 'string') {
    length = MemberType || 0;
    MemberType = lookupType(name) || genesis.Type;
    name = MemberType.name + 'x'+length;
  } else {
    MemberType = lookupType(MemberType);
  }
  var bytes = MemberType.bytes * length;

  // ##########################
  // ### ArrayT Constructor ###
  // ##########################

  var ArrayT = initArrayT(name, bytes, function ArrayT(buffer, offset, values){
    if (!Buffer.isBuffer(buffer)) {
      values = buffer;
      buffer = null;
    }
    this.rebase(buffer);
    Object.defineProperty(this, 'offset', D._CW(offset || 0));

    sLoop(length, function defineIndices(i){
      var block = new MemberType(this.buffer, this.offset + i * MemberType.bytes, values ? values[i] : null);
      Object.defineProperty(this, i, {
        enumerable: true,
        configurable: true,
        get: function(){ return block },
        set: function(v){ block.write(v) }
      });
    }.bind(this));
  });

  Object.defineProperties(ArrayT, {
    memberType: D._C_(MemberType),
    count:      D.EC_(length),
  });

  Object.defineProperty(ArrayT.prototype, 'length', D.EC_(length));

  return ArrayT;
}

Type.call(ArrayType);

ArrayType.prototype.inspect = require('./utility').arrayTypeInspect;

// ######################
// ### ArrayType Data ###
// ######################

ArrayType.prototype.prototype = {
  __proto__: Type.prototype,
  DataType: 'array',
  forEach: Array.prototype.forEach,
  reduce: Array.prototype.reduce,
  map: Array.prototype.map,

  reify: function reify(){
    return this.map(function(item){
      return item.reify();
    });
  },

  write: function write(value, start, offset){
    if (value == null) throw new TypeError('Tried to write nothing');
    index = isFinite(index) ? +index : 0;
    offset = isFinite(offset) ? +offset : 0;
    if (isFinite(value)) {
      return this[index] = value;
    }
    if ('length' in value) {
      while (index < this.length && offset < value.length) {
        this[index++] = value[offset++];
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
    Object.defineProperty(this, 'offset', D._CW(offset || 0));
    this.forEach(function(member, i){
      member.realign(offset + i * member.bytes);
    });
  },

  inspect: require('./utility').arrayInspect
};
