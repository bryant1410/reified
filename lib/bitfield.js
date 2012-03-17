"use strict";

var D     = require('./utility').desc;
var sLoop = require('./utility').sLoop;
var Type  = require('./genesis').Type;
var Data  = require('./genesis').Data;

var views = [Uint8Array, Uint8Array, Uint16Array, Uint32Array, Uint32Array];
var powers = Array.apply(null, Array(32)).map(Function.call.bind(Number)).map(Math.pow.bind(0,2));


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
  bytes = bytes || flags.length ? flags.length / 8 + .99 | 0 : 4;
  bytes = bytes || 4;

  // #############################
  // ### BitfieldT Constructor ###
  // #############################

  function BitfieldT(buffer, offset, values) {
    if (!Buffer.isBuffer(buffer)) {
      values = buffer;
      buffer = null;
    }
    this.rebase(buffer);
    this.realign(offset);

    if (Array.isArray(values)) {
      values.forEach(function(flag){ this[flag] = true }, this);
    }
  }

  // ###########################
  // ### BitfieldT Interface ###
  // ###########################

  var BitfieldInterface = eval('(function '+name+'(buffer, offset, values){ return new BitfieldT(buffer, offset, values) })');

  Object.defineProperties(BitfieldInterface, {
    bytes:      D._C_(bytes),
    flags:      D._CW(flags),
    isInstance: D._CW(function isInstance(o){ return BitfieldTData.isPrototypeOf(o) }),
  });


  // ######################
  // ### BitfieldT Data ###
  // ######################

  var BitfieldTData = Object.create(BitfieldData, {
    constructor: D._C_(BitfieldInterface),
    bytes:  D._C_(bytes),
    flags:  D._CW(flags),
    length: D._C_(flags.length > 0 ? flags.length : bytes * 8),
  });

  defineFlags(BitfieldTData, flags);

  BitfieldT.__proto__ = BitfieldInterface.__proto__ = BitfieldType.prototype;
  BitfieldT.prototype = BitfieldInterface.prototype = BitfieldTData;


  return BitfieldInterface;
}

Type.call(BitfieldType);

BitfieldType.isInstance = function isInstance(o){ return BitfieldData.isPrototypeOf(o) }


BitfieldType.prototype.inspect = require('./utility').bitfieldTypeInspect;


// #########################
// ### BitfieldType Data ###
// #########################

var BitfieldData = {
  __proto__: Data,
  forEach: Array.prototype.forEach,
  reduce: Array.prototype.reduce,
  map: Array.prototype.map,
  toString: function toString(){ return this.map(function(v){ return +v }).join('') },
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
  realign: function realign(offset){
    offset = offset || 0;
    Object.defineProperties(this, {
      offset: D._CW(offset),
      view: D._CW(new views[this.bytes](this.buffer, offset, 1))
    });
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

BitfieldType.prototype.prototype = BitfieldData;