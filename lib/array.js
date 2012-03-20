"use strict";
var genesis = require('./genesis');
var ArraySubtype = genesis.Subtype.bind(ArrayType);

module.exports = ArrayType;

// #############################
// ### ArrayType Constructor ###
// #############################

function ArrayType(name, MemberType, length) {
  if (typeof name !== 'string' || typeof MemberType === 'number') {
    length = MemberType || 0;
    MemberType = genesis.lookupType(name);
    name = MemberType.name + 'x'+length;
  } else {
    MemberType = genesis.lookupType(MemberType);
  }
  if (genesis.lookupType(name) !== name) return genesis.lookupType(name);
  var bytes = MemberType.bytes * length;

  // ##########################
  // ### ArrayT Constructor ###
  // ##########################

  function ArrayT(buffer, offset, values){
    if (!genesis.isBuffer(buffer)) {
      values = buffer;
      buffer = null;
    }
    this.rebase(buffer);
    Object.defineProperty(this, 'offset', { configurable: true, writable: true, value: offset || 0 });

    values && Object.keys(values).forEach(function(i){
      initIndex(this, MemberType, i).write(values[i]);
    }, this);
    this.emit('construct');
  }

  ArrayT.memberType = MemberType;
  ArrayT.count = length;
  ArrayT.prototype.length = length;

  return defineIndices(ArraySubtype(name, bytes, ArrayT));
}

var nullable = { value: undefined, writable: true, configurable: true };
var hidden = { configurable: true, writable: true, value: 0 };


function initIndex(target, MemberType, index){
  var block = new MemberType(target.buffer, target.offset + index * MemberType.bytes);
  Object.defineProperty(target, index, {
    enumerable: true,
    configurable: true,
    get: function(){ return block },
    set: function(v){
      if (v === null) {
        // take null to mean full deallocate
        this.emit('deallocate', index);
        Object.defineProperty(this, index, nullable);
        delete this[index];
        block = null;
      } else {
        block.write(v, index)
      }
    }
  });
  return block;
}

function defineIndices(target){
  Array.apply(null, Array(target.count)).forEach(function(n, index){
    Object.defineProperty(target.prototype, index, {
      enumerable: true,
      configurable: true,
      get: function(){ return initIndex(this, target.memberType, index) },
      set: function(v){ initIndex(this, target.memberType, index).write(v, index) }
    });
  });
  return target;
}

// ######################
// ### ArrayType Data ###
// ######################

genesis.Type(ArrayType, {
  DataType: 'array',
  forEach: Array.prototype.forEach,
  reduce: Array.prototype.reduce,
  map: Array.prototype.map,

  reify: function reify(deallocate){
    var output = this.reified = [];
    for (var i=0; i < this.length; i++) {
      output[i] = this[i].reify(deallocate);
      if (deallocate) this[i] = null;
    }
    this.emit('reify', output);
    output = this.reified;
    delete this.reified;
    return output;
  },

  write: function write(value, index, offset){
    if (value == null) throw new TypeError('Tried to write nothing');

    if (isFinite(index)) {
      // we have an index
      if (!isFinie(offset)) {
        // and no offset so it's going in
        return this[index] = value;
      } else {
        offset = +offset;
      }
      index = +index;
    } else {
      // prep for arrayish value
      index = 0;
      offset = +offset || 0;
    }

    // reify if needed, direct buffer copying doesn't happen here
    if (value.reify) value = value.reify();

    if (Array.isArray(value) || value && 'length' in value) {
      // arrayish and offset + index are already good to go
      while (index < this.length && offset < value.length) {
        var current = value[offset++];
        if (current != null) {
          this[index++] = current.reify ? current.reify() : current;
        } else if (current === null) {
          this[index++] = null;
        }
      }
    } else {
      // last ditch, something will throw an error if this isn't an acceptable type
      this[index] = offset ? value[offset] : value;
    }
  },

  fill: function fill(val){
    val = val || 0;
    for (var i=0; i < this.length; i++) {
      this[i] = val;
    }
  },

  realign: function realign(offset){
    hidden.offset = (offset = +offset || 0);
    Object.defineProperty(this, 'offset', hidden);
    // use realiagn as a chance to DEALLOCATE since everything is being reset essentially
    Object.keys(this).forEach(function(i){
      if (isFinite(i)) this[i] = null;
    }, this);
  },
});
