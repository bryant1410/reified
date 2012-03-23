"use strict";

var utility  = require('./utility');
var genesis  = require('./genesis');
var bytesFor = utility.bytes;
var bits     = utility.bits;
var BitfieldSubtype = genesis.Subtype.bind(BitfieldType);

var views = [Uint8Array, Uint8Array, Uint16Array, Uint32Array, Uint32Array];
var powers = Array.apply(null, Array(32)).map(Function.call.bind(Number)).map(Math.pow.bind(null, 2));

module.exports = BitfieldType;

// ################################
// ### BitfieldType Constructor ###
// ################################

function BitfieldType(name, flags, bytes){
  if (typeof name !== 'string') {
    bytes = flags;
    flags = name;
    name = '';
  }
  if (typeof flags === 'number') {
    bytes = flags;
    flags = [];
  }

  if (Array.isArray(flags)) {
    flags = flags.reduce(function(ret, name, index){
      ret[name] = 1 << index;
      return ret;
    }, {});
  }

  if (!(bytes > 0)) {
    bytes = bytesFor(max(flags)) ;
  }

  // #############################
  // ### BitfieldT Constructor ###
  // #############################

  function BitfieldT(data, offset, values) {
    if (!genesis.isBuffer(data)) {
      values = data || 0;
      data = null;
    }
    this.rebase(data);
    genesis.api(this, '_offset', +offset || 0);

    if (Array.isArray(values)) {
      values.forEach(function(flag){ this[flag] = true }, this);
    } else if (typeof values === 'number') {
      this.write(values);
    } else if (Object(values) === values){
      Object.keys(values).forEach(function(key){ this[key] = values[key] }, this);
    }
    this.emit('construct');
  };

  BitfieldT.flags = flags;

  // ######################
  // ### BitfieldT Data ###
  // ######################

  BitfieldT.prototype = {
    flags: flags,
    length: bytes * 8,
    toString: function toString(){ return this === BitfieldT.prototype ? '[object Data]' : this.map(function(v){ return +v }).join('') },
  };

  return defineFlags(BitfieldSubtype(name, bytes, BitfieldT));
}


function defineFlags(target) {
  var largest = 0;
  Object.keys(target.flags).forEach(function(flag){
    var val = target.flags[flag];
    largest = Math.max(largest, val);
    Object.defineProperty(target.prototype, flag, {
      configurable: true,
      enumerable: true,
      get: function( ){ return (this.read() & val) > 0 },
      set: function(v){ this.write(v ? this.read() | val : this.read() & ~val) }
    })
  });
  Array.apply(null, Array(target.bytes * 8)).forEach(function(n, i){
    var power = powers[i];
    if (power > largest) return;
    Object.defineProperty(target.prototype, i, {
      configurable: true,
      enumerable: true,
      get: function( ){ return (this.read() & power) > 0 },
      set: function(v){ this.write(v ? this.read() | power : this.read() & ~power) }
    });
  });
  return target;
}



// #########################
// ### BitfieldType Data ###
// #########################

genesis.Type(BitfieldType, {
  DataType: 'bitfield',
  forEach: Array.prototype.forEach,
  reduce: Array.prototype.reduce,
  map: Array.prototype.map,
  get: function get(i){ return (this.read() & powers[i]) > 0 },
  set: function get(i){ this.write(this.read() | powers[i]); return this; },
  unset: function unset(i){ this.write(this.read() & ~powers[i]); return this; },
  write: function write(v){ this._data['writeUint'+this.bytes*8](this._offset, v); return this; },
  read: function read(){ return this._data['readUint'+this.bytes*8](this._offset) },
  reify: function reify(deallocate){
    var flags = Object.keys(this.flags);
    if (flags.length) {
        var val = this.reified = flags.reduce(function(ret, flag, i){
          if (this[flag]) ret.push(flag);
        return ret;
      }.bind(this), []);
    } else {
      var val = this.map(function(v){ return v });
    }
    this.emit('reify', val);
    val = this.reified;
    delete this.reified;
    if (deallocate) {
      this.emit('deallocate');
      delete this._data;
      delete this._offset;
    }
    return val;
  }
});

function max(arr){
  if (Array.isArray(arr)) return arr.reduce(function(r,s){ return Math.max(s, r) }, 0);
  else return Object.keys(arr).reduce(function(r,s){ return Math.max(arr[s], r) }, 0);
}