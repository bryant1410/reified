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

    if (values) {
      Object.keys(values).forEach(function(field){
        if (!field in fields) throw new Error('Invalid field "'+field+'"');
        field in fields && initField(this, StructT, field).write(values[field]);
     }, this);
    }
    this.emit('construct');
  }

  StructT.fields = fields;
  StructT.offsets = offsets;
  StructT.names = names;

  return defineFields(StructSubtype(name, bytes, StructT));
}

function initField(target, ctor, field){
  var block = new ctor.fields[field](target.buffer, target.offset + ctor.offsets[field]) ;
  Object.defineProperty(target, field, {
    enumerable: true,
    configurable: true,
    get: function(){ return block },
    set: function(v){ block.write(v) }
  });
  return block;
}

function defineFields(target){
  target.names.forEach(function(field){
    Object.defineProperty(target.prototype, field, {
      enumerable: true,
      configurable: true,
      get: function(){ return initField(this, target, field) },
      set: function(v){ initField(this, target, field).write(v) }
    });
  });
  return target;
}

// #######################
// ### StructType Data ###
// #######################

Type(StructType, {
  DataType: 'struct',

  reify: function reify(){
    this.reified = this.constructor.names.reduce(function(ret, field){
      ret[field] = this[field].reify();
      return ret;
    }.bind(this), {});
    this.emit('reify', this.reified);
    var val = this.reified;
    delete this.reified;
    return val;
  },

  write: function write(o){
    if (isObject(o)) {
      if (o.reify) o = o.reify();
      Object.keys(o).forEach(function(field){
        this[field] = o[field].reify ? o[field].reify() : o[field];
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
