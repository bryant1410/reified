"use strict";
var isObject      = require('./utility').isObject;
var genesis       = require('./genesis');
var StructSubtype = genesis.Subtype.bind(StructType);

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
  var keys = [];

  fields = Object.keys(fields).reduce(function(ret, name){
    ret[name] = genesis.lookupType(fields[name]);
    keys.push(name);
    offsets[name] = bytes;
    bytes += ret[name].bytes;
    return ret;
  }, {});

  // ###########################
  // ### StructT Constructor ###
  // ###########################

  function StructT(data, offset, values){
    if (!genesis.isBuffer(data)) {
      values = data;
      data = null;
    }
    this.rebase(data);
    genesis.api(this, '_offset', +offset || 0);

    if (values) {
      Object.keys(values).forEach(function(field){
        if (!field in fields) throw new Error('Invalid field "'+field+'"');
        field in fields && initField(this, StructT, field).write(values[field]);
     }, this);
    }
    return this;
    //this.emit('construct');
  }

  StructT.fields = fields;
  StructT.offsets = offsets;
  StructT.keys = keys;

  return defineFields(StructSubtype(name, bytes, StructT));
}

function initField(target, ctor, field){
  var block = new ctor.fields[field](target._data, target._offset + ctor.offsets[field]) ;
  Object.defineProperty(target, field, {
    enumerable: true,
    configurable: true,
    get: function(){ return block },
    set: function(v){
      if (v === null) {
        //this.emit('deallocate', field);
        genesis.nullable(this, field);
        block = null;
      } else {
        block.write(v);
      }
    }
  });
  return block;
}

function defineFields(target){
  target.keys.forEach(function(field){
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

genesis.Type(StructType, {
  DataType: 'struct',

  reify: function reify(deallocate){
    this.reified = this.constructor.keys.reduce(function(ret, field){
      ret[field] = this[field] == null ? initField(this, this.constructor, field).reify(deallocate) : this[field].reify(deallocate);
      if (deallocate) this[field] = null;
      return ret;
    }.bind(this), {});
    //this.emit('reify', this.reified);
    var val = this.reified;
    delete this.reified;
    return val;
  },

  write: function write(o){
    if (isObject(o)) {
      if (o.reify) o = o.reify();
      Object.keys(o).forEach(function(field, current){
        current = o[field];
        if (current != null) {
          this[field] = current.reify ? current.reify() : current;
        } else if (current === null) {
          this[field] = null;
        }
      }, this);
    }
  },

  realign: function realign(offset, deallocate){
    this._offset = offset = +offset || 0;
    // use realiagn as a chance to DEALLOCATE since everything is being reset essentially
    Object.keys(this).forEach(function(field){
      if (deallocate) this[field] = null;
      else this[field].realign(offset);
    }, this);
  },

  fill: function fill(val){
    val = val || 0;
    this.constructor.keys.forEach(function(field){
      this[field] = val;
    }, this);
  },
});
