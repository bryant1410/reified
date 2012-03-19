var D            = require('./lib/utility').desc;
var Data         = require('./lib/genesis').Type;
var lookupType   = require('./lib/genesis').lookupType;
var registerType = require('./lib/genesis').registerType;
var BuffBuffer   = require('./lib/buffer').BuffBuffer;

module.exports = reified;

function reified(type, subject, size, values){
  type = lookupType(type);
  if (reified.prototype.isPrototypeOf(this)) {
    return new type(subject, size, values);
  } else {
    subject = lookupType(subject, type);
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
  type = lookupType(type);
  if (typeof type === 'string') throw new TypeError('Type not found "'+type+'"');
  return new type(buffer, offset, values);
}
reified.isType = function isType(o){ return Type.isPrototypeOf(o) }
reified.isData = function isData(o){ return Type.prototype.isPrototypeOf(o) }

Object.defineProperties(reified, {
  NumericType:   D._CW(require('./lib/numeric')),
  StructType:    D._CW(require('./lib/struct')),
  ArrayType:     D._CW(require('./lib/array')),
  BitfieldType:  D._CW(require('./lib/bitfield')),
  BuffBuffer:    D._CW(BuffBuffer),
})

Object.defineProperty(reified, 'defaultEndian', {
  enumerable: true,
  configurable: true,
  get: function(){
  	return BuffBuffer.prototype.endianness;
  },
  set: function(v){
  	if (v !== 'LE' && v !== 'BE') throw new Error('Endianness must be "BE" or "LE"');
  	BuffBuffer.prototype.endianness = v;
  }
});