"use strict";

var D     = require('./utility').desc;
var sLoop = require('./utility').sLoop;
var Type  = require('./genesis').Type;

var views = [0, Uint8Array, Uint16Array, 3, Uint32Array];
var powers = Array.apply(null, Array(32)).map(Function.call.bind(Number)).map(Math.pow.bind(0,2));


module.exports = Bitfield;


/**
 * Create a bitfield on top of a buffer/data view. Optionally map named flags.
 * @param {Buffer}    [buffer]  optional buffer containing the bytes to frame bitfield on
 * @param {String[]}  [flags]   optional array of flag names that will be set ass accessors based on index
 * @param {Number}   [offset]   optional byte offset for the buffer
 */
function Bitfield(buffer, flags, offset) {
  var args = [].slice.call(arguments);
  buffer = Buffer.isBuffer(buffer) ? args.shift() : new Buffer(4);
  flags = Array.isArray(args[0]) ? args.shift() : [];
  var bytes = flags.length ? flags.length / 8 + .99 | 0 : args[0] in views ? args.shift() : 4;
  if (bytes === 3) bytes = 4;
  offset = isFinite(offset) ? +offset : 0;
  if (!flags.length && Array.isArray(args[0])) flags = args.shift() ;

  Object.defineProperties(this, {
    flags:   D._CW(flags),
    view:    D._CW(new views[bytes](buffer, offset || 0, 1)),
    buffer:  D._CW(buffer),
    bytes:   D.EC_(bytes),
    length:  D.EC_(flags.length || bytes * 8),
  });

  if (flags.length) {
    flags.forEach(function(flag, i){
      Object.defineProperty(this, flag, {
        configurable: true,
        enumerable: true,
        get: function( ){ return this[i] },
        set: function(v){ this[i] = v }
      })
    }, this);
  }
}

Bitfield.__proto__ = Type;

Bitfield.prototype = {
  __proto__: Type.prototype,
  constructor: Bitfield,
  forEach: Array.prototype.forEach,
  reduce: Array.prototype.reduce,
  map: Array.prototype.map,
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

powers.forEach(function(power, i){
  Object.defineProperty(Bitfield.prototype, i, {
    configurable: true,
    get: function( ){ return (this.view[0] & power) > 0 },
    set: function(v){ v ? this.view[0] |= power : this.view[0] &= ~power }
  });
});