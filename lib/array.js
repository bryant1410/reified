"use strict";
var D          = require('./utility').desc;
var isObject   = require('./utility').isObject;
var sLoop      = require('./utility').sLoop;
var Type       = require('./genesis').Type;
var lookupType = require('./genesis').lookupType;
var ArraySubtype = require('./genesis').Subtype.bind(ArrayType);

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

  function ArrayT(buffer, offset, values){
    if (!Buffer.isBuffer(buffer)) {
      values = buffer;
      buffer = null;
    }
    this.rebase(buffer);
    Object.defineProperty(this, 'offset', D._CW(offset || 0));

    values && Object.keys(values).forEach(function(i){
      initIndex(this, MemberType, i).write(values[i]);
    }, this);
  }

  ArrayT.memberType = MemberType;
  ArrayT.count = length;
  ArrayT.prototype.length = length;

  return defineIndices(ArraySubtype(name, bytes, ArrayT));
}


function initIndex(target, MemberType, index){
  var block = new MemberType(target.buffer, target.offset + index * MemberType.bytes);
  Object.defineProperty(target, index, {
    enumerable: true,
    configurable: true,
    get: function(){ return block },
    set: function(v){ block.write(v) }
  });
  return block;
}

function defineIndices(target){
  sLoop(target.count, function(i){
    Object.defineProperty(target.prototype, i, {
      enumerable: true,
      configurable: true,
      get: function(){ return initIndex(this, target.memberType, i) },
      set: function(v){ initIndex(this, target.memberType, i).write(v) }
    });
  });
  return target;
}

// ######################
// ### ArrayType Data ###
// ######################

Type(ArrayType, {
  DataType: 'array',
  forEach: Array.prototype.forEach,
  reduce: Array.prototype.reduce,
  map: Array.prototype.map,

  reify: function reify(){
    var output = [];
    for (var i=0; i < this.length; i++) {
      output[i] = this[i].reify();
    }
    return output;
  },

  write: function write(value, index, offset){
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
    Object.keys(this).forEach(function(i){
      isFinite(i) && this[i].realign(offset + i * member.bytes);
    }, this);
  },
});
