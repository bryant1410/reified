"use strict";
var D            = require('./utility').desc;
var isObject     = require('./utility').isObject;
var Type         = require('./genesis').Type;
var lookupType   = require('./genesis').lookupType;
var StructSubtype = require('./genesis').Subtype.bind(StructType);

module.exports = StructType;


// ##############################
// ### StructType Constructor ###
// ##############################

function StructType(name, fields){
  if (!fields) {
    fields = name;
    name = '';
  }

  var bytes = 0;
  var offsets = {};
  var names = [];

  fields = Object.keys(fields).reduce(function(ret, name){
    ret[name] = lookupType(fields[name]);
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
  };

  StructT.fields = Object.freeze(fields);
  StructT.offsets = Object.freeze(offsets);
  StructT.names = Object.freeze(names);

  return StructSubtype(name, bytes, StructT);
}


// #######################
// ### StructType Data ###
// #######################

Type(StructType, {
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
});
