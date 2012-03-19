var ViewBuffer = require('./lib/buffer');
var lookupType = require('./lib/genesis').lookupType;

module.exports = createData;

function createData(type, buffer, offset, values){
  type = lookupType(type);
  return new type(buffer, offset, values);
}

createData.Numeric = require('./lib/numeric');
createData.Struct = require('./lib/struct');
createData.Array = require('./lib/array');
createData.Bitfield = require('./lib/bitfield');
createData.ViewBuffer = ViewBuffer;

Object.defineProperty(createData, 'defaultEndian', {
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