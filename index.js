var ViewBuffer = require('./lib/buffer');
var lookupType = require('./lib/genesis').lookupType;
var registerType = require('./lib/genesis').registerType;

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
      return new reified.Array(type, subject, size);
    } else if (Array.isArray(subject) || typeof subject === 'number' || size) {
      return new reified.Bitfield(type, subject, size);
    } else {
      return new reified.Struct(type, subject);
    }
  }
}

reified.data = function data(type, buffer, offset, values){
  type = lookupType(type);
  if (typeof type === 'string') throw new TypeError('Type not found "'+type+'"');
  return new type(buffer, offset, values);
}

reified.Numeric = require('./lib/numeric');
reified.Struct = require('./lib/struct');
reified.Array = require('./lib/array');
reified.Bitfield = require('./lib/bitfield');
reified.ViewBuffer = ViewBuffer;

Object.defineProperty(reified, 'defaultEndian', {
  enumerable: true,
  configurable: true,
  get: function(){
  	return ViewBuffer.prototype.endianness;
  },
  set: function(v){
  	if (v !== 'LE' && v !== 'BE') throw new Error('Endianness must be "BE" or "LE"');
  	ViewBuffer.prototype.endianness = v;
  }
});