var genesis      = require('./lib/genesis');
var D            = require('./lib/utility').desc;
var Buffer       = require('./lib/buffer').Buffer;
var NumericType  = require('./lib/numeric');
var StructType   = require('./lib/struct');
var ArrayType    = require('./lib/array');
var BitfieldType = require('./lib/bitfield');




module.exports = reified;

function reified(type, subject, size, values){

  type = genesis.lookupType(type);
  if (reified.prototype.isPrototypeOf(this)) {
    return new type(subject, size, values);
  } else {
    subject = genesis.lookupType(subject, type);
    if (!subject) {
      if (typeof type === 'string') {
        throw new TypeError('Subject is required when type not found');
      } else {
        return type;
      }
    }
    if (typeof type === 'string' && subject.Class === 'Type') {
      return subject.rename(type);
    }
    if (typeof subject === 'string' || subject.Class === 'Type') {
      return new reified.ArrayType(type, subject, size);
    } else if (Array.isArray(subject) || typeof subject === 'number' || size) {
      return new reified.BitfieldType(type, subject, size);
    } else {
      return new reified.StructType(type, subject);
    }
  }
}

reified.data = function data(type, buffer, offset, values){
  type = genesis.lookupType(type);
  if (typeof type === 'string') throw new TypeError('Type not found "'+type+'"');
  return new type(buffer, offset, values);
}
reified.reify = function reify(data){
  return Object.getPrototypeOf(data).reify.call(data);
}


reified.isType = function isType(o){ return genesis.Type.isPrototypeOf(o) }
reified.isData = function isData(o){ return genesis.Type.prototype.isPrototypeOf(o) }

Object.defineProperties(reified, {
  Type:          D._CW(genesis.Type),
  NumericType:   D._CW(NumericType),
  StructType:    D._CW(StructType),
  ArrayType:     D._CW(ArrayType),
  BitfieldType:  D._CW(BitfieldType),
  Buffer:        D._CW(Buffer),
})

Object.defineProperty(reified, 'defaultEndian', {
  enumerable: true,
  configurable: true,
  get: function(){
  	return Buffer.prototype.endianness;
  },
  set: function(v){
  	if (v !== 'LE' && v !== 'BE') throw new Error('Endianness must be "BE" or "LE"');
  	Buffer.prototype.endianness = v;
  }
});
