var D        = require('./utility').desc;
var isObject = require('./utility').isObject;
var sLoop    = require('./utility').sLoop;
var Type     = require('./genesis').Type;
var Data     = require('./genesis').Data;
var n = require('./numeric');

module.exports = ArrayType;

// #########################################
// #########################################
// ### ArrayType constructor constructor ###
// #########################################
// #########################################


function ArrayType(type, length) {
  var bytes = type.bytes * length;
  var dataType = type.name.replace(/Array$/, '') + 'x' + length + 'Array';

  // ######################################
  // ### ArrayType instance constructor ###
  // ######################################

  function ArrayConstructor(buffer, byteOffset, val){
    if (!interface.isInstance(this)) {
      return new ArrayConstructor(buffer, byteOffset, val);
    }
    if (Array.isArray(buffer)) {
      val = buffer;
      buffer = new Buffer(bytes);
      buffer.fill();
    } else if (buffer == null) {
      val = [];
      buffer = new Buffer(bytes);
      buffer.fill();
    } else if ('buffer' in buffer) {
      while (buffer.buffer) {
        buffer = buffer.buffer;
      }
    }
    Object.defineProperty(this, 'buffer', D._CW(new DataView(buffer, byteOffset || 0, bytes)));
    defineIndices(this, val);
  }

  var interface = eval('(function '+dataType+'(){ return ArrayConstructor.apply(this, arguments) })');

  interface.__proto__ = ArrayType.prototype;

  Object.defineProperties(interface, {
    isInstance: D.EC_(isInstance),
    bytes:      D.EC_(bytes)
  });

  function isInstance(o){ return interface.prototype.isPrototypeOf(o) }

  function defineIndices(target, values){
    values = values || [];
    sLoop(length, function(i){
      var block = new type(target.buffer, i * type.bytes, values[i]);
      Object.defineProperty(target, i, {
        enumerable: true,
        configurable: true,
        get: function(){ return block },
        set: function(v){ block.write(v) }
      });
    });
  }

  // ####################################
  // ### ArrayType instance prototype ###
  // ####################################

  ArrayConstructor.prototype = interface.prototype = Object.create(ArrayType.prototype.prototype, {
    constructor: D._CW(interface),
    dataType:    D.EC_(dataType),
    bytes:       D.EC_(bytes),
    length:      D.EC_(length),
  });

  return interface;
}

Object.defineProperties(ArrayType, {
  dataType: D._C_('Array'),
});



// ###################################
// ###################################
// ### Array constructor prototype ###
// ###################################
// ###################################

ArrayType.prototype = function(){}
ArrayType.prototype.__proto__ = Type.prototype;

Object.defineProperties(ArrayType.prototype, {
  constructor: D._CW(ArrayType),
});


// ### Array instance prototype ###
ArrayType.prototype.prototype = {
  __proto__: Data.prototype,
  forEach: Array.prototype.forEach,
  reduce: Array.prototype.reduce,
  map: Array.prototype.map,

  reify: function reify(){
    return this.map(function(item){
      return item.reify();
    })
  },

  write: function write(value, index, length){
    if (value == null) throw new TypeError('Tried to write nothing');
    index = isFinite(index) ? +index : 0;
    if (isFinite(value)) {
      return this[index].write(value);
    }
    if ('length' in value) {
      while (index < this.length && offset < value.length) {
        this[index++].write(value[offset++]);
      }
    }
  },

  fill: function fill(val){
    for (var i=0; i < this.length; i++) {
      this[i].write(val);
    }
  },

  inspect: function inspect(){
    return '['+this.dataType+'\n '+this.map(function(item){ return item.subinspect() }).join(',\n ')+' ]';
  },
  subinspect: function subinspect(){
    return '[ '+this.map(function(item){ return item.subinspect() }).join(', ')+' ]';
  }
};

var int32x2 = new ArrayType(n.Int32,4);
var int32x2x2 = new ArrayType(int32x2, 4);
var int32x2x2x4 = new ArrayType(int32x2x2, 4);
console.log(new int32x2x2x4);




//var buff = new Buffer(50);
//buff.fill(100);
//var instance = new int8x10(buff);
//console.log(instance);