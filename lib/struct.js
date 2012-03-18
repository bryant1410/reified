"use strict";
var D            = require('./utility').desc;
var isObject     = require('./utility').isObject;
var genesis      = require('./genesis');
var initStruct   = require('./genesis').initType.bind(StructType);

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

  fields = Object.keys(fields).reduce(function(ret, name){
    ret[name] = genesis.lookup(fields[name]);
    names.push(name);
    offsets[name] = bytes;
    bytes += ret[name].bytes;
    return ret;
  }, {});


  // ###########################
  // ### StructT Constructor ###
  // ###########################

  function StructT(buffer, offset, values){
    if (!Buffer.isBuffer(buffer)) {
      values = buffer;
      buffer = null;
    }
    this.rebase(buffer);
    this.realign(offset);

    names.forEach(function defineFields(field){
      var block = new fields[field](this.buffer, this.offset + offsets[field], values ? values[field] : null);
      Object.defineProperty(this, field, {
        enumerable: true,
        configurable: true,
        get: function(){ return block },
        set: function(v){ block.write(v) }
      });
    }, this);
  }

  StructT.bytes = bytes;

  // #########################
  // ### StructT Interface ###
  // #########################

  var StructTInterface = Object.defineProperties(initStruct(name, StructT), {
    fields:  D.EC_(Object.freeze(fields)),
    offsets: D.EC_(Object.freeze(offsets)),
    names:   D._C_(Object.freeze(names)),
  });

  return StructTInterface;
}

genesis.Type.call(StructType);



StructType.prototype.inspect = require('./utility').structTypeInspect;



// #######################
// ### StructType Data ###
// #######################

var StructData = {
  __proto__: genesis.Data,
  DataType: 'struct',

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

  realign: function realign(offset){
    Object.defineProperty(this, 'offset', D._CW(offset || 0));
    Object.keys(this).forEach(function(field){
      this[field].realign && this[field].realign(offset + this.constructor.offsets[field]);
    }, this);
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