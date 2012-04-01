"use strict";

var genesis = require('./genesis');
var DataBuffer  = require('./buffer');
var numeric = require('./numeric');
var PointerSubtype = genesis.Subtype.bind(PointerType);

module.exports = PointerType;

// ###############################
// ### PointerType Constructor ###
// ###############################

function PointerType(name, type, addressType){
  if (typeof name !== 'string') {
    addressType = type;
    type = name;
    name = type.name;
  }

  if (typeof type === 'string') {
    type = genesis.lookupType(type);
  } else if (typeof type === 'undefined') {
    var type = genesis.lookupType(name);
  }

  addressType = addressType || numeric.Uint32;
  if (typeof addressType === 'string') {
    addressType = genesis.lookupType(addressType);
  }

  name = '*'+name;

  // ############################
  // ### PointerT Constructor ###
  // ############################

  function PointerT(data, offset, values){
    if (!genesis.isBuffer(data)) {
      values = data;
      data = null;
    }
    this.rebase(data);

    genesis.api(this, '_offset', +offset || 0);

    this.address = new addressType(this._data, this._offset);

    if (isFinite(values)) {
      this.address.write(values);
    } else if (values && values._data) {
      this.pointTo(values);
    }

    this.emit('construct');
  }

  PointerT.pointeeType = type;
  PointerT.addressType = addressType;

  Object.defineProperty(PointerT.prototype, 'pointee', {
    enumerable: true, configurable: true,
    get: function(){
      return initPointee(this, type);
    },
    set: function(v){
      initPointee(this, type).write(v);
    }
  });

  return PointerSubtype(name, addressType.bytes, PointerT);
}

function initPointee(target, type){
  var resolved = target.resolve();
  var address = target.address.reify();
  var pointee = new type(resolved, address);
  Object.defineProperty(target, 'pointee', {
    enumerable: true, configurable: true,
    get: function(){
      var checkaddress = target.address.reify();
      if (address !== checkaddress) {
        pointee.rebase(checkaddress);
      }
      return pointee;
    },
    set: function(v){
      var checkaddress = target.address.reify();
      if (address !== checkaddress) {
        pointee.rebase(checkaddress);
      }
      pointee.write(v);
    }
  });
  return pointee;
}



// ########################
// ### PointerType Data ###
// ########################

genesis.Type(PointerType, {
  DataType: 'pointer',
  bytes: 4,

  resolve: function resolve(){
    var buffer = this._data;
    while (buffer.buffer) buffer = buffer.buffer;
    if (buffer.parent) buffer = buffer.parent;
    return buffer;
  },

  totalOffset: function totalOffset(){
    var buffer = this._data, offset = this._offset;
    while (buffer.buffer) {
      buffer = buffer.buffer;
      offset += (buffer.offset || buffer.bytesOffset || 0);
    }
    return offset;
  },

  reify: function reify(deallocate){
    return this.pointee.reify(deallocate);
  },

  write: function write(o){
    this.pointee.write(o);
  },

  setRelative: function setRelative(offset){
    this.address.write(this.totalOffset() + offset);
  },

  pointTo: function pointTo(data){
    if (!data._data) throw new TypeError('Must point to reified <Data>');
    this.address.write(data._data.buffer.offset + data._offset);
  },

  fill: function fill(val){
    this.pointee.fill(val);
  },
});

PointerType.prototype.bytes = 4;