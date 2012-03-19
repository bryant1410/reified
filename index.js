var ViewBuffer = require('./lib/buffer');

module.exports = {
  Numeric:  require('./lib/numeric'),
  Struct:   require('./lib/struct'),
  Array:    require('./lib/array'),
  Bitfield: require('./lib/bitfield'),
  ViewBuffer: ViewBuffer,
  get defaultEndian(){
  	return ViewBuffer.prototype.endianness;
  },
  set defaultEndian(v){
  	if (v !== 'LE' && v !== 'BE') throw new Error('Endianness must be "BE" or "LE"');
  	ViewBuffer.prototype.endianness = v;
  }
};
