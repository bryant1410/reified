"use strict";

var D     = require('./utility').desc;
var sLoop = require('./utility').sLoop;
var Type  = require('./genesis').Type;

var views = [Uint8Array, Uint8Array, Uint16Array, Uint32Array, Uint32Array];
var powers = Array.apply(null, Array(32)).map(Function.call.bind(Number)).map(Math.pow.bind(0,2));


module.exports = BitfieldType;


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
  bytes = bytes || flags.length ? flags.length / 8 + .99 | 0 : 4;
  bytes = bytes || 4;
  /**
   * Create a bitfield on top of a buffer/data view. Optionally map named flags.
   * @param {Buffer}    [buffer]  optional buffer containing the bytes to frame bitfield on
   * @param {String[]}  [flags]   optional arrayinst of flag names that will be set ass accessors based on index
   * @param {Number}   [offset]   optional byte offset for the buffer
   */
  function Bitfield(buffer, offset, vals) {
    if (!ctor.isInstance(this)) {
      return new Bitfield(buffer, offset, vals);
    }

    if (Array.isArray(buffer) || !buffer) {
      vals = buffer || [];
      this.rebase(null, bytes);
    } else {
      this.rebase(buffer, offset);
    }

    if (Array.isArray(vals)) {
      vals.forEach(function(flag){ this[flag] = true }, this);
    }
  }
  var ctor = eval('(function '+name+'(){ return Bitfield.apply(this, arguments) })');

  ctor.__proto__ = BitfieldType;

  Object.defineProperties(ctor, {
    bytes:       D._C_(bytes),
    isInstance:  D._CW(function isInstance(o){ return Bitfield.prototype.isPrototypeOf(o) }),
  });

  Bitfield.prototype = ctor.prototype = Object.create(BitfieldType.prototype, {
    constructor: D._C_(Bitfield),
    bytes:  D._C_(bytes),
    flags:  D._CW(flags),
    length: D._C_(flags.length > 0 ? flags.length : bytes * 8),
  });

  defineFlags(Bitfield.prototype, flags);

  return ctor;
}

Type.call(BitfieldType);

BitfieldType.prototype = {
  __proto__: Type.prototype,
  forEach: Array.prototype.forEach,
  reduce: Array.prototype.reduce,
  map: Array.prototype.map,
  rebase: function rebase(buffer, offset){
    if (buffer == null) {
      buffer = new Buffer(offset);
      offset = 0;
    } else {
      while (buffer.buffer) buffer = buffer.buffer;
    }
    Object.defineProperty(this, 'buffer', D._CW(buffer));
    this.realign(offset);
  },
  realign: function realign(offset){
    offset = offset || 0;
    Object.defineProperties(this, {
      offset: D._CW(offset),
      view: D._CW(new views[this.bytes](this.buffer, offset, 1))
    });
  },
  get: function get(i){ return (this.view[0] & powers[i]) > 0 },
  set: function get(i){ this.view[0] |= powers[i]; return this; },
  unset: function unset(index){ this.view[0] &= ~powers[i]; return this; },
  write: function write(v){ this.view[0] = v; return this; },
  read: function read(){ return this.view[0] },
  reify: function reify(){
    if (this.flags.length) {
      return this.flags.reduce(function(ret, flag, i){
        ret[flag] = this[i];
        return ret;
      }.bind(this), {});
    } else {
      return this.map(function(v){ return v });
    }
  },
  inspect: require('./utility').bitfieldInspect
};


function defineFlags(target, flags) {
  flags.forEach(function(flag, i){
    Object.defineProperty(target, flag, {
      configurable: true,
      enumerable: true,
      get: function( ){ return this[i] },
      set: function(v){ this[i] = v }
    })
  });
  powers.forEach(function(power, i){
    Object.defineProperty(target, i, {
      configurable: true,
      enumerable: true,
      get: function( ){ return (this.view[0] & power) > 0 },
      set: function(v){ v ? this.view[0] |= power : this.view[0] &= ~power }
    });
  });
}