"use strict";

var genesis = require('./genesis');
var DataBuffer  = require('./buffer');
var numeric = require('./numeric');
var PointerSubtype = genesis.Subtype.bind(PointerType);

module.exports = PointerType;


var Address = numeric.Uint32.typeDef('Address');

// ###############################
// ### PointerType Constructor ###
// ###############################

function PointerType(name, pointeeType, addressType){
  if (typeof name !== 'string') {
    addressType = pointeeType;
    pointeeType = name;
    name = pointeeType.displayName;
  }

  if (typeof pointeeType === 'string') {
    pointeeType = genesis.lookupType(pointeeType);
  } else if (typeof pointeeType === 'undefined') {
    pointeeType = genesis.lookupType(name);
  }

  if (typeof addressType === 'string') {
    addressType = genesis.lookupType(addressType);
  } else if (typeof addressType === 'undefined') {
    addressType = Address;
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

    this.address = new PointerT.addressType(this._data, this._offset);

    if (isFinite(values)) {
      this.memory = this._data;
      this.address.write(values);
    } else if (values && values._data) {
      this.pointTo(values);
    }

    return this;
    //this.emit('construct');
  }

  PointerT.pointeeType = pointeeType;
  PointerT.addressType = addressType;

  Object.defineProperty(PointerT.prototype, 'pointee', {
    enumerable: true, configurable: true,
    get: function( ){ return initPointee(this, pointeeType) },
    set: function(v){ initPointee(this, pointeeType, v) }
  });

  return PointerSubtype(name, addressType.bytes, PointerT);
}

function initPointee(target, Type, pointee){
  var address;
  if (!pointee) {
    if (target.memory) {
      pointee = new Type(target.memory, address = target.address.reify());
    } else {
      pointee = new Type;
      target.memory = pointee._data;
      target.address.write(address = pointee._offset);
    }
  } else {
    address = pointee._offset;
  }
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

function resolveBuffer(buffer){
  var offset = 0;
  if (buffer._data) {
    offset = buffer._offset;
    buffer = buffer._data;
  }
  while (buffer.buffer || buffer.parent) {
    offset += (buffer.offset || buffer.bytesOffset || 0);
    buffer = buffer.buffer || buffer.parent;
  }
  return { buffer: buffer, offset: offset };
}

// ########################
// ### PointerType Data ###
// ########################

genesis.Type(PointerType, {
  DataType: 'pointer',

  get bytes(){
    return this.constructor.addressType.bytes;
  },

  reify: function reify(deallocate){
    return this.pointee.reify(deallocate);
  },

  write: function write(o){
    this.pointee.write(o);
  },

  fill: function fill(val){
    this.pointee.fill(val);
  },

  pointTo: function pointTo(data){
    if (!data._data) throw new TypeError('Must point to reified <Data>');
    this.pointee = data;
    this.address.write(data._offset);
    this.memory = data._data;
  },
  cast: function cast(type){
    if (typeof type === 'string') {
      type = genesis.lookupType(type);
    }
    var ptrType = genesis.lookupType('*'+type.displayName);
    var ptr = new ptrType(this._data, this._offset);
    ptr.memory = this.memory;
    return ptr;
  }
});

Object.defineProperty(PointerType.prototype, 'bytes', {
  configurable: true,
  enumerable: true,
  get: function(){
    return this.addressType.bytes;
  }
});
