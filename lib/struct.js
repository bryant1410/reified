"use strict";
var D            = require('./utility').desc;
var isObject     = require('./utility').isObject;
var Type         = require('./genesis').Type;
var Data         = require('./genesis').Data;

module.exports = StructType;


// ##############################
// ### StructType Constructor ###
// ##############################

function StructType(name, fields){
  if (!fields) {
    fields = name, name = '';
  }

  // copy the input structure so we can put it on the ctor for display
  var bytes = 0;
  var offsets = {};
  var names = [];

  fields = Object.keys(fields).reduce(function(ret, field){
    names.push(field);
    ret[field] = fields[field];
    offsets[field] = bytes;
    bytes += fields[field].bytes;
    return ret;
  }, {});


  // ###########################
  // ### StructT Constructor ###
  // ###########################

  function StructT(buffer, offset, values){
    if (isObject(buffer) && names[0] in buffer && !Buffer.isBuffer(buffer)) {
      values = buffer;
      buffer = new Buffer(bytes);
      buffer.fill();
    } else if (buffer == null) {
      buffer = new Buffer(bytes);
      buffer.fill();
    } else if ('buffer' in buffer) {
      while (buffer.buffer) {
        buffer = buffer.buffer;
      }
    }

    Object.defineProperties(this, {
      buffer: D._CW(buffer),
      offset: D._CW(offset || 0)
    });

    names.forEach(function(field){
      var block = new fields[field](buffer, this.offset + offsets[field], values ? values[field] : null);
      Object.defineProperty(this, field, {
        enumerable: true,
        configurable: true,
        get: function(){ return block },
        set: function(v){ block.write(v) }
      });
    }, this);
  }

  // #########################
  // ### StructT Interface ###
  // #########################

  var StructTInterface = eval('(function '+name+'(buffer, offset, values){ return new StructT(buffer, offset, values) })');

  Object.defineProperties(StructTInterface, {
    isInstance: D._C_(function isInstance(o){ return StructTData.isPrototypeOf(o) }),
    fields:     D.EC_(Object.freeze(fields)),
    names:      D._C_(Object.freeze(names)),
    bytes:      D.EC_(bytes),
  });

  // ####################
  // ### StructT Data ###
  // ####################

  var StructTData = Object.create(StructData, {
    constructor: D._CW(StructTInterface),
    bytes:       D.EC_(bytes),
  });


  StructT.__proto__ = StructTInterface.__proto__ = StructType.prototype;
  StructT.prototype = StructTInterface.prototype = StructTData;

  return StructTInterface;
}

Type.call(StructType);

StructType.prototype.inspect = require('./utility').structTypeInspect;



// #######################
// ### StructType Data ###
// #######################

var StructData = {
  __proto__: Data.prototype,
  DataType: D.EC_('struct'),

  reify: function reify(){
    return this.constructor.names.reduce(function(ret, field){
      ret[field] = this[field].reify();
      return ret;
    }.bind(this), {});
  },

  write: function write(o){
    if (isObject(o)) {
      this.constructor.names.forEach(function(field){
        if (field in o) {
          this[field] = o[field];
        }
      }, this);
    }
  },

  fill: function fill(val){
    val = val || 0;
    this.constructor.names.forEach(function(field){
      this[field] = val;
    }, this);
  },

  inspect: require('./utility').structInspect
};

StructType.prototype.prototype = StructData;