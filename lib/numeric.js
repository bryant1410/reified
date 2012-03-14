var D     = require('./utility').desc;
var sLoop = require('./utility').sLoop;
var Type  = require('./genesis').Type;


module.exports = Block;


var types = {
     Int8: [1, function(x){ return ((x & 0x80000000) >> 24) | (x & 0x7f) }],
    Uint8: [1, function(x){ return (x >>> 0) & 0xff }],
    Int16: [2, function(x){ return ((x & 0x80000000) >> 16) | (x & 0x7fff) }],
   Uint16: [2, function(x){ return (x >>> 0) & 0xffff }],
    Int32: [4, function(x){ return x | 0 }],
   Uint32: [4, function(x){ return x >>> 0 }],
//    Int64: [8], //TODO
//   Uint64: [8], //TODO
  Float32: [4, function(x){ return x }], //TODO
  Float64: [8, function(x){ return x }], //TODO
};

var typeMap = {};


function bits(n){ return Math.log(n) / Math.LN2 }

/**
 * Coerce to number when appropriate and verify number against type storage
 */
function checkType(type, val){
  if (isFinite(val)) {
    val = +val;
  } else if (val && val.dataType === 'int64' || val.dataType === 'uint64') {
    val = val.buffer;
  } else {
    throw new TypeError('Invalid value');
  }
  if (val && bits(val) / 8 > types[type][0]) {
    throw new RangeError(val + ' exceeds '+type+' capacity');
  }
  return val;
}

/**
 * Reinterpret the bits underlying a value as another type
 */
function castToType(type, val){
  if (isFinite(val)) {
    return types[type][1](+val);
  } else if (val === Infinity || val !== val) { //NaN
    return 0;
  } else if (val && val.dataType === 'Int64' || val.dataType === 'Uint64') {
    // TODO this won't work
    return types[type][1](val);
  }
  throw new TypeError('Type not castable');
}



// #####################################
// ### Parent for numeric references ###
// #####################################

function Block(type, buffer, byteOffset, val){
  if (!Block.isBlock(this) && typeof buffer === 'number') {
    // Call with number -> `cast(type, number)`
    return castToType(type, buffer);

  } else if (type in typeMap) {
    // Call/construct specified type -> `new BlockType`
    return new typeMap[type](buffer, byteOffset, val);

  } else if (Block.isBlock(type)) {
    // Call with existing block -> `block.reify()`
    return type.reify();
  }
}

Block.isBlock = function isBlock(o){
  return Block.prototype.isPrototypeOf(o);
}



// ###############################################
// ### Parent prototype for numeric references ###
// ###############################################

Block.prototype = Object.defineProperties({}, {
  Class:    D._C_('Block'),
  dataType: D.EC_('Empty'),
  toString: D._CW(function toString(){ return '[object Block]' }),
  inspect:  D._CW(function inspect(){ return '<'+this.dataType+' '+this.reify()+'>' }),
  write:    D.ECW(function write(v){ this.buffer[0] = checkType(this.dataType, v); return this; }),
  reify:    D.ECW(function reify(){ return this.buffer ? this.buffer[0] : null }),
});



Object.keys(types).forEach(function(type){
  var TypedArray = global[type + 'Array'];
  var bytes = types[type][0];

  // #####################################
  // ### Constructor for specific type ###
  // #####################################

  function NumericType(buffer, byteOffset, val){
    if (!Block.isBlock(this)) {
      return typeof buffer === 'number' ? castToType(type, buffer) : new NumericType(buffer, byteOffset, val);
    }

    if (typeof buffer === 'number') {
      val = buffer;
      buffer = new Buffer(bytes);
    } else {
      while (buffer.buffer) {
        buffer = buffer.buffer;
      }
    }

    this.buffer = new TypedArray(buffer, byteOffset || 0, 1);

    if (val != null) {
      this.write(val);
    }
  }

  // Shell named function for public interface
  var interface = eval('(function '+type+'(){ return NumericType.apply(this, arguments) })');
  interface.__proto__ = Type;
  Object.defineProperty(interface, 'bytes', D._C_(bytes));

  // ###################################
  // ### Prototype for specific type ###
  // ###################################

  interface.prototype = NumericType.prototype = Object.create(Block.prototype, {
    constructor: D._C_(interface),
    dataType:    D.EC_(type),
    bytes:       D._C_(bytes),
  });

  // var isType = interface['is'+type+'Block'] = function(o){
  //   return NumericType.prototype.isPrototypeOf(o);
  // }

  typeMap[type] = typeMap[type.toLowerCase()] = NumericType;
  Block[type] = interface;
});

