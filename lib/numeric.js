"use strict";

var D            = require('./utility').desc;
var bits         = require('./utility').bits;
var genesis      = require('./genesis');
var NumericSubtype = genesis.Subtype.bind(NumericType);


module.exports = NumericType;


var types = {
     Int8: 1,
    Uint8: 1,
    Int16: 2,
   Uint16: 2,
    Int32: 4,
   Uint32: 4,
  Float32: 4,
  Float64: 8,
};


/**
 * Coerce to number when appropriate and verify number against type storage
 */
function checkType(type, val){
  if (val && val.DataType) {
    if (val.DataType === 'numeric' && val.Subtype === 'Int64' || val.Subtype === 'Uint64') {
      if (type === 'Int64' || type === 'Uint64') {
        return val;
      } else {
        throw new RangeError(val + ' exceeds '+type+' capacity');
      }
    } else if (val.DataType === 'array' || val.DataType === 'struct') {
      if (val.bytes > types[type][0]) {
        throw new RangeError(val + ' exceeds '+type+' capacity');
      } else {
        val = val.reify();
      }
    } else {
      val = val.reify();
    }
  }
  if (!val) val = 0;
  if (isFinite(val)) {
    val = +val;
  } else {
    throw new TypeError('Invalid value for ' + type + ': ' + val.DataType);
  }
  if (val && bits(val) / 8 > types[type][0]) {
    throw new RangeError(val + ' exceeds '+type+' capacity');
  }
  return val;
}



// ###############################
// ### NumericType Constructor ###
// ###############################

function NumericType(name, bytes){

  // ############################
  // ### NumericT Constructor ###
  // ############################

  function NumericT(buffer, offset, value){
    if (typeof buffer === 'number' || !buffer) {
      value = buffer;
      buffer = null;
    }
    this.rebase(buffer);
    this.realign(offset);

    if (value != null) {
      this.write(value);
    }
    this.emit('construct');
  }

  // #####################
  // ### NumericT Data ###
  // #####################

  NumericT.prototype = {
    Subtype: name,
    write: function write(v){
      this.buffer['write'+name](this.offset, checkType(name, v));
      return this;
    },
    reify: function reify(deallocate){
      var val = this.reified = this.buffer['read'+name](this.offset);
      this.emit('reify', val);
      val = this.reified;
      return val;
    },
  };

  return NumericSubtype(name, bytes, NumericT);
}


// ########################
// ### NumericType Data ###
// ########################

genesis.Type(NumericType, {
  DataType: 'numeric',
  fill: function fill(v){ this.write(0, v || 0) },
  realign: function realign(offset){
    D.hidden.value = offset || 0;
    Object.defineProperty(this, 'offset', D.hidden);
  },
});


Object.keys(types).forEach(function(name){
  NumericType[name] = new NumericType(name, types[name]);
});

var ArrayType = require('./array');

NumericType.Uint64 = new ArrayType('Uint64', 'Uint32', 2);
NumericType.Int64 = new ArrayType('Int64', 'Int32', 2);

var OctetString = new ArrayType('EightByteOctetString', 'Uint8', 8);

function octets(){ return new OctetString(this.buffer, this.offset) }
NumericType.Uint64.prototype.octets = octets;
NumericType.Int64.prototype.octets = octets;
