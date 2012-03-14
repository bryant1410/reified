"use strict";
var D            = require('./utility').desc;
var isObject     = require('./utility').isObject;
var Type         = require('./genesis').Type;
var Data         = require('./genesis').Data;

module.exports = StructType;


// ##########################################
// ##########################################
// ### StructType constructor constructor ###
// ##########################################
// ##########################################

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


  // #######################################
  // ### StructType instance constructor ###
  // #######################################

  function StructConstructor(buffer, offset, val){
    if (!ctor.isInstance(this)) {
      return new StructConstructor(buffer, offset, val);
    }
    if (isObject(buffer) && names[0] in buffer && !Buffer.isBuffer(buffer)) {
      val = buffer;
      buffer = new Buffer(bytes);
      buffer.fill();
    } else if (buffer == null) {
      val = {};
      buffer = new Buffer(bytes);
      buffer.fill();
    } else if ('buffer' in buffer) {
      while (buffer.buffer) {
        buffer = buffer.buffer;
      }
    }

    Object.defineProperty(this, 'buffer', D._CW(buffer.slice(offset || 0, bytes)));

    names.forEach(function(field){
      var item = val[field];
      if (item.dataType === 'struct') {
        item = item.reify();
      }
      var block = new fields[field](buffer, offsets[field], item);
      Object.defineProperty(this, field, {
        enumerable: true,
        configurable: true,
        get: function(){ return block },
        set: function(v){ block.write(v) }
      });
    }, this);
  }

  var ctor = eval('(function '+name+'(){ return StructConstructor.apply(this, arguments) })');

  ctor.__proto__ = StructType.prototype;

  Object.defineProperties(ctor, {
    isInstance: D.EC_(isInstance),
    fields:     D.EC_(Object.freeze(fields)),
    offsets:    D.EC_(Object.freeze(offsets)),
    names:      D.EC_(Object.freeze(names)),
    bytes:      D.EC_(bytes),
  });

  function isInstance(o){ return ctor.prototype.isPrototypeOf(o) }

  // #####################################
  // ### StructType instance prototype ###
  // #####################################

  StructConstructor.prototype = ctor.prototype = Object.create(StructType.prototype.prototype, {
    constructor: D._CW(ctor),
    dataType:    D.EC_('struct'),
    bytes:       D.EC_(bytes),
    inspect:     D._CW(inspect),
  });

  return ctor;
}

Type.call(StructType);


// ### Array instance prototype ###
StructType.prototype.prototype = {
  __proto__: Data.prototype,

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
};


function inspect(){
  var sep = this.bytes > 40 ? '\n ' : ' ';
  return '{ [Struct: '+this.constructor.name+']'+sep+
              this.constructor.names.map(function(field){
               return field+': '+this[field].inspect();
             }, this).join(','+sep)+' }';
}